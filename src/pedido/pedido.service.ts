import { Pedido } from './pedido.entity.js';
import { PedidoRepository, ItemPedidoInput } from './pedido.repository.js';
import { PizzaRepository } from '../pizza/pizza.repository.js';
import { ClienteRepository } from '../cliente/cliente.repository.js';
import { DetallePedidoRepository } from '../detalle-pedido/detalle-pedido.repository.js';
import { RepartidorRepository } from '../repartidor/repartidor.repository.js';
import { EnvioRepository } from '../envio/envio.repository.js';
import { HttpError } from '../shared/http-error.js';

const repository = new PedidoRepository();
const pizzaRepository = new PizzaRepository();
const clienteRepository = new ClienteRepository();
const detallePedidoRepository = new DetallePedidoRepository();
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
  if (clienteId === undefined || typeof clienteId !== 'number') {
    throw new HttpError(400, 'clienteId es requerido y debe ser un número');
  }
  if (!Array.isArray(items) || items.length === 0) {
    throw new HttpError(400, 'items es requerido y debe ser una lista con al menos una pizza');
  }

  const itemsInput = items as ItemInput[];

  for (const item of itemsInput) {
    if (typeof item.pizzaId !== 'number' || typeof item.cantidad !== 'number' || item.cantidad <= 0) {
      throw new HttpError(400, 'Cada item debe tener pizzaId (número) y cantidad (número mayor a 0)');
    }
  }

  const cliente = await clienteRepository.findOne(clienteId);
  if (!cliente) {
    throw new HttpError(404, `No existe un cliente con id ${clienteId}`);
  }

  const itemsConPizza: ItemPedidoInput[] = [];
  for (const item of itemsInput) {
    const pizza = await pizzaRepository.findOne(item.pizzaId);
    if (!pizza) {
      throw new HttpError(404, `No existe una pizza con id ${item.pizzaId}`);
    }
    if (!pizza.disponible) {
      throw new HttpError(400, `La pizza "${pizza.nombre}" no está disponible`);
    }
    itemsConPizza.push({ pizza, cantidad: item.cantidad });
  }

  return repository.addConItems(retiro, cliente, itemsConPizza);
}

export async function actualizarPedido(
  id: number,
  datos: Partial<{ retiro: boolean; estado: string }>
): Promise<Pedido> {
  const pedido = await repository.update(id, datos);
  if (!pedido) throw new HttpError(404, 'Pedido no encontrado');
  return pedido;
}

export async function asignarEnvio(
  pedidoId: number,
  repartidorId: number,
  costo: number
): Promise<Pedido> {
  const pedido = await repository.findOne(pedidoId);

  if (!pedido) {
    throw new HttpError(404, 'Pedido no encontrado');
  }

  if (pedido.retiro) {
    throw new HttpError(400,'No se puede asignar un envío a un pedido con retiro en el local');
  }

  if (pedido.estado === 'Cancelado' || pedido.estado === 'Entregado') {
    throw new HttpError(400,`No se puede asignar un envío a un pedido ${pedido.estado.toLowerCase()}`);
  }

  if (pedido.envio) {
    throw new HttpError(409,'El pedido ya tiene un envío asignado');
  }

  const repartidor = await repartidorRepository.findOne(repartidorId);

  if (!repartidor) {
    throw new HttpError(404, 'Repartidor no encontrado');
  }

  if (!repartidor.estado) {
    throw new HttpError(400,'El repartidor seleccionado no está activo');
  }

  await envioRepository.add({costo,monto_propina: 0,pedido,} as any);

  const actualizado = await repository.update(pedidoId, {repartidor,estado: 'En camino',});

  if (!actualizado) {
    throw new HttpError(404, 'Pedido no encontrado');
  }

  const pedidoCompleto = await repository.findOne(pedidoId);

  if (!pedidoCompleto) { throw new HttpError(404, 'Pedido no encontrado');
  }

  return pedidoCompleto;
}

export async function eliminarPedido(id: number): Promise<void> {
  const pedido = await repository.findOne(id);
  if (!pedido) throw new HttpError(404, 'Pedido no encontrado');

  // Cascade manual: primero los detalles (ítems), después el envío si existe
  const detalles = await detallePedidoRepository.findByPedido(id);
  for (const detalle of detalles) {
    await detallePedidoRepository.delete(id, detalle.pizza.id);
  }

  const envios = await envioRepository.findAll();
  const envioDelPedido = envios.find((e) => e.pedido.id === id);
  if (envioDelPedido) {
    await envioRepository.delete(envioDelPedido.id);
  }

  const eliminado = await repository.delete(id);
  if (!eliminado) throw new HttpError(404, 'Pedido no encontrado');
}