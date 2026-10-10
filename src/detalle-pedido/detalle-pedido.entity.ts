import { Entity, Property, ManyToOne, Rel } from '@mikro-orm/core';
import { Pizza } from '../pizza/pizza.entity.js';
import { Pedido } from '../pedido/pedido.entity.js';
import { DecimalNumberType } from '../shared/db/decimal-number.type.js';

@Entity()
export class DetallePedido {
  @ManyToOne(() => Pedido, { primary: true })
  pedido!: Rel<Pedido>;

  @ManyToOne(() => Pizza, { primary: true })
  pizza!: Rel<Pizza>;

  @Property({ type: 'number' })
  cantidad!: number;

  // Null identifica pedidos anteriores cuyo precio histórico desconocemos.
  @Property({ type: new DecimalNumberType(14, 2), nullable: true })
  precio_unitario?: number | null;

  // Atributo derivado: no se persiste en la base de datos.
  get subtotal(): number | null {
    if (this.precio_unitario == null) return null;

    return (
      (Math.round(this.precio_unitario * 100) * this.cantidad) / 100
    );
  }
}