import { respuestaPagina, patronBusqueda } from '../shared/listado.js';
import type { FiltroPersona, Pagina } from '../shared/listado.js';
import { LockMode } from '@mikro-orm/core';
import { orm } from '../shared/db/orm.js';
import { Cliente } from './cliente.entity.js';
import { Repository } from '../shared/repository.js';
import { Pedido } from '../pedido/pedido.entity.js';
import { HttpError } from '../shared/http-error.js';

export class ClienteRepository implements Repository<Cliente> {
  async findPagina(filtros: FiltroPersona): Promise<Pagina<Cliente>> {
    const consulta = orm.em.createQueryBuilder(Cliente, 'e').select(['id', 'nombre', 'apellido', 'email', 'domicilio', 'estado', 'nivel_permisos']).where({});
    if (filtros.estado !== undefined) consulta.andWhere({ estado: filtros.estado });
    // Comparación explícita sin distinguir mayúsculas ni tildes en MySQL.
    // Cada palabra debe aparecer; los valores se envían como parámetros del ORM.
    for (const palabra of filtros.busqueda.split(' ').filter(Boolean)) {
      consulta.andWhere("CONVERT(CONCAT_WS(' ', e.nombre, e.apellido, e.email, e.domicilio) USING utf8mb4) COLLATE utf8mb4_unicode_ci LIKE ? ESCAPE '!'", [patronBusqueda(palabra)]);
    }
    const [data, total] = await consulta
      .orderBy({ id: 'DESC' })
      .limit(filtros.limite).offset((filtros.pagina - 1) * filtros.limite)
      .getResultAndCount();
    return respuestaPagina(data, total, filtros.pagina, filtros.limite);
  }


  async findAll(): Promise<Cliente[]> {
    return orm.em.find(Cliente, {});
  }

  async findOne(id: number): Promise<Cliente | null> {
    return orm.em.findOne(Cliente, { id });
  }

  async findByEmail(email: string): Promise<Cliente | null> {
    return orm.em.findOne(Cliente, { email });
  }

  async add(item: Cliente): Promise<Cliente> {
    const cliente = orm.em.create(Cliente, item);
    await orm.em.persistAndFlush(cliente);
    return cliente;
  }

  async update(
    id: number,
    item: Partial<Cliente>
  ): Promise<Cliente | null> {
    const cliente = await orm.em.findOne(Cliente, { id });

    if (!cliente) return null;

    orm.em.assign(cliente, item);
    await orm.em.flush();

    return cliente;
  }

  async delete(id: number): Promise<boolean> {
    return orm.em.transactional(async (em) => {
      const cliente = await em.findOne(
        Cliente,
        { id },
        {
          lockMode: LockMode.PESSIMISTIC_WRITE,
          refresh: true,
        }
      );

      if (!cliente) return false;

      if (await em.count(Pedido, { cliente: id }) > 0) {
        throw new HttpError(
          409,
          'El cliente tiene pedidos registrados. Podés marcarlo como inactivo para conservar el historial.'
        );
      }

      em.remove(cliente);
      await em.flush();

      return true;
    });
  }
}