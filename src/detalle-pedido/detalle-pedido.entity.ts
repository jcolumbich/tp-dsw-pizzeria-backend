import { Entity, Property, ManyToOne, Rel } from '@mikro-orm/core';
import { Pizza } from '../pizza/pizza.entity.js';
import { Pedido } from '../pedido/pedido.entity.js';

@Entity()
export class DetallePedido {
  @ManyToOne(() => Pedido, { primary: true })
  pedido!: Rel<Pedido>;

  @ManyToOne(() => Pizza, { primary: true })
  pizza!: Rel<Pizza>;

  @Property({ type: 'number' })
  cantidad!: number;

  // subtotal es atributo derivado (el "/" del diagrama): no se persiste
  get subtotal(): number {
    return this.cantidad * (this.pizza?.precio ?? 0);
  }
}