import { orm } from '../shared/db/orm.js';
import { Envio } from './envio.entity.js';
import { Repository } from '../shared/repository.js';

export class EnvioRepository implements Repository<Envio> {
  async findAll(): Promise<Envio[]> {
    return orm.em.find(Envio, {}, { populate: ['pedido'] });
  }

  async findOne(id: number): Promise<Envio | null> {
    return orm.em.findOne(Envio, { id }, { populate: ['pedido'] });
  }

  async add(item: Envio): Promise<Envio> {
    const envio = orm.em.create(Envio, item);
    await orm.em.persistAndFlush(envio);
    return envio;
  }

  async update(id: number, item: Partial<Envio>): Promise<Envio | null> {
    const envio = await orm.em.findOne(Envio, { id });
    if (!envio) return null;
    orm.em.assign(envio, item);
    await orm.em.flush();
    return envio;
  }

  async delete(id: number): Promise<boolean> {
    const envio = await orm.em.findOne(Envio, { id });
    if (!envio) return false;
    await orm.em.removeAndFlush(envio);
    return true;
  }
}