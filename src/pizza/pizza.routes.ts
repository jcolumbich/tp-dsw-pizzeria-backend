import { Router } from 'express';
import { 
  findAll, 
  findOne, 
  add, 
  update, 
  remove, 
  sanitizePizzaInput 
} from './pizza.controller.js';

export const pizzaRouter = Router();

// Obtener todas las pizzas
pizzaRouter.get('/', findAll);

// Obtener una pizza por ID
pizzaRouter.get('/:id', findOne);

// Crear una nueva pizza (pasa primero por la sanitización)
pizzaRouter.post('/', sanitizePizzaInput, add);

// Modificar una pizza por ID (pasa primero por la sanitización)
pizzaRouter.put('/:id', sanitizePizzaInput, update);

// Eliminar una pizza por ID
pizzaRouter.delete('/:id', remove);