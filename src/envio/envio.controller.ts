import { Request, Response, NextFunction } from 'express';
import * as service from './envio.service.js';
import { handleError } from '../shared/handle-error.js';

export function sanitizeEnvioInput(req: Request, res: Response, next: NextFunction) {
  if (!req.body) {
    return res.status(400).json({ message: 'El cuerpo de la petición es requerido' });
  }

  req.body.envioInput = {
    costo: req.body.costo,
    monto_propina: req.body.monto_propina,
    pedido: req.body.pedidoId,
  };

  Object.keys(req.body.envioInput).forEach((key) => {
    if (req.body.envioInput[key] === undefined) {
      delete req.body.envioInput[key];
    }
  });

  next();
}

export async function findAll(req: Request, res: Response) {
  try {
    const envios = await service.listarEnvios();
    return res.status(200).json({ message: 'Todos los envíos recuperados', data: envios });
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

    const envio = await service.buscarEnvio(id);
    return res.status(200).json({ data: envio });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function add(req: Request, res: Response) {
  try {
    const nuevoEnvio = await service.crearEnvio(req.body.envioInput);
    return res.status(201).json({ message: 'Envío creado con éxito', data: nuevoEnvio });
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

    const envio = await service.actualizarEnvio(id, req.body.envioInput);
    return res.status(200).json({ message: 'Envío actualizado', data: envio });
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

    await service.eliminarEnvio(id);
    return res.status(200).json({ message: 'Envío eliminado exitosamente' });
  } catch (error) {
    return handleError(res, error);
  }
}