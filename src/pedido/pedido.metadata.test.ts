import 'reflect-metadata';
import { expect, it } from '@jest/globals';
import { MikroORM } from '@mikro-orm/core';
import { MySqlDriver } from '@mikro-orm/mysql';

it('descubre las entidades compiladas y genera las columnas de checkout sin ciclos ESM', async () => {
  const orm = await MikroORM.init({ entities: ['dist/**/*.entity.js'], dbName: 'checkout_metadata_test',
    driver: MySqlDriver, connect: false, pool: { min: 0 } });
  try {
    // En MySqlDriver esto crea el cliente Knex, sin abrir conexiones ni ejecutar SQL.
    await orm.em.getConnection().connect();
    const sql = await orm.getSchemaGenerator().getCreateSchemaSQL();
    expect(sql).toContain('`medio_pago` varchar(255) null');
    expect(sql).toContain('`costo_envio` decimal(14,2) null');
    expect(sql).toContain('`vence_pago` datetime null');
    expect(sql).toContain('unique `pedido_checkout_id_unique`');
  } finally { await orm.close(); }
});
