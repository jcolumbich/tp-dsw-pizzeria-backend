import { RequiredEntityData } from '@mikro-orm/core';
import { orm } from '../shared/db/orm.js';
import { DetallePedido } from './detalle-pedido.entity.js';

export class DetallePedidoRepository {
  async findAll(): Promise<DetallePedido[]> {
    return orm.em.find(DetallePedido, {}, { populate: ['pizza', 'pedido'] });
  }

  async findOne(pedidoId: number, pizzaId: number): Promise<DetallePedido | null> {
    return orm.em.findOne(
      DetallePedido,
      { pedido: pedidoId, pizza: pizzaId },
      { populate: ['pizza', 'pedido'] }
    );
  }

  async findByPedido(pedidoId: number): Promise<DetallePedido[]> {
    return orm.em.find(DetallePedido, { pedido: pedidoId }, { populate: ['pizza'] });
  }

  async add(item: Omit<RequiredEntityData<DetallePedido>, 'subtotal'>): Promise<DetallePedido> {
  const detalle = orm.em.create(DetallePedido, item as RequiredEntityData<DetallePedido>);
  await orm.em.persistAndFlush(detalle);
  return detalle;
}

  async update(
    pedidoId: number,
    pizzaId: number,
    item: Partial<DetallePedido>
  ): Promise<DetallePedido | null> {
    const detalle = await orm.em.findOne(DetallePedido, { pedido: pedidoId, pizza: pizzaId });
    if (!detalle) return null;
    orm.em.assign(detalle, item);
    await orm.em.flush();
    return detalle;
  }

  async delete(pedidoId: number, pizzaId: number): Promise<boolean> {
    const detalle = await orm.em.findOne(DetallePedido, { pedido: pedidoId, pizza: pizzaId });
    if (!detalle) return false;
    await orm.em.removeAndFlush(detalle);
    return true;
  }
}