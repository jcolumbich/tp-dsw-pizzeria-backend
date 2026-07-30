const express = require("express");

const app = express();
const PUERTO = 3000;

app.get("/", (req, res) => {
  res.send("¡Bienvenido a la pizzería!");
});

app.listen(PUERTO, () => {
  console.log(`Servidor corriendo en http://localhost:${PUERTO}`);
});