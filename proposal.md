
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

## Alcance Funcional

### Alcance Mínimo

| Req | Detalle |
| :--- | :--- |
| CRUD simple | 1. CRUD Ingrediente<br>2. CRUD Repartidor |
| CRUD dependiente | 1. CRUD Pizza {depende de} CRUD Ingrediente |
| Listado<br>+<br>detalle | 1. Listado de pedidos filtrado por estado (ej. "Pendiente"), muestra nro de pedido, fecha y total => detalle muestra los ítems (pizzas, cantidades, precio total ítems) y datos del cliente. |
| CUU/Epic | 1. Registrar un nuevo pedido para un cliente con sus respectivos ítems. |

---

### Adicionales para Aprobación
*Nota: Estos requerimientos se suman a los del alcance mínimo para alcanzar el nivel necesario para la aprobación directa.*

| Req | Detalle |
| :--- | :--- |
| CRUD | 1. CRUD Ingrediente<br>2. CRUD Repartidor<br>3. CRUD Cliente<br>4. CRUD Pizza<br>5. CRUD Pedido (incluye Detalle/ItemPedido) |
| CUU/Epic | 1. Registrar un nuevo pedido para un cliente calculando el total automáticamente.<br>2. Asignar un envío a un Repartidor registrando el costo y actualizando el estado del pedido. |

---

### Alcance Adicional Voluntario
*Nota: Funcionalidades extra que completan el sistema de la pizzería y añaden valor al flujo de negocio.*

| Req | Detalle |
| :--- | :--- |
| Listados | 1. Listado de pizzas filtrado por categoría (ej. "Vegetariana"), muestra nombre y precio => detalle muestra listado de ingredientes y stock.<br>2. Historial de pedidos filtrado por repartidor, muestra fecha, estado y cliente. |
| CUU/Epic | 1. Actualizar el estado de un pedido (Ej: En preparación -> En viaje -> Entregado).<br>2. Cancelación de un pedido. |
| Otros | 1. Envío de confirmación de pedido por email al cliente. |
