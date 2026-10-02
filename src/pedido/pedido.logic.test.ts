import { describe, it, expect } from '@jest/globals';
import { calcularTotalPedido } from './pedido.logic.js';

describe('calcularTotalPedido', () => {
  it('calcula bien el total de un pedido con un solo item', () => {
    const total = calcularTotalPedido([{ cantidad: 3, precioUnitario: 1500 }]);

    expect(total).toBe(4500);
  });

  it('calcula bien el total sumando varios items de distintas pizzas y cantidades', () => {
    const total = calcularTotalPedido([
      { cantidad: 2, precioUnitario: 2000 }, // 4000
      { cantidad: 1, precioUnitario: 2500 }, // 2500
      { cantidad: 4, precioUnitario: 1200 }, // 4800
    ]);

    expect(total).toBe(11300);
  });
});
