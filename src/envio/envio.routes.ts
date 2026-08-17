import { Router } from 'express';
import { sanitizeEnvioInput, findAll, findOne, add, update, remove } from './envio.controller.js';

export const envioRouter = Router();

envioRouter.get('/', findAll);
envioRouter.get('/:id', findOne);
envioRouter.post('/', sanitizeEnvioInput, add);
envioRouter.put('/:id', sanitizeEnvioInput, update);
envioRouter.delete('/:id', remove);