import { Envio } from './envio.entity.js';
import { EnvioRepository } from './envio.repository.js';
import { PedidoRepository } from '../pedido/pedido.repository.js';
import { HttpError } from '../shared/http-error.js';

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

export async function crearEnvio(datos: any): Promise<Envio> {
  const { costo, monto_propina, pedido } = datos;

  if (costo === undefined || typeof costo !== 'number' || costo < 0) {
    throw new HttpError(400, 'El costo es requerido y debe ser un número mayor o igual a 0');
  }
  if (monto_propina === undefined || typeof monto_propina !== 'number' || monto_propina < 0) {
    throw new HttpError(400, 'El monto de propina es requerido y debe ser un número mayor o igual a 0');
  }
  if (pedido === undefined || typeof pedido !== 'number') {
    throw new HttpError(400, 'El pedidoId es requerido y debe ser un número');
  }

  const pedidoEncontrado = await pedidoRepository.findOne(pedido);
  if (!pedidoEncontrado) {
    throw new HttpError(404, 'El pedido indicado no existe');
  }

  return repository.add({ ...datos, pedido: pedidoEncontrado });
}

export async function actualizarEnvio(id: number, datos: any): Promise<Envio> {
  const { costo, monto_propina, pedido } = datos;

  if (Object.keys(datos).length === 0) {
    throw new HttpError(400, 'Debe enviar al menos un campo para actualizar');
  }
  if (costo !== undefined && (typeof costo !== 'number' || costo < 0)) {
    throw new HttpError(400, 'El costo debe ser un número mayor o igual a 0');
  }
  if (monto_propina !== undefined && (typeof monto_propina !== 'number' || monto_propina < 0)) {
    throw new HttpError(400, 'El monto de propina debe ser un número mayor o igual a 0');
  }

  const inputFinal: any = { ...datos };
  if (pedido !== undefined) {
    const pedidoEncontrado = await pedidoRepository.findOne(pedido);
    if (!pedidoEncontrado) {
      throw new HttpError(404, 'El pedido indicado no existe');
    }
    inputFinal.pedido = pedidoEncontrado;
  }

  const envio = await repository.update(id, inputFinal);
  if (!envio) throw new HttpError(404, 'Envío no encontrado');
  return envio;
}

export async function eliminarEnvio(id: number): Promise<void> {
  const eliminado = await repository.delete(id);
  if (!eliminado) throw new HttpError(404, 'Envío no encontrado');
}