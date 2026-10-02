import { Router } from 'express';
import { findAll, findOne, add, update, remove } from './cliente.controller.js';
import { validarConSchema } from '../shared/validar-schema.js';
import { crearClienteSchema, actualizarClienteSchema } from './cliente.schema.js';

export const clienteRouter = Router();

clienteRouter.get('/', findAll);
clienteRouter.get('/:id', findOne);
clienteRouter.post('/', validarConSchema(crearClienteSchema, 'clienteInput'), add);
clienteRouter.put('/:id', validarConSchema(actualizarClienteSchema, 'clienteInput'), update);
clienteRouter.delete('/:id', remove);