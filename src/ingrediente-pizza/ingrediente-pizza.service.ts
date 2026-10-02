import { IngredientePizza } from './ingrediente-pizza.entity.js';
import { IngredientePizzaRepository } from './ingrediente-pizza.repository.js';
import { PizzaRepository } from '../pizza/pizza.repository.js';
import { IngredienteRepository } from '../ingrediente/ingrediente.repository.js';
import { HttpError } from '../shared/http-error.js';
import type { CrearIngredientePizzaInput } from './ingrediente-pizza.schema.js';

const repository = new IngredientePizzaRepository();
const pizzaRepository = new PizzaRepository();
const ingredienteRepository = new IngredienteRepository();

export async function listarTodo(): Promise<IngredientePizza[]> {
  return repository.findAll();
}

export async function buscarUno(pizzaId: number, ingredienteId: number): Promise<IngredientePizza> {
  const data = await repository.findOne(pizzaId, ingredienteId);
  if (!data) throw new HttpError(404, 'Registro no encontrado');
  return data;
}

export async function listarPorPizza(pizzaId: number): Promise<IngredientePizza[]> {
  const pizza = await pizzaRepository.findOne(pizzaId);
  if (!pizza) throw new HttpError(404, `No existe una pizza con id ${pizzaId}`);
  return repository.findByPizza(pizzaId);
}

export async function crear(datos: CrearIngredientePizzaInput): Promise<IngredientePizza> {
  const { cantidad, pizzaId, ingredienteId } = datos;

  const pizza = await pizzaRepository.findOne(pizzaId);
  if (!pizza) throw new HttpError(404, `No existe una pizza con id ${pizzaId}`);

  const ingrediente = await ingredienteRepository.findOne(ingredienteId);
  if (!ingrediente) throw new HttpError(404, `No existe un ingrediente con id ${ingredienteId}`);

  const existente = await repository.findOne(pizzaId, ingredienteId);
  if (existente) {
    throw new HttpError(409, 'Ese ingrediente ya está asociado a esa pizza. Usá PUT para modificar la cantidad.');
  }

  return repository.add({ cantidad, pizza, ingrediente });
}

export async function actualizar(pizzaId: number, ingredienteId: number, cantidad: number): Promise<IngredientePizza> {
  const data = await repository.update(pizzaId, ingredienteId, { cantidad });
  if (!data) throw new HttpError(404, 'Registro no encontrado');
  return data;
}

export async function eliminar(pizzaId: number, ingredienteId: number): Promise<void> {
  const eliminado = await repository.delete(pizzaId, ingredienteId);
  if (!eliminado) throw new HttpError(404, 'Registro no encontrado');
}