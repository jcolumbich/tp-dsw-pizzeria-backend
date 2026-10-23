import { Router } from 'express';
import { verificarToken } from '../auth/auth.middleware.js';
import { HttpError } from '../shared/http-error.js';
import { firmaValida } from './pago.logic.js';
import { variable } from './mercadopago.client.js';
import {
  consultarEstado,
  crearPreferencia,
  sincronizarPago,
} from './pago.service.js';

export const pagoRouter = Router();

function idPositivo(valor: unknown): number {
  if (typeof valor !== 'number' && typeof valor !== 'string') {
    throw new HttpError(400, 'ID inválido');
  }

  const id = Number(valor);

  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new HttpError(400, 'ID inválido');
  }

  return id;
}

// El webhook usa la firma de Mercado Pago, no el JWT del cliente.
pagoRouter.post('/webhook', async (req, res) => {
  const id = req.query['data.id'];

  if (
    typeof id !== 'string' ||
    !/^\d{1,30}$/.test(id) ||
    !firmaValida(
      id,
      req.get('x-request-id') ?? '',
      req.get('x-signature') ?? '',
      variable('MP_WEBHOOK_SECRET'),
    )
  ) {
    return res.status(401).json({
      message: 'Firma de webhook inválida',
    });
  }

  if (req.body?.type !== 'payment') {
    return res.sendStatus(200);
  }

  if (String(req.body?.data?.id) !== id) {
    throw new HttpError(
      400,
      'El ID de la notificación no coincide',
    );
  }

  await sincronizarPago(id);

  return res.sendStatus(200);
});

// Todas las rutas siguientes requieren iniciar sesión.
pagoRouter.use(verificarToken);

pagoRouter.post('/preferencia', async (req, res) => {
  const data = await crearPreferencia(
    idPositivo(req.body?.pedidoId),
    req.usuario!,
  );

  return res.json({ data });
});

pagoRouter.get('/pedido/:id', async (req, res) => {
  const data = await consultarEstado(
    idPositivo(req.params.id),
    req.usuario!,
  );

  return res.json({ data });
});

pagoRouter.post('/pedido/:id/verificar', async (req, res) => {
  const pedidoId = idPositivo(req.params.id);

  // Autorizar al usuario antes de consultar a Mercado Pago.
  await consultarEstado(pedidoId, req.usuario!);

  if (typeof req.body?.paymentId !== 'string') {
    throw new HttpError(400, 'Falta el ID del pago');
  }

  await sincronizarPago(
    req.body.paymentId,
    req.usuario!,
    pedidoId,
  );

  return res.json({
    data: await consultarEstado(pedidoId, req.usuario!),
  });
});