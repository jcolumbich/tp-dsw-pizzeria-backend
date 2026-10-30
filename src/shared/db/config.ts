// Esta función no abre conexiones: permite comprobar la configuración antes de usar MySQL.
export function configuracionBase(env: NodeJS.ProcessEnv) {
  if (env.JEST_WORKER_ID !== undefined && env.NODE_ENV !== 'test') {
    throw new Error('Jest debe ejecutarse con NODE_ENV=test; usá los scripts test del proyecto');
  }
  const esTest = env.NODE_ENV === 'test';
  const clientUrl = (esTest ? env.DB_TEST_URL : env.DB_URL)?.trim();
  if (!clientUrl) {
    throw new Error(esTest
      ? 'Falta DB_TEST_URL: las pruebas de integración requieren una base exclusiva terminada en _test'
      : 'Falta DB_URL. Configurá la conexión a MySQL en .env o en el hosting');
  }

  let url: URL;
  try { url = new URL(clientUrl); }
  catch { throw new Error('La URL de MySQL no es válida'); }
  const dbName = decodeURIComponent(url.pathname.slice(1));
  if (url.protocol !== 'mysql:' || !url.hostname || !/^[a-zA-Z0-9_]+$/.test(dbName)) {
    throw new Error('La URL debe tener el formato mysql://usuario:clave@host:3306/nombre_base');
  }
  if (esTest) {
    if (!dbName.endsWith('_test')) {
      throw new Error('DB_TEST_URL debe apuntar a una base cuyo nombre termine en _test');
    }
    const baseHabitual = env.DB_URL?.trim();
    if (baseHabitual) {
      let nombreHabitual: string;
      try { nombreHabitual = decodeURIComponent(new URL(baseHabitual).pathname.slice(1)); }
      catch { throw new Error('DB_URL no es válida; no se pudo verificar el aislamiento de pruebas'); }
      if (dbName === nombreHabitual) {
        throw new Error('DB_TEST_URL y DB_URL deben usar bases con nombres diferentes');
      }
    }
    if (env.DB_NAME?.trim() === dbName) {
      throw new Error('La base de pruebas no puede coincidir con DB_NAME');
    }
  } else if (env.DB_NAME?.trim() && env.DB_NAME.trim() !== dbName) {
    throw new Error('DB_NAME y el nombre de base de DB_URL no coinciden; corregí la configuración');
  }

  return { clientUrl, dbName };
}
