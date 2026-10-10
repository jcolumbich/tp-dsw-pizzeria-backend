import { z } from 'zod';

export const importeSchema = z
  .number()
  .min(0, 'El importe no puede ser negativo')
  .max(1_000_000, 'El importe máximo permitido es 1.000.000')
  .multipleOf(0.01, 'El importe admite hasta dos decimales');

export const stockSchema = z
  .number()
  .min(0, 'El stock no puede ser negativo')
  .max(1_000_000, 'El stock máximo permitido es 1.000.000')
  .multipleOf(0.0001, 'La cantidad admite hasta cuatro decimales');

export const cantidadIngredienteSchema = stockSchema.positive(
  'La cantidad debe ser mayor a 0'
);

export function redondearStock(valor: number): number {
  return Math.round(valor * 10_000) / 10_000;
}