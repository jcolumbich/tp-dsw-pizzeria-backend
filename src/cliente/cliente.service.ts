import bcrypt from 'bcryptjs';
import { Cliente } from './cliente.entity.js';
import { ClienteRepository } from './cliente.repository.js';
import { RepartidorRepository } from '../repartidor/repartidor.repository.js';
import { HttpError } from '../shared/http-error.js';
import { crearClienteSchema, crearClienteDesdeRegistroSchema, actualizarClienteSchema } from './cliente.schema.js';

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

export async function crearCliente(entrada: unknown, desdeRegistro = false): Promise<Cliente> {
  const schema = desdeRegistro ? crearClienteDesdeRegistroSchema : crearClienteSchema;
  const resultado = schema.safeParse(entrada);
  if (!resultado.success) {
    throw new HttpError(400, resultado.error.issues[0]?.message ?? 'Datos inválidos');
  }
  const datos = resultado.data;

  const clienteExistente = await repository.findByEmail(datos.email);
  const repartidorExistente = await repartidorRepository.findByEmail(datos.email);
  if (clienteExistente || repartidorExistente) {
    throw new HttpError(409, 'Ya existe un usuario registrado con ese email');
  }

  const cliente = new Cliente();
  cliente.nombre = datos.nombre;
  cliente.apellido = datos.apellido;
  cliente.email = datos.email;
  cliente.contrasenia = await bcrypt.hash(datos.contrasenia, 10);
  cliente.nivel_permisos = datos.nivel_permisos;
  cliente.estado = datos.estado;
  cliente.domicilio = datos.domicilio;

  return repository.add(cliente);
}

export async function actualizarCliente(id: number, entrada: unknown): Promise<Cliente> {
  const resultado = actualizarClienteSchema.safeParse(entrada);
  if (!resultado.success) {
    throw new HttpError(400, resultado.error.issues[0]?.message ?? 'Datos inválidos');
  }

  const actual = await repository.findOne(id);
  if (!actual) throw new HttpError(404, 'Cliente no encontrado');

  const datos = resultado.data;
  const cambios: Partial<Cliente> = {};

  if (datos.nombre !== undefined) cambios.nombre = datos.nombre;
  if (datos.apellido !== undefined) cambios.apellido = datos.apellido;
  if (datos.domicilio !== undefined) cambios.domicilio = datos.domicilio;
  if (datos.estado !== undefined) cambios.estado = datos.estado;

  if (datos.email !== undefined) {
    const clienteExistente = await repository.findByEmail(datos.email);
    const repartidorExistente = await repartidorRepository.findByEmail(datos.email);
    if ((clienteExistente && clienteExistente.id !== id) || repartidorExistente) {
      throw new HttpError(409, 'Ya existe un usuario registrado con ese email');
    }
    cambios.email = datos.email;
  }

  if (datos.contrasenia !== undefined) {
    cambios.contrasenia = await bcrypt.hash(datos.contrasenia, 10);
  }

  const cliente = await repository.update(id, cambios);
  if (!cliente) throw new HttpError(404, 'Cliente no encontrado');
  return cliente;
}

export async function eliminarCliente(id: number): Promise<void> {
  const eliminado = await repository.delete(id);
  if (!eliminado) throw new HttpError(404, 'Cliente no encontrado');
}