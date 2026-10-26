import { PedidoRepository } from '../pedido/pedido.repository.js';
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
  pedidosPorConciliar,
} from './pago.repository.js';
import {
  consultarMP,
  urlPublica,
  variable,
  validarVendedorPrueba,
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
  if (!pedido.retiro && pedido.costo_envio == null && !pedido.envio) {
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

  const envio = pedido.retiro ? 0 : pedido.costo_envio ?? pedido.envio?.costo ?? 0;

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

export async function consultarEstado(
  id: number,
  usuario: UsuarioToken,
) {
  return conPedido(id, async (pedido, contexto) => {
    autorizar(pedido, usuario);

    const pago = await contexto.buscarPago();

    const estado = estadoActual(pago, pedido);

    return {
      estado: pedido.medio_pago === 'efectivo' ? 'efectivo' : !pago && !pedido.medio_pago ? 'anterior' : estado,
      importe: pago?.importe ?? null,
      puedePagar: false,
      estadoPedido: pedido.estado,
      medioPago: pedido.medio_pago ?? null,
      retiro: pedido.retiro,
    };
  });
}

export async function crearPreferencia(
  id: number,
  usuario: UsuarioToken,
) {
  return conPedido(id, async (pedido, contexto) => {
    autorizar(pedido, usuario, true);

    if (pedido.medio_pago !== 'mercadopago' || pedido.estado !== 'Esperando pago' || !pedido.vence_pago || pedido.vence_pago.getTime() <= Date.now()) {
      throw new HttpError(
        409,
        'Solo se puede abrir el checkout durante la compra y antes de su vencimiento',
      );
    }

    await validarVendedorPrueba();
    let pago = await contexto.buscarPago();

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

    if (pago?.checkoutUrl && pago.preferenciaId) {
      const retorno = `${urlPublica('FRONTEND_URL')}/mis-pedidos/${id}`;
      await consultarMP(`/checkout/preferences/${encodeURIComponent(pago.preferenciaId)}`, {
        back_urls: { success: retorno, pending: retorno, failure: retorno },
        notification_url: `${urlPublica('BACKEND_URL')}/api/pagos/webhook`,
      }, 'PUT');
      return {
        url: pago.checkoutUrl,
      };
    }

    if (!pago) {
      pago = contexto.crearPago(randomUUID(), importe);
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

      if ((pedido.costo_envio ?? pedido.envio?.costo ?? 0) > 0) {
        items.push({
          id: 'envio',
          title: 'Envío',
          quantity: 1,
          unit_price: (pedido.costo_envio ?? pedido.envio?.costo ?? 0),
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
        expires: true,
        expiration_date_from: new Date().toISOString(),
        expiration_date_to: pedido.vence_pago.toISOString(),
        payment_methods: { excluded_payment_types: [{ id: 'ticket' }, { id: 'atm' }] },
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

  if (String(recibido.id) !== paymentId) {
    throw new HttpError(
      409,
      'El ID devuelto por Mercado Pago no coincide con el solicitado',
    );
  }

  if (String(recibido.collector_id) !== vendedorConfigurado) throw new HttpError(409, 'El vendedor del pago no coincide');
  if (recibido.live_mode !== false) await validarVendedorPrueba(vendedorConfigurado);

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
    async (pedido, contexto) => {
      if (usuario) {
        autorizar(pedido, usuario);
      }

      const pago = await contexto.buscarPago();

      if (!pago || pago.id !== encontrado.id) throw new HttpError(409, 'Referencia de pago inválida');
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

      // Confirmar una sola vez; nunca revivir pedidos cancelados ni tocar stock.
      if (pedido.medio_pago === 'mercadopago' && pedido.estado === 'Esperando pago' && estadoPago(pago.movimientos) === 'aprobado') {
        pedido.estado = 'Pendiente';
      }
    },
  );
}

async function reconciliarReferencia(referencia: string): Promise<void> {
  let offset = 0;
  let total = 0;
  do {
    const resultado = await consultarMP<{ results: { id: number }[]; paging: { total: number } }>(
      `/v1/payments/search?external_reference=${encodeURIComponent(referencia)}&limit=50&offset=${offset}&sort=date_created&criteria=desc`
    );
    if (!Array.isArray(resultado.results) || !Number.isFinite(resultado.paging?.total)) {
      throw new HttpError(502, 'No se pudo verificar el resultado de Mercado Pago');
    }
    for (const pago of resultado.results) await sincronizarPago(String(pago.id));
    total = resultado.paging.total;
    offset += resultado.results.length;
    if (!resultado.results.length && offset < total) throw new HttpError(502, 'Consulta de pagos incompleta');
  } while (offset < total);
}

export async function revisarComprasPendientes(): Promise<void> {
  const pedidos = new PedidoRepository();
  for (const id of await pedidosPorConciliar()) {
    try {
      const referencia = await conPedido(id, async (_pedido, contexto) => (await contexto.buscarPago())?.referencia);
      // Si MP no responde, conservar la reserva y reintentar; no cancelar un pago desconocido.
      if (referencia) await reconciliarReferencia(referencia);
      await pedidos.cancelarConReposicion(id, true);
    } catch (error) {
      console.error(`No se pudo conciliar el pedido ${id}:`, error instanceof Error ? error.message : 'Error');
    }
  }
}