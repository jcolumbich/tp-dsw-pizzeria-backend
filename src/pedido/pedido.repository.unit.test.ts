import 'reflect-metadata';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { LockMode } from '@mikro-orm/core';

const em: any = {
  findOne: jest.fn(), find: jest.fn(), count: jest.fn(), create: jest.fn(),
  persist: jest.fn(), flush: jest.fn(), populate: jest.fn(), remove: jest.fn(),
  transactional: jest.fn(), assign: jest.fn()
};
jest.unstable_mockModule('../shared/db/orm.js', () => ({ orm: { em } }));
const { PedidoRepository } = await import('./pedido.repository.js');
const { PizzaRepository } = await import('../pizza/pizza.repository.js');
const { ClienteRepository } = await import('../cliente/cliente.repository.js');
const { IngredienteRepository } = await import('../ingrediente/ingrediente.repository.js');
const { DetallePedido } = await import('../detalle-pedido/detalle-pedido.entity.js');

beforeEach(() => {
  jest.resetAllMocks();
  em.transactional.mockImplementation(async (operacion: any) => operacion(em));
  em.flush.mockResolvedValue(undefined);
  em.populate.mockResolvedValue(undefined);
});

describe('pedidos y borrados con historial', () => {
  it('guarda el precio y consumo originales y descuenta stock fraccionario', async () => {
    const pizza = { id: 1, nombre: 'Prueba', precio: 0.1, disponible: true };
    const ingrediente = { id: 7, nombre: 'Queso', stock: 10 };
    const detalles: any[] = [];
    let pedido: any;
    em.findOne.mockImplementation(async (entidad: any) => entidad.name === 'Cliente'
      ? { id: 1, estado: true } : pedido);
    em.find.mockImplementation(async (entidad: any) => {
      if (entidad.name === 'Pizza') return [pizza];
      if (entidad.name === 'IngredientePizza') return [{ pizza, ingrediente, cantidad: 0.1 }];
      return [ingrediente];
    });
    em.create.mockImplementation((entidad: any, datos: any) => {
      if (entidad.name === 'Pedido') {
        return pedido = { id: 2, ...datos, detalles: { getItems: () => detalles } };
      }
      const detalle = { ...datos };
      detalles.push(detalle);
      return detalle;
    });
    const resultado = await new PedidoRepository().addConItems(false, 1, [{ pizzaId: 1, cantidad: 3 }], 0.5);
    expect(ingrediente.stock).toBe(9.7);
    expect(resultado.total).toBe(0.3);
    expect(resultado.consumoIngredientes).toEqual([{ ingredienteId: 7, cantidad: 0.3 }]);
    pizza.precio = 99;
    expect(detalles[0].precio_unitario).toBe(0.1);
    const detalle = Object.assign(new DetallePedido(), detalles[0]);
    expect(detalle.subtotal).toBe(0.3);
  });

  it.each(['Cancelado', 'Entregado', 'En camino'])('no confirma un pedido %s', async (estado) => {
    const pedido = { id: 1, estado };
    em.findOne.mockResolvedValue(pedido);
    await expect(new PedidoRepository().confirmarConBloqueo(1)).rejects.toMatchObject({ statusCode: 409 });
    expect(pedido.estado).toBe(estado);
    expect(em.flush).not.toHaveBeenCalled();
    expect(em.findOne.mock.calls[0][2]).toMatchObject({
      lockMode: LockMode.PESSIMISTIC_WRITE,
      refresh: true
    });
  });

  it('serializa cancelar y confirmar: no revive el pedido ni descuenta stock otra vez', async () => {
    const pedido = {
      id: 1,
      estado: 'Pendiente',
      consumoIngredientes: [{ ingredienteId: 7, cantidad: 0.3 }]
    };
    const ingrediente = { id: 7, stock: 9.7 };
    em.findOne.mockResolvedValue(pedido);
    em.find.mockResolvedValue([ingrediente]);
    let cola: Promise<unknown> = Promise.resolve();
    em.transactional.mockImplementation((operacion: any) => {
      const resultado = cola.then(() => operacion(em));
      cola = resultado.catch(() => undefined);
      return resultado;
    });
    const repository = new PedidoRepository();
    const resultados = await Promise.allSettled([
      repository.cancelarConReposicion(1),
      repository.confirmarConBloqueo(1)
    ]);
    expect(resultados[0].status).toBe('fulfilled');
    expect(resultados[1].status).toBe('rejected');
    expect(pedido.estado).toBe('Cancelado');
    expect(ingrediente.stock).toBe(10);
  });

  it('DELETE cancela y repone una sola vez, conservando pedido, detalles y envío', async () => {
    const pedido = {
      id: 1,
      estado: 'Pendiente',
      consumoIngredientes: [{ ingredienteId: 7, cantidad: 0.3 }],
      envio: { id: 8 }
    };
    const ingrediente = { id: 7, stock: 9.7 };
    em.findOne.mockResolvedValue(pedido);
    em.find.mockResolvedValue([ingrediente]);
    const repository = new PedidoRepository();
    expect(await repository.delete(1)).toBe(true);
    expect(await repository.delete(1)).toBe(true);
    expect(pedido.estado).toBe('Cancelado');
    expect(ingrediente.stock).toBe(10);
    expect(pedido.envio).toEqual({ id: 8 });
    expect(em.remove).not.toHaveBeenCalled();
  });

  it('dar de baja una pizza conserva la receta y la referencia desde pedidos', async () => {
    const pizza = { id: 1, disponible: true, eliminada: false };
    em.findOne.mockResolvedValue(pizza);
    expect(await new PizzaRepository().delete(1)).toBe(true);
    expect(pizza).toMatchObject({ disponible: false, eliminada: true });
    expect(em.remove).not.toHaveBeenCalled();
    expect(em.find).not.toHaveBeenCalled();
  });

  it('impide borrar un cliente con pedidos', async () => {
    em.findOne.mockResolvedValue({ id: 1 });
    em.count.mockResolvedValue(1);
    await expect(new ClienteRepository().delete(1)).rejects.toMatchObject({ statusCode: 409 });
    expect(em.remove).not.toHaveBeenCalled();
  });

  it('impide borrar un ingrediente de una receta', async () => {
    em.findOne.mockResolvedValue({ id: 7 });
    em.count.mockResolvedValue(1);
    await expect(new IngredienteRepository().delete(7)).rejects.toMatchObject({ statusCode: 409 });
    expect(em.remove).not.toHaveBeenCalled();
  });

  it('protege ingredientes consumidos por pedidos activos aunque cambie la receta', async () => {
    em.findOne.mockResolvedValue({ id: 7 });
    em.count.mockResolvedValue(0);
    em.find.mockResolvedValue([{
      id: 1,
      consumoIngredientes: [{ ingredienteId: 7, cantidad: 0.3 }]
    }]);
    await expect(new IngredienteRepository().delete(7)).rejects.toMatchObject({ statusCode: 409 });
    expect(em.remove).not.toHaveBeenCalled();
  });

  it('no inventa un subtotal para detalles anteriores sin precio histórico', () => {
    const detalle = Object.assign(new DetallePedido(), {
      cantidad: 2,
      pizza: { precio: 500 },
      precio_unitario: null
    });
    expect(detalle.subtotal).toBeNull();
  });
});