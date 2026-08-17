import { Repartidor } from './repartidor.entity.js';
import { RepartidorRepository } from './repartidor.repository.js';
import { HttpError } from '../shared/http-error.js';

const repository = new RepartidorRepository();

export async function listarRepartidores(): Promise<Repartidor[]> {
  return repository.findAll();
}

export async function buscarRepartidor(id: number): Promise<Repartidor> {
  const repartidor = await repository.findOne(id);
  if (!repartidor) throw new HttpError(404, 'Repartidor no encontrado');
  return repartidor;
}

export async function crearRepartidor(datos: any): Promise<Repartidor> {
  const { nombre, apellido, email, contrasenia, nivel_permisos, estado, matricula, monto_propina_total } = datos;

  if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') {
    throw new HttpError(400, 'El nombre es requerido y debe ser un texto válido');
  }
  if (!apellido || typeof apellido !== 'string' || apellido.trim() === '') {
    throw new HttpError(400, 'El apellido es requerido y debe ser un texto válido');
  }
  if (!email || typeof email !== 'string' || email.trim() === '') {
    throw new HttpError(400, 'El email es requerido y debe ser un texto válido');
  }
  if (!contrasenia || typeof contrasenia !== 'string' || contrasenia.trim() === '') {
    throw new HttpError(400, 'La contraseña es requerida y debe ser un texto válido');
  }
  if (nivel_permisos === undefined || typeof nivel_permisos !== 'number') {
    throw new HttpError(400, 'El nivel de permisos es requerido y debe ser un número');
  }
  if (estado === undefined || typeof estado !== 'boolean') {
    throw new HttpError(400, 'El estado es requerido y debe ser un booleano');
  }
  if (!matricula || typeof matricula !== 'string' || matricula.trim() === '') {
    throw new HttpError(400, 'La matrícula es requerida y debe ser un texto válido');
  }
  if (monto_propina_total === undefined || typeof monto_propina_total !== 'number' || monto_propina_total < 0) {
    throw new HttpError(400, 'El monto de propina total es requerido y debe ser un número mayor o igual a 0');
  }

  return repository.add(datos);
}

export async function actualizarRepartidor(id: number, datos: any): Promise<Repartidor> {
  const { nombre, apellido, email, contrasenia, nivel_permisos, estado, matricula, monto_propina_total } = datos;

  if (Object.keys(datos).length === 0) {
    throw new HttpError(400, 'Debe enviar al menos un campo para actualizar');
  }
  if (nombre !== undefined && (typeof nombre !== 'string' || nombre.trim() === '')) {
    throw new HttpError(400, 'El nombre debe ser un texto válido');
  }
  if (apellido !== undefined && (typeof apellido !== 'string' || apellido.trim() === '')) {
    throw new HttpError(400, 'El apellido debe ser un texto válido');
  }
  if (email !== undefined && (typeof email !== 'string' || email.trim() === '')) {
    throw new HttpError(400, 'El email debe ser un texto válido');
  }
  if (contrasenia !== undefined && (typeof contrasenia !== 'string' || contrasenia.trim() === '')) {
    throw new HttpError(400, 'La contraseña debe ser un texto válido');
  }
  if (nivel_permisos !== undefined && typeof nivel_permisos !== 'number') {
    throw new HttpError(400, 'El nivel de permisos debe ser un número');
  }
  if (estado !== undefined && typeof estado !== 'boolean') {
    throw new HttpError(400, 'El estado debe ser un booleano');
  }
  if (matricula !== undefined && (typeof matricula !== 'string' || matricula.trim() === '')) {
    throw new HttpError(400, 'La matrícula debe ser un texto válido');
  }
  if (monto_propina_total !== undefined && (typeof monto_propina_total !== 'number' || monto_propina_total < 0)) {
    throw new HttpError(400, 'El monto de propina total debe ser un número mayor o igual a 0');
  }

  const repartidor = await repository.update(id, datos);
  if (!repartidor) throw new HttpError(404, 'Repartidor no encontrado');
  return repartidor;
}

export async function eliminarRepartidor(id: number): Promise<void> {
  const eliminado = await repository.delete(id);
  if (!eliminado) throw new HttpError(404, 'Repartidor no encontrado');
}