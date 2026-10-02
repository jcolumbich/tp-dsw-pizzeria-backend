import { Request, Response } from 'express';
import * as service from './pizza.service.js';
import { handleError } from '../shared/handle-error.js';

export async function findAll(req: Request, res: Response) {
  try {
    const pizzas = await service.listarPizzas();
    return res.status(200).json({ message: 'Todas las pizzas recuperadas', data: pizzas });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function findOne(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'El ID provisto debe ser un número entero positivo válido' });
    }
    const pizza = await service.buscarPizza(id);
    return res.status(200).json({ data: pizza });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function add(req: Request, res: Response) {
  try {
    const nuevaPizza = await service.crearPizza(req.body.pizzaInput);
    return res.status(201).json({ message: 'Pizza creada con éxito', data: nuevaPizza });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function update(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'El ID provisto debe ser un número entero positivo válido' });
    }
    const pizza = await service.actualizarPizza(id, req.body.pizzaInput);
    return res.status(200).json({ message: 'Pizza actualizada', data: pizza });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'El ID provisto debe ser un número entero positivo válido' });
    }
    await service.eliminarPizza(id);
    return res.status(200).json({ message: 'Pizza eliminada exitosamente' });
  } catch (error) {
    return handleError(res, error);
  }
}