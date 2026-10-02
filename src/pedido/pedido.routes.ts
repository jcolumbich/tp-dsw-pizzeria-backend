import { Router } from 'express';
import { findAll, findOne, add, update, asignarEnvio } from './pedido.controller.js';
import { requiereNivel } from '../auth/auth.middleware.js';
import { validarConSchema } from '../shared/validar-schema.js';
import { crearPedidoSchema, actualizarPedidoSchema, asignarEnvioSchema } from './pedido.schema.js';

export const pedidoRouter = Router();

pedidoRouter.get('/', findAll);
pedidoRouter.get('/:id', findOne);

pedidoRouter.post('/', (req, res, next) => {
  if (req.usuario?.nivel_permisos !== 0) {
    return res.status(403).json({ message: 'Solo los clientes pueden crear pedidos' });
  }
  next();
}, validarConSchema(crearPedidoSchema, 'pedidoInput'), add);

pedidoRouter.post('/:id/asignar-envio', requiereNivel(1), validarConSchema(asignarEnvioSchema, 'envioInput'), asignarEnvio);
pedidoRouter.put('/:id', requiereNivel(1), validarConSchema(actualizarPedidoSchema, 'pedidoInput'), update);