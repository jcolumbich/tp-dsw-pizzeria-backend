import { z } from 'zod';
import { crearClienteSchema } from '../cliente/cliente.schema.js';

export const loginSchema = z.strictObject({
  email: crearClienteSchema.shape.email,
  contrasenia: z
    .string()
    .min(1, 'La contraseña es requerida')
    .refine(
      (valor) => new TextEncoder().encode(valor).length <= 72,
      {
        message:
          'La contraseña admite hasta 72 bytes UTF-8; algunos caracteres ocupan más de un byte',
      }
    ),
});

export const registerSchema = z.strictObject({
  nombre: crearClienteSchema.shape.nombre,
  apellido: crearClienteSchema.shape.apellido,
  email: crearClienteSchema.shape.email,
  contrasenia: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .refine(
      (valor) => new TextEncoder().encode(valor).length <= 72,
      {
        message:
          'La contraseña admite hasta 72 bytes UTF-8; algunos caracteres ocupan más de un byte',
      }
    )
    .refine(
      (valor) => valor.trim().length > 0,
      {
        message: 'La contraseña no puede contener solamente espacios',
      }
    ),
  domicilio: crearClienteSchema.shape.domicilio,
});