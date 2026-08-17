import { Entity, Property, OneToMany, Collection } from '@mikro-orm/core';
import { Persona } from '../persona/persona.entity.js';
import { Pedido } from '../pedido/pedido.entity.js';

@Entity()
export class Repartidor extends Persona {
    @Property({ type: 'string' })
    matricula!: string;

    @Property({ type: 'double' })
    monto_propina_total!: number;

    @OneToMany(() => Pedido, (pedido) => pedido.repartidor)
    pedidos = new Collection<Pedido>(this);
}