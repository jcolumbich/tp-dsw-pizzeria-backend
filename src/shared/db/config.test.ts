import { describe, expect, it } from '@jest/globals';
import { configuracionBase } from './config.js';

describe('aislamiento de la base de datos', () => {
  it('impide conectar a desarrollo desde una ejecución manual de Jest mal configurada', () => {
    expect(() => configuracionBase({ NODE_ENV: 'development', JEST_WORKER_ID: '1',
      DB_URL: 'mysql://user:clave@localhost/pizzeria' })).toThrow('NODE_ENV=test');
  });
  it('exige una conexión explícita en producción', () => {
    expect(() => configuracionBase({ NODE_ENV: 'production' })).toThrow('Falta DB_URL');
  });
  it('no usa DB_URL como reemplazo de una base de pruebas ausente', () => {
    expect(() => configuracionBase({ NODE_ENV: 'test', DB_URL: 'mysql://user:clave@localhost/pizzeria' }))
      .toThrow('Falta DB_TEST_URL');
  });
  it('rechaza pruebas sobre una base sin sufijo _test', () => {
    expect(() => configuracionBase({ NODE_ENV: 'test', DB_TEST_URL: 'mysql://user:clave@localhost/pizzeria' }))
      .toThrow('termine en _test');
  });
  it('rechaza la misma base aunque se utilicen credenciales o hosts distintos', () => {
    expect(() => configuracionBase({ NODE_ENV: 'test',
      DB_URL: 'mysql://user:clave@localhost/pizzeria_test',
      DB_TEST_URL: 'mysql://otro:clave@127.0.0.1/pizzeria_test',
    })).toThrow('nombres diferentes');
  });
  it('selecciona únicamente la base exclusiva de pruebas', () => {
    const datos = configuracionBase({ NODE_ENV: 'test', DB_NAME: 'pizzeria',
      DB_URL: 'mysql://user:clave@localhost/pizzeria',
      DB_TEST_URL: 'mysql://test:clave@localhost/pizzeria_test' });
    expect(datos.dbName).toBe('pizzeria_test');
    expect(datos.clientUrl).toBe('mysql://test:clave@localhost/pizzeria_test');
  });
  it('rechaza un DB_NAME que cambiaría silenciosamente la base de DB_URL', () => {
    expect(() => configuracionBase({ DB_NAME: 'otra', DB_URL: 'mysql://user:clave@localhost/pizzeria' }))
      .toThrow('no coinciden');
  });
});
