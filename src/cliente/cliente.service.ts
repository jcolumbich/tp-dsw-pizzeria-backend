import bcrypt from 'bcryptjs';
import { Cliente } from './cliente.entity.js';
import { ClienteRepository } from './cliente.repository.js';
import { RepartidorRepository } from '../repartidor/repartidor.repository.js';
import { HttpError } from '../shared/http-error.js';

const repository = new ClienteRepository();
const repartidorRepository = new RepartidorRepository();

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

  const emailNormalizado = email.trim().toLowerCase();
  const clienteExistente = await repository.findByEmail(emailNormalizado);
  const repartidorExistente = await repartidorRepository.findByEmail(emailNormalizado);

  if (clienteExistente || repartidorExistente) {
    throw new HttpError(409, 'Ya existe un usuario registrado con ese email');
  }

  const contraseniaHasheada = await bcrypt.hash(contrasenia, 10);

  return repository.add({
    ...datos,
    nombre: nombre.trim(),
    apellido: apellido.trim(),
    email: emailNormalizado,
    contrasenia: contraseniaHasheada,
    domicilio: domicilio.trim(),
  });
}

export async function actualizarCliente(id: number, datos: any): Promise<Cliente> {
  if (Object.keys(datos).length === 0) {
    throw new HttpError(400, 'Debe enviar al menos un campo para actualizar');
  }

  if (datos.nombre !== undefined) {
    if (typeof datos.nombre !== 'string' || !datos.nombre.trim()) {
      throw new HttpError(400, 'El nombre debe ser un texto válido');
    }

    datos.nombre = datos.nombre.trim();
  }

  if (datos.apellido !== undefined) {
    if (typeof datos.apellido !== 'string' || !datos.apellido.trim()) {
      throw new HttpError(400, 'El apellido debe ser un texto válido');
    }

    datos.apellido = datos.apellido.trim();
  }

  if (datos.domicilio !== undefined) {
    if (typeof datos.domicilio !== 'string' || !datos.domicilio.trim()) {
      throw new HttpError(400, 'El domicilio debe ser un texto válido');
    }

    datos.domicilio = datos.domicilio.trim();
  }

  if (datos.email !== undefined) {
    if (typeof datos.email !== 'string' || !datos.email.trim()) {
      throw new HttpError(400, 'El email debe ser un texto válido');
    }

    const emailNormalizado = datos.email.trim().toLowerCase();
    const clienteExistente = await repository.findByEmail(emailNormalizado);
    const repartidorExistente = await repartidorRepository.findByEmail(emailNormalizado);

    if ((clienteExistente && clienteExistente.id !== id) || repartidorExistente) {
      throw new HttpError(409, 'Ya existe un usuario registrado con ese email');
    }

    datos.email = emailNormalizado;
  }

  if (datos.contrasenia !== undefined) {
    if (typeof datos.contrasenia !== 'string' || !datos.contrasenia.trim()) {
      throw new HttpError(400, 'La contraseña debe ser un texto válido');
    }

    datos.contrasenia = await bcrypt.hash(datos.contrasenia.trim(), 10);
  }

  const cliente = await repository.update(id, datos);

  if (!cliente) {
    throw new HttpError(404, 'Cliente no encontrado');
  }

  return cliente;
}

export async function eliminarCliente(id: number): Promise<void> {
  const eliminado = await repository.delete(id);
  if (!eliminado) throw new HttpError(404, 'Cliente no encontrado');
}