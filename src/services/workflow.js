import * as api from './api.js';
import { sameId, maintenanceForEquipment, incidentForEquipment, userName, equipmentCanBeScheduled, canExecuteMaintenance } from '../domain/maintenance.js';

const requireRole = (user, role) => {
  if (user?.rol !== role) throw new Error('No tiene permiso para esta operación.');
};
const audit = (inc, user, accion, observacion = '') => api.createHistorial({ incidenciaId: inc.id, usuario: userName(user), accion, observacion });
const currentMaintenance = async id => {
  const item = (await api.getMantenimientos()).find(m => sameId(m.id, id));
  if (!item) throw new Error('Mantenimiento no encontrado.');
  return item;
};
const equipmentOf = async (item) => {
  const eq = (await api.getEquipos()).find(e => sameId(e.id, item.equipoId) || e.codigoPatrimonial === item.codigoEquipo);
  if (!eq) throw new Error('Equipo no encontrado.');
  return eq;
};
async function releaseEquipment(eq) {
  const [incidents, maintenance] = await Promise.all([api.getIncidents(), api.getMantenimientos()]);
  const active = maintenance.some(m => maintenanceForEquipment(m, eq, incidents) && m.fechaInicio && !m.fechaFin);
  const open = incidents.some(i => incidentForEquipment(i, eq) && i.estado !== 'Cerrada');
  if (eq.estado !== 'Retirado') await api.updateEquipo(eq.id, { ...eq, estado: active ? 'En mantenimiento' : open ? 'Dañado' : 'Disponible' });
}
export async function reportIncident(data, user) {
  if (!user) throw new Error('Inicie sesión.');
  const eq = await equipmentOf(data);
  const incidents = await api.getIncidents();
  const origin = data.origenMantenimientoId ? await currentMaintenance(data.origenMantenimientoId) : null;
  const foundDuringWork = origin && !origin.fechaFin && origin.fechaInicio && sameId(origin.equipoId, eq.id) && canExecuteMaintenance(origin, user);
  if (origin && !foundDuringWork) throw new Error('Solo el técnico asignado puede reportar fallas de un trabajo en proceso.');
  if ((eq.estado !== 'Disponible' && !(eq.estado === 'En mantenimiento' && foundDuringWork)) || incidents.some(i => incidentForEquipment(i, eq) && i.estado !== 'Cerrada')) throw new Error('El equipo ya tiene una incidencia abierta o no está disponible.');
  const inc = await api.createIncident({ ...data, equipoId: eq.id, codigoEquipo: eq.codigoPatrimonial, tipoEquipo: eq.tipoEquipo, laboratorio: eq.laboratorio, reportante: userName(user), reportanteId: user.id, estado: 'Reportada' });
  if (eq.estado !== 'En mantenimiento') await api.updateEquipo(eq.id, { ...eq, estado: 'Dañado' });
  await audit(inc, user, 'Reportó incidencia', inc.descripcion);
  return inc;
}
export async function changeIncidentState(id, state, user) {
  requireRole(user, 'administrador');
  const inc = await api.getIncidentById(id);
  if (!((inc.estado === 'Reportada' && state === 'Revisada') || (inc.estado === 'Reparada' && state === 'Cerrada'))) throw new Error('Transición de incidencia no permitida.');
  const updated = await api.updateIncident(id, { ...inc, estado: state });
  if (state === 'Cerrada') await releaseEquipment(await equipmentOf(inc));
  await audit(updated, user, `Cambió estado a ${state}`);
  return updated;
}
export async function assignIncident(id, form, user) {
  requireRole(user, 'administrador');
  const [inc, maintenance, technicians] = await Promise.all([api.getIncidentById(id), api.getMantenimientos(), api.getTecnicos()]);
  if (inc.estado !== 'Revisada' || maintenance.some(m => sameId(m.incidenciaId, id))) throw new Error('La incidencia no está revisada o ya tiene mantenimiento.');
  const tech = technicians.find(t => sameId(t.id, form.tecnicoId) && t.estado === 'Activo');
  if (!tech) throw new Error('Seleccione un técnico activo.');
  if (!form.fechaProgramada) throw new Error('Seleccione una fecha programada.');
  // A reported equipment failure is corrective; preventive/predictive jobs are scheduled separately.
  const mant = await api.createMantenimiento({ ...form, incidenciaId: inc.id, equipoId: inc.equipoId || (await equipmentOf(inc)).id, codigoEquipo: inc.codigoEquipo, tecnicoId: tech.id, nombreTecnico: tech.nombre || `${tech.nombres} ${tech.apellidos}`, tipoMantenimiento: 'Correctivo', estado: 'Programado', fechaInicio: '', fechaFin: '' });
  await api.updateIncident(id, { ...inc, estado: 'Asignada' });
  await audit(inc, user, 'Asignó técnico', mant.nombreTecnico);
  return mant;
}
export async function workOnIncident(id, action, data, user) {
  requireRole(user, 'tecnico');
  const mant = await currentMaintenance(id);
  const inc = await api.getIncidentById(mant.incidenciaId);
  if (!sameId(mant.tecnicoId, user.id) || inc.estado !== 'Asignada' || mant.fechaFin) throw new Error('El trabajo no está activo o no le pertenece.');
  const eq = await equipmentOf(inc);
  if (eq.estado === 'Retirado') throw new Error('El equipo está retirado.');
  if (!['start', 'save', 'finish'].includes(action)) throw new Error('Acción inválida.');
  if (action !== 'start' && !mant.fechaInicio) throw new Error('Inicie el trabajo antes de registrar avances.');
  if (action === 'start' && mant.fechaInicio) throw new Error('El trabajo ya se inició.');
  if (action === 'finish' && (!data.diagnostico?.trim() || !data.actividades?.trim() || !(Number.isFinite(Number(data.tiempoEmpleado)) && Number(data.tiempoEmpleado) > 0))) throw new Error('Complete diagnóstico, actividades y un tiempo mayor que cero.');
  const now = new Date().toISOString();
  const fields = Object.fromEntries(['diagnostico','actividades','repuestos','observacionesTecnico','tiempoEmpleado'].filter(k => data[k] !== undefined).map(k => [k, data[k]]));
  const updated = await api.updateMantenimiento(id, { ...mant, ...fields, estado: action === 'finish' ? 'Finalizado' : 'En proceso', fechaInicio: mant.fechaInicio || now, ...(action === 'finish' ? { fechaFin: now } : {}) });
  if (action === 'start') await api.updateEquipo(eq.id, { ...eq, estado: 'En mantenimiento' });
  if (action === 'finish') await api.updateIncident(inc.id, { ...inc, estado: 'Reparada' });
  await audit(inc, user, action === 'start' ? 'Inició mantenimiento' : action === 'finish' ? 'Finalizó mantenimiento' : 'Actualizó progreso');
  return updated;
}
export async function scheduleMaintenance(form, user) {
  requireRole(user, 'administrador');
  const eq = await equipmentOf(form);
  const incidents = await api.getIncidents();
  if (!equipmentCanBeScheduled(eq, incidents)) throw new Error('Solo puede programar equipos disponibles sin incidencias abiertas.');
  const tech = (await api.getTecnicos()).find(t => sameId(t.id, form.tecnicoId) && t.estado === 'Activo');
  if (eq.estado === 'Retirado' || !tech || !form.fechaProgramada || !form.actividades?.trim()) throw new Error('Seleccione equipo vigente, técnico activo, fecha y actividades.');
  if (!['Preventivo','Predictivo'].includes(form.tipoMantenimiento)) throw new Error('Tipo inválido.');
  if (form.tipoMantenimiento === 'Preventivo' && (!Number.isInteger(Number(form.frecuenciaMeses || 6)) || Number(form.frecuenciaMeses || 6) < 1 || Number(form.frecuenciaMeses || 6) > 60)) throw new Error('La frecuencia debe ser de 1 a 60 meses.');
  if (form.tipoMantenimiento === 'Predictivo' && !form.evidenciaCondicion?.trim()) throw new Error('El predictivo requiere evidencia de condición.');
  return api.createMantenimiento({ ...form, frecuenciaMeses: form.tipoMantenimiento === 'Preventivo' ? Number(form.frecuenciaMeses || 6) : null, equipoId: eq.id, codigoEquipo: eq.codigoPatrimonial, tecnicoId: tech.id, incidenciaId: null, estado: 'Programado', fechaInicio: null, fechaFin: null, resultado: '' });
}
export async function advanceScheduled(id, result, user) {
  const mant = await currentMaintenance(id);
  if (!canExecuteMaintenance(mant, user) || mant.incidenciaId) throw new Error('Trabajo no autorizado.');
  if (!['Programado','En proceso'].includes(mant.estado)) throw new Error('El trabajo ya finalizó.');
  const eq = await equipmentOf(mant);
  const finish = mant.estado === 'En proceso';
  if (eq.estado === 'Retirado') throw new Error('El equipo está retirado.');
  if (finish && !result?.trim()) throw new Error('Registre el resultado del trabajo.');
  const now = new Date().toISOString();
  const updated = await api.updateMantenimiento(id, { ...mant, estado: finish ? 'Finalizado' : 'En proceso', ...(finish ? { fechaFin: now, resultado: result.trim() } : { fechaInicio: now }) });
  if (finish) await releaseEquipment(eq);
  else await api.updateEquipo(eq.id, { ...eq, estado: 'En mantenimiento' });
  return updated;
}

export async function removeIncident(id, user) {
  requireRole(user, 'administrador');
  const inc = await api.getIncidentById(id);
  if ((await api.getMantenimientos()).some(m => sameId(m.incidenciaId, id))) throw new Error('No se puede eliminar una incidencia con mantenimiento. Conserve su trazabilidad.');
  await api.deleteIncident(id);
  await releaseEquipment(await equipmentOf(inc));
}
