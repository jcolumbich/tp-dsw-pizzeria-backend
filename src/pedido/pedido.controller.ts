import { Request, Response, NextFunction } from 'express';
import * as service from './pedido.service.js';
import { handleError } from '../shared/handle-error.js';

export function sanitizePedidoInput(req: Request, res: Response, next: NextFunction) {
  if (!req.body) {
    return res.status(400).json({ message: 'El cuerpo de la petición es requerido' });
  }

  req.body.pedidoInput = {
    retiro: req.body.retiro,
    estado: req.body.estado,
    clienteId: req.body.clienteId,
    items: req.body.items,
  };

  Object.keys(req.body.pedidoInput).forEach((key) => {
    if (req.body.pedidoInput[key] === undefined) {
      delete req.body.pedidoInput[key];
    }
  });

  next();
}

export async function findAll(req: Request, res: Response) {
  try {
    const estado = req.query.estado as string | undefined;
    const pedidos = await service.listarPedidos(estado);
    return res.status(200).json({ message: 'Todos los pedidos recuperados', data: pedidos });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function findOne(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'El ID provisto debe ser un número entero válido' });
    }

    const pedido = await service.buscarPedido(id);
    return res.status(200).json({ data: pedido });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function add(req: Request, res: Response) {
  try {
    const { retiro, clienteId, items } = req.body.pedidoInput;
    const nuevoPedido = await service.crearPedido(retiro, clienteId, items);
    return res.status(201).json({ message: 'Pedido creado con éxito', data: nuevoPedido });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function update(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'El ID provisto debe ser un número entero válido' });
    }

    // "items" y "clienteId" solo tienen sentido en la creación (add).
    delete req.body.pedidoInput.items;
    delete req.body.pedidoInput.clienteId;

    const pedido = await service.actualizarPedido(id, req.body.pedidoInput);
    return res.status(200).json({ message: 'Pedido actualizado', data: pedido });
  } catch (error) {
    return handleError(res, error);
  }
}
export async function remove(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'El ID provisto debe ser un número entero válido' });
    }

    await service.eliminarPedido(id);
    return res.status(200).json({ message: 'Pedido eliminado exitosamente' });
  } catch (error) {
    return handleError(res, error);
  }
}