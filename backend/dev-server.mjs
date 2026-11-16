// Development JSON Server: load once, persist writes, avoid reloading stale file
// snapshots while a multi-step incident operation is being saved.
import { resolve } from 'node:path';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { createApp } from 'json-server/lib/app.js';
import { NormalizedAdapter } from 'json-server/lib/adapters/normalized-adapter.js';

const file = resolve(process.argv[2] || 'src/data/db.json');
const port = Number(process.argv[3] || 3001);
const host = process.argv[4] || 'localhost';
const db = new Low(new NormalizedAdapter(new JSONFile(file)), {});
await db.read();
// Add stable foreign keys for legacy records without replacing patrimonial codes.
for (const incident of db.data.incidencias || []) {
  if (!incident.equipoId) incident.equipoId = db.data.equipos?.find(e => e.codigoPatrimonial === incident.codigoEquipo)?.id || '';
}
for (const work of db.data.mantenimientos || []) {
  if (!work.equipoId) work.equipoId = db.data.incidencias?.find(i => String(i.id) === String(work.incidenciaId))?.equipoId || '';
  if (!work.estado) work.estado = work.fechaFin ? 'Finalizado' : work.fechaInicio ? 'En proceso' : 'Programado';
}

const app = createApp(db, { logger: false });
app.listen(port, () => console.log(`API de desarrollo: http://${host}:${port}`), host);
