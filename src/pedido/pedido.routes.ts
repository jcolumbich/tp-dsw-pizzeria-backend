import { Router } from 'express';

import {sanitizePedidoInput,findAll,findOne,add,update,asignarEnvio,} from './pedido.controller.js';

import { requiereNivel } from '../auth/auth.middleware.js';

export const pedidoRouter = Router();

pedidoRouter.get('/', findAll);

pedidoRouter.get('/:id', findOne);

pedidoRouter.post('/',sanitizePedidoInput,add);

// Asignar envío y repartidor
pedidoRouter.post('/:id/asignar-envio', requiereNivel(1), asignarEnvio);

// Modificar estado del pedido, incluida la baja lógica
pedidoRouter.put('/:id',requiereNivel(1),sanitizePedidoInput,update);