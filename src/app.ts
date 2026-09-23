import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { RequestContext } from '@mikro-orm/core';

import { orm, syncSchema } from './shared/db/orm.js';
import { validarEntrada } from './shared/validar_entradas.js';

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

const app = express();

app.use(cors());
app.use(express.json());

await syncSchema();

app.use((req, res, next) => {
  RequestContext.create(orm.em, next);
});

// Debe ejecutarse ANTES de las rutas /api.
app.use('/api', validarEntrada);

// Login público
app.use('/api/auth', authRouter);

// Rutas solo para administradores
app.use('/api/ingredientes', verificarToken, requiereNivel(1), ingredienteRouter);
app.use('/api/repartidores', verificarToken, requiereNivel(1), repartidorRouter);
app.use('/api/detalle-pedido', verificarToken, requiereNivel(1), detallePedidoRouter);
app.use('/api/envios', verificarToken, requiereNivel(1), envioRouter);
app.use('/api/ingrediente-pizza', verificarToken, requiereNivel(1), ingredientePizzaRouter);
app.use('/api/clientes', verificarToken, requiereNivel(1), clienteRouter);

// Rutas para usuarios autenticados; cada router controla sus operaciones
app.use('/api/pizzas', verificarToken, pizzaRouter);
app.use('/api/pedidos', verificarToken, pedidoRouter);

app.use((error: unknown,_req: express.Request,res: express.Response,next: express.NextFunction) => {
  if (res.headersSent) return next(error);
  return handleError(res, error);
});

app.use((_, res) => {
  return res.status(404).json({ message: 'Recurso no encontrado' });
});

app.listen(3000, () => {
  console.log('Servidor corriendo con éxito en http://localhost:3000');
});