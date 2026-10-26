import { HttpError } from '../shared/http-error.js';

export function tarifaEnvio(): number {
  const valor = process.env.COSTO_ENVIO?.trim();
  if (!valor || !/^\d+(\.\d{1,2})?$/.test(valor) || Number(valor) > 999999) {
    throw new HttpError(503, 'Falta configurar COSTO_ENVIO en el backend (importe mayor o igual a cero)');
  }
  return Number(valor);
}
