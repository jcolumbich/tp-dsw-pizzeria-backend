import { camposListado, booleanoQuery, idQuery } from '../shared/listado.js';
import { z } from 'zod';
import { importeSchema } from '../shared/numero.schema.js';

export const estadoPedidoSchema = z.enum([
  'Pendiente',
  'En preparación',
  'En camino',
  'Entregado',
  'Cancelado',
]);

const idSchema = z
  .number()
  .int()
  .positive()
  .max(Number.MAX_SAFE_INTEGER);

const itemPedidoSchema = z.strictObject({
  pizzaId: idSchema,

  cantidad: z
    .number()
    .int()
    .positive('La cantidad debe ser un entero positivo')
    .max(100, 'La cantidad máxima por pizza es 100'),
});

const itemsPedidoSchema = z
  .array(itemPedidoSchema)
  .min(1, 'Debe incluir al menos una pizza')
  .max(50, 'El pedido admite hasta 50 ítems')
  .refine(
    (items) =>
      new Set(items.map((item) => item.pizzaId)).size === items.length,
    {
      message:
        'No puede repetir una pizza: indique su cantidad en un único ítem',
    }
  );

const pedidoInputSchema = z.strictObject({
  retiro: z.boolean(),
  medio_pago: z.enum(['efectivo', 'mercadopago']).default('efectivo'),
  checkout_id: z.uuid().optional(),
  costo_envio: importeSchema.optional(),
  monto_propina: importeSchema.default(0),
  items: itemsPedidoSchema,
  clienteId: idSchema.optional(),
  estado: z.union([estadoPedidoSchema, z.literal('Esperando pago')]).optional(),
});

const validarPropina = (datos: {
  retiro: boolean;
  monto_propina: number;
}) => !datos.retiro || datos.monto_propina === 0;

const errorPropina = {
  message:
    'La propina para el repartidor solo está disponible en pedidos con envío',
  path: ['monto_propina'],
};

export const crearPedidoSchema = pedidoInputSchema.refine(
  validarPropina,
  errorPropina
);

export const crearPedidoConClienteSchema = pedidoInputSchema
  .extend({
    clienteId: idSchema,
  })
  .refine(validarPropina, errorPropina);

export const actualizarPedidoSchema = z.strictObject({
  estado: estadoPedidoSchema,
});

export const asignarEnvioSchema = z.strictObject({
  repartidorId: idSchema,
  costo: importeSchema,
});

export const filtroPedidoSchema = z.strictObject({
  pagina: camposListado.pagina,
  limite: camposListado.limite,
  estado: z.union([estadoPedidoSchema, z.literal('Esperando pago')]).optional(),
  activos: booleanoQuery.optional(),
  repartidorId: idQuery.optional(),
}).refine(datos => !(datos.activos !== undefined && datos.estado !== undefined), {
  message: 'Usá estado o activos, no ambos a la vez',
});
export type FiltroPedido = z.infer<typeof filtroPedidoSchema>;