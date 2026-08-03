import { Entity, PrimaryKey, Property, ManyToOne } from "@mikro-orm/core";
import { Pedido } from "./pedido.entity";
import { Pizza } from "./pizza.entity";

@Entity()
export class ItemPedido {
  @PrimaryKey({ type: "number" })
  id!: number;

  @ManyToOne(() => Pedido)
  pedido!: Pedido;

  @ManyToOne(() => Pizza)
  pizza!: Pizza;

  @Property({ type: "number" })
  cantidad!: number;

  @Property({ type: "number" })
  precioUnitario!: number;
}