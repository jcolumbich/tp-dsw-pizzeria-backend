# Propuesta TP DSW


## Grupo


### Integrantes
* 55158 - Setti, Francisco
* 53723  - Columbich, Julian
* 50461  - Milton, Alvarez

  
## Repositorios

## Tema
### Pizzeria

### Descripcion
Sistema de gestión para pizzerías que integra pedidos, envíos a domicilio y reservas de mesas. Controla el stock de ingredientes y la disponibilidad de productos para optimizar la operativa del negocio.

### Modelo

https://drive.google.com/file/d/1xWHBcCBiaYEYtk39Oxa8nYyFgnX6Xuhz/view?usp=sharing

## Alcance Funcional
## Alcance Mínimo

| Req | Detalle |
| :--- | :--- |
| CRUD simple | 1. CRUD Ingrediente<br>2. CRUD Mesa<br>3. CRUD Repartidor |
| CRUD dependiente | 1. CRUD Pizza {depende de} CRUD Ingrediente<br>2. CRUD Reserva {depende de} CRUD Mesa y Cliente |
| Listado<br>+<br>detalle | 1. Listado de pedidos filtrado por estado (ej. "Pendiente"), muestra nro de pedido, fecha y total => detalle muestra los ítems (pizzas, cantidades, precio total ítems) y datos del cliente.<br>2. Listado de pizzas filtrado por categoría (ej. "Vegetariana"), muestra nombre y precio => detalle muestra listado de ingredientes y stock. |
| CUU/Epic | 1. Registrar un nuevo pedido para un cliente con sus respectivos ítems.<br>2. Registrar la reserva de una mesa para una fecha específica. |

---

## Adicionales para Aprobación
*Nota: Estos requerimientos se suman a los del alcance mínimo para alcanzar el nivel necesario para la aprobación directa.*

| Req | Detalle |
| :--- | :--- |
| CRUD | 1. CRUD Ingrediente<br>2. CRUD Mesa<br>3. CRUD Repartidor<br>4. CRUD Cliente<br>5. CRUD Pizza<br>6. CRUD Reserva<br>7. CRUD Pedido (incluye Detalle/ItemPedido) |
| CUU/Epic | 1. Registrar un nuevo pedido para un cliente calculando el total automáticamente.<br>2. Registrar la reserva de una mesa validando la capacidad_p.<br>3. Asignar un envío a un Repartidor registrando el costo y actualizando el estado. |

---

## Alcance Adicional Voluntario
*Nota: Funcionalidades extra que completan el sistema de la pizzería y añaden valor al flujo de negocio.*

| Req | Detalle |
| :--- | :--- |
| Listados | 1. Listado de reservas del día filtrado por fecha, muestra cliente, sector, id_mesa y estado.<br>2. Historial de pedidos filtrado por repartidor, muestra fecha, estado, cliente y monto_propinas. |
| CUU/Epic | 1. Actualizar el estado de un pedido (Ej: En preparación -> En viaje -> Entregado).<br>2. Cancelación de un pedido o reserva. |
| Otros | 1. Envío de confirmación de pedido o reserva por email al cliente. |



