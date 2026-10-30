import 'reflect-metadata';
import { writeFile } from 'node:fs/promises';
import { orm, syncSchema } from './orm.js';

try {
  if (process.argv.includes('--apply')) {
    await syncSchema();
    console.log('Esquema actualizado sin eliminar tablas ni columnas.');
  } else {
    const sql = await orm.getSchemaGenerator().getUpdateSchemaSQL({ safe: true, dropTables: false });
    await writeFile('schema-update.sql', sql, 'utf8');
    console.log('SQL guardado en schema-update.sql. Revisalo antes de aplicarlo; no se ejecutó ese SQL.');
  }
} finally {
  await orm.close(true);
}
