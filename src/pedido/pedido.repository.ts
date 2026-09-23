import { RequiredEntityData, EntityData, LockMode } from '@mikro-orm/core';
import { orm } from '../shared/db/orm.js';
import { Pedido } from './pedido.entity.js';
import { Pizza } from '../pizza/pizza.entity.js';
import { Cliente } from '../cliente/cliente.entity.js';
import { DetallePedido } from '../detalle-pedido/detalle-pedido.entity.js';
import { Ingrediente } from '../ingrediente/ingrediente.entity.js';
import { IngredientePizza } from '../ingrediente-pizza/ingrediente-pizza.entity.js';
import { Repository } from '../shared/repository.js';
import { HttpError } from '../shared/http-error.js';

export interface ItemPedidoInput {
  pizzaId: number;
  cantidad: number;
}

export class PedidoRepository implements Repository<Pedido> {
  async findAll(estado?: string, clienteId?: number): Promise<Pedido[]> {
    const filtro: any = {};

    if (estado) filtro.estado = estado;
    if (clienteId !== undefined) filtro.cliente = clienteId;

    return orm.em.find(Pedido, filtro, {
      populate: ['detalles', 'detalles.pizza', 'cliente', 'repartidor', 'envio'],
      orderBy: { dia: 'DESC' }
    });
  }

  async findOne(id: number): Promise<Pedido | null> {
    return orm.em.findOne(Pedido, { id }, {
      populate: ['detalles', 'detalles.pizza', 'cliente', 'repartidor', 'envio']
    });
  }

  async add(item: Pedido): Promise<Pedido> {
    const pedido = orm.em.create(Pedido, item);
    await orm.em.persistAndFlush(pedido);
    return pedido;
  }

  async addConItems(retiro: boolean, clienteId: number, items: ItemPedidoInput[]): Promise<Pedido> {
    return orm.em.transactional(async (em) => {
      const cliente = await em.findOne(Cliente, { id: clienteId });

      if (!cliente) {
        throw new HttpError(404, `No existe un cliente con id ${clienteId}`);
      }

      if (!cliente.estado) {
        throw new HttpError(400, 'El cliente se encuentra dado de baja');
      }

      const pizzaIds = items.map((item) => item.pizzaId);
      const pizzas = await em.find(Pizza, { id: { $in: pizzaIds } });
      const pizzasPorId = new Map(pizzas.map((pizza) => [pizza.id, pizza]));

      for (const item of items) {
        const pizza = pizzasPorId.get(item.pizzaId);

        if (!pizza) {
          throw new HttpError(404, `No existe una pizza con id ${item.pizzaId}`);
        }

        if (!pizza.disponible) {
          throw new HttpError(400, `La pizza "${pizza.nombre}" no está disponible`);
        }
      }

      const recetas = await em.find(IngredientePizza, { pizza: { $in: pizzaIds } }, {
        populate: ['pizza', 'ingrediente']
      });

      const recetasPorPizza = new Map<number, IngredientePizza[]>();

      for (const receta of recetas) {
        const pizzaId = receta.pizza.id;
        const recetasDePizza = recetasPorPizza.get(pizzaId) ?? [];
        recetasDePizza.push(receta);
        recetasPorPizza.set(pizzaId, recetasDePizza);
      }

      const cantidadesNecesarias = new Map<number, number>();

      for (const item of items) {
        const pizza = pizzasPorId.get(item.pizzaId)!;
        const recetasDePizza = recetasPorPizza.get(item.pizzaId) ?? [];

        if (recetasDePizza.length === 0) {
          throw new HttpError(400, `La pizza "${pizza.nombre}" no tiene ingredientes cargados`);
        }

        for (const receta of recetasDePizza) {
          const ingredienteId = receta.ingrediente.id;
          const cantidadNecesaria = receta.cantidad * item.cantidad;
          const cantidadAcumulada = cantidadesNecesarias.get(ingredienteId) ?? 0;
          cantidadesNecesarias.set(ingredienteId, cantidadAcumulada + cantidadNecesaria);
        }
      }

      const ingredienteIds = [...cantidadesNecesarias.keys()].sort((a, b) => a - b);

      const ingredientes = await em.find(Ingrediente, { id: { $in: ingredienteIds } }, {
        lockMode: LockMode.PESSIMISTIC_WRITE,
        orderBy: { id: 'ASC' }
      });

      const ingredientesPorId = new Map(ingredientes.map((ingrediente) => [ingrediente.id, ingrediente]));

      for (const [ingredienteId, cantidadNecesaria] of cantidadesNecesarias) {
        const ingrediente = ingredientesPorId.get(ingredienteId);

        if (!ingrediente) {
          throw new HttpError(404, `No existe el ingrediente con id ${ingredienteId}`);
        }

        if (ingrediente.stock < cantidadNecesaria) {
          throw new HttpError(409, `Stock insuficiente de "${ingrediente.nombre}". Disponible: ${ingrediente.stock}. Necesario: ${cantidadNecesaria}`);
        }
      }

      for (const [ingredienteId, cantidadNecesaria] of cantidadesNecesarias) {
        const ingrediente = ingredientesPorId.get(ingredienteId)!;
        ingrediente.stock -= cantidadNecesaria;
      }

      const pedido = em.create(Pedido, {
        retiro,
        cliente,
        estado: 'Pendiente',
        dia: new Date(),
        total: 0
      });

      em.persist(pedido);

      let total = 0;

      for (const item of items) {
        const pizza = pizzasPorId.get(item.pizzaId)!;

        const detalleData = {
          pedido,
          pizza,
          cantidad: item.cantidad
        } as Omit<RequiredEntityData<DetallePedido>, 'subtotal'>;

        const detalle = em.create(DetallePedido, detalleData as RequiredEntityData<DetallePedido>);
        em.persist(detalle);
        total += item.cantidad * pizza.precio;
      }

      pedido.total = total;

      await em.flush();

      const pedidoCompleto = await em.findOne(Pedido, { id: pedido.id }, {
        populate: ['detalles', 'detalles.pizza', 'cliente', 'repartidor', 'envio']
      });

      if (!pedidoCompleto) {
        throw new Error('No se pudo recuperar el pedido creado');
      }

      return pedidoCompleto;
    });
  }

  async recalcularTotal(id: number): Promise<Pedido | null> {
    const pedido = await orm.em.findOne(Pedido, { id }, {
      populate: ['detalles', 'detalles.pizza']
    });

    if (!pedido) return null;

    let total = 0;

    for (const detalle of pedido.detalles) {
      total += detalle.cantidad * detalle.pizza.precio;
    }

    pedido.total = total;
    await orm.em.flush();

    return pedido;
  }

  async update(id: number, item: EntityData<Pedido>): Promise<Pedido | null> {
    const pedido = await orm.em.findOne(Pedido, { id }, {
      populate: ['detalles', 'detalles.pizza', 'cliente', 'repartidor', 'envio']
    });

    if (!pedido) return null;

    orm.em.assign(pedido, item);
    await orm.em.flush();

    return pedido;
  }

  async delete(id: number): Promise<boolean> {
    const pedido = await orm.em.findOne(Pedido, { id });

    if (!pedido) return false;

    await orm.em.removeAndFlush(pedido);
    return true;
  }

  async cancelarConReposicion(id: number): Promise<Pedido | null> {
  return orm.em.transactional(async (em) => {
    const pedido = await em.findOne(Pedido, { id }, {
      populate: ['detalles', 'detalles.pizza', 'cliente', 'repartidor', 'envio'],
      lockMode: LockMode.PESSIMISTIC_WRITE
    });

    if (!pedido) {
      return null;
    }

    if (pedido.estado === 'Cancelado') {
      return pedido;
    }

    if (pedido.estado === 'Entregado') {
      throw new HttpError(409, 'No se puede cancelar un pedido que ya fue entregado');
    }

    const pizzaIds = pedido.detalles.getItems().map((detalle) => detalle.pizza.id);

    const recetas = await em.find(IngredientePizza, { pizza: { $in: pizzaIds } }, {
      populate: ['pizza', 'ingrediente']
    });

    const recetasPorPizza = new Map<number, IngredientePizza[]>();

    for (const receta of recetas) {
      const pizzaId = receta.pizza.id;
      const recetasDePizza = recetasPorPizza.get(pizzaId) ?? [];
      recetasDePizza.push(receta);
      recetasPorPizza.set(pizzaId, recetasDePizza);
    }

    const cantidadesAReponer = new Map<number, number>();

    for (const detalle of pedido.detalles) {
      const recetasDePizza = recetasPorPizza.get(detalle.pizza.id) ?? [];

      if (recetasDePizza.length === 0) {
        throw new HttpError(409, `No se puede cancelar el pedido porque la pizza "${detalle.pizza.nombre}" no tiene ingredientes cargados`);
      }

      for (const receta of recetasDePizza) {
        const ingredienteId = receta.ingrediente.id;
        const cantidadAReponer = receta.cantidad * detalle.cantidad;
        const cantidadAcumulada = cantidadesAReponer.get(ingredienteId) ?? 0;
        cantidadesAReponer.set(ingredienteId, cantidadAcumulada + cantidadAReponer);
      }
    }

    const ingredienteIds = [...cantidadesAReponer.keys()].sort((a, b) => a - b);

    const ingredientes = await em.find(Ingrediente, { id: { $in: ingredienteIds } }, {
      lockMode: LockMode.PESSIMISTIC_WRITE,
      orderBy: { id: 'ASC' }
    });

    const ingredientesPorId = new Map(ingredientes.map((ingrediente) => [ingrediente.id, ingrediente]));

    for (const [ingredienteId, cantidadAReponer] of cantidadesAReponer) {
      const ingrediente = ingredientesPorId.get(ingredienteId);

      if (!ingrediente) {
        throw new HttpError(409, `No se puede reponer el ingrediente con id ${ingredienteId}`);
      }

      ingrediente.stock += cantidadAReponer;
    }

    pedido.estado = 'Cancelado';

    await em.flush();

    return pedido;
  });
}
}