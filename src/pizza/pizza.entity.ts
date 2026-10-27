import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from '../shared/db/base.entity.js';
import { DecimalNumberType } from '../shared/db/decimal-number.type.js';

@Entity()
export class Pizza extends BaseEntity {
  @Property({ type: 'string' })
  nombre!: string;

  @Property({ type: new DecimalNumberType(14, 2) })
  precio!: number;

  @Property({ type: 'boolean' })
  vegetariana!: boolean;

  @Property({ type: 'boolean' })
  disponible!: boolean;

  @Property({ type: 'boolean', default: false, hidden: true })
  eliminada: boolean = false;

  @Property({ type: 'string', nullable: true })
  imagen?: string;

  @Property({
    type: 'Buffer',
    columnType: 'mediumblob',
    nullable: true,
    hidden: true,
    lazy: true,
  })
  imagenContenido?: Buffer;
}