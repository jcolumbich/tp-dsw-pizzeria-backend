const express = require("express");
const ingredientesRoutes = require("./routes/ingredientes.routes");

const app = express();
const PUERTO = 3000;

app.use(express.json()); // permite que Express entienda datos JSON enviados en el body
app.use("/ingredientes", ingredientesRoutes); // conecta todas las rutas de ingredientes

app.get("/", (req, res) => {
  res.send("¡Bienvenido a la pizzería!");
});

app.listen(PUERTO, () => {
  console.log(`Servidor corriendo en http://localhost:${PUERTO}`);
});