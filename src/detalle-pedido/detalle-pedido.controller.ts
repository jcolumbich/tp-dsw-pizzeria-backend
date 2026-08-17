import { Request, Response, NextFunction } from 'express';
import * as service from './detalle-pedido.service.js';
import { handleError } from '../shared/handle-error.js';

export function sanitizeDetallePedidoInput(req: Request, res: Response, next: NextFunction) {
  if (!req.body) {
    return res.status(400).json({ message: 'El cuerpo de la petición es requerido' });
  }

  req.body.detalleInput = {
    cantidad: req.body.cantidad,
    pizzaId: req.body.pizzaId,
    pedidoId: req.body.pedidoId,
  };

  Object.keys(req.body.detalleInput).forEach((key) => {
    if (req.body.detalleInput[key] === undefined) {
      delete req.body.detalleInput[key];
    }
  });

  next();
}

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
    const pedidoId = Number(req.params.pedidoId);
    const pizzaId = Number(req.params.pizzaId);
    if (isNaN(pedidoId) || isNaN(pizzaId)) {
      return res.status(400).json({ message: 'Los IDs provistos deben ser números enteros válidos' });
    }

    const detalle = await service.buscarDetalle(pedidoId, pizzaId);
    return res.status(200).json({ data: detalle });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function findByPedido(req: Request, res: Response) {
  try {
    const pedidoId = Number(req.params.pedidoId);
    if (isNaN(pedidoId)) {
      return res.status(400).json({ message: 'El ID de pedido provisto debe ser un número entero válido' });
    }

    const data = await service.listarPorPedido(pedidoId);
    return res.status(200).json({ data });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function add(req: Request, res: Response) {
  try {
    const { detalle, pedido } = await service.crearDetalle(req.body.detalleInput);
    return res.status(201).json({
      message: 'Detalle de pedido creado con éxito',
      data: detalle,
      pedido,
    });
  } catch (error) {
    return handleError(res, error);
  }
}
export async function update(req: Request, res: Response) {
  try {
    const pedidoId = Number(req.params.pedidoId);
    const pizzaId = Number(req.params.pizzaId);
    if (isNaN(pedidoId) || isNaN(pizzaId)) {
      return res.status(400).json({ message: 'Los IDs provistos deben ser números enteros válidos' });
    }

    const { detalle, pedido } = await service.actualizarDetalle(pedidoId, pizzaId, req.body.detalleInput.cantidad);
    return res.status(200).json({
      message: 'Detalle de pedido actualizado',
      data: detalle,
      pedido,
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const pedidoId = Number(req.params.pedidoId);
    const pizzaId = Number(req.params.pizzaId);
    if (isNaN(pedidoId) || isNaN(pizzaId)) {
      return res.status(400).json({ message: 'Los IDs provistos deben ser números enteros válidos' });
    }

    const pedidoActualizado = await service.eliminarDetalle(pedidoId, pizzaId);
    return res.status(200).json({
      message: 'Detalle de pedido eliminado exitosamente',
      pedido: pedidoActualizado,
    });
  } catch (error) {
    return handleError(res, error);
  }
}