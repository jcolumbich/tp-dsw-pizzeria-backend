import { Router } from 'express';
import { sanitizePedidoInput, findAll, findOne, add, update, remove } from './pedido.controller.js';

export const pedidoRouter = Router();

pedidoRouter.get('/', findAll);
pedidoRouter.get('/:id', findOne);
pedidoRouter.post('/', sanitizePedidoInput, add);
pedidoRouter.put('/:id', sanitizePedidoInput, update);
pedidoRouter.delete('/:id', remove);