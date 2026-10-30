# Referencia de la API

Base local: `http://localhost:3000`. Los cuerpos normales usan `Content-Type: application/json`. Para rutas protegidas, enviar `Authorization: Bearer TOKEN` obtenido por login. Los IDs son números. Nivel 0: cliente; nivel 1: administrador.

## Autenticación

| Método y ruta | Acceso | Cuerpo |
| --- | --- | --- |
| `POST /api/auth/register` | Público | `nombre`, `apellido`, `email`, `contrasenia`, `domicilio` |
| `POST /api/auth/login` | Público | `email`, `contrasenia` |

El registro crea nivel 0; no acepta asignarse permisos. Respuesta: `{ message, data: { token, usuario } }`. La contraseña de registro tiene mínimo 6 caracteres; en el CRUD administrativo de clientes, mínimo 8. JWT vence a las 2 horas. Los permisos actuales se consultan en MySQL.

## CRUDs y consultas

En las filas con `/:id`, ese segmento se usa para consultar, actualizar o eliminar un registro.

| Recurso | Métodos | Acceso | Campos de alta |
| --- | --- | --- | --- |
| `/api/ingredientes` | GET, POST; GET/PUT/DELETE `/:id` | Administrador | `nombre`, `stock` |
| `/api/clientes` | GET, POST; GET/PUT/DELETE `/:id` | Administrador | `nombre`, `apellido`, `email`, `contrasenia`, `nivel_permisos`, `estado`, `domicilio` |
| `/api/repartidores` | GET, POST; GET/PUT/PATCH/DELETE `/:id` | Administrador | Campos de persona más `matricula`; `monto_propina_total` opcional |
| `/api/pizzas` | GET; GET `/:id` | Público | — |
| `/api/pizzas` | POST; PUT/DELETE `/:id` | Administrador | `nombre`, `precio`, `vegetariana`, `disponible`; `descripcion` opcional |
| `/api/ingrediente-pizza` | GET, POST; GET/PUT/DELETE `/:pizzaId/:ingredienteId`; GET `/pizza/:pizzaId` | Administrador | `pizzaId`, `ingredienteId`, `cantidad`; en PUT solo `cantidad` |
| `/api/envios` | GET, POST; GET/PUT/DELETE `/:id` | Administrador | `pedidoId`, `repartidorId`, `costo`; `monto_propina` opcional |
| `/api/detalle-pedido` | GET; GET `/pedido/:pedidoId`; GET `/:pedidoId/:pizzaId` | Administrador | Solo consulta; los ítems se crean con el pedido |

Los PUT de clientes, repartidores, ingredientes y pizzas admiten actualizaciones parciales no vacías. Clientes y repartidores no permiten cambiar `nivel_permisos` por actualización. El borrado respeta relaciones e historial: por ejemplo, una pizza se da de baja lógicamente y un cliente con pedidos no se elimina.

Para imágenes de pizza usar `multipart/form-data` con `datos` (JSON en texto) e `imagen` (archivo). La respuesta conserva la URL `/uploads/pizzas/...webp`; los bytes se recuperan de MySQL. También se puede enviar JSON cuando no se adjunta una imagen.

## Filtros remotos

| Listado | Parámetros query |
| --- | --- |
| Pizzas | `pagina`, `limite`, `busqueda`, `vegetariana`, `disponible` |
| Clientes y repartidores | `pagina`, `limite`, `busqueda`, `estado` |
| Pedidos | `pagina`, `limite`, `estado` **o** `activos`; `repartidorId` solo administrador |

`pagina` comienza en 1; `limite` va de 1 a 100 y por defecto vale 10. Los booleanos en query son `true` o `false`. La búsqueda admite hasta 120 caracteres. La paginación y los filtros se ejecutan en el backend. Respuesta paginada: `{ message, data: [...], paginacion: { pagina, limite, total, totalPaginas } }`.

## Pedidos y envíos

| Método y ruta | Acceso | Cuerpo / comportamiento |
| --- | --- | --- |
| `GET /api/pedidos` | Autenticado | Cliente: solo sus pedidos; administrador: listado general |
| `GET /api/pedidos/tarifa-envio` | Autenticado | `{ data: { costo } }` |
| `GET /api/pedidos/:id` | Dueño o administrador | Detalle con relaciones |
| `POST /api/pedidos` | Cliente nivel 0 | Registra compra y reserva stock |
| `PUT /api/pedidos/:id` | Administrador | `{ "estado": "En preparación" }`, `Entregado` o `Cancelado`, según transición válida |
| `POST /api/pedidos/:id/asignar-envio` | Administrador | `{ "repartidorId": 1, "costo": 1500 }` |
| `DELETE /api/pedidos/:id` | Administrador | Cancela, repone stock una sola vez y conserva historial |

Ejemplo de compra:

```json
{
  "retiro": false,
  "medio_pago": "efectivo",
  "checkout_id": "7e1b05c3-3171-4cce-b47c-7a30f77bb64b",
  "costo_envio": 1500,
  "monto_propina": 100,
  "items": [{ "pizzaId": 1, "cantidad": 2 }]
}
```

Reemplazar los IDs por registros existentes y el costo por la tarifa consultada. Usar un UUID nuevo para una nueva compra y conservarlo al reintentar la misma. No repetir una pizza en varios ítems. Cada cantidad es un entero de 1 a 100 y se permiten de 1 a 50 ítems. El cliente real se obtiene de la sesión. Los importes y precios se verifican/calculan en el servidor. En retiro no corresponde propina.

Estados: `Esperando pago`, `Pendiente`, `En preparación`, `En camino`, `Entregado`, `Cancelado`. La asignación de envío exige pedido en preparación, delivery, repartidor activo y pago aprobado si corresponde. No se cambia a `En camino` mediante un PUT arbitrario.

Con `medio_pago: "mercadopago"`, la compra puede responder con `data.checkoutUrl`. La creación del pedido se conserva si falla la apertura del proveedor: ante 502 se debe reintentar con el mismo `checkout_id`.

## Pagos

| Método y ruta | Autenticación | Cuerpo |
| --- | --- | --- |
| `GET /api/pagos/pedido/:id` | Dueño o administrador | Sin cuerpo |
| `POST /api/pagos/pedido/:id/verificar` | Dueño o administrador | `{ "paymentId": "100" }` |
| `POST /api/pagos/webhook?data.id=100` | Firma de Mercado Pago, sin JWT | `{ "type": "payment", "data": { "id": "100" } }` |

El webhook requiere `x-request-id` y `x-signature` válidos; no se aprueba un pago por recibir el retorno del navegador. El backend consulta al proveedor y verifica referencia, importe, moneda y vendedor.

## Respuestas y errores

Altas: normalmente 201 con `{ message, data }`. Consultas y cambios: 200 con `{ data }` y, según ruta, `message`. Bajas: 200 con `message`. Errores: `{ message }`; la validación de body agrega `errores: [{ campo, mensaje }]`.

- 400: datos o identificadores inválidos.
- 401: sesión ausente/inválida o firma de webhook inválida.
- 403: permisos insuficientes.
- 404: registro o recurso inexistente.
- 409: conflicto de negocio, stock, duplicados o relaciones.
- 413: solicitud o imagen demasiado grande.
- 500: error interno.
- 502/503: proveedor o configuración de pagos no disponible.

Los archivos `src/**/*.http` aportan ejemplos por entidad; reemplazar sus tokens, IDs y URLs antes de usarlos. Esta referencia describe las rutas implementadas, no habilita operaciones adicionales sobre pagos o detalles históricos.
