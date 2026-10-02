import { z } from 'zod';

export const crearIngredienteSchema = z.strictObject({
  nombre: z.string().trim().min(1, 'El nombre es requerido').max(100, 'El nombre admite hasta 100 caracteres'),
  stock: z.number().min(0, 'El stock debe ser un número mayor o igual a 0'),
});

export const actualizarIngredienteSchema = crearIngredienteSchema.partial().refine(
  (datos) => Object.values(datos).some((valor) => valor !== undefined),
  { message: 'Debe enviar al menos un campo para actualizar' }
);

export type CrearIngredienteInput = z.infer<typeof crearIngredienteSchema>;
export type ActualizarIngredienteInput = z.infer<typeof actualizarIngredienteSchema>;