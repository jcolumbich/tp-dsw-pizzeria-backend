import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from '../shared/db/base.entity.js';

@Entity()
export class Pizza extends BaseEntity {
  @Property({ type: 'string' })
  nombre!: string;

  @Property({ type: 'number' })
  precio!: number;

  @Property({ type: 'boolean' })
  vegetariana!: boolean;

  @Property({ type: 'boolean' })
  disponible!: boolean;
}