import { Request, Response } from 'express';
import * as service from './pedido.service.js';
import { handleError } from '../shared/handle-error.js';
import { filtroPedidoSchema } from './pedido.schema.js';

export async function findAll(req: Request, res: Response) {
  try {
    if (!req.usuario) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    const resultado = filtroPedidoSchema.safeParse(req.query);
    if (!resultado.success) {
      return res.status(400).json({ message: 'El filtro de estado no es válido' });
    }

    const clienteId = req.usuario.nivel_permisos === 0 ? req.usuario.id : undefined;
    const pedidos = await service.listarPedidos(resultado.data.estado, clienteId);
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
    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'El ID provisto debe ser un número entero positivo válido' });
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
    if (!req.usuario) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }
    if (req.usuario.nivel_permisos !== 0) {
      return res.status(403).json({ message: 'Solo los clientes pueden crear pedidos' });
    }

    const { retiro, items } = req.body.pedidoInput;
    const nuevoPedido = await service.crearPedido(retiro, req.usuario.id, items);
    return res.status(201).json({ message: 'Pedido creado con éxito', data: nuevoPedido });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function update(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'El ID provisto debe ser un número entero positivo válido' });
    }
    const pedido = await service.actualizarPedido(id, req.body.pedidoInput);
    return res.status(200).json({ message: 'Pedido actualizado', data: pedido });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function asignarEnvio(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'El ID del pedido debe ser un número entero positivo válido' });
    }
    const { repartidorId, costo } = req.body.envioInput;
    const pedido = await service.asignarEnvio(id, repartidorId, costo);
    return res.status(200).json({ message: 'Envío y repartidor asignados correctamente', data: pedido });
  } catch (error) {
    return handleError(res, error);
  }
}