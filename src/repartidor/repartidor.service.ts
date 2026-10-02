import bcrypt from 'bcryptjs';
import { Repartidor } from './repartidor.entity.js';
import { RepartidorRepository } from './repartidor.repository.js';
import { ClienteRepository } from '../cliente/cliente.repository.js';
import { HttpError } from '../shared/http-error.js';
import { crearRepartidorSchema, actualizarRepartidorSchema } from './repartidor.schema.js';

const repository = new RepartidorRepository();
const clienteRepository = new ClienteRepository();

function normalizarMatricula(matricula: string): string {
  return matricula.trim().toUpperCase();
}

async function comprobarMatriculaDisponible(matricula: string, idActual?: number): Promise<void> {
  const repartidores = await repository.findAll();
  const repetida = repartidores.some(
    (repartidor) => repartidor.id !== idActual && normalizarMatricula(repartidor.matricula) === matricula
  );
  if (repetida) throw new HttpError(409, 'Ya existe un repartidor con esa matrícula');
}

export async function listarRepartidores(): Promise<Repartidor[]> {
  return repository.findAll();
}

export async function buscarRepartidor(id: number): Promise<Repartidor> {
  const repartidor = await repository.findOne(id);
  if (!repartidor) throw new HttpError(404, 'Repartidor no encontrado');
  return repartidor;
}

export async function crearRepartidor(entrada: unknown): Promise<Repartidor> {
  const resultado = crearRepartidorSchema.safeParse(entrada);
  if (!resultado.success) {
    throw new HttpError(400, resultado.error.issues[0]?.message ?? 'Datos inválidos');
  }
  const datos = resultado.data;

  const repartidorExistente = await repository.findByEmail(datos.email);
  const clienteExistente = await clienteRepository.findByEmail(datos.email);
  if (repartidorExistente || clienteExistente) {
    throw new HttpError(409, 'Ya existe un usuario registrado con ese email');
  }

  await comprobarMatriculaDisponible(datos.matricula);

  const repartidor = new Repartidor();
  repartidor.nombre = datos.nombre;
  repartidor.apellido = datos.apellido;
  repartidor.email = datos.email;
  repartidor.contrasenia = await bcrypt.hash(datos.contrasenia, 10);
  repartidor.nivel_permisos = datos.nivel_permisos;
  repartidor.estado = datos.estado;
  repartidor.matricula = datos.matricula;
  repartidor.monto_propina_total = datos.monto_propina_total;

  return repository.add(repartidor);
}

export async function actualizarRepartidor(id: number, entrada: unknown): Promise<Repartidor> {
  const resultado = actualizarRepartidorSchema.safeParse(entrada);
  if (!resultado.success) {
    throw new HttpError(400, resultado.error.issues[0]?.message ?? 'Datos inválidos');
  }

  const actual = await repository.findOne(id);
  if (!actual) throw new HttpError(404, 'Repartidor no encontrado');

  const datos = resultado.data;
  const cambios: Partial<Repartidor> = {};

  if (datos.nombre !== undefined) cambios.nombre = datos.nombre;
  if (datos.apellido !== undefined) cambios.apellido = datos.apellido;
  if (datos.estado !== undefined) cambios.estado = datos.estado;

  if (datos.email !== undefined) {
    const repartidorExistente = await repository.findByEmail(datos.email);
    const clienteExistente = await clienteRepository.findByEmail(datos.email);
    if ((repartidorExistente && repartidorExistente.id !== id) || clienteExistente) {
      throw new HttpError(409, 'Ya existe un usuario registrado con ese email');
    }
    cambios.email = datos.email;
  }

  if (datos.matricula !== undefined) {
    await comprobarMatriculaDisponible(datos.matricula, id);
    cambios.matricula = datos.matricula;
  }

  if (datos.contrasenia !== undefined) {
    cambios.contrasenia = await bcrypt.hash(datos.contrasenia, 10);
  }

  const repartidor = await repository.update(id, cambios);
  if (!repartidor) throw new HttpError(404, 'Repartidor no encontrado');
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