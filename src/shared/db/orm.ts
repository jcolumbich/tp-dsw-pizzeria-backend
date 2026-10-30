import 'dotenv/config';
import { MikroORM } from '@mikro-orm/core';
import { MySqlDriver } from '@mikro-orm/mysql';
import { configuracionBase } from './config.js';

export const orm = await MikroORM.init({
  entities: ['dist/**/*.entity.js'],
  entitiesTs: ['src/**/*.entity.ts'],
  ...configuracionBase(process.env),
  driver: MySqlDriver,
  debug: process.env.NODE_ENV === 'development',
  schemaGenerator: {
    disableForeignKeys: true,
    createForeignKeyConstraints: true
  }
});

export const syncSchema = async () => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('La actualización automática del esquema está deshabilitada en producción');
  }
  const generator = orm.getSchemaGenerator();
  await generator.updateSchema({ safe: true, dropTables: false });
};
