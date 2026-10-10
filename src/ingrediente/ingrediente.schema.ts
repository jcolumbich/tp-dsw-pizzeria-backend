import { z } from 'zod';
import { stockSchema } from '../shared/numero.schema.js';

export const crearIngredienteSchema = z.strictObject({
  nombre: z.string().trim().min(1, 'El nombre es requerido').max(100, 'El nombre admite hasta 100 caracteres'),

  stock: stockSchema,
});

export const actualizarIngredienteSchema = crearIngredienteSchema
  .partial()
  .refine(
    (datos) => Object.values(datos).some((valor) => valor !== undefined),
    { message: 'Debe enviar al menos un campo para actualizar' }
  );

export type CrearIngredienteInput = z.infer<
  typeof crearIngredienteSchema
>;

export type ActualizarIngredienteInput = z.infer<
  typeof actualizarIngredienteSchema
>;