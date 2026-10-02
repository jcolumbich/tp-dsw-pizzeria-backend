import { describe, it, expect } from '@jest/globals';
import { validarPizzaDisponible } from './pedido.logic.js';
import { HttpError } from '../shared/http-error.js';

describe('validarPizzaDisponible', () => {
  it('no lanza error cuando la pizza tiene disponible: true', () => {
    expect(() => validarPizzaDisponible({ nombre: 'Muzzarella', disponible: true })).not.toThrow();
  });

  it('lanza HttpError 400 cuando la pizza tiene disponible: false', () => {
    expect(() => validarPizzaDisponible({ nombre: 'Napolitana', disponible: false })).toThrow(
      HttpError
    );

    try {
      validarPizzaDisponible({ nombre: 'Napolitana', disponible: false });
      throw new Error('No debería llegar acá');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpError);
      expect((error as HttpError).statusCode).toBe(400);
      expect((error as HttpError).message).toBe('La pizza "Napolitana" no está disponible');
    }
  });
});
