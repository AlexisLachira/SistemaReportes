import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

export function migrateDemoInventoryCodes(original) {
  const data = structuredClone(original);
  const byId = new Map();
  const byOldCode = new Map();
  const mapping = data.equipos.map((eq, index) => {
    if (eq.id == null || !eq.codigoPatrimonial || byId.has(String(eq.id)) || byOldCode.has(String(eq.codigoPatrimonial))) throw new Error('Inventario con IDs o códigos ausentes o duplicados.');
    const entry = { equipoId: eq.id, anterior: String(eq.codigoPatrimonial), nuevo: String(740899504221n + BigInt(index)) };
    byId.set(String(eq.id), entry); byOldCode.set(String(eq.codigoPatrimonial), entry);
    return entry;
  });
  const resolveEntry = item => item.equipoId ? byId.get(String(item.equipoId)) : byOldCode.get(String(item.codigoEquipo));
  for (const incident of data.incidencias || []) {
    const entry = resolveEntry(incident);
    if (!entry) throw new Error(`Incidencia sin equipo válido: ${incident.id}`);
    incident.equipoId = entry.equipoId; incident.codigoEquipo = entry.nuevo;
  }
  for (const work of data.mantenimientos || []) {
    const incident = data.incidencias?.find(i => String(i.id) === String(work.incidenciaId));
    const entry = work.equipoId ? byId.get(String(work.equipoId)) : incident ? byId.get(String(incident.equipoId)) : byOldCode.get(String(work.codigoEquipo));
    if (!entry) throw new Error(`Mantenimiento sin equipo válido: ${work.id}`);
    work.equipoId = entry.equipoId; work.codigoEquipo = entry.nuevo;
  }
  for (const eq of data.equipos) {
    eq.codigoPatrimonial = byId.get(String(eq.id)).nuevo;
    eq.codigoInventarioFicticio = true;
  }
  return { data, mapping };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const files = ['src/data/db.json', 'backend/db.json'];
  const prepared = await Promise.all(files.map(async file => {
    const text = await readFile(file, 'utf8');
    return { file, text, ...migrateDemoInventoryCodes(JSON.parse(text)) };
  }));
  if (process.argv.includes('--apply')) {
    const backup = resolve('.local-run', `inventory-backup-${Date.now()}`);
    await mkdir(backup, { recursive: true });
    for (const item of prepared) await writeFile(join(backup, item.file.replaceAll('/', '-')), item.text);
    for (const item of prepared) await writeFile(item.file, JSON.stringify(item.data, null, 2) + '\n');
    await writeFile(join(backup, 'mapping.json'), JSON.stringify(prepared.map(({ file, mapping }) => ({ file, mapping })), null, 2));
    console.log(`Respaldo: ${backup}`);
  }
  console.log(JSON.stringify(prepared.map(({ file, mapping }) => ({ file, mapping })), null, 2));
}
