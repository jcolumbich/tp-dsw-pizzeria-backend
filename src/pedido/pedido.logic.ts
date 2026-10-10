import { HttpError } from '../shared/http-error.js';

export interface ItemParaTotal {
  cantidad: number;
  precioUnitario: number;
}

export function calcularTotalPedido(items: ItemParaTotal[]): number {
  const totalCentavos = items.reduce(
    (centavos, item) =>
      centavos + item.cantidad * Math.round(item.precioUnitario * 100),
    0
  );

  return totalCentavos / 100;
}

export interface PizzaParaValidar {
  nombre: string;
  disponible: boolean;
}

export function validarPizzaDisponible(pizza: PizzaParaValidar): void {
  if (!pizza.disponible) {
    throw new HttpError(
      400,
      `La pizza "${pizza.nombre}" no está disponible`
    );
  }
}