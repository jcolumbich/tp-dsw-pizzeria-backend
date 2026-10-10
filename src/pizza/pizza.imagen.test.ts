import 'reflect-metadata';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import sharp from 'sharp';
import { handleError } from '../shared/handle-error.js';

const em: any = { findOne: jest.fn(), create: jest.fn(), persistAndFlush: jest.fn() };
jest.unstable_mockModule('../shared/db/orm.js', () => ({ orm: { em } }));
const { procesarImagenPizza, servirImagenPizza, recibirImagenPizza } = await import('./pizza.imagen.js');
const { crearPizza } = await import('./pizza.service.js');

beforeEach(() => {
  jest.resetAllMocks();
  em.create.mockImplementation((_entidad: any, datos: any) => datos);
  em.persistAndFlush.mockResolvedValue(undefined);
});

describe('imágenes persistidas con la pizza', () => {
  it('procesa la imagen real y guarda sus bytes junto con la URL en la base', async () => {
    const jpeg = await sharp({
      create: { width: 2, height: 2, channels: 3, background: '#ff0000' }
    }).jpeg().toBuffer();
    const webp = await procesarImagenPizza({ buffer: jpeg } as Express.Multer.File);
    expect((await sharp(webp).metadata()).format).toBe('webp');
    const pizza = await crearPizza({
      nombre: 'Prueba', precio: 10.25, disponible: true, vegetariana: true
    }, webp);
    expect(pizza.imagen).toMatch(/^\/uploads\/pizzas\/[a-f0-9-]+\.webp$/);
    expect(pizza.imagenContenido).toEqual(webp);
    expect(em.persistAndFlush).toHaveBeenCalledWith(pizza);
  });

  it('sirve los bytes recuperados de la base sin depender de uploads/', async () => {
    const bytes = await sharp({
      create: { width: 2, height: 2, channels: 3, background: '#ff0000' }
    }).webp().toBuffer();
    em.findOne.mockResolvedValue({ imagenContenido: bytes });
    const app = express();
    app.get('/uploads/pizzas/:nombre', servirImagenPizza);
    const respuesta = await request(app).get('/uploads/pizzas/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.webp');
    expect(respuesta.status).toBe(200);
    expect(respuesta.headers['content-type']).toContain('image/webp');
    expect(respuesta.headers['content-length']).toBe(String(bytes.length));
    expect(respuesta.headers['x-content-type-options']).toBe('nosniff');
    expect(em.findOne.mock.calls[0][1]).toEqual({
      imagen: '/uploads/pizzas/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.webp'
    });
  });

  it('rechaza contenido que no sea una imagen decodificable', async () => {
    await expect(procesarImagenPizza({
      buffer: Buffer.from('no es una foto')
    } as Express.Multer.File)).rejects.toMatchObject({ statusCode: 400 });
  });

  it('un archivo que supera el límite responde 413', async () => {
    const app = express();
    app.post('/prueba', recibirImagenPizza, (_req, res) => res.json({ ok: true }));
    app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => handleError(res, error));
    const respuesta = await request(app).post('/prueba').field('datos', '{}')
      .attach('imagen', Buffer.alloc(5 * 1024 * 1024 + 1), {
        filename: 'foto.jpg', contentType: 'image/jpeg'
      });
    expect(respuesta.status).toBe(413);
  });
});