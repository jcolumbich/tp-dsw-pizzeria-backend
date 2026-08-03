import { MySqlDriver } from "@mikro-orm/mysql";
import { Ingrediente } from "./entities/ingrediente.entity";
import { Repartidor } from "./entities/repartidor.entity";
import { Pizza } from "./entities/pizza.entity";
import { Cliente } from "./entities/cliente.entity";
import { Pedido } from "./entities/pedido.entity";
import { ItemPedido } from "./entities/item-pedido.entity";


export default {
  entities: [Ingrediente, Repartidor, Pizza, Cliente, Pedido, ItemPedido],
  dbName: process.env.DB_NAME || "pizzeria",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "pizzeria123",
  driver: MySqlDriver,
};
