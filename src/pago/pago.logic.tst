import { describe, expect, it } from '@jest/globals';
import { createHmac } from 'node:crypto';
import { estadoPago, guardarMovimiento, firmaValida } from './pago.logic.js';
const movimiento = { estado: 'approved', actualizado: '2026-10-23T12:00:00Z', reembolsado: 0 };
describe('notificaciones idempotentes y firmadas', () => {
  it('ignora duplicados y notificaciones antiguas', () => {
    const actual = { '100': movimiento };
    expect(guardarMovimiento(actual, '100', movimiento)).toBe(actual);
    expect(guardarMovimiento(actual, '100', { ...movimiento, estado: 'pending', actualizado: '2026-10-22T12:00:00Z' })).toBe(actual);
  });
  it('dos cobros distintos o un reembolso requieren revisión', () => {
    expect(estadoPago({ '1': movimiento, '2': movimiento })).toBe('revision');
    expect(estadoPago({ '1': { ...movimiento, reembolsado: 1 } })).toBe('revision');
  });
  it('valida la firma y rechaza alterar el ID de pago', () => {
    const firma = createHmac('sha256', 'secreto-test').update('id:100;request-id:request;ts:123;').digest('hex');
    expect(firmaValida('100', 'request', `ts=123,v1=${firma}`, 'secreto-test')).toBe(true);
    expect(firmaValida('101', 'request', `ts=123,v1=${firma}`, 'secreto-test')).toBe(false);
    expect(firmaValida('100', 'request', '', 'secreto-test')).toBe(false);
  });
});
