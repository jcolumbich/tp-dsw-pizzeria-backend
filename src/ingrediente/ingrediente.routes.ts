import { Router } from 'express';
import { findAll, findOne, add, update, remove } from './ingrediente.controller.js';
import { validarConSchema } from '../shared/validar-schema.js';
import { crearIngredienteSchema, actualizarIngredienteSchema } from './ingrediente.schema.js';

export const ingredienteRouter = Router();

ingredienteRouter.get('/', findAll);
ingredienteRouter.get('/:id', findOne);
ingredienteRouter.post('/', validarConSchema(crearIngredienteSchema, 'ingredienteInput'), add);
ingredienteRouter.put('/:id', validarConSchema(actualizarIngredienteSchema, 'ingredienteInput'), update);
ingredienteRouter.delete('/:id', remove);