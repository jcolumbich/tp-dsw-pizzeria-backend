import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ClienteRepository } from '../cliente/cliente.repository.js';

const clienteRepository = new ClienteRepository();

export interface UsuarioToken {
  id: number;
  email: string;
  nivel_permisos: number;
}

declare global {
  namespace Express {
    interface Request {
      usuario?: UsuarioToken;
    }
  }
}

export async function verificarToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token no provisto' });
  }

  const token = header.slice('Bearer '.length).trim();
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    return res.status(500).json({ message: 'Error de configuración del servidor' });
  }

  let payload: jwt.JwtPayload | string;

  try {
    payload = jwt.verify(token, secret, { algorithms: ['HS256'] });
  } catch {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }

  if (
    typeof payload !== 'object' ||
    !Number.isInteger(payload.id) ||
    payload.id <= 0
  ) {
    return res.status(401).json({ message: 'Token inválido' });
  }

  try {
    const cliente = await clienteRepository.findOne(payload.id);

    if (!cliente) {
      return res.status(401).json({ message: 'Usuario inexistente' });
    }

    if (!cliente.estado) {
      return res.status(403).json({ message: 'Tu cuenta fue suspendida' });
    }

    // Usamos los datos actuales de la base, no el nivel guardado en el JWT.
    req.usuario = {
      id: cliente.id,
      email: cliente.email,
      nivel_permisos: cliente.nivel_permisos,
    };

    return next();
  } catch (error) {
    console.error('Error al consultar el usuario autenticado:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}

export function requiereNivel(nivelMinimo: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.usuario) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    if (req.usuario.nivel_permisos < nivelMinimo) {
      return res.status(403).json({
        message: 'No tenés permisos suficientes para esta acción',
      });
    }

    return next();
  };
}