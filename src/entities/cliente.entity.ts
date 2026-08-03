import { Entity, PrimaryKey, Property } from "@mikro-orm/core";

@Entity()
export class Cliente {
  @PrimaryKey({ type: "number" })
  id!: number;

  @Property({ type: "string" })
  nombre!: string;

  @Property({ type: "string" })
  telefono!: string;

  @Property({ type: "string" })
  direccion!: string;
}