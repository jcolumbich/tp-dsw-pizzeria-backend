import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from '../shared/db/base.entity.js';
import { DecimalNumberType } from '../shared/db/decimal-number.type.js';

@Entity()
export class Ingrediente extends BaseEntity {
  @Property({ type: 'string' })
  nombre!: string;

  @Property({ type: new DecimalNumberType(16, 4) })
  stock!: number;
}