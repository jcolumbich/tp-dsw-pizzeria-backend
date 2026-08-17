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

export async function crearIngrediente(datos: any): Promise<Ingrediente> {
  const { nombre, stock } = datos;

  if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') {
    throw new HttpError(400, 'El nombre es requerido y debe ser un texto válido');
  }
  if (stock === undefined || typeof stock !== 'number' || stock < 0) {
    throw new HttpError(400, 'El stock es requerido y debe ser un número mayor o igual a 0');
  }

  return repository.add(datos);
}

export async function actualizarIngrediente(id: number, datos: any): Promise<Ingrediente> {
  const { nombre, stock } = datos;

  if (Object.keys(datos).length === 0) {
    throw new HttpError(400, 'Debe enviar al menos un campo para actualizar');
  }
  if (nombre !== undefined && (typeof nombre !== 'string' || nombre.trim() === '')) {
    throw new HttpError(400, 'El nombre debe ser un texto válido');
  }
  if (stock !== undefined && (typeof stock !== 'number' || stock < 0)) {
    throw new HttpError(400, 'El stock debe ser un número mayor o igual a 0');
  }

  const ingrediente = await repository.update(id, datos);
  if (!ingrediente) throw new HttpError(404, 'Ingrediente no encontrado');
  return ingrediente;
}

export async function eliminarIngrediente(id: number): Promise<void> {
  const eliminado = await repository.delete(id);
  if (!eliminado) throw new HttpError(404, 'Ingrediente no encontrado');
}