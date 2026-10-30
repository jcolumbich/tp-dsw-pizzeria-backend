import 'reflect-metadata';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { app } from '../app.js';
import { Cliente } from '../cliente/cliente.entity.js';
import { Ingrediente } from './ingrediente.entity.js';
import { orm, syncSchema } from '../shared/db/orm.js';

// NODE_ENV=test obliga al ORM a usar DB_TEST_URL, nunca la base habitual.
// Solo se eliminan las filas creadas por esta ejecución; no se vacían tablas.
const sufijo = randomUUID();
const clave = 'Clave-exclusiva-de-integracion-123';
const nombreIngrediente = `Integracion-${sufijo}`;
const usuarios: Cliente[] = [];
let tokenAdmin: string;
let tokenCliente: string;
const respuestaLogin = z.object({ data: z.object({ token: z.string().min(1) }) });
const respuestaIngrediente = z.object({
  data: z.object({ id: z.number().int().positive(), nombre: z.string(), stock: z.number() }),
});

beforeAll(async () => {
  if (process.env.NODE_ENV !== 'test') throw new Error('Ejecutá este test con pnpm run test:integration');
  await syncSchema();
  const em = orm.em.fork();
  const contrasenia = await bcrypt.hash(clave, 10);
  for (const nivel of [1, 0]) {
    usuarios.push(em.create(Cliente, {
      nombre: 'Integracion', apellido: 'Prueba',
      email: `integracion-${nivel}-${sufijo}@example.com`,
      contrasenia, nivel_permisos: nivel, estado: true, domicilio: 'Domicilio de prueba',
    }));
  }
  await em.persistAndFlush(usuarios);
  const tokens: string[] = [];
  for (const usuario of usuarios) {
    const respuesta = await request(app).post('/api/auth/login')
      .send({ email: usuario.email, contrasenia: clave });
    expect(respuesta.status).toBe(200);
    tokens.push(respuestaLogin.parse(respuesta.body).data.token);
  }
  [tokenAdmin, tokenCliente] = tokens;
});

afterAll(async () => {
  try {
    const em = orm.em.fork();
    await em.nativeDelete(Ingrediente, { nombre: nombreIngrediente });
    const ids = usuarios.map(usuario => usuario.id).filter(id => Number.isInteger(id));
    if (ids.length > 0) await em.nativeDelete(Cliente, { id: { $in: ids } });
  } finally {
    await orm.close(true);
  }
});

describe('API de ingredientes con MySQL real', () => {
  it('rechaza la consulta sin sesión', async () => {
    expect((await request(app).get('/api/ingredientes')).status).toBe(401);
  });
  it('rechaza un cliente autenticado sin permisos de administrador', async () => {
    const respuesta = await request(app).get('/api/ingredientes')
      .set('Authorization', `Bearer ${tokenCliente}`);
    expect(respuesta.status).toBe(403);
  });
  it('rechaza stock negativo antes de persistir', async () => {
    const respuesta = await request(app).post('/api/ingredientes')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: nombreIngrediente, stock: -1 });
    expect(respuesta.status).toBe(400);
    expect(await orm.em.fork().count(Ingrediente, { nombre: nombreIngrediente })).toBe(0);
  });
  it('crea, consulta, lista, actualiza y elimina un ingrediente con stock fraccionario', async () => {
    const alta = await request(app).post('/api/ingredientes')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: nombreIngrediente, stock: 10.25 });
    expect(alta.status).toBe(201);
    const ingrediente = respuestaIngrediente.parse(alta.body).data;
    expect(ingrediente.stock).toBe(10.25);
    const consulta = await request(app).get(`/api/ingredientes/${ingrediente.id}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);
    expect(consulta.status).toBe(200);
    expect(respuestaIngrediente.parse(consulta.body).data).toEqual(ingrediente);
    const listado = await request(app).get('/api/ingredientes')
      .set('Authorization', `Bearer ${tokenAdmin}`);
    expect(listado.status).toBe(200);
    expect(listado.body.data).toEqual(expect.arrayContaining([expect.objectContaining({ id: ingrediente.id })]));
    const actualizacion = await request(app).put(`/api/ingredientes/${ingrediente.id}`)
      .set('Authorization', `Bearer ${tokenAdmin}`).send({ stock: 7.125 });
    expect(actualizacion.status).toBe(200);
    expect(respuestaIngrediente.parse(actualizacion.body).data.stock).toBe(7.125);
    const guardado = await orm.em.fork().findOneOrFail(Ingrediente, ingrediente.id);
    expect(guardado.stock).toBe(7.125);
    const baja = await request(app).delete(`/api/ingredientes/${ingrediente.id}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);
    expect(baja.status).toBe(200);
    expect(await orm.em.fork().findOne(Ingrediente, ingrediente.id)).toBeNull();
  });
});
