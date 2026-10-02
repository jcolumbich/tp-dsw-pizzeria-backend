import { z } from 'zod';

const envioInputSchema = z.strictObject({
  costo: z.number().min(0, 'El costo debe ser un número mayor o igual a 0'),
  monto_propina: z.number().min(0, 'El monto de propina debe ser un número mayor o igual a 0'),
  pedidoId: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
});

export const crearEnvioSchema = envioInputSchema.transform(({ pedidoId, ...datos }) => ({
  ...datos,
  pedido: pedidoId,
}));

export const actualizarEnvioSchema = envioInputSchema.partial().refine(
  (datos) => Object.values(datos).some((valor) => valor !== undefined),
  { message: 'Debe enviar al menos un campo para actualizar' }
).transform(({ pedidoId, ...datos }) => ({
  ...datos,
  ...(pedidoId !== undefined ? { pedido: pedidoId } : {}),
}));

export type CrearEnvioInput = z.infer<typeof crearEnvioSchema>;
export type ActualizarEnvioInput = z.infer<typeof actualizarEnvioSchema>;