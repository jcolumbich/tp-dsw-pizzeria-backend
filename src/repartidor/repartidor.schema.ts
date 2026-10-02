import { z } from 'zod';

export const crearRepartidorSchema = z.strictObject({
  nombre: z.string().trim().min(1, 'El nombre es requerido').max(100, 'El nombre admite hasta 100 caracteres'),
  apellido: z.string().trim().min(1, 'El apellido es requerido').max(100, 'El apellido admite hasta 100 caracteres'),
  email: z.string().trim().toLowerCase().max(254, 'El email admite hasta 254 caracteres').pipe(z.email('El formato del email no es válido')),
  contrasenia: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(128, 'La contraseña admite hasta 128 caracteres').refine(
    (valor) => valor.trim().length > 0,
    { message: 'La contraseña no puede contener solamente espacios' }
  ),
  nivel_permisos: z.number().int().min(0).max(1),
  estado: z.boolean(),
  matricula: z.string().trim().toUpperCase().min(1, 'La matrícula es requerida').max(50, 'La matrícula admite hasta 50 caracteres'),
  monto_propina_total: z.number().min(0, 'El monto de propinas no puede ser negativo').default(0),
});

export const actualizarRepartidorSchema = crearRepartidorSchema.omit({
  nivel_permisos: true,
  monto_propina_total: true,
}).partial().refine(
  (datos) => Object.values(datos).some((valor) => valor !== undefined),
  { message: 'Debe enviar al menos un campo para actualizar' }
);