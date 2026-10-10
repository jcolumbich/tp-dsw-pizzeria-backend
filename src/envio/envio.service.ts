import { Envio } from './envio.entity.js';
import { EnvioRepository } from './envio.repository.js';
import { HttpError } from '../shared/http-error.js';
import type { CrearEnvioInput, ActualizarEnvioInput } from './envio.schema.js';

const repository = new EnvioRepository();

export async function listarEnvios(): Promise<Envio[]> {
  return repository.findAll();
}

export async function buscarEnvio(id: number): Promise<Envio> {
  const envio = await repository.findOne(id);
  if (!envio) throw new HttpError(404, 'Envío no encontrado');
  return envio;
}

export async function crearEnvio(datos: CrearEnvioInput): Promise<Envio> {
  return repository.add(datos);
}

export async function actualizarEnvio(id: number, datos: ActualizarEnvioInput): Promise<Envio> {
  const envio = await repository.update(id, datos);
  if (!envio) throw new HttpError(404, 'Envío no encontrado');
  return envio;
}

export async function eliminarEnvio(id: number): Promise<void> {
  const eliminado = await repository.delete(id);
  if (!eliminado) throw new HttpError(404, 'Envío no encontrado');
}