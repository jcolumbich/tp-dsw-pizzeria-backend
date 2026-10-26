import type { Request, Response } from 'express';
import { HttpError } from '../shared/http-error.js';
import { firmaValida } from './pago.logic.js';
import { variable } from './mercadopago.client.js';
import {
  consultarEstado,
  sincronizarPago,
} from './pago.service.js';


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
export async function recibirWebhook(req: Request, res: Response) {
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
}


export async function obtenerEstado(req: Request, res: Response) {
  const data = await consultarEstado(
    idPositivo(req.params.id),
    req.usuario!,
  );

  return res.json({ data });
}

export async function verificarRetorno(req: Request, res: Response) {
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
}