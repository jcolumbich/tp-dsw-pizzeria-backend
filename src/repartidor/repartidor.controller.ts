import { Request, Response, NextFunction } from 'express';
import * as service from './repartidor.service.js';
import { handleError } from '../shared/handle-error.js';

export function sanitizeRepartidorInput(req: Request, res: Response, next: NextFunction) {
  if (!req.body) {
    return res.status(400).json({ message: 'El cuerpo de la petición es requerido' });
  }

  req.body.repartidorInput = {
    nombre: req.body.nombre,
    apellido: req.body.apellido,
    email: req.body.email,
    contrasenia: req.body.contrasenia,
    nivel_permisos: req.body.nivel_permisos,
    estado: req.body.estado,
    matricula: req.body.matricula,
    monto_propina_total: req.body.monto_propina_total,
  };

  Object.keys(req.body.repartidorInput).forEach((key) => {
    if (req.body.repartidorInput[key] === undefined) {
      delete req.body.repartidorInput[key];
    }
  });

  next();
}

export async function findAll(req: Request, res: Response) {
  try {
    const repartidores = await service.listarRepartidores();
    return res.status(200).json({ message: 'Todos los repartidores recuperados', data: repartidores });
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

    const repartidor = await service.buscarRepartidor(id);
    return res.status(200).json({ data: repartidor });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function add(req: Request, res: Response) {
  try {
    const nuevoRepartidor = await service.crearRepartidor(req.body.repartidorInput);
    return res.status(201).json({ message: 'Repartidor creado con éxito', data: nuevoRepartidor });
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

    const repartidor = await service.actualizarRepartidor(id, req.body.repartidorInput);
    return res.status(200).json({ message: 'Repartidor actualizado', data: repartidor });
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

    await service.eliminarRepartidor(id);
    return res.status(200).json({ message: 'Repartidor eliminado exitosamente' });
  } catch (error) {
    return handleError(res, error);
  }
}