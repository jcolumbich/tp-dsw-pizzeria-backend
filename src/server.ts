import { app } from './app.js';
import { RequestContext } from '@mikro-orm/core';
import { orm, syncSchema } from './shared/db/orm.js';
import { importarImagenesLocales } from './pizza/pizza.imagen.js';
import { revisarComprasPendientes } from './pago/pago.service.js';

try {
  if (!process.env.JWT_SECRET?.trim()) throw new Error('Falta JWT_SECRET');
  if (process.env.NODE_ENV !== 'production' && process.env.DB_SYNC_SCHEMA === 'true') {
    await syncSchema();
  }
  if (process.env.IMPORTAR_IMAGENES_LOCALES === 'true') {
    await importarImagenesLocales();
  }
  const port = Number(process.env.PORT || 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT no es válido');

  let revisando = false;
  const revisar = async () => {
    if (revisando) return;
    revisando = true;
    try { await RequestContext.createAsync(orm.em, revisarComprasPendientes); }
    catch (error) {
      console.error('No se pudieron revisar las compras pendientes:', error instanceof Error ? error.message : 'Error');
    } finally { revisando = false; }
  };

  const servidor = app.listen(port, () => console.log(`Servidor en http://localhost:${port}`));
  const intervalo = setInterval(() => { void revisar(); }, 60_000);
  intervalo.unref();
  void revisar();

  let cerrando = false;
  const cerrar = () => {
    if (cerrando) return;
    cerrando = true;
    clearInterval(intervalo);
    servidor.close(() => {
      void orm.close(true).catch(error => {
        console.error('No se pudo cerrar MySQL:', error);
        process.exitCode = 1;
      });
    });
  };
  process.once('SIGINT', cerrar);
  process.once('SIGTERM', cerrar);
  servidor.on('error', error => {
    console.error('No se pudo iniciar el servidor:', error);
    process.exitCode = 1;
    cerrar();
  });
} catch (error) {
  await orm.close(true);
  throw error;
}
