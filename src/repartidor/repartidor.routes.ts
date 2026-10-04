import { Router } from 'express';
import { findAll, findOne, add, update, remove } from './repartidor.controller.js';
import { validarConSchema } from '../shared/validar-schema.js';
import { crearRepartidorSchema, actualizarRepartidorSchema } from './repartidor.schema.js';

export const repartidorRouter = Router();

repartidorRouter.get('/', findAll);
repartidorRouter.get('/:id', findOne);
repartidorRouter.post('/', validarConSchema(crearRepartidorSchema, 'repartidorInput'), add);
repartidorRouter.put('/:id', validarConSchema(actualizarRepartidorSchema, 'repartidorInput'), update);
repartidorRouter.patch('/:id', validarConSchema(actualizarRepartidorSchema, 'repartidorInput'), update);
repartidorRouter.delete('/:id', remove);