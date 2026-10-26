import 'dotenv/config';
import { HttpError } from '../shared/http-error.js';

export function variable(nombre: string): string {
  const valor = process.env[nombre]?.trim();

  if (!valor) {
    throw new HttpError(503, `Falta configurar ${nombre} en el backend`);
  }

  return valor;
}

export function urlPublica(nombre: string): string {
  let url: URL;
  try { url = new URL(variable(nombre)); }
  catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(503, `${nombre} no contiene una URL válida`);
  }

  if (
    url.protocol !== 'https:' ||
    ['localhost', '127.0.0.1'].includes(url.hostname)
  ) {
    throw new HttpError(503, `${nombre} debe ser una URL pública HTTPS`);
  }

  return url.origin;
}

export async function consultarMP<T>(
  ruta: string,
  body?: unknown,
  metodo?: 'POST' | 'PUT',
): Promise<T> {
  if (variable('MP_MODO') !== 'prueba') {
    throw new Error('Esta integración solo permite modo prueba');
  }

  const respuesta = await fetch(
    `https://api.mercadopago.com${ruta}`,
    {
      method: metodo ?? (body === undefined ? 'GET' : 'POST'),
      headers: {
        Authorization: `Bearer ${variable('MP_ACCESS_TOKEN')}`,
        'Content-Type': 'application/json',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    },
  );

  if (!respuesta.ok) {
    throw new Error(
      `Mercado Pago respondió HTTP ${respuesta.status}`,
    );
  }

  return respuesta.json() as Promise<T>;
}
export async function validarVendedorPrueba(
  vendedorConfigurado: string = variable('MP_VENDEDOR_PRUEBA_ID'),
): Promise<void> {
  if (variable('MP_MODO') !== 'prueba') {
    throw new HttpError(
      409,
      'Esta integración está habilitada únicamente para pruebas',
    );
  }

  // Verificar el dueño del token antes del checkout y al conciliar pagos live_mode.
  const respuestaUsuario = await fetch(
    'https://api.mercadolibre.com/users/me',
    {
      headers: {
        Authorization: `Bearer ${variable('MP_ACCESS_TOKEN')}`,
      },
      signal: AbortSignal.timeout(10000),
    },
  );

  if (!respuestaUsuario.ok) {
    throw new HttpError(
      502,
      `No se pudo comprobar la cuenta de prueba del vendedor: HTTP ${respuestaUsuario.status}`,
    );
  }

  const vendedor =
    (await respuestaUsuario.json()) as { id?: number | string; tags?: string[] };

  const esVendedorDePrueba =
    String(vendedor.id) === vendedorConfigurado &&
    Array.isArray(vendedor.tags) &&
    vendedor.tags.includes('test_user');

  if (!esVendedorDePrueba) {
    throw new HttpError(
      409,
      'El vendedor no pudo validarse como cuenta de prueba. El pago no se registró.',
    );
  }
}