import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { HttpError } from '../shared/http-error.js';
import { PizzaRepository } from './pizza.repository.js';
import { Pizza } from './pizza.entity.js';
import { orm } from '../shared/db/orm.js';
import { handleError } from '../shared/handle-error.js';

export const CARPETA_IMAGENES_PIZZA = resolve(
  process.cwd(),
  'uploads',
  'pizzas'
);

const nombreImagenValido =
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.webp$/;

const pizzaRepository = new PizzaRepository();

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
    fields: 1,
    parts: 2,
    fieldSize: 16 * 1024,
  },

  fileFilter: (_req, archivo, callback) => {
    if (
      archivo.mimetype !== 'image/jpeg' &&
      archivo.mimetype !== 'image/png' &&
      archivo.mimetype !== 'image/webp'
    ) {
      return callback(
        new HttpError(400, 'La imagen debe ser JPG, PNG o WebP.')
      );
    }

    callback(null, true);
  },
}).single('imagen');

// Conserva las solicitudes JSON y acepta formularios con archivo.
export function recibirImagenPizza(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.is('multipart/form-data')) return next();

  upload(req, res, (error: unknown) => {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return next(
          new HttpError(413, 'La imagen no puede superar los 5 MB.')
        );
      }

      return next(
        new HttpError(
          400,
          'Enviá una sola imagen y los datos de la pizza.'
        )
      );
    }

    if (error) return next(error);

    try {
      if (!req.file) {
        throw new HttpError(
          400,
          'Seleccioná una imagen para la pizza.'
        );
      }

      if (typeof req.body?.datos !== 'string') {
        throw new HttpError(400, 'Faltan los datos de la pizza.');
      }

      const datos: unknown = JSON.parse(req.body.datos);

      if (
        !datos ||
        typeof datos !== 'object' ||
        Array.isArray(datos)
      ) {
        throw new HttpError(
          400,
          'Los datos de la pizza no son válidos.'
        );
      }

      req.body = datos;
      next();
    } catch (error) {
      if (error instanceof HttpError) {
        return next(error);
      }

      next(
        new HttpError(400, 'Los datos de la pizza no son válidos.')
      );
    }
  });
}

export async function procesarImagenPizza(
  archivo: Express.Multer.File
): Promise<Buffer> {
  let imagen: Buffer;

  try {
    // Valida y convierte el contenido real de la imagen.
    const original = sharp(archivo.buffer, {
      limitInputPixels: 20_000_000,
    });

    const metadata = await original.metadata();

    if (
      metadata.format !== 'jpeg' &&
      metadata.format !== 'png' &&
      metadata.format !== 'webp'
    ) {
      throw new Error('Formato no permitido');
    }

    if (metadata.pages && metadata.pages > 1) {
      throw new Error('La imagen no puede ser animada');
    }

    imagen = await original
      .rotate()
      .resize(1200, 900, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    throw new HttpError(
      400,
      'La imagen no es válida. Usá una foto JPG, PNG o WebP de hasta 20 megapíxeles.'
    );
  }

  if (imagen.length > 2 * 1024 * 1024) {
    throw new HttpError(
      413,
      'La imagen procesada supera los 2 MB. Elegí una foto más liviana.'
    );
  }

  return imagen;
}

export async function servirImagenPizza(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const nombre = String(req.params.nombre);

  if (!nombreImagenValido.test(nombre)) {
    return res.status(404).json({
      message: 'Imagen no encontrada',
    });
  }

  try {
    const contenido = await pizzaRepository.buscarImagen(
      `/uploads/pizzas/${nombre}`
    );

    // Permite servir fotos antiguas que todavía existen en el disco.
    if (!contenido) return next();

    res.set({
      'Content-Type': 'image/webp',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'public, max-age=31536000, immutable',
    });

    return res.send(contenido);
  } catch (error) {
    return handleError(res, error);
  }
}

// Copia las fotos existentes a MySQL si sus archivos siguen disponibles.
export async function importarImagenesLocales(): Promise<void> {
  const em = orm.em.fork();

  const pizzas = await em.find(
    Pizza,
    {
      imagen: { $ne: null },
      imagenContenido: null,
    },
    {
      fields: ['id', 'imagen'],
    }
  );

  for (const pizza of pizzas) {
    const nombre =
      pizza.imagen?.replace('/uploads/pizzas/', '') ?? '';

    if (!nombreImagenValido.test(nombre)) continue;

    try {
      const contenido = await readFile(
        resolve(CARPETA_IMAGENES_PIZZA, nombre)
      );

      if (contenido.length > 2 * 1024 * 1024) continue;

      await em.nativeUpdate(
        Pizza,
        {
          id: pizza.id,
          imagen: pizza.imagen,
          imagenContenido: null,
        },
        {
          imagenContenido: contenido,
        }
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }
}