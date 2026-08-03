import { MySqlDriver } from "@mikro-orm/mysql";
import { Ingrediente } from "./entities/ingrediente.entity";
import { Repartidor } from "./entities/repartidor.entity";

export default {
  entities: [Ingrediente, Repartidor],
  dbName: process.env.DB_NAME || "pizzeria",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "pizzeria123",
  driver: MySqlDriver,
};
