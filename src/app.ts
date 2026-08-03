import "reflect-metadata";
import express, { Request, Response } from "express";
import { MikroORM, RequestContext } from "@mikro-orm/core";
import mikroOrmConfig from "./mikro-orm.config";
import ingredientesRoutes from "./routes/ingredientes.routes";
import repartidoresRoutes from "./routes/repartidores.routes";
import pizzasRoutes from "./routes/pizzas.routes";



const PUERTO = 3000;

async function main() {
  const orm = await MikroORM.init(mikroOrmConfig);

  const app = express();
  app.use(express.json());

  app.use((req, res, next) => {
    RequestContext.create(orm.em, next);
  });

  app.use("/ingredientes", ingredientesRoutes);
  app.use("/repartidores", repartidoresRoutes);
  app.use("/pizzas", pizzasRoutes);
  
  app.get("/", (req: Request, res: Response) => {
    res.send("¡Bienvenido a la pizzería!");
  });

  app.listen(PUERTO, () => {
    console.log(`Servidor corriendo en http://localhost:${PUERTO}`);
  });
}

main();
