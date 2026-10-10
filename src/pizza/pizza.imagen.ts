import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { HttpError } from '../shared/http-error.js';

export const CARPETA_IMAGENES_PIZZA = resolve(process.cwd(), 'uploads', 'pizzas');

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
    if (archivo.mimetype !== 'image/jpeg' && archivo.mimetype !== 'image/png' && archivo.mimetype !== 'image/webp') {
      return callback(new HttpError(400, 'La imagen debe ser JPG, PNG o WebP.'));
    }
    callback(null, true);
  },
}).single('imagen');

// Conserva las solicitudes JSON existentes y acepta el nuevo formulario con archivo.
export function recibirImagenPizza(req: Request, res: Response, next: NextFunction) {
  if (!req.is('multipart/form-data')) return next();

  upload(req, res, (error: unknown) => {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return next(new HttpError(400, 'La imagen no puede superar los 5 MB.'));
      }
      return next(new HttpError(400, 'Enviá una sola imagen y los datos de la pizza.'));
    }
    if (error) return next(error);

    try {
      if (!req.file) {
        throw new HttpError(400, 'Seleccioná una imagen para la pizza.');
      }
      if (typeof req.body?.datos !== 'string') {
        throw new HttpError(400, 'Faltan los datos de la pizza.');
      }
      const datos: unknown = JSON.parse(req.body.datos);
      if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
        throw new HttpError(400, 'Los datos de la pizza no son válidos.');
      }
      req.body = datos;
      next();
    } catch (error) {
      if (error instanceof HttpError) {
        return next(error);
      }
      next(new HttpError(400, 'Los datos de la pizza no son válidos.'));
    }
  });
}

export async function guardarImagenPizza(archivo: Express.Multer.File): Promise<string> {
  let imagen: Buffer;
  try {
    // Decodifica y convierte el contenido real; no confía solo en la extensión.
    const original = sharp(archivo.buffer, { limitInputPixels: 20_000_000 });
    const metadata = await original.metadata();
    if (metadata.format !== 'jpeg' && metadata.format !== 'png' && metadata.format !== 'webp') {
      throw new Error('Formato no permitido');
    }
    if (metadata.pages && metadata.pages > 1) {
      throw new Error('La imagen no puede ser animada');
    }
    imagen = await original.rotate()
      .resize(1200, 900, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 }).toBuffer();
  } catch {
    throw new HttpError(400, 'La imagen no es válida. Usá una foto JPG, PNG o WebP de hasta 20 megapíxeles.');
  }

  await mkdir(CARPETA_IMAGENES_PIZZA, { recursive: true });
  const nombre = `${randomUUID()}.webp`;
  await writeFile(resolve(CARPETA_IMAGENES_PIZZA, nombre), imagen);
  return `/uploads/pizzas/${nombre}`;
}

export async function borrarImagenPizza(imagen: string): Promise<void> {
  const nombre = imagen.replace('/uploads/pizzas/', '');
  if (!/^[a-f0-9-]{36}\.webp$/.test(nombre)) return;
  try {
    await unlink(resolve(CARPETA_IMAGENES_PIZZA, nombre));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.error('No se pudo quitar la imagen de la pizza:', error);
    }
  }
}