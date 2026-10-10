import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { RequestContext } from '@mikro-orm/core';

import { orm, syncSchema } from './shared/db/orm.js';

import { ingredienteRouter } from './ingrediente/ingrediente.routes.js';
import { pizzaRouter } from './pizza/pizza.routes.js';
import { repartidorRouter } from './repartidor/repartidor.routes.js';
import { pedidoRouter } from './pedido/pedido.routes.js';
import { detallePedidoRouter } from './detalle-pedido/detalle-pedido.routes.js';
import { envioRouter } from './envio/envio.routes.js';
import { ingredientePizzaRouter } from './ingrediente-pizza/ingrediente-pizza.routes.js';
import { clienteRouter } from './cliente/cliente.routes.js';
import { authRouter } from './auth/auth.routes.js';
import { verificarToken, requiereNivel } from './auth/auth.middleware.js';
import { handleError } from './shared/handle-error.js';
import { CARPETA_IMAGENES_PIZZA } from './pizza/pizza.imagen.js';

export const app = express();

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(cors({ origin: frontendUrl, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],allowedHeaders: ['Content-Type', 'Authorization'],}));
app.use(express.json());
app.use('/uploads/pizzas', express.static(CARPETA_IMAGENES_PIZZA, {
  dotfiles: 'deny',
  setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
}));

await syncSchema();

app.use((req, res, next) => {
  RequestContext.create(orm.em, next);
});

// Login público
app.use('/api/auth', authRouter);

// Rutas solo para administradores
app.use('/api/ingredientes', verificarToken, requiereNivel(1), ingredienteRouter);
app.use('/api/repartidores', verificarToken, requiereNivel(1), repartidorRouter);
app.use('/api/detalle-pedido', verificarToken, requiereNivel(1), detallePedidoRouter);
app.use('/api/envios', verificarToken, requiereNivel(1), envioRouter);
app.use('/api/ingrediente-pizza', verificarToken, requiereNivel(1), ingredientePizzaRouter);
app.use('/api/clientes', verificarToken, requiereNivel(1), clienteRouter);

// Pizzas: lectura pública (carta), escritura solo admin (verificarToken se aplica por ruta en pizza.routes.ts)
app.use('/api/pizzas', pizzaRouter);

// Rutas para usuarios autenticados; cada router controla sus operaciones
app.use('/api/pedidos', verificarToken, pedidoRouter);

app.use((error: unknown,_req: express.Request,res: express.Response,next: express.NextFunction) => {
  if (res.headersSent) return next(error);
  return handleError(res, error);
});

app.use((_, res) => {
  return res.status(404).json({ message: 'Recurso no encontrado' });
});
// Jest establece JEST_WORKER_ID durante los tests.
// Supertest utiliza app directamente, sin iniciar el servidor en el puerto 3000.
if (process.env.JEST_WORKER_ID === undefined) {
  app.listen(3000, () => {
    console.log('Servidor corriendo con éxito en http://localhost:3000');
  });
}