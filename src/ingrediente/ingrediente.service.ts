import { Ingrediente } from './ingrediente.entity.js';
import { IngredienteRepository } from './ingrediente.repository.js';
import { HttpError } from '../shared/http-error.js';

const repository = new IngredienteRepository();

export async function listarIngredientes(): Promise<Ingrediente[]> {
  return repository.findAll();
}

export async function buscarIngrediente(id: number): Promise<Ingrediente> {
  const ingrediente = await repository.findOne(id);
  if (!ingrediente) throw new HttpError(404, 'Ingrediente no encontrado');
  return ingrediente;
}

export async function crearIngrediente(
  datos: { nombre: string; stock: number }
): Promise<Ingrediente> {
  const ingrediente = new Ingrediente();

  ingrediente.nombre = datos.nombre;
  ingrediente.stock = datos.stock;

  return repository.add(ingrediente);
}

export async function actualizarIngrediente(
  id: number,
  datos: Partial<{ nombre: string; stock: number }>
): Promise<Ingrediente> {
  const ingrediente = await repository.update(id, datos);
  if (!ingrediente) throw new HttpError(404, 'Ingrediente no encontrado');
  return ingrediente;
}

export async function eliminarIngrediente(id: number): Promise<void> {
  const eliminado = await repository.delete(id);
  if (!eliminado) throw new HttpError(404, 'Ingrediente no encontrado');
}