import { Response } from 'express';
import { HttpError } from './http-error.js';

export function handleError(res: Response, error: unknown) {
  if (error instanceof HttpError) {
    return res.status(error.statusCode).json({ message: error.message });
  }
  const message = error instanceof Error ? error.message : 'Error inesperado';
  return res.status(500).json({ message });
}