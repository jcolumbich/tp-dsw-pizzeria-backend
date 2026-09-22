// src/pizza/pizza.service.ts

import { Pizza } from './pizza.entity.js';
import { PizzaRepository } from './pizza.repository.js';
import { IngredientePizzaRepository } from '../ingrediente-pizza/ingrediente-pizza.repository.js';
import { HttpError } from '../shared/http-error.js';

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

export async function crearPizza(datos: any): Promise<Pizza> {
  const { nombre, precio, vegetariana, disponible } = datos;

  if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') {
    throw new HttpError(400, 'El nombre es requerido y debe ser un texto válido');
  }
  if (precio === undefined || typeof precio !== 'number' || precio < 0) {
    throw new HttpError(400, 'El precio es requerido y debe ser un número mayor o igual a 0');
  }
  if (vegetariana === undefined || typeof vegetariana !== 'boolean') {
    throw new HttpError(400, 'El campo vegetariana es requerido y debe ser booleano');
  }
  if (disponible === undefined || typeof disponible !== 'boolean') {
    throw new HttpError(400, 'El campo disponible es requerido y debe ser booleano');
  }

  return repository.add(datos);
}

export async function actualizarPizza(id: number, datos: any): Promise<Pizza> {
  const { nombre, precio, vegetariana, disponible } = datos;

  if (Object.keys(datos).length === 0) {
    throw new HttpError(400, 'Debe enviar al menos un campo para actualizar');
  }
  if (nombre !== undefined && (typeof nombre !== 'string' || nombre.trim() === '')) {
    throw new HttpError(400, 'El nombre debe ser un texto válido');
  }
  if (precio !== undefined && (typeof precio !== 'number' || precio < 0)) {
    throw new HttpError(400, 'El precio debe ser un número mayor o igual a 0');
  }
  if (vegetariana !== undefined && typeof vegetariana !== 'boolean') {
    throw new HttpError(400, 'El campo vegetariana debe ser booleano');
  }
  if (disponible !== undefined && typeof disponible !== 'boolean') {
    throw new HttpError(400, 'El campo disponible debe ser booleano');
  }

  const pizza = await repository.update(id, datos);
  if (!pizza) throw new HttpError(404, 'Pizza no encontrada');
  return pizza;
}

export async function eliminarPizza(id: number): Promise<void> {
  const pizza = await repository.findOne(id);
  if (!pizza) throw new HttpError(404, 'Pizza no encontrada');

  // Cascade manual: borramos primero la composición de ingredientes de esta pizza
  const composicion = await ingredientePizzaRepository.findByPizza(id);
  for (const item of composicion) {
    await ingredientePizzaRepository.delete(id, item.ingrediente.id);
  }

  const eliminada = await repository.delete(id);
  if (!eliminada) throw new HttpError(404, 'Pizza no encontrada');
}