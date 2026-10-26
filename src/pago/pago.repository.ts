import { LockMode } from '@mikro-orm/core';
import { orm } from '../shared/db/orm.js';
import { Pedido } from '../pedido/pedido.entity.js';
import { Pago } from './pago.entity.js';
import { HttpError } from '../shared/http-error.js';

export interface ContextoPago {
  buscarPago(): Promise<Pago | null>;
  crearPago(referencia: string, importe: number): Pago;
}

export async function conPedido<T>(
  id: number,
  accion: (pedido: Pedido, contexto: ContextoPago) => Promise<T>,
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

    const resultado = await accion(pedido, {
      buscarPago: () => em.findOne(Pago, { pedido: id }, { refresh: true }),
      crearPago: (referencia, importe) => {
        const pago = em.create(Pago, { pedido, referencia, importe });
        em.persist(pago);
        return pago;
      },
    });

    await em.flush();

    return resultado;
  });
}

export async function buscarPorReferencia(
  referencia: string,
): Promise<Pago | null> {
  return orm.em.findOne(Pago, { referencia });
}

export async function pedidosPorConciliar(): Promise<number[]> {
  const pedidos = await orm.em.find(Pedido, {
    estado: 'Esperando pago'
  }, { orderBy: { vence_pago: 'ASC' } });
  return pedidos.map(pedido => pedido.id);
}