import 'reflect-metadata'; 
import express from 'express';
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


const app = express();
app.use(express.json()); // Middleware para parsear JSONs en el body

// Sincronizamos la base de datos automáticamente al arrancar
await syncSchema();

// Middleware de contexto para que cada request tenga su propia transacción limpia
app.use((req, res, next) => {
  RequestContext.create(orm.em, next);
});

// Registramos el router de ingredientes
app.use('/api/ingredientes', ingredienteRouter);

// Registramos el router de pizza
app.use('/api/pizzas', pizzaRouter);

// Registramos el router de repartidores
app.use('/api/repartidores', repartidorRouter);

// Registramos el router de pedidos
app.use('/api/pedidos', pedidoRouter);

// Registramos el router de detalle de pedidos
app.use('/api/detalle-pedido', detallePedidoRouter);

app.use('/api/envios', envioRouter);

// Registramos el router de ingrediente-pizza
app.use('/api/ingrediente-pizza', ingredientePizzaRouter);

app.use('/api/clientes', clienteRouter);

// Manejador global para endpoints inexistentes (404)
app.use((_, res) => {
  return res.status(404).json({ message: 'Recurso no encontrado' });
});

app.listen(3000, () => {
  console.log('Servidor corriendo con éxito en http://localhost:3000');
});