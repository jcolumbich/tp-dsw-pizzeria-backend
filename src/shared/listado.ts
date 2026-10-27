import { z } from 'zod';
import { HttpError } from './http-error.js';

// HTTP entrega strings: no usar coerce.boolean(), porque "false" es truthy.
export const booleanoQuery = z.enum(['true', 'false']).transform(valor => valor === 'true');
const enteroQuery = (maximo: number) => z.string().regex(/^[1-9]\d*$/, 'Debe ser un entero positivo')
  .transform(Number).pipe(z.number().int().min(1).max(maximo));
export const idQuery = enteroQuery(Number.MAX_SAFE_INTEGER);
export const camposListado = {
  pagina: enteroQuery(100000).default(1),
  limite: enteroQuery(100).default(10),
  busqueda: z.string().trim().max(120, 'La búsqueda admite hasta 120 caracteres')
    .transform(valor => valor.replace(/\s+/g, ' ')).default(''),
};
export const filtroPersonaSchema = z.strictObject({
  ...camposListado,
  estado: booleanoQuery.optional(),
});
export const filtroPizzaSchema = z.strictObject({
  ...camposListado,
  vegetariana: booleanoQuery.optional(),
  disponible: booleanoQuery.optional(),
});
export type FiltroPersona = z.infer<typeof filtroPersonaSchema>;
export type FiltroPizza = z.infer<typeof filtroPizzaSchema>;

export function validarQuery<T>(schema: z.ZodType<T>, entrada: unknown): T {
  const resultado = schema.safeParse(entrada);
  if (!resultado.success) {
    throw new HttpError(400, resultado.error.issues[0]?.message ?? 'Filtros inválidos');
  }
  return resultado.data;
}

export interface Pagina<T> {
  data: T[];
  paginacion: { pagina: number; limite: number; total: number; totalPaginas: number };
}
export function respuestaPagina<T>(data: T[], total: number, pagina: number, limite: number): Pagina<T> {
  return { data, paginacion: { pagina, limite, total, totalPaginas: Math.max(1, Math.ceil(total / limite)) } };
}

// ! es el escape explícito de LIKE. Los comodines escritos por el usuario son literales.
export function patronBusqueda(palabra: string): string {
  return `%${palabra.replace(/[!%_]/g, caracter => `!${caracter}`)}%`;
}