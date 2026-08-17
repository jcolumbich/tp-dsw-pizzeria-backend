import { orm } from '../shared/db/orm.js';
import { Repartidor } from './repartidor.entity.js';
import { Repository } from '../shared/repository.js';

export class RepartidorRepository implements Repository<Repartidor> {
  async findAll(): Promise<Repartidor[]> {
    return orm.em.find(Repartidor, {});
  }

  async findOne(id: number): Promise<Repartidor | null> {
    return orm.em.findOne(Repartidor, { id });
  }

  async add(item: Repartidor): Promise<Repartidor> {
    const repartidor = orm.em.create(Repartidor, item);
    await orm.em.persistAndFlush(repartidor);
    return repartidor;
  }

  async update(id: number, item: Partial<Repartidor>): Promise<Repartidor | null> {
    const repartidor = await orm.em.findOne(Repartidor, { id });
    if (!repartidor) return null;
    orm.em.assign(repartidor, item);
    await orm.em.flush();
    return repartidor;
  }

  async delete(id: number): Promise<boolean> {
    const repartidor = await orm.em.findOne(Repartidor, { id });
    if (!repartidor) return false;
    await orm.em.removeAndFlush(repartidor);
    return true;
  }
}