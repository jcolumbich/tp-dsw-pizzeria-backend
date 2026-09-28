import { Router } from 'express';
import { findAll, findOne, findByPedido } from './detalle-pedido.controller.js';

export const detallePedidoRouter = Router();

detallePedidoRouter.get('/', findAll);
detallePedidoRouter.get('/pedido/:pedidoId', findByPedido);
detallePedidoRouter.get('/:pedidoId/:pizzaId', findOne);