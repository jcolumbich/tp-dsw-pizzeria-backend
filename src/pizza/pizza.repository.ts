import { orm } from '../shared/db/orm.js'
import { Pizza } from './pizza.entity.js'
import { Repository } from '../shared/repository.js'

export class PizzaRepository implements Repository<Pizza> {
  async findAll(): Promise<Pizza[]> {
    return orm.em.find(Pizza, {})
  }

  async findOne(id: number): Promise<Pizza | null> {
    return orm.em.findOne(Pizza, { id })
  }

  async add(item: Pizza): Promise<Pizza> {
    const pizza = orm.em.create(Pizza, item)
    await orm.em.persistAndFlush(pizza)
    return pizza
  }

  async update(id: number, item: Partial<Pizza>): Promise<Pizza | null> {
    const pizza = await orm.em.findOne(Pizza, { id })
    if (!pizza) return null
    orm.em.assign(pizza, item)
    await orm.em.flush()
    return pizza
  }

  async delete(id: number): Promise<boolean> {
    const pizza = await orm.em.findOne(Pizza, { id })
    if (!pizza) return false
    await orm.em.removeAndFlush(pizza)
    return true
  }
}