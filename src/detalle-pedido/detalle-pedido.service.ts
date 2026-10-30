import { DetallePedido } from './detalle-pedido.entity.js';
import { DetallePedidoRepository } from './detalle-pedido.repository.js';
import { PizzaRepository } from '../pizza/pizza.repository.js';
import { PedidoRepository } from '../pedido/pedido.repository.js';
import { Pedido } from '../pedido/pedido.entity.js';
import { crearDetalleSchema } from './detalle-pedido.schema.js';
import { HttpError } from '../shared/http-error.js';

const repository = new DetallePedidoRepository();
const pizzaRepository = new PizzaRepository();
const pedidoRepository = new PedidoRepository();

export async function listarDetalles(): Promise<DetallePedido[]> {
  return repository.findAll();
}

export async function buscarDetalle(
  pedidoId: number,
  pizzaId: number
): Promise<DetallePedido> {
  const detalle = await repository.findOne(pedidoId, pizzaId);

  if (!detalle) {
    throw new HttpError(404, 'Detalle de pedido no encontrado');
  }

  return detalle;
}

export async function listarPorPedido(
  pedidoId: number
): Promise<DetallePedido[]> {
  const pedido = await pedidoRepository.findOne(pedidoId);

  if (!pedido) {
    throw new HttpError(
      404,
      `No existe un pedido con id ${pedidoId}`
    );
  }

  return repository.findByPedido(pedidoId);
}

export async function crearDetalle(
  datos: unknown
): Promise<{ detalle: DetallePedido; pedido: Pedido | null }> {
  const resultado = crearDetalleSchema.safeParse(datos);
  if (!resultado.success) {
    throw new HttpError(400, 'cantidad, pizzaId y pedidoId deben ser números enteros positivos válidos');
  }
  const { cantidad, pizzaId, pedidoId } = resultado.data;

  const pizza = await pizzaRepository.findOne(pizzaId);

  if (!pizza) {
    throw new HttpError(
      404,
      `No existe una pizza con id ${pizzaId}`
    );
  }

  const pedido = await pedidoRepository.findOne(pedidoId);

  if (!pedido) {
    throw new HttpError(
      404,
      `No existe un pedido con id ${pedidoId}`
    );
  }

  const existente = await repository.findOne(pedidoId, pizzaId);

  if (existente) {
    throw new HttpError(
      409,
      'Esa pizza ya está en el pedido. Usá PUT para modificar la cantidad.'
    );
  }

  const nuevoDetalle = await repository.add({
    cantidad,
    pizza,
    pedido,
    precio_unitario: pizza.precio,
  });

  const pedidoActualizado =
    await pedidoRepository.recalcularTotal(pedidoId);

  return {
    detalle: nuevoDetalle,
    pedido: pedidoActualizado,
  };
}

export async function actualizarDetalle(
  pedidoId: number,
  pizzaId: number,
  cantidad: unknown
): Promise<{ detalle: DetallePedido; pedido: Pedido | null }> {
  if (
    cantidad === undefined ||
    typeof cantidad !== 'number' ||
    cantidad <= 0
  ) {
    throw new HttpError(
      400,
      'La cantidad es requerida y debe ser un número mayor a 0'
    );
  }

  const detalle = await repository.update(
    pedidoId,
    pizzaId,
    { cantidad }
  );

  if (!detalle) {
    throw new HttpError(404, 'Detalle de pedido no encontrado');
  }

  const pedidoActualizado =
    await pedidoRepository.recalcularTotal(pedidoId);

  return {
    detalle,
    pedido: pedidoActualizado,
  };
}

export async function eliminarDetalle(
  pedidoId: number,
  pizzaId: number
): Promise<Pedido | null> {
  const eliminado = await repository.delete(pedidoId, pizzaId);

  if (!eliminado) {
    throw new HttpError(404, 'Detalle de pedido no encontrado');
  }

  return pedidoRepository.recalcularTotal(pedidoId);
}