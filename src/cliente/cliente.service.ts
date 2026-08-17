import { Cliente } from './cliente.entity.js';
import { ClienteRepository } from './cliente.repository.js';
import { HttpError } from '../shared/http-error.js';

const repository = new ClienteRepository();

export async function listarClientes(): Promise<Cliente[]> {
  return repository.findAll();
}

export async function buscarCliente(id: number): Promise<Cliente> {
  const cliente = await repository.findOne(id);
  if (!cliente) throw new HttpError(404, 'Cliente no encontrado');
  return cliente;
}

export async function crearCliente(datos: any): Promise<Cliente> {
  const { nombre, apellido, email, contrasenia, nivel_permisos, estado, domicilio } = datos;

  if (!nombre || typeof nombre !== 'string') {
    throw new HttpError(400, 'El nombre es requerido y debe ser texto');
  }
  if (!apellido || typeof apellido !== 'string') {
    throw new HttpError(400, 'El apellido es requerido y debe ser texto');
  }
  if (!email || typeof email !== 'string') {
    throw new HttpError(400, 'El email es requerido y debe ser texto');
  }
  if (!contrasenia || typeof contrasenia !== 'string') {
    throw new HttpError(400, 'La contraseña es requerida y debe ser texto');
  }
  if (nivel_permisos === undefined || typeof nivel_permisos !== 'number') {
    throw new HttpError(400, 'nivel_permisos es requerido y debe ser un número');
  }
  if (estado === undefined || typeof estado !== 'boolean') {
    throw new HttpError(400, 'estado es requerido y debe ser booleano');
  }
  if (!domicilio || typeof domicilio !== 'string') {
    throw new HttpError(400, 'El domicilio es requerido y debe ser texto');
  }

  return repository.add(datos);
}

export async function actualizarCliente(id: number, datos: any): Promise<Cliente> {
  if (Object.keys(datos).length === 0) {
    throw new HttpError(400, 'Debe enviar al menos un campo para actualizar');
  }

  const cliente = await repository.update(id, datos);
  if (!cliente) throw new HttpError(404, 'Cliente no encontrado');
  return cliente;
}

export async function eliminarCliente(id: number): Promise<void> {
  const eliminado = await repository.delete(id);
  if (!eliminado) throw new HttpError(404, 'Cliente no encontrado');
}