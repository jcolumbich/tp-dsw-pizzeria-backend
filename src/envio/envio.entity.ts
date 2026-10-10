import { Entity, Property, OneToOne, Rel } from '@mikro-orm/core';
import { BaseEntity } from '../shared/db/base.entity.js';
import { Pedido } from '../pedido/pedido.entity.js';
import { DecimalNumberType } from '../shared/db/decimal-number.type.js';

@Entity()
export class Envio extends BaseEntity {
  @Property({ type: new DecimalNumberType(14, 2) })
  costo!: number;

  @Property({ type: new DecimalNumberType(14, 2) })
  monto_propina?: number = 0;

  @OneToOne(() => Pedido, { owner: true, nullable: false })
  pedido!: Rel<Pedido>;
}