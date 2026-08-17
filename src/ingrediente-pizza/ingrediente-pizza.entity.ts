import { Entity, Property, ManyToOne, Rel } from '@mikro-orm/core';
import { Pizza } from '../pizza/pizza.entity.js';
import { Ingrediente } from '../ingrediente/ingrediente.entity.js';

@Entity()
export class IngredientePizza {
  @ManyToOne(() => Pizza, { primary: true })
  pizza!: Rel<Pizza>;

  @ManyToOne(() => Ingrediente, { primary: true })
  ingrediente!: Rel<Ingrediente>;

  @Property({ type: 'double' })
  cantidad!: number;
}