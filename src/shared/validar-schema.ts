import { Request, Response, NextFunction } from 'express';
import { ZodType } from 'zod';

export function validarConSchema(schema: ZodType, campo: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const resultado = schema.safeParse(req.body);

    if (!resultado.success) {
      return res.status(400).json({
        message: 'Datos inválidos',
        errores: resultado.error.issues.map((i) => ({
          campo: i.path.join('.'),
          mensaje: i.message,
        })),
      });
    }

    req.body[campo] = resultado.data;
    next();
  };
}