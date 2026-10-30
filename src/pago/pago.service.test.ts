import 'reflect-metadata';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { Pedido } from '../pedido/pedido.entity.js';
import type { Pago } from './pago.entity.js';
import { z } from 'zod';
import type { ContextoPago } from './pago.repository.js';

let pedido: Pedido;
let pago: Pago | null;
// El mock devuelve respuestas de varios endpoints; el cuerpo se valida al inspeccionarlo.
const consultarMP = jest.fn<(ruta: string, body?: unknown, metodo?: 'POST' | 'PUT') => Promise<unknown>>();
const validarVendedorPrueba = jest.fn<typeof import('./mercadopago.client.js').validarVendedorPrueba>();
const cancelar = jest.fn<import('../pedido/pedido.repository.js').PedidoRepository['cancelarConReposicion']>();
const vencidos = jest.fn<typeof import('./pago.repository.js').pedidosPorConciliar>();
jest.unstable_mockModule('./mercadopago.client.js', () => ({
  consultarMP, validarVendedorPrueba,
  variable: (nombre: string) => nombre === 'MP_VENDEDOR_PRUEBA_ID' ? '99' : 'prueba',
  urlPublica: (nombre: string) => nombre === 'FRONTEND_URL' ? 'https://front.example' : 'https://back.example',
}));
jest.unstable_mockModule('./pago.repository.js', () => ({
  conPedido: async (_id: number, accion: (p: Pedido, contexto: ContextoPago) => Promise<unknown>) => accion(pedido, {
    buscarPago: async () => pago,
    crearPago: (referencia: string, importe: number) => pago = { id: 7, pedido, referencia, importe } as Pago,
  }),
  buscarPorReferencia: async (referencia: string) => pago?.referencia === referencia ? pago : null,
  pedidosPorConciliar: vencidos,
}));
jest.unstable_mockModule('../pedido/pedido.repository.js', () => ({
  PedidoRepository: class { cancelarConReposicion = cancelar; },
}));
const { crearPreferencia, consultarEstado, sincronizarPago, revisarComprasPendientes } = await import('./pago.service.js');
const usuario = { id: 1, email: 'test@example.com', nivel_permisos: 0 };
const recibido = (extra = {}) => ({ id: 100, external_reference: 'ref', collector_id: 99,
  live_mode: false, currency_id: 'ARS', transaction_amount: 130, status: 'approved',
  date_last_updated: '2026-10-23T12:00:00Z', ...extra });

beforeEach(() => {
  jest.resetAllMocks();
  pedido = { id: 5, cliente: { id: 1 }, retiro: false, total: 100, monto_propina: 10,
    costo_envio: 20, medio_pago: 'mercadopago', estado: 'Esperando pago',
    vence_pago: new Date(Date.now() + 30 * 60_000),
    detalles: { getItems: () => [{ pizza: { id: 2, nombre: 'Pizza' }, cantidad: 2, precio_unitario: 50 }] },
  } as unknown as Pedido;
  pago = { id: 7, pedido, referencia: 'ref', importe: 130 } as Pago;
  validarVendedorPrueba.mockResolvedValue(undefined);
  vencidos.mockResolvedValue([]);
});

describe('compra y aprobación en el servidor', () => {
  it('abre checkout de delivery con envío y propina antes de asignar repartidor', async () => {
    consultarMP.mockResolvedValue({ id: 'pref', init_point: 'https://www.mercadopago.com.ar/checkout/test', collector_id: 99 });
    const result = await crearPreferencia(5, usuario);
    expect(result.url).toContain('mercadopago.com.ar');
    expect(pedido.estado).toBe('Esperando pago');
    expect(validarVendedorPrueba).toHaveBeenCalledTimes(1);
    const body = z.object({
      items: z.array(z.object({ unit_price: z.number(), quantity: z.number() })),
      expires: z.boolean(),
      external_reference: z.string(),
      back_urls: z.object({ success: z.string() }),
    }).parse(consultarMP.mock.calls[0][1]);
    expect(body.items.map((i) => i.unit_price * i.quantity)).toEqual([100, 10, 20]);
    expect(body.expires).toBe(true);
    expect(body.external_reference).toBe('ref');
    expect(body.back_urls.success).toBe('https://front.example/mis-pedidos/5');
  });
  it('reutiliza la preferencia y actualiza los túneles al reintentar la compra', async () => {
    pago!.preferenciaId = 'pref'; pago!.checkoutUrl = 'https://www.mercadopago.com.ar/checkout/test';
    consultarMP.mockResolvedValue({});
    await crearPreferencia(5, usuario);
    expect(consultarMP).toHaveBeenCalledWith('/checkout/preferences/pref', expect.anything(), 'PUT');
  });
  it.each(['efectivo', undefined])('no abre checkout para un pedido %s', async medio => {
    pedido.medio_pago = medio as Pedido['medio_pago'];
    await expect(crearPreferencia(5, usuario)).rejects.toMatchObject({ statusCode: 409 });
    expect(consultarMP).not.toHaveBeenCalled();
  });
  it('no abre checkout si no puede validar al vendedor como usuario de prueba', async () => {
    validarVendedorPrueba.mockRejectedValue(new Error('Cuenta no verificada'));
    await expect(crearPreferencia(5, usuario)).rejects.toThrow('Cuenta no verificada');
    expect(consultarMP).not.toHaveBeenCalled();
  });
  it('rechaza otro propietario antes de consultar a Mercado Pago', async () => {
    await expect(consultarEstado(5, { ...usuario, id: 2 })).rejects.toMatchObject({ statusCode: 403 });
    expect(consultarMP).not.toHaveBeenCalled();
  });
  it('aprobado confirma una vez y una repetición no cambia la preparación', async () => {
    consultarMP.mockResolvedValue(recibido());
    await sincronizarPago('100');
    expect(pedido.estado).toBe('Pendiente');
    pedido.estado = 'En preparación';
    await sincronizarPago('100');
    expect(pedido.estado).toBe('En preparación');
    expect(Object.keys(pago!.movimientos!)).toEqual(['100']);
  });
  it.each(['pending', 'rejected', 'cancelled', 'in_process'])('%s no confirma el pedido', async status => {
    consultarMP.mockResolvedValue(recibido({ status }));
    await sincronizarPago('100');
    expect(pedido.estado).toBe('Esperando pago');
  });
  it.each([
    { transaction_amount: 1 }, { collector_id: 88 }, { currency_id: 'USD' }, { id: 101 },
  ])('rechaza un pago que no coincide: %j', async extra => {
    consultarMP.mockResolvedValue(recibido(extra));
    await expect(sincronizarPago('100')).rejects.toMatchObject({ statusCode: 409 });
    expect(pedido.estado).toBe('Esperando pago');
    expect(pago!.movimientos).toBeUndefined();
  });
  it('live_mode true exige comprobar el vendedor de prueba', async () => {
    consultarMP.mockResolvedValue(recibido({ live_mode: true }));
    await sincronizarPago('100');
    expect(validarVendedorPrueba).toHaveBeenCalledWith('99');
  });
  it('un pago tardío no revive un pedido cancelado', async () => {
    pedido.estado = 'Cancelado'; consultarMP.mockImplementation(async (ruta: string) => ruta.includes('/search?') ? { results: [], paging: { total: 0 } } : recibido());
    await sincronizarPago('100');
    expect(pedido.estado).toBe('Cancelado');
    expect(await consultarEstado(5, usuario)).toMatchObject({ estado: 'revision', puedePagar: false });
  });
  it('recupera automáticamente un aprobado aunque no haya llegado el webhook', async () => {
    consultarMP.mockImplementation(async (ruta: string) => String(ruta).includes('/search?')
      ? { results: [{ id: 100 }], paging: { total: 1 } } : recibido());
    vencidos.mockResolvedValue([5]);
    await revisarComprasPendientes();
    expect(await consultarEstado(5, usuario)).toMatchObject({ estado: 'aprobado', estadoPedido: 'Pendiente', puedePagar: false });
  });
  it('efectivo no consulta a MP ni ofrece pagar otra vez', async () => {
    pedido.medio_pago = 'efectivo'; pedido.estado = 'Pendiente'; pago = null;
    expect(await consultarEstado(5, usuario)).toMatchObject({ estado: 'efectivo', puedePagar: false });
    expect(consultarMP).not.toHaveBeenCalled();
  });
  it('concilia antes de liberar una reserva vencida', async () => {
    vencidos.mockResolvedValue([5]);
    consultarMP.mockResolvedValue({ results: [], paging: { total: 0 } });
    await revisarComprasPendientes();
    expect(cancelar).toHaveBeenCalledWith(5, true);
  });
  it('no libera stock si MP no responde durante la conciliación', async () => {
    vencidos.mockResolvedValue([5]); consultarMP.mockRejectedValue(new Error('Sin conexión'));
    const log = jest.spyOn(console, 'error').mockImplementation(() => {});
    await revisarComprasPendientes();
    expect(cancelar).not.toHaveBeenCalled();
    log.mockRestore();
  });
});

 it('muestra el aprobado guardado aunque Mercado Pago esté caído', async () => {
   consultarMP.mockResolvedValue(recibido());
   await sincronizarPago('100');
   consultarMP.mockReset().mockRejectedValue(new Error('Proveedor caído'));
   expect(await consultarEstado(5, usuario)).toMatchObject({ estado: 'aprobado' });
   expect(consultarMP).not.toHaveBeenCalled();
 });
 it('consultar una reserva no depende de la búsqueda externa de pagos', async () => {
   consultarMP.mockRejectedValue(new Error('Proveedor caído'));
   expect(await consultarEstado(5, usuario)).toMatchObject({ estadoPedido: 'Esperando pago' });
   expect(consultarMP).not.toHaveBeenCalled();
 });
