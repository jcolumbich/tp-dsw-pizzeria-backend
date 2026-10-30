import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { RequestContext } from '@mikro-orm/core';
import { orm } from './shared/db/orm.js';
import { ingredienteRouter } from './ingrediente/ingrediente.routes.js';
import { pizzaRouter } from './pizza/pizza.routes.js';
import { repartidorRouter } from './repartidor/repartidor.routes.js';
import { pedidoRouter } from './pedido/pedido.routes.js';
import { detallePedidoRouter } from './detalle-pedido/detalle-pedido.routes.js';
import { envioRouter } from './envio/envio.routes.js';
import { ingredientePizzaRouter } from './ingrediente-pizza/ingrediente-pizza.routes.js';
import { clienteRouter } from './cliente/cliente.routes.js';
import { authRouter } from './auth/auth.routes.js';
import {
  verificarToken,
  requiereNivel,
} from './auth/auth.middleware.js';
import { handleError } from './shared/handle-error.js';
import {
  CARPETA_IMAGENES_PIZZA,
  servirImagenPizza,
} from './pizza/pizza.imagen.js';
import { pagoRouter } from './pago/pago.routes.js';

export const app = express();

const origenesPermitidos = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

const frontendUrl = process.env.FRONTEND_URL?.trim();

if (frontendUrl) {
  origenesPermitidos.push(new URL(frontendUrl).origin);
}

app.use(
  cors({
    origin: origenesPermitidos,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

app.use(express.json());

app.use((_req, _res, next) => {
  RequestContext.create(orm.em, next);
});

app.get('/uploads/pizzas/:nombre', servirImagenPizza);

app.use(
  '/uploads/pizzas',
  express.static(CARPETA_IMAGENES_PIZZA, {
    dotfiles: 'deny',
    setHeaders: (res) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
    },
  }),
);

app.use('/api/auth', authRouter);
app.use('/api/pagos', pagoRouter);

app.use(
  '/api/ingredientes',
  verificarToken,
  requiereNivel(1),
  ingredienteRouter,
);

app.use(
  '/api/repartidores',
  verificarToken,
  requiereNivel(1),
  repartidorRouter,
);

app.use(
  '/api/detalle-pedido',
  verificarToken,
  requiereNivel(1),
  detallePedidoRouter,
);

app.use(
  '/api/envios',
  verificarToken,
  requiereNivel(1),
  envioRouter,
);

app.use(
  '/api/ingrediente-pizza',
  verificarToken,
  requiereNivel(1),
  ingredientePizzaRouter,
);

app.use(
  '/api/clientes',
  verificarToken,
  requiereNivel(1),
  clienteRouter,
);

app.use('/api/pizzas', pizzaRouter);
app.use('/api/pedidos', verificarToken, pedidoRouter);

app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    if (res.headersSent) return next(error);
    return handleError(res, error);
  },
);

app.use((_req, res) => {
  return res.status(404).json({
    message: 'Recurso no encontrado',
  });
});

export default app;
