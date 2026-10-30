import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import { createHmac } from 'node:crypto';
import { handleError } from '../shared/handle-error.js';
import { HttpError } from '../shared/http-error.js';
const consultar = jest.fn<typeof import('./pago.service.js').consultarEstado>();
const sincronizar = jest.fn<typeof import('./pago.service.js').sincronizarPago>();
jest.unstable_mockModule('./pago.service.js', () => ({ consultarEstado: consultar, sincronizarPago: sincronizar }));
jest.unstable_mockModule('../auth/auth.middleware.js', () => ({
  verificarToken: (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.get('Authorization') !== 'Bearer test') return res.sendStatus(401);
    req.usuario = { id: 1, email: 'test@example.com', nivel_permisos: 0 };
    next();
  },
}));
const { pagoRouter } = await import('./pago.routes.js');
const app = express();
app.use(express.json());
app.use('/api/pagos', pagoRouter);
app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => handleError(res, error));
beforeEach(() => {
  jest.resetAllMocks(); process.env.MP_WEBHOOK_SECRET = 'secreto-http-test';
  consultar.mockResolvedValue({ estado: 'aprobado', estadoPedido: 'Pendiente', puedePagar: false,
    importe: 130, medioPago: 'mercadopago', retiro: false });
});
describe('controladores de pagos', () => {
  it('rechaza un webhook sin firma antes de sincronizar', async () => {
    const result = await request(app).post('/api/pagos/webhook?data.id=100').send({ type: 'payment', data: { id: 100 } });
    expect(result.status).toBe(401); expect(sincronizar).not.toHaveBeenCalled();
  });
  it('acepta la firma válida y sincroniza usando el ID notificado', async () => {
    const firma = createHmac('sha256', 'secreto-http-test').update('id:100;request-id:req;ts:123;').digest('hex');
    const result = await request(app).post('/api/pagos/webhook?data.id=100')
      .set('x-request-id', 'req').set('x-signature', `ts=123,v1=${firma}`)
      .send({ type: 'payment', data: { id: 100 } });
    expect(result.status).toBe(200); expect(sincronizar).toHaveBeenCalledWith('100');
  });
  it('no consulta la operación del retorno si el pedido pertenece a otro cliente', async () => {
    consultar.mockRejectedValue(new HttpError(403, 'Sin permiso'));
    const result = await request(app).post('/api/pagos/pedido/2/verificar').set('Authorization', 'Bearer test').send({ paymentId: '100' });
    expect(result.status).toBe(403); expect(sincronizar).not.toHaveBeenCalled();
  });
  it('responde los estados verificados por el servicio', async () => {
    const result = await request(app).get('/api/pagos/pedido/5').set('Authorization', 'Bearer test');
    expect(result.status).toBe(200);
    expect(result.body.data).toMatchObject({ estado: 'aprobado', puedePagar: false });
  });
});

it('las rutas reales de consulta requieren sesión', async () => {
  expect((await request(app).get('/api/pagos/pedido/5')).status).toBe(401);
  expect((await request(app).post('/api/pagos/pedido/5/verificar').send({ paymentId: '100' })).status).toBe(401);
  expect(consultar).not.toHaveBeenCalled();
});