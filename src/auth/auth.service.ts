import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ClienteRepository } from '../cliente/cliente.repository.js';
import { HttpError } from '../shared/http-error.js';

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

export async function login(email: string, contraseniaPlana: string): Promise<ResultadoLogin> {
  if (!email || !contraseniaPlana) {
    throw new HttpError(400, 'Email y contraseña son requeridos');
  }

  const clientes = await clienteRepository.findAll();
  const cliente = clientes.find((c) => c.email === email);

  // Mensaje genérico a propósito: no confirmamos si el email existe o no.
  if (!cliente) {
    throw new HttpError(401, 'Credenciales inválidas');
  }

  const coincide = await bcrypt.compare(contraseniaPlana, cliente.contrasenia);
  if (!coincide) {
    throw new HttpError(401, 'Credenciales inválidas');
  }

  if (!cliente.estado) {
    throw new HttpError(403, 'Este usuario está suspendido');
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new HttpError(500, 'JWT_SECRET no está configurado en el servidor');
  }

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