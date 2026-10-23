import 'dotenv/config';

export function variable(nombre: string): string {
  const valor = process.env[nombre]?.trim();

  if (!valor) {
    throw new Error(`Falta configurar ${nombre}`);
  }

  return valor;
}

export function urlPublica(nombre: string): string {
  const url = new URL(variable(nombre));

  if (
    url.protocol !== 'https:' ||
    ['localhost', '127.0.0.1'].includes(url.hostname)
  ) {
    throw new Error(`${nombre} debe ser una URL pública HTTPS`);
  }

  return url.origin;
}

export async function consultarMP<T>(
  ruta: string,
  body?: unknown,
): Promise<T> {
  if (variable('MP_MODO') !== 'prueba') {
    throw new Error('Esta integración solo permite modo prueba');
  }

  const respuesta = await fetch(
    `https://api.mercadopago.com${ruta}`,
    {
      method: body === undefined ? 'GET' : 'POST',
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