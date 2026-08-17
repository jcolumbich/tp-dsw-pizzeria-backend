import { Router } from 'express';
import {
  sanitizeDetallePedidoInput,
  findAll,
  findOne,
  findByPedido,
  add,
  update,
  remove,
} from './detalle-pedido.controller.js';

export const detallePedidoRouter = Router();

detallePedidoRouter.get('/', findAll);
detallePedidoRouter.get('/pedido/:pedidoId', findByPedido);
detallePedidoRouter.get('/:pedidoId/:pizzaId', findOne);
detallePedidoRouter.post('/', sanitizeDetallePedidoInput, add);
detallePedidoRouter.put('/:pedidoId/:pizzaId', sanitizeDetallePedidoInput, update);
detallePedidoRouter.delete('/:pedidoId/:pizzaId', remove);