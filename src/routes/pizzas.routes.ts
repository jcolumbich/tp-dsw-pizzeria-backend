import express, { Request, Response, Router } from "express";
import { RequestContext } from "@mikro-orm/core";
import { Pizza } from "../entities/pizza.entity";
import { Ingrediente } from "../entities/ingrediente.entity";

const router: Router = express.Router();

// GET /pizzas → todas, con sus ingredientes incluidos
router.get("/", async (req: Request, res: Response) => {
  const em = RequestContext.getEntityManager()!;
  const pizzas = await em.find(Pizza, {}, { populate: ["ingredientes"] });
  res.json(pizzas);
});

// GET /pizzas/:id → una sola, con detalle de ingredientes
router.get("/:id", async (req: Request, res: Response) => {
  const em = RequestContext.getEntityManager()!;
  const id = Number(req.params.id);
  const pizza = await em.findOne(Pizza, { id }, { populate: ["ingredientes"] });

  if (!pizza) {
    return res.status(404).json({ error: "Pizza no encontrada" });
  }

  res.json(pizza);
});

// POST /pizzas → crear, recibiendo un array de ids de ingredientes
router.post("/", async (req: Request, res: Response) => {
  const em = RequestContext.getEntityManager()!;

  const nuevaPizza = em.create(Pizza, {
    nombre: req.body.nombre,
    precio: req.body.precio,
    ingredientes: [],
  });

  if (req.body.ingredientesIds) {
    for (const ingredienteId of req.body.ingredientesIds) {
      const ingrediente = await em.findOne(Ingrediente, { id: ingredienteId });
      if (ingrediente) {
        nuevaPizza.ingredientes.add(ingrediente);
      }
    }
  }

  await em.persistAndFlush(nuevaPizza);
  res.status(201).json(nuevaPizza);
});

export default router;