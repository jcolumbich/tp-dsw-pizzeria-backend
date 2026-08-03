import express, { Request, Response, Router } from "express";
import { RequestContext } from "@mikro-orm/core";
import { Pedido } from "../entities/pedido.entity";
import { Cliente } from "../entities/cliente.entity";
import { Pizza } from "../entities/pizza.entity";
import { ItemPedido } from "../entities/item-pedido.entity";

const router: Router = express.Router();

// GET /pedidos → todos, o filtrados por ?estado=Pendiente
router.get("/", async (req: Request, res: Response) => {
  const em = RequestContext.getEntityManager()!;
  const filtro: any = {};

  if (req.query.estado) {
    filtro.estado = req.query.estado;
  }

  const pedidos = await em.find(Pedido, filtro, {
    populate: ["cliente", "items", "items.pizza"],
  });
  res.json(pedidos);
});

// GET /pedidos/:id → detalle completo
router.get("/:id", async (req: Request, res: Response) => {
  const em = RequestContext.getEntityManager()!;
  const id = Number(req.params.id);
  const pedido = await em.findOne(
    Pedido,
    { id },
    { populate: ["cliente", "items", "items.pizza"] }
  );

  if (!pedido) {
    return res.status(404).json({ error: "Pedido no encontrado" });
  }

  res.json(pedido);
});

// POST /pedidos → el CUU: registrar pedido calculando el total automáticamente
router.post("/", async (req: Request, res: Response) => {
  const em = RequestContext.getEntityManager()!;

  const cliente = await em.findOne(Cliente, { id: req.body.clienteId });
  if (!cliente) {
    return res.status(404).json({ error: "Cliente no encontrado" });
  }

 const pedido = em.create(Pedido, {
  cliente,
  fecha: new Date(),
  estado: "Pendiente",
  total: 0,
  items: [],
});

  let total = 0;

  for (const itemBody of req.body.items) {
    const pizza = await em.findOne(Pizza, { id: itemBody.pizzaId });
    if (!pizza) continue;

    const item = em.create(ItemPedido, {
      pedido,
      pizza,
      cantidad: itemBody.cantidad,
      precioUnitario: pizza.precio,
    });

    pedido.items.add(item);
    total += pizza.precio * itemBody.cantidad;
  }

  pedido.total = total;

  await em.persistAndFlush(pedido);
  res.status(201).json(pedido);
});

export default router;

