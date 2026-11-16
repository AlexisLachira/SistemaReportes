import { migrateDemoInventoryCodes } from '../scripts/demo-inventory.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createServer } from 'node:net';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { maintenanceForEquipment, completedMaintenance, preventiveSchedule, addMonths, equipmentCanBeScheduled, canExecuteMaintenance } from '../src/domain/maintenance.js';

test('Flujo integrado contra JSON Server aislado', async t => {
  const original = await readFile('src/data/db.json', 'utf8');
  const fixture = JSON.parse(original);
  const legacyEquipment = fixture.equipos.at(-1);
  fixture.incidencias = [{ id: 'legacy-inc', codigoEquipo: legacyEquipment.codigoPatrimonial, estado: 'Cerrada' }];
  fixture.mantenimientos = [{ id: 'legacy-work', incidenciaId: 'legacy-inc', tecnicoId: fixture.tecnicos[0].id, tipoMantenimiento: 'Preventivo', fechaInicio: '2026-01-01', fechaFin: '2026-01-02' }];
  fixture.historialIncidencias = [];
  fixture.equipos.forEach(e => { e.estado = 'Disponible'; });
  const dir = await mkdtemp(join(tmpdir(), 'unp-flow-'));
  const db = join(dir, 'db.json'); await writeFile(db, JSON.stringify(fixture));
  const socket = createServer(); socket.listen(0, '127.0.0.1'); await once(socket, 'listening');
  const port = socket.address().port; await new Promise(r => socket.close(r));
  globalThis.__API_URL__ = `http://127.0.0.1:${port}`;
  const server = spawn(process.execPath, [resolve('backend/dev-server.mjs'), db, String(port), '127.0.0.1'], { stdio: 'pipe', windowsHide: true });
  let output = ''; server.stderr.on('data', c => { output += c; }); server.stdout.on('data', c => { output += c; });
  try {
    let ready = false;
    for (let i = 0; i < 100; i++) {
      try { ready = (await fetch(`${globalThis.__API_URL__}/equipos`)).ok; } catch {}
      if (ready) break;
      if (server.exitCode !== null) throw new Error(output);
      await new Promise(r => setTimeout(r, 100));
    }
    assert.ok(ready, output);
    const api = await import('../src/services/api.js');
    const flow = await import('../src/services/workflow.js');
    const admin = fixture.usuarios.find(u => u.rol === 'administrador');
    const student = fixture.usuarios.find(u => u.rol === 'alumno');
    const tech = fixture.tecnicos.find(u => u.estado === 'Activo');
    const other = fixture.tecnicos.find(u => u.estado === 'Activo' && u.id !== tech.id);
    const eq = fixture.equipos[0];
    const data = { equipoId: eq.id, codigoEquipo: eq.codigoPatrimonial, descripcion: 'La computadora no enciende al pulsar el boton.', fecha: '2026-11-16', prioridad: 'Alta', usuariosAfectados: '2-10', impideActividades: 'Impide actividades' };
    let inc, mant;
    await t.test('registros anteriores conservan codigo y adquieren relacion por ID', async () => {
      assert.equal((await api.getIncidentById('legacy-inc')).equipoId, legacyEquipment.id);
      const legacy = (await api.getMantenimientos()).find(m => m.id === 'legacy-work');
      assert.equal(legacy.equipoId, legacyEquipment.id);
      assert.equal(legacy.estado, 'Finalizado');
      assert.equal((await api.getEquipoById(legacyEquipment.id)).codigoPatrimonial, legacyEquipment.codigoPatrimonial);
    });
    await t.test('registro por codigo y rechazo de duplicados', async () => {
      assert.ok((await api.getEquipos()).find(e => e.codigoPatrimonial === eq.codigoPatrimonial));
      inc = await flow.reportIncident(data, student);
      assert.equal(inc.estado, 'Reportada'); assert.equal(inc.reportanteId, student.id);
      assert.equal((await api.getEquipoById(eq.id)).estado, 'Dañado');
      await assert.rejects(flow.reportIncident(data, student), /abierta/);
    });
    await t.test('programacion excluye equipos con fallas incluso si figura Disponible', async () => {
      for (const tipoMantenimiento of ['Preventivo', 'Predictivo']) {
        const form = { equipoId: eq.id, tecnicoId: tech.id, fechaProgramada: '2026-11-20', tipoMantenimiento, actividades: 'Inspeccion', evidenciaCondicion: 'Mediciones y analisis' };
        await assert.rejects(flow.scheduleMaintenance(form, admin), /sin incidencias abiertas/);
        const current = await api.getEquipoById(eq.id);
        await api.updateEquipo(eq.id, { ...current, estado: 'Disponible' });
        await assert.rejects(flow.scheduleMaintenance(form, admin), /sin incidencias abiertas/);
        await api.updateEquipo(eq.id, current);
      }
      assert.equal((await api.getMantenimientos()).filter(m => String(m.equipoId) === String(eq.id)).length, 0);
    });
    await t.test('revision, asignacion y permisos', async () => {
      await assert.rejects(flow.assignIncident(inc.id, { tecnicoId: tech.id, fechaProgramada: '2026-11-17' }, admin), /revisada/);
      await assert.rejects(flow.changeIncidentState(inc.id, 'Revisada', student), /permiso/);
      await flow.changeIncidentState(inc.id, 'Revisada', admin);
      mant = await flow.assignIncident(inc.id, { tecnicoId: tech.id, fechaProgramada: '2026-11-17' }, admin);
      assert.equal((await api.getIncidentById(inc.id)).estado, 'Asignada');
      assert.equal(mant.tipoMantenimiento, 'Correctivo'); assert.equal(mant.estado, 'Programado');
      await assert.rejects(flow.assignIncident(inc.id, { tecnicoId: tech.id }, admin));
      await assert.rejects(flow.workOnIncident(mant.id, 'start', {}, other), /pertenece/);
      await assert.rejects(flow.workOnIncident(mant.id, 'finish', {}, tech), /Inicie/);
    });
    await t.test('inicio, avances, solucion y cierre', async () => {
      mant = await flow.workOnIncident(mant.id, 'start', {}, tech);
      assert.ok(mant.fechaInicio); assert.equal((await api.getEquipoById(eq.id)).estado, 'En mantenimiento');
      await assert.rejects(flow.workOnIncident(mant.id, 'finish', {}, tech), /Complete/);
      const details = { diagnostico: 'Fuente averiada', actividades: 'Cambio de fuente y pruebas de encendido', tiempoEmpleado: '1.5', repuestos: 'Fuente 500W' };
      await flow.workOnIncident(mant.id, 'save', details, tech);
      mant = await flow.workOnIncident(mant.id, 'finish', details, tech);
      assert.ok(mant.fechaFin); assert.equal(mant.estado, 'Finalizado');
      assert.equal((await api.getIncidentById(inc.id)).estado, 'Reparada');
      await flow.changeIncidentState(inc.id, 'Cerrada', admin);
      assert.equal((await api.getEquipoById(eq.id)).estado, 'Disponible');
      const history = await api.getHistorialByIncidencia(inc.id);
      assert.equal(history.length, 7);
      await assert.rejects(flow.workOnIncident(mant.id, 'save', details, tech));
      await assert.rejects(flow.removeIncident(inc.id, admin), /trazabilidad/);
      await assert.rejects(api.deleteEquipo(eq.id), /historial/);
    });
    await t.test('preventivo independiente incluido en inventario y reportes', async () => {
      const job = await flow.scheduleMaintenance({ equipoId: eq.id, tecnicoId: tech.id, fechaProgramada: '2026-11-18', tipoMantenimiento: 'Preventivo', actividades: 'Limpieza interna' }, admin);
      assert.equal(job.incidenciaId, null);
      await assert.rejects(flow.advanceScheduled(job.id, '', admin), /autorizado/);
      await assert.rejects(flow.advanceScheduled(job.id, '', other), /autorizado/);
      await flow.advanceScheduled(job.id, '', tech);
      await assert.rejects(flow.advanceScheduled(job.id, 'Resultado del administrador', admin), /autorizado/);
      assert.equal((await api.getEquipoById(eq.id)).estado, 'En mantenimiento');
      await assert.rejects(flow.advanceScheduled(job.id, '', tech), /resultado/);
      const done = await flow.advanceScheduled(job.id, 'Limpieza y comprobacion completadas', tech);
      assert.equal((await api.getEquipoById(eq.id)).estado, 'Disponible');
      assert.ok(completedMaintenance(done));
      assert.ok(maintenanceForEquipment(done, eq, await api.getIncidents()));
      assert.equal((await api.getMantenimientos()).filter(m => maintenanceForEquipment(m, eq, [inc])).length, 2);
      await assert.rejects(flow.advanceScheduled(job.id, 'otra vez', tech), /finaliz/);
    });
    await t.test('predictivo exige evidencia y cierre respeta otros trabajos activos', async () => {
      const form = { equipoId: eq.id, tecnicoId: tech.id, fechaProgramada: '2026-11-19', tipoMantenimiento: 'Predictivo', actividades: 'Revisar disco' };
      await assert.rejects(flow.scheduleMaintenance(form, admin), /evidencia/);
      const job = await flow.scheduleMaintenance({ ...form, evidenciaCondicion: 'SMART: sectores pendientes en aumento' }, admin);
      const newInc = await flow.reportIncident(data, student);
      await flow.changeIncidentState(newInc.id, 'Revisada', admin);
      const repair = await flow.assignIncident(newInc.id, { tecnicoId: tech.id, fechaProgramada: '2026-11-19' }, admin);
      await flow.workOnIncident(repair.id, 'start', {}, tech);
      await flow.workOnIncident(repair.id, 'finish', { diagnostico: 'Cable suelto', actividades: 'Ajuste y prueba', tiempoEmpleado: 1 }, tech);
      await flow.advanceScheduled(job.id, '', tech);
      await flow.changeIncidentState(newInc.id, 'Cerrada', admin);
      assert.equal((await api.getEquipoById(eq.id)).estado, 'En mantenimiento');
      await flow.advanceScheduled(job.id, 'Disco reemplazado y validado', tech);
      assert.equal((await api.getEquipoById(eq.id)).estado, 'Disponible');
    });
    await t.test('finalizar un preventivo no oculta una falla pendiente', async () => {
      const job = await flow.scheduleMaintenance({ equipoId: eq.id, tecnicoId: tech.id, fechaProgramada: '2026-11-20', tipoMantenimiento: 'Preventivo', actividades: 'Limpieza' }, admin);
      const pending = await flow.reportIncident(data, student);
      await flow.advanceScheduled(job.id, '', tech);
      await flow.advanceScheduled(job.id, 'Limpieza realizada; falla pendiente de revision', tech);
      assert.equal((await api.getEquipoById(eq.id)).estado, 'Da\u00f1ado');
      await flow.removeIncident(pending.id, admin);
      assert.equal((await api.getEquipoById(eq.id)).estado, 'Disponible');
      assert.ok(maintenanceForEquipment({ incidenciaId: 12 }, eq, [{ id: '12', codigoEquipo: eq.codigoPatrimonial }]));
    });
    await t.test('falla detectada durante preventivo conserva el flujo correctivo', async () => {
      const job = await flow.scheduleMaintenance({ equipoId: eq.id, tecnicoId: tech.id, fechaProgramada: '2026-11-21', tipoMantenimiento: 'Preventivo', frecuenciaMeses: 3, actividades: 'Inspeccion preventiva' }, admin);
      await flow.advanceScheduled(job.id, '', tech);
      await assert.rejects(flow.reportIncident(data, student));
      await assert.rejects(flow.reportIncident({ ...data, origenMantenimientoId: job.id }, other));
      await assert.rejects(flow.reportIncident({ ...data, origenMantenimientoId: job.id }, admin), /t\u00e9cnico/);
      const detected = await flow.reportIncident({ ...data, origenMantenimientoId: job.id }, tech);
      assert.equal(detected.origenMantenimientoId, job.id);
      assert.equal((await api.getEquipoById(eq.id)).estado, 'En mantenimiento');
      await flow.advanceScheduled(job.id, 'Inspeccion completada; incidencia registrada', tech);
      assert.equal((await api.getEquipoById(eq.id)).estado, 'Da\u00f1ado');
      await flow.changeIncidentState(detected.id, 'Revisada', admin);
      const repair = await flow.assignIncident(detected.id, { tecnicoId: tech.id, fechaProgramada: '2026-11-22' }, admin);
      await flow.workOnIncident(repair.id, 'start', {}, tech);
      await flow.workOnIncident(repair.id, 'finish', { diagnostico: 'Conexion averiada', actividades: 'Reemplazo y prueba', tiempoEmpleado: 1 }, tech);
      await flow.changeIncidentState(detected.id, 'Cerrada', admin);
      assert.equal((await api.getEquipoById(eq.id)).estado, 'Disponible');
      await assert.rejects(flow.scheduleMaintenance({ equipoId: eq.id, tecnicoId: tech.id, fechaProgramada: '2026-11-22', tipoMantenimiento: 'Correctivo', actividades: 'Intento independiente' }, admin), /Tipo/);
    });
    await t.test('busqueda exacta por codigo conserva ceros iniciales', async () => {
      const equipment = await api.createEquipo({ ...eq, id: undefined, codigoPatrimonial: '074089950422' });
      assert.equal((await api.getEquipoByCodigo(' 074089950422 ')).id, equipment.id);
      assert.equal(await api.getEquipoByCodigo('74089950422'), null);
      assert.equal(await api.getEquipoByCodigo('NO-EXISTE'), null);
      assert.equal((await api.getEquipoByCodigo(eq.codigoPatrimonial)).id, eq.id);
    });
    assert.equal(await readFile('src/data/db.json', 'utf8'), original, 'La base real no debe cambiar');
  } finally {
    if (server.exitCode === null) { server.kill(); await once(server, 'exit'); }
    assert.ok(resolve(dir).startsWith(resolve(tmpdir()) + '\\') || resolve(dir).startsWith(resolve(tmpdir()) + '/'));
    await rm(dir, { recursive: true, force: true });
  }
});

// A corrective repair must not reset the preventive schedule.
test('seguimiento preventivo usa su propia frecuencia y respeta estado operativo', () => {
  const eq = { id: 'eq1', codigoPatrimonial: '00001', estado: 'Disponible', fechaAdquisicion: '2026-01-31' };
  assert.equal(addMonths('2026-01-31', 1), '2026-02-28');
  assert.equal(preventiveSchedule(eq, [], [], '2026-11-16').label, 'Preventivo vencido');
  const preventive = { equipoId: eq.id, tipoMantenimiento: 'Preventivo', fechaFin: '2026-10-01', frecuenciaMeses: 3 };
  const corrective = { equipoId: eq.id, tipoMantenimiento: 'Correctivo', fechaFin: '2026-11-16' };
  const tracking = preventiveSchedule(eq, [preventive, corrective], [], '2026-11-16');
  assert.equal(tracking.next, '2027-01-01');
  assert.equal(tracking.label, 'Preventivo al d\u00eda');
  assert.equal(eq.estado, 'Disponible');
  const planned = { equipoId: eq.id, tipoMantenimiento: 'Preventivo', fechaProgramada: '2026-11-20' };
  assert.equal(preventiveSchedule(eq, [preventive, planned], [], '2026-11-16').label, 'Preventivo programado');
  assert.equal(preventiveSchedule({ ...eq, estado: 'Retirado' }, [], [], '2026-11-16').next, null);
  assert.equal(maintenanceForEquipment({ equipoId: 'otro', codigoEquipo: eq.codigoPatrimonial }, eq), false);
});

test('selector y acciones respetan incidencias abiertas y tecnico asignado', () => {
  const eq = { id: '1', codigoPatrimonial: '740899504221', estado: 'Disponible' };
  assert.equal(equipmentCanBeScheduled(eq, [{ equipoId: 1, estado: 'Cerrada' }]), true);
  for (const estado of ['Reportada', 'Revisada', 'Asignada', 'Reparada']) {
    assert.equal(equipmentCanBeScheduled(eq, [{ equipoId: 1, estado }]), false);
    assert.equal(equipmentCanBeScheduled(eq, [{ codigoEquipo: eq.codigoPatrimonial, estado }]), false);
  }
  for (const estado of ['Da\u00f1ado', 'En mantenimiento', 'Retirado']) assert.equal(equipmentCanBeScheduled({ ...eq, estado }, []), false);
  assert.equal(canExecuteMaintenance({ tecnicoId: 10 }, { id: '10', rol: 'tecnico' }), true);
  assert.equal(canExecuteMaintenance({ tecnicoId: 10 }, { id: '10', rol: 'administrador' }), false);
  assert.equal(canExecuteMaintenance({ tecnicoId: 10 }, { id: 11, rol: 'tecnico' }), false);
});
test('migracion ficticia mantiene IDs, relaciones y datos de atencion', () => {
  const original = { equipos: [{ id: 'e1', codigoPatrimonial: 'ANTIGUO' }], incidencias: [{ id: 'inc', codigoEquipo: 'ANTIGUO', descripcion: 'Falla existente' }], mantenimientos: [{ id: 'work', incidenciaId: 'inc', tecnicoId: 't1', resultado: 'Resultado existente' }], historialIncidencias: [{ id: 'h1', incidenciaId: 'inc', accion: 'Atencion' }] };
  const { data } = migrateDemoInventoryCodes(original);
  assert.equal(data.equipos[0].id, 'e1');
  assert.equal(data.equipos[0].codigoPatrimonial, '740899504221');
  assert.equal(data.equipos[0].codigoInventarioFicticio, true);
  assert.equal(data.incidencias[0].id, 'inc');
  assert.equal(data.incidencias[0].equipoId, 'e1');
  assert.equal(data.mantenimientos[0].equipoId, 'e1');
  assert.equal(data.mantenimientos[0].codigoEquipo, data.equipos[0].codigoPatrimonial);
  assert.equal(data.mantenimientos[0].resultado, original.mantenimientos[0].resultado);
  assert.deepEqual(data.historialIncidencias, original.historialIncidencias);
  assert.equal(original.equipos[0].codigoPatrimonial, 'ANTIGUO');
});
