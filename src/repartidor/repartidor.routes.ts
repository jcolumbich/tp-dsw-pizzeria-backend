import { Router } from 'express';
import { sanitizeRepartidorInput, findAll, findOne, add, update, remove } from './repartidor.controller.js';

export const repartidorRouter = Router();

repartidorRouter.get('/', findAll);
repartidorRouter.get('/:id', findOne);
repartidorRouter.post('/', sanitizeRepartidorInput, add);
repartidorRouter.put('/:id', sanitizeRepartidorInput, update);
repartidorRouter.patch('/:id', sanitizeRepartidorInput, update);
repartidorRouter.delete('/:id', remove);