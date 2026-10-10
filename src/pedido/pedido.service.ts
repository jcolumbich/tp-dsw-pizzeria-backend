import { Pedido } from './pedido.entity.js';
import { PedidoRepository } from './pedido.repository.js';
import type { ItemPedidoInput } from './pedido.repository.js';
import { HttpError } from '../shared/http-error.js';
import { crearPedidoConClienteSchema, actualizarPedidoSchema, asignarEnvioSchema } from './pedido.schema.js';

const repository = new PedidoRepository();

export async function listarPedidos(estado?: string, clienteId?: number): Promise<Pedido[]> {
  return repository.findAll(estado, clienteId);
}

export async function buscarPedido(id: number): Promise<Pedido> {
  const pedido = await repository.findOne(id);
  if (!pedido) throw new HttpError(404, 'Pedido no encontrado');
  return pedido;
}

export async function crearPedido(retiro: unknown, clienteId: unknown, items: unknown, montoPropina: unknown = 0): Promise<Pedido> {
  const resultado = crearPedidoConClienteSchema.safeParse({ retiro, clienteId, items, monto_propina: montoPropina });
  if (!resultado.success) {
    throw new HttpError(400, resultado.error.issues[0]?.message ?? 'Datos inválidos');
  }
  const datos = resultado.data;
  const itemsAgrupados = new Map<number, number>();
  for (const item of datos.items) {
    itemsAgrupados.set(item.pizzaId, (itemsAgrupados.get(item.pizzaId) ?? 0) + item.cantidad);
  }
  const itemsPedido: ItemPedidoInput[] = [...itemsAgrupados.entries()].map(
    ([pizzaId, cantidad]) => ({ pizzaId, cantidad })
  );
  return repository.addConItems(datos.retiro, datos.clienteId, itemsPedido, datos.monto_propina);
}

export async function actualizarPedido(id: number, entrada: Partial<{ retiro: boolean; estado: string }>): Promise<Pedido> {
  const resultado = actualizarPedidoSchema.safeParse(entrada);
  if (!resultado.success) {
    throw new HttpError(400, resultado.error.issues[0]?.message ?? 'Solo se puede actualizar el estado del pedido');
  }
  const datos = resultado.data;
  if (datos.estado === 'Entregado') {
    const pedidoEntregado = await repository.marcarEntregado(id);
    if (!pedidoEntregado) throw new HttpError(404, 'Pedido no encontrado');
    return pedidoEntregado;
  }
  if (datos.estado === 'Cancelado') {
    const pedidoCancelado = await repository.cancelarConReposicion(id);
    if (!pedidoCancelado) throw new HttpError(404, 'Pedido no encontrado');
    return pedidoCancelado;
  }
  if (datos.estado !== 'En preparación') {
    throw new HttpError(409, 'Para pasar un pedido a En camino tenés que asignar su envío');
  }
  const pedido = await repository.confirmarConBloqueo(id);
  if (!pedido) throw new HttpError(404, 'Pedido no encontrado');
  return pedido;
}

export async function asignarEnvio(pedidoId: number, repartidorId: number, costo: number): Promise<Pedido> {
  const resultado = asignarEnvioSchema.safeParse({ repartidorId, costo });
  if (!resultado.success) {
    throw new HttpError(400, resultado.error.issues[0]?.message ?? 'Datos de envío inválidos');
  }
  const datos = resultado.data;
  return repository.asignarEnvioConRepartidor(pedidoId, datos.repartidorId, datos.costo);
}

export async function eliminarPedido(id: number): Promise<void> {
  const eliminado = await repository.delete(id);
  if (!eliminado) throw new HttpError(404, 'Pedido no encontrado');
}