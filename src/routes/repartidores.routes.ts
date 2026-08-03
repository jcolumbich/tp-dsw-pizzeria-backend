import express, { Request, Response, Router } from "express";
import { RequestContext } from "@mikro-orm/core";
import { Repartidor } from "../entities/repartidor.entity";

const router: Router = express.Router();

router.get("/", async (req: Request, res: Response) => {
  const em = RequestContext.getEntityManager()!;
  const repartidores = await em.find(Repartidor, {});
  res.json(repartidores);
});

router.get("/:id", async (req: Request, res: Response) => {
  const em = RequestContext.getEntityManager()!;
  const id = Number(req.params.id);
  const repartidor = await em.findOne(Repartidor, { id });

  if (!repartidor) {
    return res.status(404).json({ error: "Repartidor no encontrado" });
  }

  res.json(repartidor);
});

router.post("/", async (req: Request, res: Response) => {
  const em = RequestContext.getEntityManager()!;

  const nuevoRepartidor = em.create(Repartidor, {
    nombre: req.body.nombre,
    telefono: req.body.telefono,
  });

  await em.persistAndFlush(nuevoRepartidor);
  res.status(201).json(nuevoRepartidor);
});

router.put("/:id", async (req: Request, res: Response) => {
  const em = RequestContext.getEntityManager()!;
  const id = Number(req.params.id);
  const repartidor = await em.findOne(Repartidor, { id });

  if (!repartidor) {
    return res.status(404).json({ error: "Repartidor no encontrado" });
  }

  repartidor.nombre = req.body.nombre;
  repartidor.telefono = req.body.telefono;
  await em.flush();

  res.json(repartidor);
});

router.delete("/:id", async (req: Request, res: Response) => {
  const em = RequestContext.getEntityManager()!;
  const id = Number(req.params.id);
  const repartidor = await em.findOne(Repartidor, { id });

  if (!repartidor) {
    return res.status(404).json({ error: "Repartidor no encontrado" });
  }

  await em.removeAndFlush(repartidor);
  res.status(204).send();
});

export default router;

