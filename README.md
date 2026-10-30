
# Backend de la pizzería — TP DSW

API REST desarrollada con **TypeScript, Express, MySQL y MikroORM**, organizada en capas de rutas, controladores, servicios y repositorios.

Incluye autenticación JWT, roles de cliente y administrador, gestión de pizzas e ingredientes, recetas, stock, pedidos, envíos y pagos de prueba con Mercado Pago.

## Requisitos

- Node.js 22.16 o superior.
- pnpm 11.25.0.
- MySQL 8.

Para instalar pnpm:

```powershell
npm install --global pnpm@11.25.0
```

## Instalación local

Desde la raíz del repositorio:

```powershell
pnpm install --frozen-lockfile
if (!(Test-Path .env)) { Copy-Item .env.example .env }
```

En Bash, para crear el archivo de configuración por primera vez:

```bash
cp -n .env.example .env
```

Crear una base de datos MySQL, por ejemplo `pizzeria`, y configurar `DB_URL` con los datos de conexión y el nombre de la base. Si se utiliza `DB_NAME`, debe coincidir con el nombre indicado en `DB_URL`.

Generar una clave para `JWT_SECRET`:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

### Variables de entorno

| Variable | Uso |
| --- | --- |
| `NODE_ENV` | Entorno de ejecución: `development`, `test` o `production` |
| `DB_URL` | URL de conexión a MySQL con usuario, contraseña, host, puerto y base |
| `DB_NAME` | Opcional; nombre de la base de datos |
| `DB_SYNC_SCHEMA` | Sincronización automática del esquema fuera de producción; se recomienda `false` |
| `JWT_SECRET` | Clave para firmar los tokens JWT |
| `PORT` | Puerto HTTP; por defecto, `3000` |
| `FRONTEND_URL` | URL del frontend permitida por CORS |
| `BACKEND_URL` | URL pública del backend para la integración con Mercado Pago |
| `COSTO_ENVIO` | Tarifa de envío aplicada a los pedidos |
| `IMPORTAR_IMAGENES_LOCALES` | Permite importar imágenes antiguas de `uploads/pizzas` a MySQL |
| `MP_MODO` | Modo de Mercado Pago; utilizar `prueba` |
| `MP_ACCESS_TOKEN` | Token del vendedor de prueba |
| `MP_VENDEDOR_PRUEBA_ID` | ID del vendedor de prueba |
| `MP_WEBHOOK_SECRET` | Clave de firma del webhook |

## Base de datos y arranque

Con MySQL en funcionamiento y la base configurada:

```powershell
pnpm run db:preview
```

Revisar el archivo `schema-update.sql` generado antes de aplicar los cambios:

```powershell
pnpm run db:update
pnpm run dev
```

`db:update` está disponible únicamente fuera de producción y utiliza las opciones `safe: true` y `dropTables: false`. Se recomienda realizar una copia de seguridad antes de actualizar el esquema.

Para compilar y ejecutar la aplicación:

```powershell
pnpm run build
pnpm start
```

## Pruebas

### Pruebas unitarias

No requieren una base MySQL ni conexiones reales a Mercado Pago:

```powershell
pnpm run test:unit
```

### Pruebas de integración

Crear una base de datos independiente para las pruebas. Por ejemplo, desde una sesión administradora de MySQL:

```sql
CREATE DATABASE pizzeria_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'pizzeria_test'@'localhost' IDENTIFIED BY 'CAMBIAR_CLAVE';
GRANT ALL PRIVILEGES ON pizzeria_test.* TO 'pizzeria_test'@'localhost';
```

Crear el archivo `.env.test` y configurar `DB_TEST_URL` con la conexión a esa base:

```powershell
if (!(Test-Path .env.test)) { Copy-Item .env.test.example .env.test }
pnpm run test:integration
```

La base de integración debe tener un nombre terminado en `_test` y ser distinta de la base utilizada para desarrollo. Las pruebas comprueban autenticación, permisos y operaciones CRUD de ingredientes sobre MySQL.

Para ejecutar todas las pruebas:

```powershell
pnpm test
```

Este comando también ejecuta las pruebas de integración, por lo que requiere su base de datos configurada.

Para guardar el resultado en un archivo:

```powershell
pnpm test 2>&1 | Tee-Object -FilePath resultado-tests.txt
```

## Primer administrador

Las cuentas registradas desde el frontend se crean con permisos de cliente (`nivel_permisos = 0`). Para asignar permisos de administrador, registrar una cuenta y ejecutar desde MySQL:

```sql
UPDATE cliente
SET nivel_permisos = 1
WHERE email = 'EMAIL_DE_TU_CUENTA_ADMIN';
```

Después, cerrar sesión e ingresar nuevamente para actualizar los permisos.

## Mercado Pago e imágenes

El sistema utiliza **pagos de prueba** con Mercado Pago. Para probar la integración, configurar las variables `MP_*` con credenciales de prueba, además de `FRONTEND_URL` y `BACKEND_URL` con URLs públicas HTTPS.

El webhook se encuentra en:

```text
/api/pagos/webhook
```

Las imágenes nuevas se convierten a formato WebP y se almacenan en MySQL mediante `imagenContenido`.

Para importar imágenes antiguas almacenadas en `uploads/pizzas`, establecer temporalmente `IMPORTAR_IMAGENES_LOCALES=true`. Una vez finalizada la importación, volver a `false`.

## Despliegue

El backend necesita un servidor Node.js con acceso a MySQL y un proceso persistente para ejecutar la revisión periódica de pagos pendientes. El frontend puede alojarse por separado en Vercel.

Comando de instalación y compilación:

```bash
pnpm install --frozen-lockfile && pnpm run build
```

Comando de inicio:

```bash
pnpm start
```

Configurar en el hosting las variables de entorno necesarias, especialmente `NODE_ENV=production`, `DB_URL`, `JWT_SECRET` y `FRONTEND_URL`.

En producción, las modificaciones del esquema se preparan y aplican previamente desde la herramienta de administración de MySQL, después de revisar el SQL y realizar una copia de seguridad.

## API y material de referencia

- [Referencia de endpoints](docs/api.md), complementada por los ejemplos `src/**/*.http`.
- [Consigna del TP](https://github.com/utnfrrodsw/tp).
- [Material oficial de backend](https://github.com/utnfrrodsw/material-be).
- [Guías de apoyo de backend](https://github.com/joel-arnold/BE-material): TypeScript/Zod, MikroORM y Jest.

## Dependencias pendientes

MikroORM 5.9.8 presenta tres avisos de seguridad pendientes (uno crítico y dos altos). Su resolución requiere evaluar una migración a MikroORM 6.6.x o superior. Para más información, consultar [la verificación del proyecto](docs/verificacion.md).
