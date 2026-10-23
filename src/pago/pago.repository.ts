import { LockMode, type EntityManager } from '@mikro-orm/core';
import { orm } from '../shared/db/orm.js';
import { Pedido } from '../pedido/pedido.entity.js';
import { Pago } from './pago.entity.js';
import { HttpError } from '../shared/http-error.js';

export async function conPedido<T>(
  id: number,
  accion: (pedido: Pedido, em: EntityManager) => Promise<T>,
): Promise<T> {
  return orm.em.transactional(async (em) => {
    const pedido = await em.findOne(Pedido, id, {
      lockMode: LockMode.PESSIMISTIC_WRITE,
      refresh: true,
    });

    if (!pedido) {
      throw new HttpError(404, 'Pedido no encontrado');
    }

    await em.populate(pedido, [
      'cliente',
      'envio',
      'detalles',
      'detalles.pizza',
    ]);

    const resultado = await accion(pedido, em);

    await em.flush();

    return resultado;
  });
}

export async function buscarPorReferencia(
  referencia: string,
): Promise<Pago | null> {
  return orm.em.findOne(Pago, { referencia });
}