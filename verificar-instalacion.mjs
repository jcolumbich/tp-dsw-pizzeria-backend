import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const archivos = JSON.parse(readFileSync(new URL('./archivos-checkout.json', import.meta.url), 'utf8'));
let fallos = 0;
for (const [ruta, hash] of Object.entries(archivos)) {
  try {
    const bytes = readFileSync(new URL(ruta, import.meta.url));
    if (createHash('sha256').update(bytes).digest('hex') !== hash) {
      console.error('Archivo diferente al paquete:', ruta); fallos++;
    }
  } catch { console.error('Falta copiar:', ruta); fallos++; }
}
console.log(fallos ? `${fallos} archivos faltantes o distintos. Copiá el paquete completo.` : 'OK: todos los archivos del paquete están completos y coinciden.');
process.exitCode = fallos ? 1 : 0;
