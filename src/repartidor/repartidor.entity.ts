import { Entity, Property, OneToMany, Collection, Unique } from '@mikro-orm/core';
import { Persona } from '../persona/persona.entity.js';
import { Pedido } from '../pedido/pedido.entity.js';

@Entity()
@Unique({ properties: ['email'] })
export class Repartidor extends Persona {

    
  @Property({ type: 'string', unique: true })
  matricula!: string;

  @Property({ type: 'double' })
  monto_propina_total!: number;

  @OneToMany(() => Pedido, (pedido) => pedido.repartidor)
  pedidos = new Collection<Pedido>(this);
}