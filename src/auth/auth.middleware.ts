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

export async function verificarToken(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token no provisto' });
  }

  const token = header.split(' ')[1];
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    return res.status(500).json({ message: 'JWT_SECRET no está configurado en el servidor' });
  }

  try {
    const payload = jwt.verify(token, secret) as UsuarioToken;

    const cliente = await clienteRepository.findOne(payload.id);
    if (!cliente) {
      return res.status(401).json({ message: 'Tu usuario ya no existe. Volvé a iniciar sesión.' });
    }
    if (!cliente.estado) {
      return res.status(403).json({ message: 'Tu cuenta fue suspendida.' });
    }

    req.usuario = payload;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
}

export function requiereNivel(nivelMinimo: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.usuario) {
      return res.status(401).json({ message: 'No autenticado' });
    }
    if (req.usuario.nivel_permisos < nivelMinimo) {
      return res.status(403).json({ message: 'No tenés permisos suficientes para esta acción' });
    }
    next();
  };
}