import { orm } from '../shared/db/orm.js'
import { Ingrediente } from './ingrediente.entity.js'
import { Repository } from '../shared/repository.js'

export class IngredienteRepository implements Repository<Ingrediente> {
  async findAll(): Promise<Ingrediente[]> {
    return orm.em.find(Ingrediente, {})
  }

  async findOne(id: number): Promise<Ingrediente | null> {
    return orm.em.findOne(Ingrediente, { id })
  }

  async add(item: Ingrediente): Promise<Ingrediente> {
    const ingrediente = orm.em.create(Ingrediente, item)
    await orm.em.persistAndFlush(ingrediente)
    return ingrediente
  }

  async update(id: number, item: Partial<Ingrediente>): Promise<Ingrediente | null> {
    const ingrediente = await orm.em.findOne(Ingrediente, { id })
    if (!ingrediente) return null
    orm.em.assign(ingrediente, item)
    await orm.em.flush()
    return ingrediente
  }

  async delete(id: number): Promise<boolean> {
    const ingrediente = await orm.em.findOne(Ingrediente, { id })
    if (!ingrediente) return false
    await orm.em.removeAndFlush(ingrediente)
    return true
  }
}