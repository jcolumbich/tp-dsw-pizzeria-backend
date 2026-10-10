import { randomUUID } from 'node:crypto';
import { Pizza } from './pizza.entity.js';
import { PizzaRepository } from './pizza.repository.js';
import { HttpError } from '../shared/http-error.js';
import type {
  CrearPizzaInput,
  ActualizarPizzaInput,
} from './pizza.schema.js';

const repository = new PizzaRepository();

export async function listarPizzas(): Promise<Pizza[]> {
  return repository.findAll();
}

export async function buscarPizza(id: number): Promise<Pizza> {
  const pizza = await repository.findOne(id);

  if (!pizza) {
    throw new HttpError(404, 'Pizza no encontrada');
  }

  return pizza;
}

export async function crearPizza(
  datos: CrearPizzaInput,
  imagen?: Buffer
): Promise<Pizza> {
  const pizza = new Pizza();

  pizza.nombre = datos.nombre;
  pizza.precio = datos.precio;
  pizza.vegetariana = datos.vegetariana;
  pizza.disponible = datos.disponible;

  if (imagen) {
    pizza.imagen = `/uploads/pizzas/${randomUUID()}.webp`;
    pizza.imagenContenido = imagen;
  }

  return repository.add(pizza);
}

export async function actualizarPizza(
  id: number,
  datos: ActualizarPizzaInput,
  imagen?: Buffer
): Promise<Pizza> {
  const cambios: Partial<Pizza> = { ...datos };

  if (imagen !== undefined) {
    cambios.imagen = `/uploads/pizzas/${randomUUID()}.webp`;
    cambios.imagenContenido = imagen;
  }

  const pizza = await repository.update(id, cambios);

  if (!pizza) {
    throw new HttpError(404, 'Pizza no encontrada');
  }

  return pizza;
}

export async function eliminarPizza(id: number): Promise<void> {
  const eliminada = await repository.delete(id);

  if (!eliminada) {
    throw new HttpError(404, 'Pizza no encontrada');
  }
}