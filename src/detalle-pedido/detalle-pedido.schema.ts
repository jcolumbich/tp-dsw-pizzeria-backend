import { z } from 'zod';

export const pedidoIdParamsSchema = z.object({
  pedidoId: z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER),
});

export const detallePedidoParamsSchema = pedidoIdParamsSchema.extend({
  pizzaId: z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER),
});