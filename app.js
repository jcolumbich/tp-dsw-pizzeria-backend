const express = require("express");

const app = express();
const PUERTO = 3000;

// Array de objetos: simula por ahora lo que después vendrá de la base de datos
const ingredientes = [
  { id: 1, nombre: "Muzzarella", stock: 50 },
  { id: 2, nombre: "Jamón", stock: 30 },
  { id: 3, nombre: "Morrones", stock: 20 },
];

app.get("/", (req, res) => {
  res.send("¡Bienvenido a la pizzería!");
});

app.get("/ingredientes", (req, res) => {
  res.json(ingredientes);
});

app.listen(PUERTO, () => {
  console.log(`Servidor corriendo en http://localhost:${PUERTO}`);
});