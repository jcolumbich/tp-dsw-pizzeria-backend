import { spawnSync } from 'node:child_process';
import { config } from 'dotenv';

const modo = process.argv[2] ?? 'all';
if (!['all', 'unit', 'integration'].includes(modo)) throw new Error('Modo de prueba no válido');
config({ quiet: true });
config({ path: '.env.test', override: true, quiet: true });
process.env.NODE_ENV = 'test';
process.env.DB_SYNC_SCHEMA = 'false';
process.env.IMPORTAR_IMAGENES_LOCALES = 'false';
// El token solo se utiliza en la base exclusiva de pruebas.
process.env.JWT_SECRET = 'secreto-exclusivo-de-tests-locales-no-usar-en-produccion';

if (modo !== 'unit') {
  const { configuracionBase } = await import('../dist/shared/db/config.js');
  configuracionBase(process.env);
}
const filtro = modo === 'unit'
  ? ['--testPathIgnorePatterns=integration']
  : modo === 'integration' ? ['--testPathPatterns=integration'] : [];
const resultado = spawnSync(process.execPath, [
  '--experimental-vm-modules', 'node_modules/jest/bin/jest.js', '--runInBand',
  ...filtro, ...process.argv.slice(3),
], { stdio: 'inherit', env: process.env });
if (resultado.error) throw resultado.error;
process.exitCode = resultado.status ?? 1;
