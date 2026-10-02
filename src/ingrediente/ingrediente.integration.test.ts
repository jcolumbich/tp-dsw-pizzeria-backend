import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { RequestContext } from '@mikro-orm/core';
import { app } from '../app.js';
import { ClienteRepository } from '../cliente/cliente.repository.js';
import { Cliente } from '../cliente/cliente.entity.js';
import { orm } from '../shared/db/orm.js';

// GET /api/ingredientes requiere estar autenticado como admin (verificarToken + requiereNivel(1)).
// Como el registro público de clientes siempre crea usuarios con nivel_permisos 0, para este
// test creamos directamente en la base de datos de desarrollo (vía repository, sin pasar por
// HTTP) un cliente admin temporal, generamos su token igual que auth.service.ts, y lo borramos
// al finalizar para no dejar datos de prueba en la base.
const EMAIL_ADMIN_TEST = 'admin-test-integracion@example.com';

const clienteRepository = new ClienteRepository();
let clienteTestId: number;
let token: string;

beforeAll(async () => {
  // Fuera de un request HTTP real no existe el RequestContext que app.ts crea por middleware,
  // así que lo recreamos acá a mano para poder usar los repositories directamente (mismo
  // patrón que MikroORM recomienda para scripts/tests fuera del ciclo de vida de Express).
  await RequestContext.createAsync(orm.em, async () => {
    const existente = await clienteRepository.findByEmail(EMAIL_ADMIN_TEST);
    if (existente) {
      await clienteRepository.delete(existente.id);
    }

    const clienteAdmin = await clienteRepository.add({
      nombre: 'Admin',
      apellido: 'DeTest',
      email: EMAIL_ADMIN_TEST,
      contrasenia: 'no-se-usa-en-este-test',
      nivel_permisos: 1,
      estado: true,
      domicilio: 'N/A',
    } as Cliente);

    clienteTestId = clienteAdmin.id;

    token = jwt.sign(
      {
        id: clienteAdmin.id,
        email: clienteAdmin.email,
        nivel_permisos: clienteAdmin.nivel_permisos,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: '5m' }
    );
  });
});

afterAll(async () => {
  await RequestContext.createAsync(orm.em, async () => {
    if (clienteTestId) {
      await clienteRepository.delete(clienteTestId);
    }
  });
  await orm.close();
});

describe('GET /api/ingredientes (integración)', () => {
  it('responde 200 con { message, data } y data es un array, autenticado como admin', async () => {
    const respuesta = await request(app)
      .get('/api/ingredientes')
      .set('Authorization', `Bearer ${token}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toHaveProperty('message');
    expect(respuesta.body).toHaveProperty('data');
    expect(Array.isArray(respuesta.body.data)).toBe(true);
  });
});
