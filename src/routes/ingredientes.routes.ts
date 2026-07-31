import express, { Request, Response, Router } from "express";
import { RequestContext } from "@mikro-orm/core";
import { Ingrediente } from "../entities/ingrediente.entity";

const router: Router = express.Router();

// GET /ingredientes → todos
router.get("/", async (req: Request, res: Response) => {
  const em = RequestContext.getEntityManager()!;
  const ingredientes = await em.find(Ingrediente, {});
  res.json(ingredientes);
});

// GET /ingredientes/:id → uno solo
router.get("/:id", async (req: Request, res: Response) => {
  const em = RequestContext.getEntityManager()!;
  const id = Number(req.params.id);
  const ingrediente = await em.findOne(Ingrediente, { id });

  if (!ingrediente) {
    return res.status(404).json({ error: "Ingrediente no encontrado" });
  }

  res.json(ingrediente);
});

// POST /ingredientes → crear
router.post("/", async (req: Request, res: Response) => {
  const em = RequestContext.getEntityManager()!;

  const nuevoIngrediente = em.create(Ingrediente, {
    nombre: req.body.nombre,
    stock: req.body.stock,
  });

  await em.persistAndFlush(nuevoIngrediente);
  res.status(201).json(nuevoIngrediente);
});

// PUT /ingredientes/:id → actualizar
router.put("/:id", async (req: Request, res: Response) => {
  const em = RequestContext.getEntityManager()!;
  const id = Number(req.params.id);
  const ingrediente = await em.findOne(Ingrediente, { id });

  if (!ingrediente) {
    return res.status(404).json({ error: "Ingrediente no encontrado" });
  }

  ingrediente.nombre = req.body.nombre;
  ingrediente.stock = req.body.stock;
  await em.flush();

  res.json(ingrediente);
});

// DELETE /ingredientes/:id → eliminar
router.delete("/:id", async (req: Request, res: Response) => {
  const em = RequestContext.getEntityManager()!;
  const id = Number(req.params.id);
  const ingrediente = await em.findOne(Ingrediente, { id });

  if (!ingrediente) {
    return res.status(404).json({ error: "Ingrediente no encontrado" });
  }

  await em.removeAndFlush(ingrediente);
  res.status(204).send();
});

export default router;