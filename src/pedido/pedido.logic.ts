import { HttpError } from '../shared/http-error.js';

export interface ItemParaTotal {
  cantidad: number;
  precioUnitario: number;
}

export function calcularTotalPedido(items: ItemParaTotal[]): number {
  return items.reduce((total, item) => total + item.cantidad * item.precioUnitario, 0);
}

export interface PizzaParaValidar {
  nombre: string;
  disponible: boolean;
}

export function validarPizzaDisponible(pizza: PizzaParaValidar): void {
  if (!pizza.disponible) {
    throw new HttpError(400, `La pizza "${pizza.nombre}" no está disponible`);
  }
}
