import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ClienteRepository } from '../cliente/cliente.repository.js';
import { crearCliente } from '../cliente/cliente.service.js';
import { HttpError } from '../shared/http-error.js';
import { loginSchema, registerSchema } from './auth.schema.js';

const clienteRepository = new ClienteRepository();

interface ResultadoLogin {
  token: string;
  usuario: {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    nivel_permisos: number;
  };
}

function generarToken(cliente: {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  nivel_permisos: number;
}): ResultadoLogin {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new HttpError(500, 'JWT_SECRET no está configurado en el servidor');

  const token = jwt.sign(
    { id: cliente.id, email: cliente.email, nivel_permisos: cliente.nivel_permisos },
    secret,
    { expiresIn: '2h' }
  );

  return {
    token,
    usuario: {
      id: cliente.id,
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      email: cliente.email,
      nivel_permisos: cliente.nivel_permisos,
    },
  };
}

export async function login(email: string, contraseniaPlana: string): Promise<ResultadoLogin> {
  const resultado = loginSchema.safeParse({ email, contrasenia: contraseniaPlana });
  if (!resultado.success) {
    throw new HttpError(400, resultado.error.issues[0]?.message ?? 'Datos inválidos');
  }
  const datos = resultado.data;

  const cliente = await clienteRepository.findByEmail(datos.email);
  if (!cliente) throw new HttpError(401, 'Credenciales inválidas');

  const coincide = await bcrypt.compare(datos.contrasenia, cliente.contrasenia);
  if (!coincide) throw new HttpError(401, 'Credenciales inválidas');

  if (!cliente.estado) throw new HttpError(403, 'Este usuario está suspendido');

  return generarToken(cliente);
}

export async function register(entrada: unknown): Promise<ResultadoLogin> {
  const resultado = registerSchema.safeParse(entrada);
  if (!resultado.success) {
    throw new HttpError(400, resultado.error.issues[0]?.message ?? 'Datos inválidos');
  }
  const datos = resultado.data;

    const cliente = await crearCliente({
    nombre: datos.nombre,
    apellido: datos.apellido,
    email: datos.email,
    contrasenia: datos.contrasenia,
    domicilio: datos.domicilio,
    nivel_permisos: 0,
    estado: true,
  }, true);

  return generarToken(cliente);
}