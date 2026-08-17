import { orm } from '../shared/db/orm.js';
import { Cliente } from './cliente.entity.js';
import { Repository } from '../shared/repository.js';

export class ClienteRepository implements Repository<Cliente> {
  async findAll(): Promise<Cliente[]> {
    return orm.em.find(Cliente, {});
  }

  async findOne(id: number): Promise<Cliente | null> {
    return orm.em.findOne(Cliente, { id });
  }

  async add(item: Cliente): Promise<Cliente> {
    const cliente = orm.em.create(Cliente, item);
    await orm.em.persistAndFlush(cliente);
    return cliente;
  }

  async update(id: number, item: Partial<Cliente>): Promise<Cliente | null> {
    const cliente = await orm.em.findOne(Cliente, { id });
    if (!cliente) return null;
    orm.em.assign(cliente, item);
    await orm.em.flush();
    return cliente;
  }

  async delete(id: number): Promise<boolean> {
    const cliente = await orm.em.findOne(Cliente, { id });
    if (!cliente) return false;
    await orm.em.removeAndFlush(cliente);
    return true;
  }
}