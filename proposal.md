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

El sistema tiene dos tipos de usuario: **cliente** (nivel 0), que consulta la carta, se registra, arma pedidos y sigue su estado; y **administrador** (nivel 1), que gestiona pizzas, ingredientes, repartidores, clientes, pedidos y envíos. Al crear un pedido se descuenta de forma transaccional el stock de ingredientes; al cancelarlo, se repone.

### Modelo

El diagrama del modelo está en [este link](https://drive.google.com/file/d/1xWHBcCBiaYEYtk39Oxa8nYyFgnX6Xuhz/view?usp=sharing).
## Alcance Funcional

### Alcance Mínimo

| Req | Detalle |
| :--- | :--- |
| CRUD simple | 1. CRUD Ingrediente<br>2. CRUD Repartidor |
| CRUD dependiente | 1. CRUD Pizza {depende de} CRUD Ingrediente, a través de la entidad intermedia `IngredientePizza` (CRUD propio con la cantidad de cada ingrediente por pizza). |
| Listado<br>+<br>detalle | 1. Listado de pedidos filtrado por estado (ej. "Pendiente"), muestra nro de pedido, fecha y total => detalle muestra los ítems (pizzas, cantidades, precio total ítems) y datos del cliente. |
| CUU/Epic | 1. Registrar un nuevo pedido para un cliente con sus respectivos ítems. |

---

### Adicionales para Aprobación
*Nota: Estos requerimientos se suman a los del alcance mínimo para alcanzar el nivel necesario para la aprobación directa.*

| Req | Detalle |
| :--- | :--- |
| CRUD | 1. CRUD Ingrediente<br>2. CRUD Repartidor<br>3. CRUD Cliente<br>4. CRUD Pizza<br>5. CRUD Pedido, junto con sus ítems (`DetallePedido`): los ítems se crean al registrar el pedido y se consultan como parte de él (el módulo `detalle-pedido` es de solo lectura). La baja de un pedido (`DELETE /api/pedidos/:id`) es una **cancelación**: pasa a estado *Cancelado*, repone el stock una sola vez y conserva el historial (no se borra la fila).<br>6. CRUD Envío (administración de bajo nivel; el flujo con reglas de negocio es el CUU de asignar envío). |
| CUU/Epic | 1. Registrar un nuevo pedido para un cliente calculando el total automáticamente (ítems más costo de envío cuando corresponde), validando disponibilidad y descontando el stock de ingredientes de forma transaccional.<br>2. Asignar un envío a un Repartidor registrando el costo y actualizando el estado del pedido (el pedido debe estar *En preparación*, sin retiro en local y sin envío previo; el repartidor debe existir y estar activo). |
| Login y niveles de acceso | 1. Registro y login con JWT (expira a las 2 h) y contraseñas hasheadas con bcrypt.<br>2. Dos niveles de acceso: cliente (nivel 0) y administrador (nivel 1). El registro público siempre crea usuarios de nivel 0.<br>3. Rutas protegidas por nivel en el backend (middlewares `verificarToken` y `requiereNivel`) y en el frontend. La lectura de la carta de pizzas es pública; toda escritura es solo admin. Un cliente solo puede ver sus propios pedidos. |
| Validación y errores | Validación de entrada con Zod en todos los endpoints (esquemas estrictos que rechazan campos de más) y manejo centralizado de errores con códigos HTTP apropiados (400, 401, 403, 404, 409, 413, 500). |
| Tests | Backend (Jest): tests unitarios y un test de integración contra MySQL (`pnpm test`). Frontend: Vitest + Testing Library y un test end-to-end con Playwright. |
| Ambientes | Configuración por variables de entorno: `.env` (desarrollo/producción), `.env.test` (base exclusiva de tests) y sus archivos `.example`. |
| Documentación de la API | Archivos `.http` por módulo (ver sección *Documentación de la API*) y referencia en `docs/api.md`. |

---

### Alcance Adicional Voluntario
*Nota: Funcionalidades extra que completan el sistema de la pizzería y añaden valor al flujo de negocio. Se listan únicamente las efectivamente implementadas.*

| Req | Detalle |
| :--- | :--- |
| Listados | 1. Listado de pizzas con búsqueda y filtros por `vegetariana` y `disponible`, con paginación.<br>2. Historial de pedidos filtrado por repartidor (`repartidorId`, solo administrador), más filtro por estado y pedidos activos, con paginación.<br>3. Listados de clientes y repartidores con búsqueda, filtro por estado y paginación. |
| CUU/Epic | 1. Ciclo de estados del pedido. Con pago en efectivo: *Pendiente* → *En preparación* → *En camino* (si tiene envío) → *Entregado*. Con Mercado Pago, el pedido nace en *Esperando pago* y pasa a *Pendiente* cuando el pago se aprueba; si el pago vence, se cancela. En cualquier etapa previa a *Entregado* puede pasar a *Cancelado*.<br>2. Cancelación de un pedido, que repone el stock de ingredientes consumido.<br>3. Control de stock de ingredientes: descuento transaccional con bloqueo pesimista al crear el pedido y reposición al cancelarlo.<br>4. Pedido para retiro en local o con envío a domicilio, con costo de envío configurable.<br>5. Propina del cliente al repartidor. |
| Pagos | Integración con Mercado Pago en **modo prueba** (checkout y webhook `/api/pagos/webhook` con verificación de firma HMAC), con credenciales de vendedor de prueba. |
| Imágenes | Carga de imágenes de pizzas (procesadas con `sharp` y guardadas en la base de datos). |
| Frontend | 1. Carta pública en la página de inicio.<br>2. Pantallas "Nuevo pedido" y "Mis pedidos" (con detalle) para clientes.<br>3. Pantallas de administración para cada entidad.<br>4. Validación de formularios con Zod. |


## Deploy

* Frontend (Vercel): https://tp-dsw-pizzeria-frontend.vercel.app
* Backend (Render): https://tp-dsw-pizzeria-backend.onrender.com
* Base de datos: MySQL en Aiven.


## Documentación de la API

Cada módulo del backend tiene un archivo `.http` (formato REST Client de VS Code) con ejemplos reales de cada endpoint, incluyendo los casos de error esperados (validación, autorización, reglas de negocio):

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

* Backend: <!-- PEGAR_LINK_PR_BACKEND --> https://github.com/jcolumbich/tp-dsw-pizzeria-backend/pull/4
* Frontend: <!-- PEGAR_LINK_PR_FRONTEND --> https://github.com/jcolumbich/tp-dsw-pizzeria-frontend/pull/NUMERO

## Contacto para la defensa

* Columbich, Julian — jcolumbich@gmail.com
* Setti, Francisco — settifrancisco.esc5032@gmail.com
