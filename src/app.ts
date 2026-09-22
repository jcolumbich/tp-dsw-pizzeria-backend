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


const app = express();
app.use(cors());
app.use(express.json()); // Middleware para parsear JSONs en el body

// Sincronizamos la base de datos automáticamente al arrancar
await syncSchema();

// Middleware de contexto para que cada request tenga su propia transacción limpia
app.use((req, res, next) => {
  RequestContext.create(orm.em, next);
});

// Login (público, sin protección)
app.use('/api/auth', authRouter);

// Registramos el router de ingredientes (solo Admin)
app.use('/api/ingredientes', verificarToken,requiereNivel(1), ingredienteRouter);

app.use( '/api/repartidores', verificarToken, requiereNivel(1), repartidorRouter);

// Pizzas (cualquier usuario autenticado puede consultar;
// las modificaciones se restringen en pizza.routes.ts)
app.use('/api/pizzas', verificarToken, pizzaRouter);

// Registramos el router de pedidos (cualquier usuario logueado; el detalle de qué
// puede hacer cada nivel se controla dentro de pedido.routes.ts)
app.use('/api/pedidos', verificarToken, pedidoRouter);

// Registramos el router de detalle de pedidos (solo Admin)
app.use('/api/detalle-pedido', verificarToken, requiereNivel(1), detallePedidoRouter);

// Envíos (solo Admin)
app.use('/api/envios', verificarToken, requiereNivel(1), envioRouter);

// Registramos el router de ingrediente-pizza (solo Admin)
app.use('/api/ingrediente-pizza', verificarToken, requiereNivel(1), ingredientePizzaRouter);

// Clientes (solo Admin)
app.use('/api/clientes', verificarToken, requiereNivel(1), clienteRouter);

// Manejador global para endpoints inexistentes (404)
app.use((_, res) => {
  return res.status(404).json({ message: 'Recurso no encontrado' });
});

app.listen(3000, () => {
  console.log('Servidor corriendo con éxito en http://localhost:3000');
});