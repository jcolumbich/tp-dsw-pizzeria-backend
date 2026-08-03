import { Entity, PrimaryKey, Property, ManyToOne, OneToMany, Collection, Cascade } from "@mikro-orm/core";
import { Cliente } from "./cliente.entity";
import { ItemPedido } from "./item-pedido.entity";

@Entity()
export class Pedido {
  @PrimaryKey({ type: "number" })
  id!: number;

  @Property({ type: "Date" })
  fecha: Date = new Date();

  @Property({ type: "string" })
  estado: string = "Pendiente";

  @Property({ type: "number" })
  total: number = 0;

  @ManyToOne(() => Cliente)
  cliente!: Cliente;

  @OneToMany(() => ItemPedido, (item) => item.pedido, { cascade: [Cascade.ALL] })
  items = new Collection<ItemPedido>(this);
}
