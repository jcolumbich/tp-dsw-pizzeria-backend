import { z } from 'zod';

export const crearIngredientePizzaSchema = z.strictObject({
  cantidad: z.number().positive('La cantidad debe ser mayor a 0'),
  pizzaId: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  ingredienteId: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
});

export const actualizarIngredientePizzaSchema = crearIngredientePizzaSchema.pick({ cantidad: true });

export type CrearIngredientePizzaInput = z.infer<typeof crearIngredientePizzaSchema>;