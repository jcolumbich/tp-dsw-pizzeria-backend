import { z } from 'zod';
import { cantidadIngredienteSchema } from '../shared/numero.schema.js';

export const crearIngredientePizzaSchema = z.strictObject({
  cantidad: cantidadIngredienteSchema,
  pizzaId: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  ingredienteId: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
});

export const actualizarIngredientePizzaSchema =
  crearIngredientePizzaSchema.pick({ cantidad: true });

export type CrearIngredientePizzaInput = z.infer<
  typeof crearIngredientePizzaSchema
>;