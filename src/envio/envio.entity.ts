import { Entity, Property, OneToOne, Rel } from '@mikro-orm/core';
import { BaseEntity } from '../shared/db/base.entity.js';
import { Pedido } from '../pedido/pedido.entity.js';

@Entity()
export class Envio extends BaseEntity {
  @Property({ type: 'double' })
  costo!: number;

  @Property({ type: 'double' })
  monto_propina!: number;

  @OneToOne(() => Pedido, { owner: true, nullable: false })
  pedido!: Rel<Pedido>;
}