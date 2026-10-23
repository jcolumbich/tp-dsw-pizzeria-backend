import { createHmac, timingSafeEqual } from 'node:crypto';
import type { MovimientoMP } from './pago.entity.js';
import { HttpError } from '../shared/http-error.js';

export function centavos(valor: number): number {
  if (!Number.isFinite(valor) || valor < 0) {
    throw new HttpError(409, 'Importe inválido');
  }

  const resultado = Math.round(valor * 100);

  if (!Number.isSafeInteger(resultado)) {
    throw new HttpError(409, 'Importe fuera de rango');
  }

  return resultado;
}

export function estadoPago(
  movimientos: Record<string, MovimientoMP> = {},
): string {
  const pagos = Object.values(movimientos ?? {});

  if (!pagos.length) return 'sin_pagar';

  const aprobados = pagos.filter((pago) => pago.estado === 'approved');

  if (
    aprobados.length > 1 ||
    pagos.some(
      (pago) =>
        pago.reembolsado > 0 ||
        ['refunded', 'charged_back', 'in_mediation'].includes(pago.estado),
    )
  ) {
    return 'revision';
  }

  if (aprobados.length === 1) return 'aprobado';

  if (
    pagos.some((pago) =>
      ['pending', 'in_process', 'authorized'].includes(pago.estado),
    )
  ) {
    return 'pendiente';
  }

  if (
    pagos.every((pago) =>
      ['rejected', 'cancelled'].includes(pago.estado),
    )
  ) {
    return 'rechazado';
  }

  return 'revision';
}

export function guardarMovimiento(
  anteriores: Record<string, MovimientoMP> | undefined,
  id: string,
  nuevo: MovimientoMP,
): Record<string, MovimientoMP> {
  const previo = anteriores?.[id];

  // No reemplazar información nueva por una notificación anterior.
  if (
    previo &&
    Date.parse(previo.actualizado) >= Date.parse(nuevo.actualizado)
  ) {
    return anteriores!;
  }

  return { ...anteriores, [id]: nuevo };
}

export function firmaValida(
  dataId: string,
  requestId: string,
  firma: string,
  secreto: string,
): boolean {
  const partes = firma
    .split(',')
    .map((parte) => parte.trim().split('='));

  const ts = partes.find(([clave]) => clave === 'ts')?.[1];

  const firmas = partes
    .filter(([clave]) => clave === 'v1')
    .map(([, valor]) => valor);

  if (!/^\d+$/.test(ts ?? '') || !requestId || !secreto) {
    return false;
  }

  const mensaje =
    `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`;

  const esperada = createHmac('sha256', secreto)
    .update(mensaje)
    .digest();

  return firmas.some(
    (valor) =>
      /^[a-f\d]{64}$/i.test(valor ?? '') &&
      timingSafeEqual(Buffer.from(valor, 'hex'), esperada),
  );
}