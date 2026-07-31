import express, { Request, Response } from "express";
import ingredientesRoutes from "./routes/ingredientes.routes";

const app = express();
const PUERTO = 3000;

app.use(express.json());
app.use("/ingredientes", ingredientesRoutes);

app.get("/", (req: Request, res: Response) => {
  res.send("¡Bienvenido a la pizzería!");
});

app.listen(PUERTO, () => {
  console.log(`Servidor corriendo en http://localhost:${PUERTO}`);
});