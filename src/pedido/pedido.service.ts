import { Pedido } from './pedido.entity.js';
import { PedidoRepository, ItemPedidoInput } from './pedido.repository.js';
import { PizzaRepository } from '../pizza/pizza.repository.js';
import { ClienteRepository } from '../cliente/cliente.repository.js';
import { HttpError } from '../shared/http-error.js';

const repository = new PedidoRepository();
const pizzaRepository = new PizzaRepository();
const clienteRepository = new ClienteRepository();

interface ItemInput {
  pizzaId: number;
  cantidad: number;
}

export async function listarPedidos(estado?: string): Promise<Pedido[]> {
  return repository.findAll(estado);
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

export async function eliminarPedido(id: number): Promise<void> {
  const eliminado = await repository.delete(id);
  if (!eliminado) throw new HttpError(404, 'Pedido no encontrado');
}