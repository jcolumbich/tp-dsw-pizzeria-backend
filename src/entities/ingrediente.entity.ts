import { Entity, PrimaryKey, Property } from "@mikro-orm/core";

@Entity()
export class Ingrediente {
  @PrimaryKey()
  id!: number;

  @Property()
  nombre!: string;

  @Property()
  stock!: number;
}

