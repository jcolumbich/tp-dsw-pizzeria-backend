import { Entity, PrimaryKey, Property, ManyToMany, Collection } from "@mikro-orm/core";
import { Ingrediente } from "./ingrediente.entity";

@Entity()
export class Pizza {
  @PrimaryKey({ type: "number" })
  id!: number;

  @Property({ type: "string" })
  nombre!: string;

  @Property({ type: "number" })
  precio!: number;

  @ManyToMany(() => Ingrediente)
  ingredientes = new Collection<Ingrediente>(this);
}
