import { Pizza } from './pizza.entity.js';
import { PizzaRepository } from './pizza.repository.js';
import { IngredientePizzaRepository } from '../ingrediente-pizza/ingrediente-pizza.repository.js';
import { HttpError } from '../shared/http-error.js';
import type { CrearPizzaInput, ActualizarPizzaInput } from './pizza.schema.js';

const repository = new PizzaRepository();
const ingredientePizzaRepository = new IngredientePizzaRepository();

export async function listarPizzas(): Promise<Pizza[]> {
  return repository.findAll();
}

export async function buscarPizza(id: number): Promise<Pizza> {
  const pizza = await repository.findOne(id);
  if (!pizza) throw new HttpError(404, 'Pizza no encontrada');
  return pizza;
}

export async function crearPizza(datos: CrearPizzaInput): Promise<Pizza> {
  const pizza = new Pizza();
  pizza.nombre = datos.nombre;
  pizza.precio = datos.precio;
  pizza.vegetariana = datos.vegetariana;
  pizza.disponible = datos.disponible;
  return repository.add(pizza);
}

export async function actualizarPizza(id: number, datos: ActualizarPizzaInput): Promise<Pizza> {
  const pizza = await repository.update(id, datos);
  if (!pizza) throw new HttpError(404, 'Pizza no encontrada');
  return pizza;
}

export async function eliminarPizza(id: number): Promise<void> {
  const pizza = await repository.findOne(id);
  if (!pizza) throw new HttpError(404, 'Pizza no encontrada');

  const composicion = await ingredientePizzaRepository.findByPizza(id);
  for (const item of composicion) {
    await ingredientePizzaRepository.delete(id, item.ingrediente.id);
  }

  const eliminada = await repository.delete(id);
  if (!eliminada) throw new HttpError(404, 'Pizza no encontrada');
}