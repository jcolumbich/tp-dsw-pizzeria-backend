import { Router } from 'express';
import { 
  findAll, 
  findOne, 
  add, 
  update, 
  remove, 
  sanitizeIngredienteInput 
} from './ingrediente.controller.js';

export const ingredienteRouter = Router();

// Obtener todos los ingredientes
ingredienteRouter.get('/', findAll);

// Obtener un ingrediente por ID
ingredienteRouter.get('/:id', findOne);

// Crear un nuevo ingrediente (pasa primero por la sanitización)
ingredienteRouter.post('/', sanitizeIngredienteInput, add);

// Modificar un ingrediente por ID (pasa primero por la sanitización)
ingredienteRouter.put('/:id', sanitizeIngredienteInput, update);

// Eliminar un ingrediente por ID
ingredienteRouter.delete('/:id', remove);