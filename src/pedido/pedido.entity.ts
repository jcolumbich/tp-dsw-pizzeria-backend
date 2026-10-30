import {Entity,Property, OneToMany,OneToOne, ManyToOne, Collection,Rel, Cascade,} from '@mikro-orm/core';
import { BaseEntity } from '../shared/db/base.entity.js';
import { DetallePedido } from '../detalle-pedido/detalle-pedido.entity.js';
import { Envio } from '../envio/envio.entity.js';
import { Repartidor } from '../repartidor/repartidor.entity.js';
import { Cliente } from '../cliente/cliente.entity.js';
import { DecimalNumberType } from '../shared/db/decimal-number.type.js';

export interface ConsumoIngredientePedido {
  ingredienteId: number;
  cantidad: number;
}

@Entity()
export class Pedido extends BaseEntity {
  @Property({ type: 'Date' })
  dia: Date = new Date();

  @Property({ type: new DecimalNumberType(14, 2), defaultRaw: '0.00' })
  total: number = 0;

  @Property({ type: new DecimalNumberType(14, 2), defaultRaw: '0.00' })
  monto_propina: number = 0;

  @Property({ type: 'boolean' })
  retiro!: boolean;

  @Property({ type: 'string' })
  estado: string = 'Pendiente';

  // Nulos en pedidos anteriores: no se inventa su forma de pago.
  @Property({ type: 'string', nullable: true })
  medio_pago?: 'efectivo' | 'mercadopago';

  @Property({ type: new DecimalNumberType(14, 2), nullable: true })
  costo_envio?: number;

  @Property({ type: 'string', nullable: true, unique: true, hidden: true })
  checkout_id?: string;

  @Property({ type: 'Date', nullable: true })
  vence_pago?: Date;

  @Property({ type: 'json', nullable: true, hidden: true })
  consumoIngredientes?: ConsumoIngredientePedido[] | null;

  @OneToMany(() => DetallePedido, (detalle) => detalle.pedido, {
    cascade: [Cascade.ALL],
    orphanRemoval: true,
  })
  detalles = new Collection<DetallePedido>(this);

  @OneToOne(() => Envio, (envio) => envio.pedido, { nullable: true })
  envio?: Rel<Envio>;

  @ManyToOne(() => Repartidor, { nullable: true })
  repartidor?: Rel<Repartidor>;

  @ManyToOne(() => Cliente, { nullable: true })
  cliente?: Rel<Cliente>;
}