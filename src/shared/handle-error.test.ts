import { describe, expect, it } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import { handleError } from './handle-error.js';
import { DecimalNumberType } from './db/decimal-number.type.js';
import { importeSchema, stockSchema } from './numero.schema.js';

describe('errores HTTP y precisión', () => {
  it.each([
    ['{"retiro":', 400],
    [JSON.stringify({ dato: 'a'.repeat(110_000) }), 413]
  ])('informa correctamente JSON inválido o demasiado grande', async (cuerpo, estado) => {
    const app = express();
    app.use(express.json());
    app.post('/prueba', (_req, res) => res.json({ ok: true }));
    app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => handleError(res, error));
    const resultado = await request(app).post('/prueba').set('Content-Type', 'application/json').send(cuerpo);
    expect(resultado.status).toBe(estado);
    expect(resultado.body.message).not.toBe('Error interno del servidor');
  });

  it.each(['ER_DUP_ENTRY', 'ER_ROW_IS_REFERENCED_2', 'ER_NO_REFERENCED_ROW_2'])('traduce %s a 409', async (code) => {
    const app = express();
    app.get('/prueba', (_req, res) => handleError(res, { code }));
    const resultado = await request(app).get('/prueba');
    expect(resultado.status).toBe(409);
  });

  it('persiste decimales y devuelve números, conservando null en precios antiguos', () => {
    const dinero = new DecimalNumberType(14, 2);
    const stock = new DecimalNumberType(16, 4);
    expect(dinero.getColumnType()).toBe('decimal(14,2)');
    expect(stock.convertToDatabaseValue(9.7)).toBe('9.7000');
    expect(dinero.convertToJSValue('10.25')).toBe(10.25);
    expect(dinero.convertToJSValue(null)).toBeNull();
    expect(dinero.convertToDatabaseValue(null)).toBeNull();
  });

  it('rechaza importes y cantidades que no se pueden almacenar con su precisión', () => {
    expect(importeSchema.safeParse(0.01).success).toBe(true);
    expect(importeSchema.safeParse(1.001).success).toBe(false);
    expect(stockSchema.safeParse(0.1234).success).toBe(true);
    expect(stockSchema.safeParse(0.12345).success).toBe(false);
  });
});