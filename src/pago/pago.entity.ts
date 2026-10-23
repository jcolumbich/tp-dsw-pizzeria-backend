import { Entity, OneToOne, Property, Rel } from '@mikro-orm/core';
import { BaseEntity } from '../shared/db/base.entity.js';
import { DecimalNumberType } from '../shared/db/decimal-number.type.js';
import { Pedido } from '../pedido/pedido.entity.js';

export interface MovimientoMP {
  estado: string;
  actualizado: string;
  reembolsado: number;
}

@Entity()
export class Pago extends BaseEntity {
  @OneToOne(() => Pedido, { owner: true })
  pedido!: Rel<Pedido>;

  @Property({ type: 'string', unique: true })
  referencia!: string;

  @Property({ type: new DecimalNumberType(14, 2) })
  importe!: number;

  @Property({ type: 'string', nullable: true })
  preferenciaId?: string;

  @Property({ type: 'text', nullable: true, hidden: true })
  checkoutUrl?: string;

  @Property({ type: 'json', nullable: true, hidden: true })
  movimientos?: Record<string, MovimientoMP>;
}