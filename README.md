# Backend de la pizzería — TP DSW

API REST en TypeScript, Express y MySQL con MikroORM. Mantiene las capas de rutas, controladores, servicios y repositorios. Incluye autenticación JWT, permisos cliente/administrador, catálogo, recetas, stock, pedidos, envíos y pagos de prueba con Mercado Pago.

## Requisitos

- Node.js 22.16 o superior (recomendado: una versión LTS actualizada de Node 22 o 24).
- pnpm 11.25.0: `npm install --global pnpm@11.25.0`.
- MySQL 8 disponible. Las bases se crean antes de iniciar la aplicación.

TypeScript 5.9.3 es compatible con los tipos de Jest 30; no bajar a TypeScript 5.1.
Usar pnpm para respetar `pnpm-workspace.yaml` y `pnpm-lock.yaml`, incluidos los overrides de seguridad.

## Instalación local

Desde la raíz del repositorio:

```powershell
pnpm install --frozen-lockfile
Copy-Item .env.example .env
```

Si ya existe `.env`, conservarlo y completar las variables nuevas; no sobrescribir las claves existentes. En Bash, el equivalente es `cp .env.example .env` solo la primera vez.

Crear una base MySQL dedicada, por ejemplo `pizzeria`, y configurar `DB_URL` con un usuario que tenga permisos sobre ella. La URL debe incluir el nombre de base. `DB_NAME` es opcional: si existe, debe coincidir. La aplicación ya no intenta conectar con una contraseña escrita en el código.

Generar un secreto y copiar el resultado a `JWT_SECRET`:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Variables:

| Variable | Uso |
| --- | --- |
| `NODE_ENV` | `development` local; `production` en el servidor |
| `DB_URL` | URL MySQL con usuario, clave, host, puerto y base |
| `DB_NAME` | Opcional; debe coincidir con la base de `DB_URL` |
| `DB_SYNC_SCHEMA` | `false` recomendado; `true` permite sincronizar al iniciar solo fuera de producción |
| `JWT_SECRET` | Secreto propio para firmar sesiones |
| `PORT` | Puerto HTTP, por defecto 3000 |
| `FRONTEND_URL` | Origen permitido del frontend; definir el dominio del despliegue |
| `BACKEND_URL` | URL pública del backend usada por Mercado Pago |
| `COSTO_ENVIO` | Tarifa de envío; se conserva al crear cada pedido |
| `IMPORTAR_IMAGENES_LOCALES` | `true` solo para importar fotos antiguas de `uploads/pizzas` a MySQL |
| `MP_MODO` | `prueba`; este proyecto no habilita pagos reales |
| `MP_ACCESS_TOKEN` | Token del vendedor de prueba |
| `MP_VENDEDOR_PRUEBA_ID` | ID de ese vendedor |
| `MP_WEBHOOK_SECRET` | Secreto de firma del webhook |

Las variables `DB_HOST`, `DB_USER`, `DB_PASSWORD` y `DB_PORT` no son leídas por este backend: se usa `DB_URL`. No hacen falta variables `VITE_*` en el backend. Mantener una sola definición de `FRONTEND_URL`.

## Esquema y arranque

En una base local nueva o de desarrollo:

```powershell
pnpm run db:preview
# Revisar schema-update.sql; este comando no aplica ese SQL.
pnpm run db:update
pnpm run dev
```

`db:update` utiliza `safe: true` y `dropTables: false`. Evita eliminar tablas y columnas, pero no sustituye una copia de seguridad ni la revisión de los cambios de tipos. Está bloqueado con `NODE_ENV=production`.

`src/app.ts` configura Express sin iniciar el servidor, sincronizar el esquema o importar imágenes. `src/server.ts` inicia HTTP y la revisión periódica de compras pendientes. La conexión a MySQL debe estar disponible.

Para ejecutar compilado:

```powershell
pnpm run build
pnpm start
```

## Pruebas

Sin MySQL ni llamadas reales a Mercado Pago:

```powershell
pnpm run test:unit
```

Para integración, crear una base independiente y un usuario limitado a ella. Ejemplo para ejecutar una vez desde una sesión administradora de MySQL, reemplazando la clave:

```sql
CREATE DATABASE pizzeria_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'pizzeria_test'@'localhost' IDENTIFIED BY 'CAMBIAR_CLAVE';
GRANT ALL PRIVILEGES ON pizzeria_test.* TO 'pizzeria_test'@'localhost';
```

```powershell
Copy-Item .env.test.example .env.test
# Editar DB_TEST_URL con la clave que elegiste.
pnpm run test:integration
pnpm test
```

El nombre debe terminar en `_test` y ser diferente de la base habitual. El runner carga `.env.test` y fija `NODE_ENV=test`; el ORM exige `DB_TEST_URL` sin usar `DB_URL` como reemplazo. Las pruebas crean sus usuarios, realizan login real, verifican permisos y recorren el CRUD de ingredientes contra MySQL; luego eliminan solo sus filas. No usar `.env.test` para reemplazar `DB_URL` ni `DB_NAME`: allí se configura únicamente `DB_TEST_URL`.

`pnpm test` ejecuta todas las pruebas y falla si falta MySQL o su configuración; no oculta ni omite la integración. Para guardar evidencia:

```powershell
pnpm test 2>&1 | Tee-Object -FilePath resultado-tests.txt
```

Las pruebas con mocks comprueban reglas de pedidos, stock, pagos y tratamiento de imágenes; no demuestran una conexión real a Mercado Pago. La advertencia `ExperimentalWarning: VM Modules` corresponde al soporte ESM de Jest.

## Primer administrador

El registro público siempre crea un cliente con nivel 0. Para una instalación nueva, registrar una cuenta propia por el frontend y luego otorgarle nivel 1 desde una sesión administradora de MySQL:

```sql
UPDATE cliente SET nivel_permisos = 1 WHERE email = 'EMAIL_DE_TU_CUENTA_ADMIN';
```

Volver a iniciar sesión. No existe una contraseña administrativa universal creada por este paquete.

## Mercado Pago e imágenes

Para probar pagos, usar cuentas de prueba y configurar todas las variables `MP_*`. `FRONTEND_URL` y `BACKEND_URL` deben ser URLs públicas HTTPS durante checkout; `localhost` sirve para trabajar con efectivo pero no para ese flujo externo. Configurar el webhook en `/api/pagos/webhook` con el secreto correspondiente.

Las imágenes nuevas se convierten a WebP y se almacenan en MySQL (`imagenContenido`). Las fotos históricas que solo estén en disco se pueden importar una vez con `IMPORTAR_IMAGENES_LOCALES=true`; luego volver a `false`.

## Despliegue

El proceso de `pnpm start` necesita un hosting de Node con un proceso persistente y acceso a MySQL para la revisión de pagos cada minuto. Build: `pnpm install --frozen-lockfile && pnpm run build`. Inicio: `pnpm start`. Configurar `NODE_ENV=production`, `DB_URL`, `JWT_SECRET`, `FRONTEND_URL` y las demás variables necesarias en el hosting.

El arranque de producción no modifica el esquema, aunque `DB_SYNC_SCHEMA=true`. Preparar y revisar el SQL de actualización sobre una copia de la base, respaldar la base real y aplicar el SQL aprobado desde la herramienta de administración antes de desplegar. No ejecutar una sincronización automática en cada arranque.

Este paquete no configura ni certifica un despliegue en Vercel: en un entorno serverless no se puede depender del intervalo en memoria para revisar pagos. El frontend puede seguir alojado en Vercel.

## API, alcance y material

- [Referencia de endpoints](docs/api.md), complementada por los ejemplos `src/**/*.http`.
- [Propuesta del TP](proposal.md): revisar sus observaciones antiguas contra el código actual antes de entregar; el modelo externo y las credenciales de deploy requieren verificación del equipo.
- [Consigna](https://github.com/utnfrrodsw/tp).
- [Material oficial](https://github.com/utnfrrodsw/material-be).
- [Guías de apoyo no oficiales](https://github.com/joel-arnold/BE-material), unidades 7 (TypeScript/Zod), 8 (MikroORM) y 10 (Jest).

El tipado se basa en tipos del dominio/ORM, `unknown` con validación para entradas y mocks tipados. Se mantienen las reglas de los CRUD y los dos casos de uso relacionados: registrar pedido y asignar envío.

## Dependencias pendientes

Se actualizaron mysql2 y otras dependencias compatibles detectadas por la auditoría. MikroORM 5.9.8 mantiene tres avisos de seguridad (uno crítico y dos altos); las versiones corregidas pertenecen a MikroORM 6.6.x o superior. Este cambio no realiza esa migración mayor ni afirma que la aplicación tenga cero vulnerabilidades. Consultar [los resultados y límites](docs/verificacion.md) antes de considerar terminado el despliegue de producción.
