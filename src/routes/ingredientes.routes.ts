import express, { Request, Response, Router } from "express";

const router: Router = express.Router();

const ingredientes = [
  { id: 1, nombre: "Muzzarella", stock: 50 },
  { id: 2, nombre: "Jamón", stock: 30 },
  { id: 3, nombre: "Morrones", stock: 20 },
];

router.get("/", (req: Request, res: Response) => {
  res.json(ingredientes);
});

router.get("/:id", (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const ingrediente = ingredientes.find((i) => i.id === id);

  if (!ingrediente) {
    return res.status(404).json({ error: "Ingrediente no encontrado" });
  }

  res.json(ingrediente);
});

router.post("/", (req: Request, res: Response) => {
  const nuevoIngrediente = {
    id: ingredientes.length + 1,
    nombre: req.body.nombre,
    stock: req.body.stock,
  };

  ingredientes.push(nuevoIngrediente);
  res.status(201).json(nuevoIngrediente);
});

router.put("/:id", (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const ingrediente = ingredientes.find((i) => i.id === id);

  if (!ingrediente) {
    return res.status(404).json({ error: "Ingrediente no encontrado" });
  }

  ingrediente.nombre = req.body.nombre;
  ingrediente.stock = req.body.stock;
  res.json(ingrediente);
});

router.delete("/:id", (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const index = ingredientes.findIndex((i) => i.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Ingrediente no encontrado" });
  }

  ingredientes.splice(index, 1);
  res.status(204).send();
});

export default router;