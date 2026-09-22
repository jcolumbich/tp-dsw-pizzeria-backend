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

    if (!req.usuario) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    const clienteId = req.usuario.nivel_permisos === 0 ? req.usuario.id : undefined;
    const pedidos = await service.listarPedidos(estado, clienteId);

    return res.status(200).json({
      message: req.usuario.nivel_permisos === 0 ? 'Pedidos del cliente recuperados' : 'Todos los pedidos recuperados',
      data: pedidos,
    });
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

    if (!req.usuario) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    const pedido = await service.buscarPedido(id);

    if (req.usuario.nivel_permisos === 0 && pedido.cliente?.id !== req.usuario.id) {
      return res.status(403).json({ message: 'No tenés permiso para consultar este pedido' });
    }

    return res.status(200).json({ data: pedido });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function add(req: Request, res: Response) {
  try {
    const { retiro, items } = req.body.pedidoInput;

    const clienteId =
      req.usuario && req.usuario.nivel_permisos === 0
        ? req.usuario.id
        : req.body.pedidoInput.clienteId;

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

    delete req.body.pedidoInput.items;
    delete req.body.pedidoInput.clienteId;

    const pedido = await service.actualizarPedido(id, req.body.pedidoInput);
    return res.status(200).json({ message: 'Pedido actualizado', data: pedido });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function asignarEnvio(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const repartidorId = Number(req.body.repartidorId);
    const costo = Number(req.body.costo);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({message: 'El ID del pedido debe ser un número entero válido',});
    }

    if (!Number.isInteger(repartidorId) || repartidorId <= 0) {
      return res.status(400).json({  message: 'El repartidorId debe ser un número entero válido',});
    }

    if (!Number.isFinite(costo) || costo < 0) {
      return res.status(400).json({message: 'El costo debe ser un número mayor o igual a 0',});
    }

    const pedido = await service.asignarEnvio(id,repartidorId,costo);

    return res.status(200).json({message: 'Envío y repartidor asignados correctamente',data: pedido,});
  } catch (error) {
    return handleError(res, error);
  }
}