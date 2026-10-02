import { z } from 'zod';
import { crearClienteSchema } from '../cliente/cliente.schema.js';

export const loginSchema = z.strictObject({
  email: crearClienteSchema.shape.email,
  contrasenia: z.string().min(1, 'La contraseña es requerida').max(128, 'La contraseña admite hasta 128 caracteres'),
});

export const registerSchema = z.object({
  nombre: crearClienteSchema.shape.nombre,
  apellido: crearClienteSchema.shape.apellido,
  email: crearClienteSchema.shape.email,
  contrasenia: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').max(128, 'La contraseña admite hasta 128 caracteres').refine(
    (valor) => valor.trim().length > 0,
    { message: 'La contraseña no puede contener solamente espacios' }
  ),
  domicilio: crearClienteSchema.shape.domicilio,
});