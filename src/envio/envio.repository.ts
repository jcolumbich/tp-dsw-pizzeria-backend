import { EntityManager, LockMode } from '@mikro-orm/core';
import { orm } from '../shared/db/orm.js';
import { Envio } from './envio.entity.js';
import { Pedido } from '../pedido/pedido.entity.js';
import { PedidoRepository } from '../pedido/pedido.repository.js';
import { HttpError } from '../shared/http-error.js';
import type { CrearEnvioInput, ActualizarEnvioInput } from './envio.schema.js';

const pedidoRepository = new PedidoRepository();

export class EnvioRepository {
  async findAll(): Promise<Envio[]> {
    return orm.em.find(Envio, {}, { populate: ['pedido'] });
  }

  async findOne(id: number): Promise<Envio | null> {
    return orm.em.findOne(Envio, { id }, { populate: ['pedido'] });
  }

  async add(datos: CrearEnvioInput): Promise<Envio> {
    const pedido = await pedidoRepository.asignarEnvioConRepartidor(
      datos.pedido,
      datos.repartidorId,
      datos.costo,
      datos.monto_propina
    );

    return pedido.envio!;
  }

  private async buscarEnvioBloqueado(em: EntityManager, id: number): Promise<{ envio: Envio; pedido: Pedido } | null> {
    const referencia = await em.findOne(Envio, { id }, { refresh: true });
    if (!referencia) return null;

    const pedidoId = referencia.pedido.id;
    const pedido = await em.findOne(Pedido, { id: pedidoId }, {
      lockMode: LockMode.PESSIMISTIC_WRITE,
      refresh: true
    });

    if (!pedido) throw new HttpError(409, 'El envío no tiene un pedido válido');

    const envio = await em.findOne(Envio, { id }, {
      lockMode: LockMode.PESSIMISTIC_WRITE,
      refresh: true
    });

    if (!envio) return null;
    if (envio.pedido.id !== pedidoId) {
      throw new HttpError(409, 'El envío cambió de pedido. Volvé a consultar antes de modificarlo');
    }
    if (pedido.estado === 'Entregado' || pedido.estado === 'Cancelado') {
      throw new HttpError(409, 'No se puede modificar ni eliminar el envío de un pedido entregado o cancelado');
    }
    if (pedido.retiro || pedido.estado !== 'En camino' || !pedido.repartidor) {
      throw new HttpError(409, 'El envío debe pertenecer a un pedido a domicilio en camino con repartidor asignado');
    }

    envio.pedido = pedido;
    return { envio, pedido };
  }

  async update(id: number, datos: ActualizarEnvioInput): Promise<Envio | null> {
    return orm.em.transactional(async (em) => {
      const actual = await this.buscarEnvioBloqueado(em, id);
      if (!actual) return null;

      const { envio, pedido } = actual;
      if (pedido.medio_pago && (
        (datos.costo !== undefined && datos.costo !== envio.costo) ||
        (datos.monto_propina !== undefined && datos.monto_propina !== envio.monto_propina)
      )) throw new HttpError(409, 'El importe y la propina quedaron fijados al comprar');
      if (datos.costo !== undefined) envio.costo = datos.costo;
      if (datos.monto_propina !== undefined) {
        envio.monto_propina = datos.monto_propina;
        pedido.monto_propina = datos.monto_propina;
      }

      await em.flush();
      await em.populate(envio, ['pedido']);
      return envio;
    });
  }

  async delete(id: number): Promise<boolean> {
    return orm.em.transactional(async (em) => {
      const actual = await this.buscarEnvioBloqueado(em, id);
      if (!actual) return false;

      const { envio, pedido } = actual;
      pedido.monto_propina = envio.monto_propina ?? pedido.monto_propina ?? 0;
      pedido.envio = undefined;
      pedido.repartidor = undefined;
      pedido.estado = 'En preparación';
      em.remove(envio);
      await em.flush();
      return true;
    });
  }
}