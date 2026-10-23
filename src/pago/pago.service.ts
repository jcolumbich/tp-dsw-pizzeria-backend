import { randomUUID } from 'node:crypto';
import type { UsuarioToken } from '../auth/auth.middleware.js';
import type { Pedido } from '../pedido/pedido.entity.js';
import { HttpError } from '../shared/http-error.js';
import { Pago } from './pago.entity.js';
import {
  centavos,
  estadoPago,
  guardarMovimiento,
} from './pago.logic.js';
import {
  conPedido,
  buscarPorReferencia,
} from './pago.repository.js';
import {
  consultarMP,
  urlPublica,
  variable,
} from './mercadopago.client.js';

interface PreferenciaMP {
  id: string;
  init_point: string;
  collector_id: number;
}

interface RespuestaPagoMP {
  id: number;
  external_reference: string;
  collector_id: number;
  live_mode: boolean;
  currency_id: string;
  transaction_amount: number;
  transaction_amount_refunded?: number;
  status: string;
  date_last_updated: string;
}

interface UsuarioMercadoPago {
  id?: number | string;
  tags?: string[];
}

function autorizar(
  pedido: Pedido,
  usuario: UsuarioToken,
  soloCliente = false,
): void {
  const noEsCliente =
    soloCliente && usuario.nivel_permisos !== 0;

  const noEsPropietario =
    usuario.nivel_permisos === 0 &&
    pedido.cliente?.id !== usuario.id;

  if (noEsCliente || noEsPropietario) {
    throw new HttpError(
      403,
      'No tenés permiso para operar este pago',
    );
  }
}

function importePedido(pedido: Pedido): number {
  if (!pedido.retiro && !pedido.envio) {
    throw new HttpError(
      409,
      'El envío todavía no tiene un costo confirmado',
    );
  }

  const propina = pedido.retiro
    ? 0
    : pedido.envio?.monto_propina ??
      pedido.monto_propina ??
      0;

  const envio = pedido.retiro ? 0 : pedido.envio!.costo;

  const importe =
    (
      centavos(pedido.total) +
      centavos(propina) +
      centavos(envio)
    ) / 100;

  if (importe <= 0) {
    throw new HttpError(
      409,
      'El pedido debe tener un importe mayor a cero',
    );
  }

  return importe;
}

function estadoActual(
  pago: Pago | null,
  pedido: Pedido,
): string {
  const estado = estadoPago(pago?.movimientos ?? {});

  if (
    pedido.estado === 'Cancelado' &&
    estado === 'aprobado'
  ) {
    return 'revision';
  }

  return estado;
}

async function validarEntornoDePrueba(
  recibido: RespuestaPagoMP,
  vendedorConfigurado: string,
): Promise<void> {
  if (variable('MP_MODO') !== 'prueba') {
    throw new HttpError(
      409,
      'Esta integración está habilitada únicamente para pruebas',
    );
  }

  if (String(recibido.collector_id) !== vendedorConfigurado) {
    throw new HttpError(
      409,
      'El vendedor del pago no coincide con MP_VENDEDOR_PRUEBA_ID',
    );
  }

  if (recibido.live_mode === false) {
    return;
  }

  // Si live_mode no es false, verificamos que el dueño
  // del token sea el vendedor configurado y una cuenta de prueba.
  const respuestaUsuario = await fetch(
    'https://api.mercadolibre.com/users/me',
    {
      headers: {
        Authorization: `Bearer ${variable('MP_ACCESS_TOKEN')}`,
      },
      signal: AbortSignal.timeout(10000),
    },
  );

  if (!respuestaUsuario.ok) {
    throw new HttpError(
      502,
      `No se pudo comprobar la cuenta de prueba del vendedor: HTTP ${respuestaUsuario.status}`,
    );
  }

  const vendedor =
    (await respuestaUsuario.json()) as UsuarioMercadoPago;

  const esVendedorDePrueba =
    String(vendedor.id) === vendedorConfigurado &&
    Array.isArray(vendedor.tags) &&
    vendedor.tags.includes('test_user');

  if (!esVendedorDePrueba) {
    throw new HttpError(
      409,
      'El vendedor no pudo validarse como cuenta de prueba. El pago no se registró.',
    );
  }
}

export async function consultarEstado(
  id: number,
  usuario: UsuarioToken,
) {
  return conPedido(id, async (pedido, em) => {
    autorizar(pedido, usuario);

    const pago = await em.findOne(
      Pago,
      { pedido: id },
      { refresh: true },
    );

    const estado = estadoActual(pago, pedido);

    const puedePagar =
      usuario.nivel_permisos === 0 &&
      pedido.estado !== 'Cancelado' &&
      (pedido.retiro || !!pedido.envio) &&
      ['sin_pagar', 'rechazado'].includes(estado);

    return {
      estado,
      importe: pago?.importe ?? null,
      puedePagar,
    };
  });
}

export async function crearPreferencia(
  id: number,
  usuario: UsuarioToken,
) {
  return conPedido(id, async (pedido, em) => {
    autorizar(pedido, usuario, true);

    if (pedido.estado === 'Cancelado') {
      throw new HttpError(
        409,
        'El pedido está cancelado',
      );
    }

    let pago = await em.findOne(
      Pago,
      { pedido: id },
      { refresh: true },
    );

    const estado = estadoActual(pago, pedido);

    if (!['sin_pagar', 'rechazado'].includes(estado)) {
      throw new HttpError(
        409,
        'Este pago ya está aprobado, pendiente o en revisión',
      );
    }

    const importe = importePedido(pedido);

    if (
      pago &&
      centavos(pago.importe) !== centavos(importe)
    ) {
      throw new HttpError(
        409,
        'El importe cambió después de iniciar el pago. Requiere revisión',
      );
    }

    if (pago?.checkoutUrl) {
      return {
        url: pago.checkoutUrl,
      };
    }

    if (!pago) {
      pago = em.create(Pago, {
        pedido,
        referencia: randomUUID(),
        importe,
      });

      em.persist(pago);
    }

    const front = urlPublica('FRONTEND_URL');
    const back = urlPublica('BACKEND_URL');
    const vendedor =
      variable('MP_VENDEDOR_PRUEBA_ID').trim();

    variable('MP_WEBHOOK_SECRET');

    const retorno = `${front}/mis-pedidos/${id}`;

    const items = pedido.detalles
      .getItems()
      .map((detalle) => {
        if (detalle.precio_unitario == null) {
          throw new HttpError(
            409,
            'El pedido no tiene precios históricos',
          );
        }

        return {
          id: String(detalle.pizza.id),
          title: detalle.pizza.nombre,
          quantity: detalle.cantidad,
          unit_price: Number(detalle.precio_unitario),
          currency_id: 'ARS',
        };
      });

    if (!pedido.retiro) {
      const propina =
        pedido.envio?.monto_propina ??
        pedido.monto_propina ??
        0;

      if (propina > 0) {
        items.push({
          id: 'propina',
          title: 'Propina',
          quantity: 1,
          unit_price: propina,
          currency_id: 'ARS',
        });
      }

      if (pedido.envio!.costo > 0) {
        items.push({
          id: 'envio',
          title: 'Envío',
          quantity: 1,
          unit_price: pedido.envio!.costo,
          currency_id: 'ARS',
        });
      }
    }

    const totalItems = items.reduce(
      (total, item) =>
        total + centavos(item.unit_price) * item.quantity,
      0,
    );

    if (totalItems !== centavos(importe)) {
      throw new HttpError(
        409,
        'El detalle del pedido no coincide con el total',
      );
    }

    const preferencia = await consultarMP<PreferenciaMP>(
      '/checkout/preferences',
      {
        items,
        external_reference: pago.referencia,
        back_urls: {
          success: retorno,
          pending: retorno,
          failure: retorno,
        },
        auto_return: 'approved',
        notification_url: `${back}/api/pagos/webhook`,
      },
    );

    if (String(preferencia.collector_id) !== vendedor) {
      throw new HttpError(
        409,
        'El token no corresponde al vendedor de prueba configurado',
      );
    }

    const url = new URL(preferencia.init_point);

    const dominiosPermitidos = [
      'www.mercadopago.com.ar',
      'mercadopago.com.ar',
      'www.mercadopago.com',
      'mercadopago.com',
    ];

    if (
      url.protocol !== 'https:' ||
      !dominiosPermitidos.includes(url.hostname)
    ) {
      throw new Error(
        'Mercado Pago devolvió una URL de checkout inesperada',
      );
    }

    pago.preferenciaId = preferencia.id;
    pago.checkoutUrl = url.href;

    return {
      url: pago.checkoutUrl,
    };
  });
}

export async function sincronizarPago(
  paymentId: string,
  usuario?: UsuarioToken,
  pedidoId?: number,
): Promise<void> {
  if (!/^\d{1,30}$/.test(paymentId)) {
    throw new HttpError(
      400,
      'ID de pago inválido',
    );
  }

  const recibido = await consultarMP<RespuestaPagoMP>(
    `/v1/payments/${paymentId}`,
  );

  const vendedorConfigurado =
    variable('MP_VENDEDOR_PRUEBA_ID').trim();

  // Diagnóstico temporal, sin tokens ni contraseñas.
  console.log('Diagnóstico del pago:', {
    idCoincide: String(recibido.id) === paymentId,
    live_mode: recibido.live_mode,
    vendedorRecibido: String(recibido.collector_id),
    vendedorConfigurado,
    estado: recibido.status,
  });

  if (String(recibido.id) !== paymentId) {
    throw new HttpError(
      409,
      'El ID devuelto por Mercado Pago no coincide con el solicitado',
    );
  }

  await validarEntornoDePrueba(
    recibido,
    vendedorConfigurado,
  );

  if (!recibido.external_reference) {
    throw new HttpError(
      409,
      'Pago sin referencia',
    );
  }

  const encontrado = await buscarPorReferencia(
    recibido.external_reference,
  );

  if (!encontrado) {
    if (usuario) {
      throw new HttpError(
        404,
        'El pago no pertenece a esta aplicación',
      );
    }

    return;
  }

  if (
    pedidoId !== undefined &&
    encontrado.pedido.id !== pedidoId
  ) {
    throw new HttpError(
      403,
      'El pago corresponde a otro pedido',
    );
  }

  await conPedido(
    encontrado.pedido.id,
    async (pedido, em) => {
      if (usuario) {
        autorizar(pedido, usuario);
      }

      const pago = await em.findOneOrFail(
        Pago,
        encontrado.id,
        { refresh: true },
      );

      const datosValidos =
        recibido.currency_id === 'ARS' &&
        centavos(recibido.transaction_amount) ===
          centavos(pago.importe) &&
        !!recibido.status &&
        Number.isFinite(
          Date.parse(recibido.date_last_updated),
        );

      if (!datosValidos) {
        throw new HttpError(
          409,
          'Los datos del pago no coinciden con el pedido',
        );
      }

      pago.movimientos = guardarMovimiento(
        pago.movimientos ?? {},
        paymentId,
        {
          estado: recibido.status,
          actualizado: recibido.date_last_updated,
          reembolsado:
            recibido.transaction_amount_refunded ?? 0,
        },
      );

      // El pago no modifica la preparación ni el stock.
    },
  );
}