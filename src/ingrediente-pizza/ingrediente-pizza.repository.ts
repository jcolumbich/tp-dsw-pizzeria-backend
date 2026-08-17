import { RequiredEntityData } from '@mikro-orm/core';
import { orm } from '../shared/db/orm.js';
import { IngredientePizza } from './ingrediente-pizza.entity.js';

export class IngredientePizzaRepository {
  async findAll(): Promise<IngredientePizza[]> {
    return orm.em.find(IngredientePizza, {}, { populate: ['pizza', 'ingrediente'] });
  }

  async findOne(pizzaId: number, ingredienteId: number): Promise<IngredientePizza | null> {
    return orm.em.findOne(
      IngredientePizza,
      { pizza: pizzaId, ingrediente: ingredienteId },
      { populate: ['pizza', 'ingrediente'] }
    );
  }

  async findByPizza(pizzaId: number): Promise<IngredientePizza[]> {
    return orm.em.find(IngredientePizza, { pizza: pizzaId }, { populate: ['ingrediente'] });
  }

 async add(item: RequiredEntityData<IngredientePizza>): Promise<IngredientePizza> {
    const ip = orm.em.create(IngredientePizza, item);
    await orm.em.persistAndFlush(ip);
    return ip;
  }

  async update(
    pizzaId: number,
    ingredienteId: number,
    item: Partial<IngredientePizza>
  ): Promise<IngredientePizza | null> {
    const ip = await orm.em.findOne(IngredientePizza, { pizza: pizzaId, ingrediente: ingredienteId });
    if (!ip) return null;
    orm.em.assign(ip, item);
    await orm.em.flush();
    return ip;
  }

  async delete(pizzaId: number, ingredienteId: number): Promise<boolean> {
    const ip = await orm.em.findOne(IngredientePizza, { pizza: pizzaId, ingrediente: ingredienteId });
    if (!ip) return false;
    await orm.em.removeAndFlush(ip);
    return true;
  }
}