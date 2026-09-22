import { Request, Response } from 'express';
import * as service from './auth.service.js';
import { handleError } from '../shared/handle-error.js';

export async function login(req: Request, res: Response) {
  try {
    const { email, contrasenia } = req.body;
    const resultado = await service.login(email, contrasenia);
    return res.status(200).json({ message: 'Login exitoso', data: resultado });
  } catch (error) {
    return handleError(res, error);
  }
}