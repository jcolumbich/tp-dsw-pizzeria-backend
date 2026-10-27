import type { FilterQuery } from '@mikro-orm/core';
import type { FiltroPedido } from './pedido.schema.js';
import { respuestaPagina } from '../shared/listado.js';
import { RequiredEntityData, EntityData, LockMode, EntityManager, wrap } from '@mikro-orm/core';
import { Pago } from '../pago/pago.entity.js';
import { estadoPago, centavos } from '../pago/pago.logic.js';
import { tarifaEnvio } from './pedido.checkout.js';
import { orm } from '../shared/db/orm.js';
import { Pedido } from './pedido.entity.js';
import { Pizza } from '../pizza/pizza.entity.js';
import { Cliente } from '../cliente/cliente.entity.js';
import { Envio } from '../envio/envio.entity.js';
import { Repartidor } from '../repartidor/repartidor.entity.js';
import { DetallePedido } from '../detalle-pedido/detalle-pedido.entity.js';
import { Ingrediente } from '../ingrediente/ingrediente.entity.js';
import { IngredientePizza } from '../ingrediente-pizza/ingrediente-pizza.entity.js';
import { Repository } from '../shared/repository.js';
import { HttpError } from '../shared/http-error.js';
import { calcularTotalPedido, validarPizzaDisponible } from './pedido.logic.js';
import { redondearStock } from '../shared/numero.schema.js';

export interface ItemPedidoInput {
  pizzaId: number;
  cantidad: number;
}

export class PedidoRepository implements Repository<Pedido> {
  serializar(pedido: Pedido) { return wrap(pedido).toObject(); }

  private async validarPago(em: EntityManager, pedido: Pedido): Promise<void> {
    const pago = await em.findOne(Pago, { pedido: pedido.id }, { refresh: true });
    if ((pedido.medio_pago === 'mercadopago' || pago) && estadoPago(pago?.movimientos) !== 'aprobado') {
      throw new HttpError(409, 'El pago debe estar aprobado antes de preparar o entregar el pedido');
    }
  }

  async findPagina(filtros: FiltroPedido, clienteId?: number) {
    const where: FilterQuery<Pedido> = {};
    if (filtros.estado !== undefined) where.estado = filtros.estado;
    if (filtros.activos !== undefined) {
      where.estado = filtros.activos ? { $ne: 'Cancelado' } : 'Cancelado';
    }
    if (filtros.repartidorId !== undefined) where.repartidor = filtros.repartidorId;
    // Se aplica SIEMPRE el alcance del usuario, independientemente de los filtros.
    if (clienteId !== undefined) where.cliente = clienteId;
    const [data, total] = await orm.em.findAndCount(Pedido, where, {
      populate: ['detalles', 'detalles.pizza', 'cliente', 'repartidor', 'envio'],
      orderBy: { dia: 'DESC', id: 'DESC' },
      limit: filtros.limite,
      offset: (filtros.pagina - 1) * filtros.limite,
    });
    return respuestaPagina(data, total, filtros.pagina, filtros.limite);
  }

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

  async addConItems(retiro: boolean, clienteId: number, items: ItemPedidoInput[], montoPropina: number = 0, medioPago: 'efectivo' | 'mercadopago' = 'efectivo', checkoutId?: string, costoEsperado?: number): Promise<Pedido> {
    return orm.em.transactional(async (em) => {
      const cliente = await em.findOne(Cliente, { id: clienteId }, {
        lockMode: LockMode.PESSIMISTIC_WRITE,
        refresh: true
      });
      if (!cliente) throw new HttpError(404, `No existe un cliente con id ${clienteId}`);
      if (!cliente.estado) throw new HttpError(400, 'El cliente se encuentra dado de baja');

      // El bloqueo del cliente serializa reintentos de la misma compra.
      if (checkoutId) {
        const anterior = await em.findOne(Pedido, { checkout_id: checkoutId }, {
          populate: ['detalles', 'detalles.pizza', 'cliente', 'repartidor', 'envio'], refresh: true
        });
        if (anterior) {
          if (anterior.cliente?.id !== clienteId) throw new HttpError(409, 'La compra ya existe');
          return anterior;
        }
      }
      const costoEnvio = retiro ? 0 : tarifaEnvio();
      if (costoEsperado !== undefined && centavos(costoEsperado) !== centavos(costoEnvio)) {
        throw new HttpError(409, 'La tarifa de envío cambió. Recargá la página antes de confirmar');
      }
      const pizzaIds = items.map((item) => item.pizzaId);
      const pizzas = await em.find(Pizza, { id: { $in: pizzaIds }, eliminada: false });
      const pizzasPorId = new Map(pizzas.map((pizza) => [pizza.id, pizza]));
      for (const item of items) {
        const pizza = pizzasPorId.get(item.pizzaId);
        if (!pizza) throw new HttpError(404, `No existe una pizza con id ${item.pizzaId}`);
        validarPizzaDisponible(pizza);
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
          const cantidadNecesaria = redondearStock(receta.cantidad * item.cantidad);
          const cantidadAcumulada = cantidadesNecesarias.get(ingredienteId) ?? 0;
          cantidadesNecesarias.set(ingredienteId, redondearStock(cantidadAcumulada + cantidadNecesaria));
        }
      }

      const ingredienteIds = [...cantidadesNecesarias.keys()].sort((a, b) => a - b);
      const ingredientes = await em.find(Ingrediente, { id: { $in: ingredienteIds } }, {
        lockMode: LockMode.PESSIMISTIC_WRITE,
        orderBy: { id: 'ASC' },
        refresh: true
      });
      const ingredientesPorId = new Map(ingredientes.map((ingrediente) => [ingrediente.id, ingrediente]));
      for (const [ingredienteId, cantidadNecesaria] of cantidadesNecesarias) {
        const ingrediente = ingredientesPorId.get(ingredienteId);
        if (!ingrediente) throw new HttpError(404, `No existe el ingrediente con id ${ingredienteId}`);
        if (ingrediente.stock < cantidadNecesaria) {
          throw new HttpError(409, `Stock insuficiente de "${ingrediente.nombre}". Disponible: ${ingrediente.stock}. Necesario: ${cantidadNecesaria}`);
        }
      }
      for (const [ingredienteId, cantidadNecesaria] of cantidadesNecesarias) {
        const ingrediente = ingredientesPorId.get(ingredienteId)!;
        ingrediente.stock = redondearStock(ingrediente.stock - cantidadNecesaria);
      }

      const pedido = em.create(Pedido, {
        retiro,
        cliente,
        estado: medioPago === 'mercadopago' ? 'Esperando pago' : 'Pendiente',
        medio_pago: medioPago,
        costo_envio: costoEnvio,
        checkout_id: checkoutId,
        vence_pago: medioPago === 'mercadopago' ? new Date(Date.now() + 30 * 60_000) : undefined,
        dia: new Date(),
        total: 0,
        monto_propina: montoPropina,
        consumoIngredientes: [...cantidadesNecesarias.entries()].map(([ingredienteId, cantidad]) => ({
          ingredienteId,
          cantidad
        }))
      });
      em.persist(pedido);
      const detallesCreados: { pizza: Pizza; cantidad: number }[] = [];
      for (const item of items) {
        const pizza = pizzasPorId.get(item.pizzaId)!;
        const detalleData = {
          pedido,
          pizza,
          cantidad: item.cantidad,
          precio_unitario: pizza.precio
        } as Omit<RequiredEntityData<DetallePedido>, 'subtotal'>;
        const detalle = em.create(DetallePedido, detalleData as RequiredEntityData<DetallePedido>);
        em.persist(detalle);
        detallesCreados.push({ pizza, cantidad: item.cantidad });
      }
      pedido.total = calcularTotalPedido(
        detallesCreados.map(({ pizza, cantidad }) => ({ cantidad, precioUnitario: pizza.precio }))
      );
      await em.flush();
      const pedidoCompleto = await em.findOne(Pedido, { id: pedido.id }, {
        populate: ['detalles', 'detalles.pizza', 'cliente', 'repartidor', 'envio']
      });
      if (!pedidoCompleto) throw new Error('No se pudo recuperar el pedido creado');
      return pedidoCompleto;
    });
  }

  async recalcularTotal(id: number): Promise<Pedido | null> {
    const pedido = await orm.em.findOne(Pedido, { id }, {
      populate: ['detalles', 'detalles.pizza']
    });
    if (!pedido) return null;
    const items = pedido.detalles.getItems().map((detalle) => {
      if (detalle.precio_unitario == null) {
        throw new HttpError(409, 'Este pedido anterior no tiene el precio histórico registrado. No se puede recalcular automáticamente.');
      }
      return { cantidad: detalle.cantidad, precioUnitario: detalle.precio_unitario };
    });
    pedido.total = calcularTotalPedido(items);
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

  async asignarEnvioConRepartidor(pedidoId: number, repartidorId: number, costo: number, montoPropina?: number): Promise<Pedido> {
    return orm.em.transactional(async (em) => {
      const pedido = await em.findOne(Pedido, { id: pedidoId }, {
        lockMode: LockMode.PESSIMISTIC_WRITE,
        refresh: true
      });
      if (!pedido) throw new HttpError(404, 'Pedido no encontrado');
      await this.validarPago(em, pedido);
      if (pedido.costo_envio != null && centavos(costo) !== centavos(pedido.costo_envio)) {
        throw new HttpError(409, 'El costo del envío ya quedó fijado al comprar');
      }
      if (pedido.medio_pago && montoPropina !== undefined && centavos(montoPropina) !== centavos(pedido.monto_propina)) {
        throw new HttpError(409, 'La propina ya quedó fijada al comprar');
      }
      if (pedido.retiro) {
        throw new HttpError(400, 'No se puede asignar un envío a un pedido con retiro en el local');
      }
      const envioExistente = await em.findOne(Envio, { pedido: pedidoId }, { refresh: true });
      if (envioExistente) throw new HttpError(409, 'El pedido ya tiene un envío asignado');
      if (pedido.estado !== 'En preparación') {
        throw new HttpError(409, 'Confirmá el pedido antes de asignar el envío');
      }
      const repartidor = await em.findOne(Repartidor, { id: repartidorId }, {
        lockMode: LockMode.PESSIMISTIC_WRITE,
        refresh: true
      });
      if (!repartidor) throw new HttpError(404, 'Repartidor no encontrado');
      if (!repartidor.estado) throw new HttpError(400, 'El repartidor seleccionado no está activo');
      const envio = em.create(Envio, {
        costo,
        monto_propina: montoPropina ?? pedido.monto_propina ?? 0,
        pedido
      });
      pedido.envio = envio;
      pedido.monto_propina = envio.monto_propina ?? 0;
      pedido.repartidor = repartidor;
      pedido.estado = 'En camino';
      em.persist(envio);
      await em.flush();
      await em.populate(pedido, ['detalles', 'detalles.pizza', 'cliente', 'repartidor', 'envio']);
      return pedido;
    });
  }

  async marcarEntregado(id: number): Promise<Pedido | null> {
    return orm.em.transactional(async (em) => {
      const pedido = await em.findOne(Pedido, { id }, {
        lockMode: LockMode.PESSIMISTIC_WRITE,
        refresh: true
      });
      if (!pedido) return null;
      await em.populate(pedido, ['detalles', 'detalles.pizza', 'cliente', 'repartidor', 'envio']);
      await this.validarPago(em, pedido);
      if (pedido.estado === 'Entregado') return pedido;
      if (pedido.estado === 'Cancelado') throw new HttpError(409, 'No se puede entregar un pedido cancelado');
      const estadoEsperado = pedido.retiro ? 'En preparación' : 'En camino';
      if (pedido.estado !== estadoEsperado) {
        throw new HttpError(409, pedido.retiro
          ? 'El pedido debe estar en preparación antes de confirmar el retiro'
          : 'El pedido debe estar en camino antes de confirmar la entrega');
      }
      if (!pedido.retiro && (!pedido.envio || !pedido.repartidor)) {
        throw new HttpError(409, 'El pedido debe tener un envío y un repartidor asignados');
      }
      pedido.estado = 'Entregado';
      await em.flush();
      return pedido;
    });
  }

  async confirmarConBloqueo(id: number): Promise<Pedido | null> {
    return orm.em.transactional(async (em) => {
      const pedido = await em.findOne(Pedido, { id }, {
        lockMode: LockMode.PESSIMISTIC_WRITE,
        refresh: true
      });
      if (!pedido) return null;
      await this.validarPago(em, pedido);
      if (pedido.estado !== 'Pendiente' && pedido.estado !== 'En preparación') {
        throw new HttpError(409, 'Solo se puede confirmar un pedido pendiente');
      }
      pedido.estado = 'En preparación';
      await em.flush();
      await em.populate(pedido, ['detalles', 'detalles.pizza', 'cliente', 'repartidor', 'envio']);
      return pedido;
    });
  }

  async delete(id: number): Promise<boolean> {
    return (await this.cancelarConReposicion(id)) !== null;
  }

  async cancelarConReposicion(id: number, soloVencido = false): Promise<Pedido | null> {
    return orm.em.transactional(async (em) => {
      const pedido = await em.findOne(Pedido, { id }, {
        populate: ['detalles', 'detalles.pizza', 'cliente', 'repartidor', 'envio'],
        lockMode: LockMode.PESSIMISTIC_WRITE,
        refresh: true
      });
      if (!pedido) return null;
      if (soloVencido) {
        if (pedido.estado !== 'Esperando pago' || !pedido.vence_pago || pedido.vence_pago.getTime() + 120_000 > Date.now()) return pedido;
        const pago = await em.findOne(Pago, { pedido: id }, { refresh: true });
        if (!['sin_pagar', 'rechazado'].includes(estadoPago(pago?.movimientos))) return pedido;
      }
      if (pedido.estado === 'Cancelado') return pedido;
      if (pedido.estado === 'Entregado') {
        throw new HttpError(409, 'No se puede cancelar un pedido que ya fue entregado');
      }
      const consumos = pedido.consumoIngredientes;
      if (!Array.isArray(consumos) || consumos.length === 0) {
        throw new HttpError(409, 'Este pedido anterior no tiene el consumo de ingredientes registrado. No se puede reponer su stock automáticamente: requiere una revisión manual.');
      }
      const cantidadesAReponer = new Map<number, number>();
      for (const consumo of consumos) {
        if (!consumo || !Number.isSafeInteger(consumo.ingredienteId) || consumo.ingredienteId <= 0 ||
          !Number.isFinite(consumo.cantidad) || consumo.cantidad <= 0 || cantidadesAReponer.has(consumo.ingredienteId)) {
          throw new HttpError(409, 'El consumo de ingredientes registrado no es válido. Revisá el pedido antes de cancelarlo.');
        }
        cantidadesAReponer.set(consumo.ingredienteId, consumo.cantidad);
      }
      const ingredienteIds = [...cantidadesAReponer.keys()].sort((a, b) => a - b);
      const ingredientes = await em.find(Ingrediente, { id: { $in: ingredienteIds } }, {
        lockMode: LockMode.PESSIMISTIC_WRITE,
        orderBy: { id: 'ASC' },
        refresh: true
      });
      const ingredientesPorId = new Map(ingredientes.map((ingrediente) => [ingrediente.id, ingrediente]));
      for (const ingredienteId of cantidadesAReponer.keys()) {
        if (!ingredientesPorId.has(ingredienteId)) {
          throw new HttpError(409, `No se puede reponer el ingrediente con id ${ingredienteId} porque ya no existe`);
        }
      }
      for (const [ingredienteId, cantidadAReponer] of cantidadesAReponer) {
        const ingrediente = ingredientesPorId.get(ingredienteId)!;
        ingrediente.stock = redondearStock(ingrediente.stock + cantidadAReponer);
      }
      pedido.estado = 'Cancelado';
      pedido.repartidor = undefined;
      await em.flush();
      return pedido;
    });
  }
}