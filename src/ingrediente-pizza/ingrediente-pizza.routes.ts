import { Router } from 'express';
import { findAll, findOne, findByPizza, add, update, remove } from './ingrediente-pizza.controller.js';
import { validarConSchema } from '../shared/validar-schema.js';
import { crearIngredientePizzaSchema, actualizarIngredientePizzaSchema } from './ingrediente-pizza.schema.js';

export const ingredientePizzaRouter = Router();

ingredientePizzaRouter.get('/', findAll);
ingredientePizzaRouter.get('/pizza/:pizzaId', findByPizza);
ingredientePizzaRouter.get('/:pizzaId/:ingredienteId', findOne);
ingredientePizzaRouter.post('/', validarConSchema(crearIngredientePizzaSchema, 'ingredientePizzaInput'), add);
ingredientePizzaRouter.put('/:pizzaId/:ingredienteId', validarConSchema(actualizarIngredientePizzaSchema, 'ingredientePizzaInput'), update);
ingredientePizzaRouter.delete('/:pizzaId/:ingredienteId', remove);