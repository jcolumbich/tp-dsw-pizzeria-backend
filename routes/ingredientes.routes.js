const express = require("express");
const router = express.Router();

// Array de ingredientes (por ahora en memoria, después vendrá de la base de datos)
const ingredientes = [
  { id: 1, nombre: "Muzzarella", stock: 50 },
  { id: 2, nombre: "Jamón", stock: 30 },
  { id: 3, nombre: "Morrones", stock: 20 },
];

// GET /ingredientes → devuelve todos
router.get("/", (req, res) => {
  res.json(ingredientes);
});

// GET /ingredientes/:id → devuelve uno solo, buscando por id
router.get("/:id", (req, res) => {
  const id = Number(req.params.id);
  const ingrediente = ingredientes.find((i) => i.id === id);

  if (!ingrediente) {
    return res.status(404).json({ error: "Ingrediente no encontrado" });
  }

  res.json(ingrediente);
});

// POST /ingredientes → crea uno nuevo
router.post("/", (req, res) => {
  const nuevoIngrediente = {
    id: ingredientes.length + 1,
    nombre: req.body.nombre,
    stock: req.body.stock,
  };

  ingredientes.push(nuevoIngrediente);
  res.status(201).json(nuevoIngrediente);
});

// PUT /ingredientes/:id → actualiza uno existente
router.put("/:id", (req, res) => {
  const id = Number(req.params.id);
  const ingrediente = ingredientes.find((i) => i.id === id);

  if (!ingrediente) {
    return res.status(404).json({ error: "Ingrediente no encontrado" });
  }

  ingrediente.nombre = req.body.nombre;
  ingrediente.stock = req.body.stock;
  res.json(ingrediente);
});

// DELETE /ingredientes/:id → elimina uno
router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = ingredientes.findIndex((i) => i.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Ingrediente no encontrado" });
  }

  ingredientes.splice(index, 1);
  res.status(204).send();
});

module.exports = router;