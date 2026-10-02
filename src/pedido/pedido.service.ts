import { Pedido } from './pedido.entity.js';
import { PedidoRepository } from './pedido.repository.js';
import type { ItemPedidoInput } from './pedido.repository.js';
import { RepartidorRepository } from '../repartidor/repartidor.repository.js';
import { EnvioRepository } from '../envio/envio.repository.js';
import { Envio } from '../envio/envio.entity.js';
import { HttpError } from '../shared/http-error.js';
import { crearPedidoConClienteSchema, actualizarPedidoSchema, asignarEnvioSchema } from './pedido.schema.js';

const repository = new PedidoRepository();
const envioRepository = new EnvioRepository();
const repartidorRepository = new RepartidorRepository();

export async function listarPedidos(estado?: string, clienteId?: number): Promise<Pedido[]> {
  return repository.findAll(estado, clienteId);
}

export async function buscarPedido(id: number): Promise<Pedido> {
  const pedido = await repository.findOne(id);
  if (!pedido) throw new HttpError(404, 'Pedido no encontrado');
  return pedido;
}

export async function crearPedido(retiro: unknown, clienteId: unknown, items: unknown): Promise<Pedido> {
  const resultado = crearPedidoConClienteSchema.safeParse({ retiro, clienteId, items });
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

  return repository.addConItems(datos.retiro, datos.clienteId, itemsPedido);
}

export async function actualizarPedido(id: number, entrada: Partial<{ retiro: boolean; estado: string }>): Promise<Pedido> {
  const resultado = actualizarPedidoSchema.safeParse(entrada);
  if (!resultado.success) {
    throw new HttpError(400, resultado.error.issues[0]?.message ?? 'Solo se puede actualizar el estado del pedido');
  }
  const datos = resultado.data;

  const pedidoActual = await repository.findOne(id);
  if (!pedidoActual) throw new HttpError(404, 'Pedido no encontrado');
  if (pedidoActual.estado === 'Entregado') {
    throw new HttpError(409, 'No se puede modificar un pedido entregado anteriormente');
  }

  if (pedidoActual.estado === 'Cancelado') {
    if (datos.estado === 'Cancelado') return pedidoActual;
    throw new HttpError(409, 'Un pedido cancelado no puede volver a modificarse');
  }

  if (datos.estado === 'Cancelado') {
    const pedidoCancelado = await repository.cancelarConReposicion(id);
    if (!pedidoCancelado) throw new HttpError(404, 'Pedido no encontrado');
    return pedidoCancelado;
  }

  if (pedidoActual.estado !== 'Pendiente' || datos.estado !== 'En preparación') {
    throw new HttpError(409, 'Solo se puede confirmar un pedido pendiente');
  }

  const pedido = await repository.update(id, { estado: 'En preparación' });
  if (!pedido) throw new HttpError(404, 'Pedido no encontrado');
  return pedido;
}

export async function asignarEnvio(pedidoId: number, repartidorId: number, costo: number): Promise<Pedido> {
  const resultado = asignarEnvioSchema.safeParse({ repartidorId, costo });
  if (!resultado.success) {
    throw new HttpError(400, resultado.error.issues[0]?.message ?? 'Datos de envío inválidos');
  }
  const datos = resultado.data;

  const pedido = await repository.findOne(pedidoId);
  if (!pedido) throw new HttpError(404, 'Pedido no encontrado');
  if (pedido.retiro) {
    throw new HttpError(400, 'No se puede asignar un envío a un pedido con retiro en el local');
  }
  if (pedido.estado !== 'En preparación') {
    throw new HttpError(409, 'Confirmá el pedido antes de asignar el envío');
  }
  if (pedido.envio) {
    throw new HttpError(409, 'El pedido ya tiene un envío asignado');
  }

  const repartidor = await repartidorRepository.findOne(datos.repartidorId);
  if (!repartidor) throw new HttpError(404, 'Repartidor no encontrado');
  if (!repartidor.estado) {
    throw new HttpError(400, 'El repartidor seleccionado no está activo');
  }

  const envio = new Envio();
  envio.costo = datos.costo;
  envio.monto_propina = 0;
  envio.pedido = pedido;
  await envioRepository.add(envio);

  const actualizado = await repository.update(pedidoId, { repartidor, estado: 'En camino' });
  if (!actualizado) throw new HttpError(404, 'Pedido no encontrado');

  const pedidoCompleto = await repository.findOne(pedidoId);
  if (!pedidoCompleto) throw new HttpError(404, 'Pedido no encontrado');
  return pedidoCompleto;
}

export async function eliminarPedido(id: number): Promise<void> {
  const pedido = await repository.cancelarConReposicion(id);
  if (!pedido) throw new HttpError(404, 'Pedido no encontrado');
}