// Disposable browser test environment. Stop by writing "stop" to stdin.
import { mkdtemp, readFile, writeFile, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
const stopFile = resolve('tests/.preview-stop');
await rm(stopFile, { force: true });
const dir = await mkdtemp(join(tmpdir(), 'unp-preview-'));
const data = JSON.parse(await readFile('src/data/db.json', 'utf8'));
data.incidencias = []; data.mantenimientos = []; data.historialIncidencias = [];
data.equipos.forEach(e => { e.estado = 'Disponible'; });
data.equipos[0].codigoPatrimonial = '740899504221';
const db = join(dir, 'db.json'); await writeFile(db, JSON.stringify(data));
const children = [
  spawn(process.execPath, ['backend/dev-server.mjs', db, '3419', '127.0.0.1'], { windowsHide: true, stdio: ['ignore','pipe','pipe'] }),
  spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5419', '--strictPort'], { env: { ...process.env, VITE_API_URL: 'http://127.0.0.1:3419' }, windowsHide: true, stdio: ['ignore','pipe','pipe'] })
];
for (const p of children) { p.stdout.pipe(process.stdout); p.stderr.pipe(process.stderr); }
let stopped = false;
async function stop() {
  if (stopped) return; stopped = true;
  await Promise.all(children.map(async p => { if (p.exitCode === null) { p.kill(); await once(p, 'exit'); } }));
  if (!resolve(dir).startsWith(resolve(tmpdir()))) throw new Error('Unexpected temp directory');
  await rm(dir, { recursive: true, force: true }); process.exit();
}
process.stdin.on('data', input => { if (input.toString().includes('stop')) stop(); });
process.on('SIGINT', stop); process.on('SIGTERM', stop);
console.log('Preview temporal: http://127.0.0.1:5419');

setInterval(() => { access(stopFile).then(stop).catch(() => {}); }, 500);
setTimeout(stop, 15 * 60 * 1000);
