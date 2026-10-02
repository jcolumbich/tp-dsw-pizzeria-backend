import { z } from 'zod';

export const estadoPedidoSchema = z.enum([
  'Pendiente',
  'En preparación',
  'En camino',
  'Entregado',
  'Cancelado',
]);

const idSchema = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);

const itemPedidoSchema = z.strictObject({
  pizzaId: idSchema,
  cantidad: z.number().int().positive('La cantidad debe ser un entero positivo').max(100, 'La cantidad máxima por pizza es 100'),
});

const itemsPedidoSchema = z.array(itemPedidoSchema).min(1, 'Debe incluir al menos una pizza').max(50, 'El pedido admite hasta 50 ítems').refine(
  (items) => new Set(items.map((item) => item.pizzaId)).size === items.length,
  { message: 'No puede repetir una pizza: indique su cantidad en un único ítem' }
);

export const crearPedidoSchema = z.strictObject({
  retiro: z.boolean(),
  items: itemsPedidoSchema,
  clienteId: idSchema.optional(),
  estado: estadoPedidoSchema.optional(),
});

export const crearPedidoConClienteSchema = crearPedidoSchema.extend({
  clienteId: idSchema,
});

export const actualizarPedidoSchema = z.strictObject({
  estado: estadoPedidoSchema,
});

export const asignarEnvioSchema = z.strictObject({
  repartidorId: idSchema,
  costo: z.number().min(0, 'El costo debe ser un número mayor o igual a 0'),
});

export const filtroPedidoSchema = z.object({
  estado: estadoPedidoSchema.optional(),
});