import { Pedido } from './pedido.entity.js';
import { PedidoRepository, ItemPedidoInput } from './pedido.repository.js';

import { RepartidorRepository } from '../repartidor/repartidor.repository.js';
import { EnvioRepository } from '../envio/envio.repository.js';
import { HttpError } from '../shared/http-error.js';

const repository = new PedidoRepository();

const envioRepository = new EnvioRepository();
const repartidorRepository = new RepartidorRepository();

interface ItemInput {
  pizzaId: number;
  cantidad: number;
}

export async function listarPedidos(estado?: string, clienteId?: number): Promise<Pedido[]> {
  return repository.findAll(estado, clienteId);
}

export async function buscarPedido(id: number): Promise<Pedido> {
  const pedido = await repository.findOne(id);
  if (!pedido) throw new HttpError(404, 'Pedido no encontrado');
  return pedido;
}

export async function crearPedido(retiro: unknown, clienteId: unknown, items: unknown): Promise<Pedido> {
  if (typeof retiro !== 'boolean') {
    throw new HttpError(400, 'retiro es requerido y debe ser true o false');
  }

  if (!Number.isInteger(clienteId) || Number(clienteId) <= 0) {
    throw new HttpError(400, 'clienteId es requerido y debe ser un número entero mayor a 0');
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new HttpError(400, 'items es requerido y debe ser una lista con al menos una pizza');
  }

  const itemsInput = items as ItemInput[];

  for (const item of itemsInput) {
    if (!Number.isInteger(item.pizzaId) || item.pizzaId <= 0 || !Number.isInteger(item.cantidad) || item.cantidad <= 0) {
      throw new HttpError(400, 'Cada item debe tener pizzaId y cantidad como números enteros mayores a 0');
    }
  }

  const itemsAgrupados = new Map<number, number>();

  for (const item of itemsInput) {
    itemsAgrupados.set(item.pizzaId, (itemsAgrupados.get(item.pizzaId) ?? 0) + item.cantidad);
  }

  const itemsPedido: ItemPedidoInput[] = [...itemsAgrupados.entries()].map(([pizzaId, cantidad]) => ({ pizzaId, cantidad }));

  return repository.addConItems(retiro, clienteId as number, itemsPedido);
}

export async function actualizarPedido(id: number, datos: Partial<{ retiro: boolean; estado: string }>): Promise<Pedido> {
  const pedidoActual = await repository.findOne(id);

  if (!pedidoActual) {
    throw new HttpError(404, 'Pedido no encontrado');
  }

  if (pedidoActual.estado === 'Cancelado') {
    if (datos.estado === 'Cancelado') {
      return pedidoActual;
    }

    throw new HttpError(409, 'Un pedido cancelado no puede volver a modificarse');
  }

  if (datos.estado === 'Cancelado') {
    const pedidoCancelado = await repository.cancelarConReposicion(id);

    if (!pedidoCancelado) {
      throw new HttpError(404, 'Pedido no encontrado');
    }

    return pedidoCancelado;
  }

  const pedido = await repository.update(id, datos);

  if (!pedido) {
    throw new HttpError(404, 'Pedido no encontrado');
  }

  return pedido;
}

export async function asignarEnvio(pedidoId: number, repartidorId: number, costo: number): Promise<Pedido> {
  const pedido = await repository.findOne(pedidoId);

  if (!pedido) {
    throw new HttpError(404, 'Pedido no encontrado');
  }

  if (pedido.retiro) {
    throw new HttpError(400, 'No se puede asignar un envío a un pedido con retiro en el local');
  }

  if (pedido.estado === 'Cancelado' || pedido.estado === 'Entregado') {
    throw new HttpError(400, `No se puede asignar un envío a un pedido ${pedido.estado.toLowerCase()}`);
  }

  if (pedido.envio) {
    throw new HttpError(409, 'El pedido ya tiene un envío asignado');
  }

  const repartidor = await repartidorRepository.findOne(repartidorId);

  if (!repartidor) {
    throw new HttpError(404, 'Repartidor no encontrado');
  }

  if (!repartidor.estado) {
    throw new HttpError(400, 'El repartidor seleccionado no está activo');
  }

  await envioRepository.add({ costo, monto_propina: 0, pedido } as any);

  const actualizado = await repository.update(pedidoId, { repartidor, estado: 'En camino' });

  if (!actualizado) {
    throw new HttpError(404, 'Pedido no encontrado');
  }

  const pedidoCompleto = await repository.findOne(pedidoId);

  if (!pedidoCompleto) {
    throw new HttpError(404, 'Pedido no encontrado');
  }

  return pedidoCompleto;
}

export async function eliminarPedido(id: number): Promise<void> {
  const pedido = await repository.cancelarConReposicion(id);

  if (!pedido) {
    throw new HttpError(404, 'Pedido no encontrado');
  }
}