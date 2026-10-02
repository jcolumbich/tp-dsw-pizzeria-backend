import { Router } from 'express';
import { findAll, findOne, add, update, remove } from './pizza.controller.js';
import { requiereNivel } from '../auth/auth.middleware.js';
import { validarConSchema } from '../shared/validar-schema.js';
import { crearPizzaSchema, actualizarPizzaSchema } from './pizza.schema.js';

export const pizzaRouter = Router();

pizzaRouter.get('/', findAll);
pizzaRouter.get('/:id', findOne);
pizzaRouter.post('/', requiereNivel(1), validarConSchema(crearPizzaSchema, 'pizzaInput'), add);
pizzaRouter.put('/:id', requiereNivel(1), validarConSchema(actualizarPizzaSchema, 'pizzaInput'), update);
pizzaRouter.delete('/:id', requiereNivel(1), remove);