import { z } from 'zod';

const costoSchema = z.number().min(0, 'El costo debe ser un número mayor o igual a 0');
const propinaSchema = z.number().min(0, 'El monto de propina debe ser un número mayor o igual a 0');
const idSchema = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);

export const crearEnvioSchema = z.strictObject({
  costo: costoSchema,
  monto_propina: propinaSchema.multipleOf(0.01, 'La propina admite hasta dos decimales').optional(),
  pedidoId: idSchema,
  repartidorId: idSchema,
}).transform(({ pedidoId, ...datos }) => ({
  ...datos,
  pedido: pedidoId,
}));

export const actualizarEnvioSchema = z.strictObject({
  costo: costoSchema.optional(),
  monto_propina: propinaSchema.multipleOf(0.01, 'La propina admite hasta dos decimales').optional(),
}).refine(
  (datos) => Object.values(datos).some((valor) => valor !== undefined),
  { message: 'Debe enviar al menos un campo para actualizar' }
);

export type CrearEnvioInput = z.infer<typeof crearEnvioSchema>;
export type ActualizarEnvioInput = z.infer<typeof actualizarEnvioSchema>;