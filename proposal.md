
# Propuesta TP DSW

## Grupo

### Integrantes
* 53723 - Columbich, Julian
* 55158 - Setti, Francisco

## Repositorios
* [Backend](https://github.com/jcolumbich/tp-dsw-pizzeria-backend)
* [Frontend](https://github.com/jcolumbich/tp-dsw-pizzeria-frontend)

## Tema
### Pizzeria

### Descripcion
Sistema de gestión para pizzerías que integra pedidos y envíos a domicilio. Controla el stock de ingredientes y la disponibilidad de productos para optimizar la operativa del negocio.

### Modelo

https://drive.google.com/file/d/1xWHBcCBiaYEYtk39Oxa8nYyFgnX6Xuhz/view?usp=sharing

> **TODO:** verificar que el diagrama del link de arriba siga reflejando el modelo real implementado.
> Entidades actuales (`src/*/*.entity.ts`): `Persona` (abstracta) de la que heredan `Cliente` y
> `Repartidor`; `Pizza`; `Ingrediente`; `IngredientePizza` (relación N a N Pizza-Ingrediente, con
> atributo `cantidad`); `Pedido`; `DetallePedido` (relación N a N Pedido-Pizza, con atributo
> `cantidad` y un `subtotal` derivado, no persistido); `Envio` (relación 1 a 1 con `Pedido`).

## Alcance Funcional

### Alcance Mínimo

| Req | Detalle |
| :--- | :--- |
| CRUD simple | 1. CRUD Ingrediente<br>2. CRUD Repartidor |
| CRUD dependiente | 1. CRUD Pizza {depende de} CRUD Ingrediente |
| Listado<br>+<br>detalle | 1. Listado de pedidos filtrado por estado (ej. "Pendiente"), muestra nro de pedido, fecha y total => detalle muestra los ítems (pizzas, cantidades, precio total ítems) y datos del cliente. |
| CUU/Epic | 1. Registrar un nuevo pedido para un cliente con sus respectivos ítems. |

> **TODO:** la relación Pizza-Ingrediente no quedó implementada como una dependencia directa,
> sino a través de una entidad intermedia propia, `IngredientePizza` (N a N, con `cantidad`),
> que tiene su propio CRUD completo (`src/ingrediente-pizza/`, rutas bajo `/api/ingrediente-pizza`).
> Conviene aclarar esto en la fila de "CRUD dependiente".

---

### Adicionales para Aprobación
*Nota: Estos requerimientos se suman a los del alcance mínimo para alcanzar el nivel necesario para la aprobación directa.*

| Req | Detalle |
| :--- | :--- |
| CRUD | 1. CRUD Ingrediente<br>2. CRUD Repartidor<br>3. CRUD Cliente<br>4. CRUD Pizza<br>5. CRUD Pedido (incluye Detalle/ItemPedido) |
| CUU/Epic | 1. Registrar un nuevo pedido para un cliente calculando el total automáticamente.<br>2. Asignar un envío a un Repartidor registrando el costo y actualizando el estado del pedido. |

> **TODO:** "CRUD Pedido (incluye Detalle/ItemPedido)" no es un CRUD completo tal como quedó
> implementado:
> - `Pedido` no tiene endpoint de baja (`src/pedido/pedido.routes.ts` no define ninguna ruta
>   `DELETE`). La única forma de "darlo de baja" es `PUT /api/pedidos/:id` con
>   `estado: "Cancelado"`, que repone el stock de ingredientes pero deja la fila en la base para
>   siempre.
> - `DetallePedido` es de solo lectura (`src/detalle-pedido/detalle-pedido.routes.ts` solo expone
>   3 `GET`, sin `POST`/`PUT`/`DELETE`). Los ítems de un pedido se crean automáticamente al crear
>   el pedido (`POST /api/pedidos`) y nunca se modifican por separado.
> - Ingrediente, Repartidor, Cliente y Pizza sí tienen CRUD completo (GET/POST/PUT/DELETE).
> - Además, el código tiene un CRUD completo de `Envio` (`src/envio/`, `/api/envios`) que no
>   figura en esta tabla; hoy coexiste con el CUU de "asignar envío" de abajo, que es el flujo
>   real que valida reglas de negocio (estado del pedido, repartidor activo, etc.) — `/api/envios`
>   es un CRUD genérico de más bajo nivel, sin esas validaciones.

---

### Alcance Adicional Voluntario
*Nota: Funcionalidades extra que completan el sistema de la pizzería y añaden valor al flujo de negocio.*

| Req | Detalle |
| :--- | :--- |
| Listados | 1. Listado de pizzas filtrado por categoría (ej. "Vegetariana"), muestra nombre y precio => detalle muestra listado de ingredientes y stock.<br>2. Historial de pedidos filtrado por repartidor, muestra fecha, estado y cliente. |
| CUU/Epic | 1. Actualizar el estado de un pedido (Ej: En preparación -> En viaje -> Entregado).<br>2. Cancelación de un pedido. |
| Otros | 1. Envío de confirmación de pedido por email al cliente. |

> **TODO:** revisar esta sección completa contra el código:
> - **Listado de pizzas por categoría:** no implementado. `GET /api/pizzas`
>   (`src/pizza/pizza.service.ts` → `listarPizzas()`) no acepta ningún filtro; devuelve siempre
>   todas las pizzas. El "detalle de ingredientes y stock" si existe, pero como endpoint aparte:
>   `GET /api/ingrediente-pizza/pizza/:pizzaId`.
> - **Historial de pedidos por repartidor:** no implementado. `GET /api/pedidos` solo admite
>   filtrar por `estado` (`filtroPedidoSchema` en `src/pedido/pedido.schema.ts`); no hay
>   parámetro de filtro por `repartidorId`.
> - **Nombre de estado:** el estado implementado se llama **"En camino"**, no "En viaje"
>   (ver `estadoPedidoSchema` en `src/pedido/pedido.schema.ts`: `Pendiente`, `En preparación`,
>   `En camino`, `Entregado`, `Cancelado`). Corregir el nombre acá.
> - **Cancelación de un pedido:** sí está implementada (`PUT /api/pedidos/:id` con
>   `estado: "Cancelado"`), y además repone el stock de ingredientes consumido
>   (`cancelarConReposicion` en `src/pedido/pedido.repository.ts`), algo que esta sección no
>   menciona.
> - **Email de confirmación:** no implementado. No hay ninguna dependencia ni lógica de envío de
>   emails en el código (se buscó `nodemailer`/SMTP y no aparece en ningún lado).
> - **Control de stock:** el control de stock de ingredientes (descuento transaccional con
>   bloqueo pesimista al crear un pedido, reposición al cancelarlo) sí está implementado
>   (`src/pedido/pedido.repository.ts`, métodos `addConItems` y `cancelarConReposicion`), pero no
>   figura como ítem propio en ninguna tabla de Alcance pese a ser parte central del sistema
>   (se menciona solo en la Descripción general, más arriba).

## Deploy

* Frontend: https://tp-dsw-pizzeria-frontend.vercel.app
* Backend: https://tp-dsw-pizzeria-backend.onrender.com

## Credenciales

| Rol | Email | Contraseña |
| :--- | :--- | :--- |
| Admin | admin@test.com | admin123 |
| Cliente | cliente@test.com | cliente123 |

## Documentación de la API

Cada módulo del backend tiene un archivo `.http` (formato REST Client de VS Code) con ejemplos
reales de cada endpoint, incluyendo los casos de error esperados (validación, autorización,
reglas de negocio):

* `src/auth/auth.http`
* `src/cliente/cliente.http`
* `src/ingrediente/ingrediente.http`
* `src/pizza/pizza.http`
* `src/ingrediente-pizza/ingrediente-pizza.http`
* `src/repartidor/repartidor.http`
* `src/pedido/pedido.http`
* `src/envio/envio.http`
* `src/detalle-pedido/detalle-pedido.http`

## Pull Requests

> **TODO:** completar con los links a los Pull Requests relevantes para la entrega.

## Contacto para la defensa

> **TODO:** completar con el contacto (email y/o teléfono) para coordinar la defensa.
