import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ClienteRepository } from '../cliente/cliente.repository.js';
import { crearCliente } from '../cliente/cliente.service.js';
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

function generarToken(cliente: {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  nivel_permisos: number;
}): ResultadoLogin {
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

  return generarToken(cliente);
}

export async function register(datos: any): Promise<ResultadoLogin> {
  const { nombre, apellido, email, contrasenia, domicilio } = datos;

  const cliente = await crearCliente({
    nombre,
    apellido,
    email,
    contrasenia,
    domicilio,
    nivel_permisos: 0,
    estado: true,
  });

  return generarToken(cliente);
}