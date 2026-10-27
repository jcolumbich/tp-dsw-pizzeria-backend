import { respuestaPagina, patronBusqueda } from '../shared/listado.js';
import type { FiltroPizza, Pagina } from '../shared/listado.js';
import { LockMode } from '@mikro-orm/core';
import { orm } from '../shared/db/orm.js';
import { Pizza } from './pizza.entity.js';
import { Repository } from '../shared/repository.js';

export class PizzaRepository implements Repository<Pizza> {
  async findPagina(filtros: FiltroPizza): Promise<Pagina<Pizza>> {
    const consulta = orm.em.createQueryBuilder(Pizza, 'e').select(['id', 'nombre', 'precio', 'vegetariana', 'disponible', 'imagen']).where({ eliminada: false });
    if (filtros.vegetariana !== undefined) consulta.andWhere({ vegetariana: filtros.vegetariana });
    if (filtros.disponible !== undefined) consulta.andWhere({ disponible: filtros.disponible });
    // Comparación explícita sin distinguir mayúsculas ni tildes en MySQL.
    // Cada palabra debe aparecer; los valores se envían como parámetros del ORM.
    for (const palabra of filtros.busqueda.split(' ').filter(Boolean)) {
      consulta.andWhere("CONVERT(CONCAT_WS(' ', e.nombre) USING utf8mb4) COLLATE utf8mb4_unicode_ci LIKE ? ESCAPE '!'", [patronBusqueda(palabra)]);
    }
    const [data, total] = await consulta
      .orderBy({ id: 'DESC' })
      .limit(filtros.limite).offset((filtros.pagina - 1) * filtros.limite)
      .getResultAndCount();
    return respuestaPagina(data, total, filtros.pagina, filtros.limite);
  }


  async findAll(): Promise<Pizza[]> {
    return orm.em.find(Pizza, { eliminada: false });
  }

  async findOne(id: number): Promise<Pizza | null> {
    return orm.em.findOne(Pizza, { id, eliminada: false });
  }

  async add(item: Pizza): Promise<Pizza> {
    const pizza = orm.em.create(Pizza, item);
    await orm.em.persistAndFlush(pizza);
    return pizza;
  }

  async update(id: number, item: Partial<Pizza>): Promise<Pizza | null> {
    return orm.em.transactional(async (em) => {
      const pizza = await em.findOne(
        Pizza,
        { id, eliminada: false },
        {
          lockMode: LockMode.PESSIMISTIC_WRITE,
          refresh: true,
        }
      );

      if (!pizza) return null;

      em.assign(pizza, item);
      await em.flush();

      return pizza;
    });
  }

  async delete(id: number): Promise<boolean> {
    return orm.em.transactional(async (em) => {
      const pizza = await em.findOne(
        Pizza,
        { id },
        {
          lockMode: LockMode.PESSIMISTIC_WRITE,
          refresh: true,
        }
      );

      if (!pizza) return false;

      pizza.eliminada = true;
      pizza.disponible = false;

      await em.flush();

      return true;
    });
  }

  async buscarImagen(ruta: string): Promise<Buffer | null> {
    const pizza = await orm.em.findOne(
      Pizza,
      { imagen: ruta },
      { fields: ['id', 'imagenContenido'] }
    );

    return pizza?.imagenContenido ?? null;
  }
}