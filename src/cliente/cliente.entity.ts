import { Entity, Property, OneToMany, Collection, Unique } from '@mikro-orm/core';
import { Persona } from '../persona/persona.entity.js';
import { Pedido } from '../pedido/pedido.entity.js';

@Entity()
@Unique({ properties: ['email'] })
export class Cliente extends Persona {
  @Property({ type: 'string' })
  domicilio!: string;

  @OneToMany(() => Pedido, (pedido) => pedido.cliente)
  pedidos = new Collection<Pedido>(this);
}