import { z } from 'zod';

export const crearPizzaSchema = z.strictObject({
  nombre: z.string().trim().min(1, 'El nombre es requerido').max(100, 'El nombre admite hasta 100 caracteres'),
  precio: z.number().min(0, 'El precio debe ser un número mayor o igual a 0'),
  vegetariana: z.boolean(),
  disponible: z.boolean(),
});

export const actualizarPizzaSchema = crearPizzaSchema.partial().refine(
  (datos) => Object.values(datos).some((valor) => valor !== undefined),
  { message: 'Debe enviar al menos un campo para actualizar' }
);

export type CrearPizzaInput = z.infer<typeof crearPizzaSchema>;
export type ActualizarPizzaInput = z.infer<typeof actualizarPizzaSchema>;