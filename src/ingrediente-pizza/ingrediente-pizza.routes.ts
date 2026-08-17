import { Router } from 'express';
import {
  sanitizeIngredientePizzaInput,
  findAll,
  findOne,
  findByPizza,
  add,
  update,
  remove,
} from './ingrediente-pizza.controller.js';

export const ingredientePizzaRouter = Router();

ingredientePizzaRouter.get('/', findAll);
ingredientePizzaRouter.get('/pizza/:pizzaId', findByPizza);
ingredientePizzaRouter.get('/:pizzaId/:ingredienteId', findOne);
ingredientePizzaRouter.post('/', sanitizeIngredientePizzaInput, add);
ingredientePizzaRouter.put('/:pizzaId/:ingredienteId', sanitizeIngredientePizzaInput, update);
ingredientePizzaRouter.delete('/:pizzaId/:ingredienteId', remove);