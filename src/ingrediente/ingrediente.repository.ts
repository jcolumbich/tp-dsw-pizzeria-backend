import { LockMode } from '@mikro-orm/core';
import { orm } from '../shared/db/orm.js';
import { Ingrediente } from './ingrediente.entity.js';
import { Repository } from '../shared/repository.js';
import { IngredientePizza } from '../ingrediente-pizza/ingrediente-pizza.entity.js';
import { Pedido } from '../pedido/pedido.entity.js';
import { HttpError } from '../shared/http-error.js';

export class IngredienteRepository implements Repository<Ingrediente> {
  async findAll(): Promise<Ingrediente[]> {
    return orm.em.find(Ingrediente, {});
  }

  async findOne(id: number): Promise<Ingrediente | null> {
    return orm.em.findOne(Ingrediente, { id });
  }

  async add(item: Ingrediente): Promise<Ingrediente> {
    const ingrediente = orm.em.create(Ingrediente, item);
    await orm.em.persistAndFlush(ingrediente);
    return ingrediente;
  }

  async update(
    id: number,
    item: Partial<Ingrediente>
  ): Promise<Ingrediente | null> {
    const ingrediente = await orm.em.findOne(Ingrediente, { id });

    if (!ingrediente) return null;

    orm.em.assign(ingrediente, item);
    await orm.em.flush();

    return ingrediente;
  }

  async delete(id: number): Promise<boolean> {
    return orm.em.transactional(async (em) => {
      const ingrediente = await em.findOne(
        Ingrediente,
        { id },
        {
          lockMode: LockMode.PESSIMISTIC_WRITE,
          refresh: true,
        }
      );

      if (!ingrediente) return false;

      if (await em.count(IngredientePizza, { ingrediente: id }) > 0) {
        throw new HttpError(
          409,
          'No se puede eliminar el ingrediente porque forma parte de una receta.'
        );
      }

      const pedidos = await em.find(
        Pedido,
        {
          estado: {
            $nin: ['Cancelado', 'Entregado'],
          },
        },
        {
          fields: ['id', 'consumoIngredientes'],
        }
      );

      const consumidoPorPedidoActivo = pedidos.some((pedido) =>
        pedido.consumoIngredientes?.some(
          (consumo) => consumo.ingredienteId === id
        )
      );

      if (consumidoPorPedidoActivo) {
        throw new HttpError(
          409,
          'El ingrediente fue consumido por un pedido activo. Debe conservarse para poder reponer el stock si se cancela.'
        );
      }

      em.remove(ingrediente);
      await em.flush();

      return true;
    });
  }
}