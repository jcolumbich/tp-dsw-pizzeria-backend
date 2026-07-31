import "reflect-metadata";
import express, { Request, Response } from "express";
import { MikroORM } from "@mikro-orm/core";
import { RequestContext } from "@mikro-orm/core";
import mikroOrmConfig from "./mikro-orm.config";
import ingredientesRoutes from "./routes/ingredientes.routes";

const PUERTO = 3000;

async function main() {
  const orm = await MikroORM.init(mikroOrmConfig);

  const app = express();
  app.use(express.json());

  // Este middleware crea un "contexto" de base de datos limpio para cada petición
  app.use((req, res, next) => {
    RequestContext.create(orm.em, next);
  });

  app.use("/ingredientes", ingredientesRoutes);

  app.get("/", (req: Request, res: Response) => {
    res.send("¡Bienvenido a la pizzería!");
  });

  app.listen(PUERTO, () => {
    console.log(`Servidor corriendo en http://localhost:${PUERTO}`);
  });
}

main();
