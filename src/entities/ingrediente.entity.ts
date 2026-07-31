import { Entity, PrimaryKey, Property } from "@mikro-orm/core";

@Entity()
export class Ingrediente {
  @PrimaryKey({ type: "number" })
  id!: number;

  @Property({ type: "string" })
  nombre!: string;

  @Property({ type: "number" })
  stock!: number;
}