import { Envio } from './envio.entity.js';
import { EnvioRepository } from './envio.repository.js';
import { PedidoRepository } from '../pedido/pedido.repository.js';
import { HttpError } from '../shared/http-error.js';
import type { CrearEnvioInput, ActualizarEnvioInput } from './envio.schema.js';

const repository = new EnvioRepository();
const pedidoRepository = new PedidoRepository();

export async function listarEnvios(): Promise<Envio[]> {
  return repository.findAll();
}

export async function buscarEnvio(id: number): Promise<Envio> {
  const envio = await repository.findOne(id);
  if (!envio) throw new HttpError(404, 'Envío no encontrado');
  return envio;
}

export async function crearEnvio(datos: CrearEnvioInput): Promise<Envio> {
  const pedidoEncontrado = await pedidoRepository.findOne(datos.pedido);
  if (!pedidoEncontrado) throw new HttpError(404, 'El pedido indicado no existe');

  const envio = new Envio();
  envio.costo = datos.costo;
  envio.monto_propina = datos.monto_propina;
  envio.pedido = pedidoEncontrado;

  return repository.add(envio);
}

export async function actualizarEnvio(id: number, datos: ActualizarEnvioInput): Promise<Envio> {
  const actual = await repository.findOne(id);
  if (!actual) throw new HttpError(404, 'Envío no encontrado');

  const cambios: Partial<Envio> = {};
  if (datos.costo !== undefined) cambios.costo = datos.costo;
  if (datos.monto_propina !== undefined) cambios.monto_propina = datos.monto_propina;

  if (datos.pedido !== undefined) {
    const pedidoEncontrado = await pedidoRepository.findOne(datos.pedido);
    if (!pedidoEncontrado) throw new HttpError(404, 'El pedido indicado no existe');
    cambios.pedido = pedidoEncontrado;
  }

  const envio = await repository.update(id, cambios);
  if (!envio) throw new HttpError(404, 'Envío no encontrado');
  return envio;
}

export async function eliminarEnvio(id: number): Promise<void> {
  const eliminado = await repository.delete(id);
  if (!eliminado) throw new HttpError(404, 'Envío no encontrado');
}