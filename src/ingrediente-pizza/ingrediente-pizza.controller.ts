import { Request, Response } from 'express';
import * as service from './ingrediente-pizza.service.js';
import { handleError } from '../shared/handle-error.js';

export async function findAll(req: Request, res: Response) {
  try {
    const data = await service.listarTodo();
    return res.status(200).json({ message: 'Todos los ingredientes de pizza recuperados', data });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function findOne(req: Request, res: Response) {
  try {
    const pizzaId = Number(req.params.pizzaId);
    const ingredienteId = Number(req.params.ingredienteId);
    if (!Number.isSafeInteger(pizzaId) || pizzaId <= 0 || !Number.isSafeInteger(ingredienteId) || ingredienteId <= 0) {
      return res.status(400).json({ message: 'Los IDs provistos deben ser números enteros positivos válidos' });
    }
    const data = await service.buscarUno(pizzaId, ingredienteId);
    return res.status(200).json({ data });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function findByPizza(req: Request, res: Response) {
  try {
    const pizzaId = Number(req.params.pizzaId);
    if (!Number.isSafeInteger(pizzaId) || pizzaId <= 0) {
      return res.status(400).json({ message: 'El ID de pizza provisto debe ser un número entero positivo válido' });
    }
    const data = await service.listarPorPizza(pizzaId);
    return res.status(200).json({ data });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function add(req: Request, res: Response) {
  try {
    const nuevo = await service.crear(req.body.ingredientePizzaInput);
    return res.status(201).json({ message: 'Ingrediente agregado a la pizza con éxito', data: nuevo });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function update(req: Request, res: Response) {
  try {
    const pizzaId = Number(req.params.pizzaId);
    const ingredienteId = Number(req.params.ingredienteId);
    if (!Number.isSafeInteger(pizzaId) || pizzaId <= 0 || !Number.isSafeInteger(ingredienteId) || ingredienteId <= 0) {
      return res.status(400).json({ message: 'Los IDs provistos deben ser números enteros positivos válidos' });
    }
    const data = await service.actualizar(pizzaId, ingredienteId, req.body.ingredientePizzaInput.cantidad);
    return res.status(200).json({ message: 'Actualizado con éxito', data });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const pizzaId = Number(req.params.pizzaId);
    const ingredienteId = Number(req.params.ingredienteId);
    if (!Number.isSafeInteger(pizzaId) || pizzaId <= 0 || !Number.isSafeInteger(ingredienteId) || ingredienteId <= 0) {
      return res.status(400).json({ message: 'Los IDs provistos deben ser números enteros positivos válidos' });
    }
    await service.eliminar(pizzaId, ingredienteId);
    return res.status(200).json({ message: 'Eliminado exitosamente' });
  } catch (error) {
    return handleError(res, error);
  }
}