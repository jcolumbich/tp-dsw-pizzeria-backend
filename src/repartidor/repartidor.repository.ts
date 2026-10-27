import { respuestaPagina, patronBusqueda } from '../shared/listado.js';
import type { FiltroPersona, Pagina } from '../shared/listado.js';
import { orm } from '../shared/db/orm.js';
import { Repartidor } from './repartidor.entity.js';
import { Repository } from '../shared/repository.js';
import { Pedido } from '../pedido/pedido.entity.js';

export class RepartidorRepository implements Repository<Repartidor> {
  async findPagina(filtros: FiltroPersona): Promise<Pagina<Repartidor>> {
    const consulta = orm.em.createQueryBuilder(Repartidor, 'e').select(['id', 'nombre', 'apellido', 'email', 'matricula', 'estado', 'nivel_permisos', 'monto_propina_total']).where({});
    if (filtros.estado !== undefined) consulta.andWhere({ estado: filtros.estado });
    // Comparación explícita sin distinguir mayúsculas ni tildes en MySQL.
    // Cada palabra debe aparecer; los valores se envían como parámetros del ORM.
    for (const palabra of filtros.busqueda.split(' ').filter(Boolean)) {
      consulta.andWhere("CONVERT(CONCAT_WS(' ', e.nombre, e.apellido, e.email, e.matricula) USING utf8mb4) COLLATE utf8mb4_unicode_ci LIKE ? ESCAPE '!'", [patronBusqueda(palabra)]);
    }
    const [data, total] = await consulta
      .orderBy({ id: 'DESC' })
      .limit(filtros.limite).offset((filtros.pagina - 1) * filtros.limite)
      .getResultAndCount();
    return respuestaPagina(data, total, filtros.pagina, filtros.limite);
  }


  async findAll(): Promise<Repartidor[]> {
    return orm.em.find(Repartidor, {});
  }

  async findOne(id: number): Promise<Repartidor | null> {
    return orm.em.findOne(Repartidor, { id });
  }

  async findByEmail(email: string): Promise<Repartidor | null> {
  return orm.em.findOne(Repartidor, { email });
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

  async tienePedidosAsignados(id: number): Promise<boolean> {
  const cantidad = await orm.em.count(Pedido, { repartidor: id });
  return cantidad > 0;
 }

  async delete(id: number): Promise<boolean> {
    const repartidor = await orm.em.findOne(Repartidor, { id });
    if (!repartidor) return false;
    await orm.em.removeAndFlush(repartidor);
    return true;
  }
}