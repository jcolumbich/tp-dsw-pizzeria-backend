import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from '../shared/db/base.entity.js';

@Entity()
export class Ingrediente extends BaseEntity {
  @Property({ type: 'string' })
  nombre!: string;

  @Property({ type: 'number' })
  stock!: number;
}