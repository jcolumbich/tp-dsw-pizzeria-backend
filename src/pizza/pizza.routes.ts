import { Router } from 'express';
import { 
  findAll, 
  findOne, 
  add, 
  update, 
  remove, 
  sanitizePizzaInput 
} from './pizza.controller.js';
import { requiereNivel } from '../auth/auth.middleware.js';

export const pizzaRouter = Router();

// Obtener todas las pizzas (cualquier usuario logueado, Cliente o Admin)
pizzaRouter.get('/', findAll);

// Obtener una pizza por ID (cualquier usuario logueado)
pizzaRouter.get('/:id', findOne);

// Crear una nueva pizza (solo Admin)
pizzaRouter.post('/', requiereNivel(1), sanitizePizzaInput, add);

// Modificar una pizza por ID (solo Admin)
pizzaRouter.put('/:id', requiereNivel(1), sanitizePizzaInput, update);

// Eliminar una pizza por ID (solo Admin)
pizzaRouter.delete('/:id', requiereNivel(1), remove);