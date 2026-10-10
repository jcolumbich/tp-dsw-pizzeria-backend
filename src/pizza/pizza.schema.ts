import { z } from 'zod';
import { importeSchema } from '../shared/numero.schema.js';

export const crearPizzaSchema = z.strictObject({
  nombre: z
    .string()
    .trim()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre admite hasta 100 caracteres'),

  precio: importeSchema,
  vegetariana: z.boolean(),
  disponible: z.boolean(),
});

export const actualizarPizzaSchema = crearPizzaSchema
  .partial()
  .refine(
    (datos) => Object.values(datos).some((valor) => valor !== undefined),
    { message: 'Debe enviar al menos un campo para actualizar' }
  );

export type CrearPizzaInput = z.infer<typeof crearPizzaSchema>;

export type ActualizarPizzaInput = z.infer<typeof actualizarPizzaSchema>;