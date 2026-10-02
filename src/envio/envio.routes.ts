import { Router } from 'express';
import { findAll, findOne, add, update, remove } from './envio.controller.js';
import { validarConSchema } from '../shared/validar-schema.js';
import { crearEnvioSchema, actualizarEnvioSchema } from './envio.schema.js';

export const envioRouter = Router();

envioRouter.get('/', findAll);
envioRouter.get('/:id', findOne);
envioRouter.post('/', validarConSchema(crearEnvioSchema, 'envioInput'), add);
envioRouter.put('/:id', validarConSchema(actualizarEnvioSchema, 'envioInput'), update);
envioRouter.delete('/:id', remove);