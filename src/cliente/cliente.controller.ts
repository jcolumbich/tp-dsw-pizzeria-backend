import { Request, Response, NextFunction } from 'express';
import * as service from './cliente.service.js';
import { handleError } from '../shared/handle-error.js';

export function sanitizeClienteInput(req: Request, res: Response, next: NextFunction) {
  if (!req.body) {
    return res.status(400).json({ message: 'El cuerpo de la petición es requerido' });
  }

  req.body.clienteInput = {
    nombre: req.body.nombre,
    apellido: req.body.apellido,
    email: req.body.email,
    contrasenia: req.body.contrasenia,
    nivel_permisos: req.body.nivel_permisos,
    estado: req.body.estado,
    domicilio: req.body.domicilio,
  };

  Object.keys(req.body.clienteInput).forEach((key) => {
    if (req.body.clienteInput[key] === undefined) {
      delete req.body.clienteInput[key];
    }
  });

  next();
}

export async function findAll(req: Request, res: Response) {
  try {
    const clientes = await service.listarClientes();
    return res.status(200).json({ message: 'Todos los clientes recuperados', data: clientes });
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

    const cliente = await service.buscarCliente(id);
    return res.status(200).json({ data: cliente });
  } catch (error) {
    return handleError(res, error);
  }
}


export async function add(req: Request, res: Response) {
  try {
    const nuevoCliente = await service.crearCliente(req.body.clienteInput);
    return res.status(201).json({ message: 'Cliente creado con éxito', data: nuevoCliente });
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

    const cliente = await service.actualizarCliente(id, req.body.clienteInput);
    return res.status(200).json({ message: 'Cliente actualizado', data: cliente });
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

    await service.eliminarCliente(id);
    return res.status(200).json({ message: 'Cliente eliminado exitosamente' });
  } catch (error) {
    return handleError(res, error);
  }
}