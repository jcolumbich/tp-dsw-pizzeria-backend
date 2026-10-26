import type { Response } from 'express';
import { HttpError } from './http-error.js';

export function handleError(res: Response, error: unknown) {
  if (error instanceof HttpError && error.statusCode >= 400 && error.statusCode < 600) {
    return res.status(error.statusCode).json({ message: error.message });
  }
  const datos = typeof error === 'object' && error !== null
    ? error as { type?: string; code?: string; cause?: { code?: string }; name?: string }
    : {};
  if (datos.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'El cuerpo de la solicitud debe contener JSON válido' });
  }
  if (datos.type === 'entity.too.large') {
    return res.status(413).json({ message: 'La solicitud supera el tamaño permitido' });
  }
  const codigo = datos.code ?? datos.cause?.code;
  if (codigo === 'ER_DUP_ENTRY' || datos.name === 'UniqueConstraintViolationException') {
    return res.status(409).json({ message: 'Ya existe un registro con esos datos únicos' });
  }
  if (codigo === 'ER_ROW_IS_REFERENCED_2' || codigo === 'ER_NO_REFERENCED_ROW_2' || datos.name === 'ForeignKeyConstraintViolationException') {
    return res.status(409).json({ message: 'No se puede completar la operación porque el registro tiene relaciones o una referencia ya no existe' });
  }
  console.error('Error interno:', error);
  return res.status(500).json({ message: 'Error interno del servidor' });
}