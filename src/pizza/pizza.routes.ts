import { Router } from 'express';
import { findAll, findOne, add, update, remove } from './pizza.controller.js';
import { verificarToken, requiereNivel } from '../auth/auth.middleware.js';
import { validarConSchema } from '../shared/validar-schema.js';
import { crearPizzaSchema, actualizarPizzaSchema } from './pizza.schema.js';

export const pizzaRouter = Router();

pizzaRouter.get('/', findAll);
pizzaRouter.get('/:id', findOne);
pizzaRouter.post('/', verificarToken, requiereNivel(1), validarConSchema(crearPizzaSchema, 'pizzaInput'), add);
pizzaRouter.put('/:id', verificarToken, requiereNivel(1), validarConSchema(actualizarPizzaSchema, 'pizzaInput'), update);
pizzaRouter.delete('/:id', verificarToken, requiereNivel(1), remove);