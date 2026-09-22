import bcrypt from 'bcryptjs';
import { Repartidor } from './repartidor.entity.js';
import { RepartidorRepository } from './repartidor.repository.js';
import { HttpError } from '../shared/http-error.js';
import { ClienteRepository } from '../cliente/cliente.repository.js';

const repository = new RepartidorRepository();
const clienteRepository = new ClienteRepository();

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

  if (!matricula || typeof matricula !== 'string') {
    throw new HttpError(400, 'La matrícula es requerida y debe ser texto');
  }

 const emailNormalizado = email.trim().toLowerCase();
 const repartidorExistente = await repository.findByEmail(emailNormalizado);
 const clienteExistente = await clienteRepository.findByEmail(emailNormalizado);

 if (repartidorExistente || clienteExistente) {
  throw new HttpError(409, 'Ya existe un usuario registrado con ese email');
 }

  const contraseniaHasheada = await bcrypt.hash(contrasenia, 10);

 return repository.add({
  ...datos,
  email: emailNormalizado,
  contrasenia: contraseniaHasheada,
  monto_propina_total: monto_propina_total ?? 0,
 });
}

export async function actualizarRepartidor(id: number, datos: any): Promise<Repartidor> {
  if (Object.keys(datos).length === 0) {
    throw new HttpError(400, 'Debe enviar al menos un campo para actualizar');
  }

  if (datos.contrasenia) {
    datos.contrasenia = await bcrypt.hash(datos.contrasenia, 10);
  }

  if (datos.email !== undefined) {
    if (typeof datos.email !== 'string' || !datos.email.trim()) {
      throw new HttpError(400, 'El email debe ser un texto válido');
    }

    const emailNormalizado = datos.email.trim().toLowerCase();
    const repartidorExistente = await repository.findByEmail(emailNormalizado);
    const clienteExistente = await clienteRepository.findByEmail(emailNormalizado);

    if ((repartidorExistente && repartidorExistente.id !== id) || clienteExistente) {
    throw new HttpError(409, 'Ya existe un usuario registrado con ese email');
    }

    datos.email = emailNormalizado;
  }

  const repartidor = await repository.update(id, datos);

  if (!repartidor) {
    throw new HttpError(404, 'Repartidor no encontrado');
  }

  return repartidor;
}

export async function eliminarRepartidor(id: number): Promise<void> {
  const repartidor = await repository.findOne(id);
  if (!repartidor) throw new HttpError(404, 'Repartidor no encontrado');

  const tienePedidosAsignados = await repository.tienePedidosAsignados(id);

  if (tienePedidosAsignados) {
    throw new HttpError(409, 'No se puede eliminar el repartidor porque tiene pedidos asignados. Podés marcarlo como inactivo.');
  }

  const eliminado = await repository.delete(id);
  if (!eliminado) throw new HttpError(404, 'Repartidor no encontrado');
}