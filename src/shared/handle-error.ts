import type { Response } from 'express';
import { HttpError } from './http-error.js';

export function handleError(res: Response, error: unknown) {
  if (error instanceof HttpError && error.statusCode >= 400 && error.statusCode < 500) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  console.error('Error interno:', error);
  return res.status(500).json({ message: 'Error interno del servidor' });
}