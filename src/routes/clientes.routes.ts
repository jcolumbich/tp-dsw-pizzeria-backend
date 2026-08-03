import express, { Request, Response, Router } from "express";
import { RequestContext } from "@mikro-orm/core";
import { Cliente } from "../entities/cliente.entity";

const router: Router = express.Router();

router.get("/", async (req: Request, res: Response) => {
  const em = RequestContext.getEntityManager()!;
  const clientes = await em.find(Cliente, {});
  res.json(clientes);
});

router.get("/:id", async (req: Request, res: Response) => {
  const em = RequestContext.getEntityManager()!;
  const id = Number(req.params.id);
  const cliente = await em.findOne(Cliente, { id });

  if (!cliente) {
    return res.status(404).json({ error: "Cliente no encontrado" });
  }

  res.json(cliente);
});

router.post("/", async (req: Request, res: Response) => {
  const em = RequestContext.getEntityManager()!;

  const nuevoCliente = em.create(Cliente, {
    nombre: req.body.nombre,
    telefono: req.body.telefono,
    direccion: req.body.direccion,
  });

  await em.persistAndFlush(nuevoCliente);
  res.status(201).json(nuevoCliente);
});

router.put("/:id", async (req: Request, res: Response) => {
  const em = RequestContext.getEntityManager()!;
  const id = Number(req.params.id);
  const cliente = await em.findOne(Cliente, { id });

  if (!cliente) {
    return res.status(404).json({ error: "Cliente no encontrado" });
  }

  cliente.nombre = req.body.nombre;
  cliente.telefono = req.body.telefono;
  cliente.direccion = req.body.direccion;
  await em.flush();

  res.json(cliente);
});

router.delete("/:id", async (req: Request, res: Response) => {
  const em = RequestContext.getEntityManager()!;
  const id = Number(req.params.id);
  const cliente = await em.findOne(Cliente, { id });

  if (!cliente) {
    return res.status(404).json({ error: "Cliente no encontrado" });
  }

  await em.removeAndFlush(cliente);
  res.status(204).send();
});

export default router;