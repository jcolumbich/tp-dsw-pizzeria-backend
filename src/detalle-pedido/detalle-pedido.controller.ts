import { Request, Response } from 'express';
import * as service from './detalle-pedido.service.js';
import { handleError } from '../shared/handle-error.js';
import { pedidoIdParamsSchema, detallePedidoParamsSchema } from './detalle-pedido.schema.js';

export async function findAll(req: Request, res: Response) {
  try {
    const detalles = await service.listarDetalles();
    return res.status(200).json({ message: 'Todos los detalles de pedido recuperados', data: detalles });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function findOne(req: Request, res: Response) {
  try {
    const resultado = detallePedidoParamsSchema.safeParse(req.params);
    if (!resultado.success) {
      return res.status(400).json({ message: 'Los IDs provistos deben ser números enteros positivos válidos' });
    }
    const { pedidoId, pizzaId } = resultado.data;
    const detalle = await service.buscarDetalle(pedidoId, pizzaId);
    return res.status(200).json({ data: detalle });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function findByPedido(req: Request, res: Response) {
  try {
    const resultado = pedidoIdParamsSchema.safeParse(req.params);
    if (!resultado.success) {
      return res.status(400).json({ message: 'El ID de pedido provisto debe ser un número entero positivo válido' });
    }
    const data = await service.listarPorPedido(resultado.data.pedidoId);
    return res.status(200).json({ data });
  } catch (error) {
    return handleError(res, error);
  }
}