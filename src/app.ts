import "reflect-metadata";
import express, { Request, Response } from "express";
import { MikroORM, RequestContext } from "@mikro-orm/core";
import mikroOrmConfig from "./mikro-orm.config";
import ingredientesRoutes from "./routes/ingredientes.routes";
import repartidoresRoutes from "./routes/repartidores.routes";
import pizzasRoutes from "./routes/pizzas.routes";
import clientesRoutes from "./routes/clientes.routes";
import pedidosRoutes from "./routes/pedidos.routes";
import cors from "cors";

const PUERTO = 3000;

async function main() {
  const orm = await MikroORM.init(mikroOrmConfig);

  const app = express();
  app.use(express.json());
  app.use(cors());
  app.use((req, res, next) => {
    RequestContext.create(orm.em, next);
  });

  app.use("/ingredientes", ingredientesRoutes);
  app.use("/repartidores", repartidoresRoutes);
  app.use("/pizzas", pizzasRoutes);
  app.use("/clientes", clientesRoutes);
  app.use("/pedidos", pedidosRoutes);
  
  app.get("/", (req: Request, res: Response) => {
    res.send("¡Bienvenido a la pizzería!");
  });

  app.listen(PUERTO, () => {
    console.log(`Servidor corriendo en http://localhost:${PUERTO}`);
  });
}

main();
