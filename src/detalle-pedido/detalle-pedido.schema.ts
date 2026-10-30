import { z } from 'zod';

export const crearDetalleSchema = z.object({
  cantidad: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  pizzaId: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  pedidoId: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
});

export const pedidoIdParamsSchema = z.object({
  pedidoId: z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER),
});

export const detallePedidoParamsSchema = pedidoIdParamsSchema.extend({
  pizzaId: z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER),
});
