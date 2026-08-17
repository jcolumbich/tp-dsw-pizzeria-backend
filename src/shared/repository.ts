export interface Repository<T> {
  findAll(): Promise<T[]>
  findOne(id: number): Promise<T | null>
  add(item: T): Promise<T>
  update(id: number, item: Partial<T>): Promise<T | null>
  delete(id: number): Promise<boolean>
}