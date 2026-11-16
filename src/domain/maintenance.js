export const sameId = (a, b) => a != null && b != null && String(a) === String(b);
export const incidentForEquipment = (incident, equipment) => incident.equipoId
  ? sameId(incident.equipoId, equipment.id)
  : incident.codigoEquipo === equipment.codigoPatrimonial;
export const maintenanceForEquipment = (maintenance, equipment, incidents = []) => {
  if (maintenance.equipoId) return sameId(maintenance.equipoId, equipment.id);
  if (maintenance.incidenciaId) return incidents.some(i => sameId(i.id, maintenance.incidenciaId) && incidentForEquipment(i, equipment));
  return maintenance.codigoEquipo === equipment.codigoPatrimonial;
};
export const completedMaintenance = m => Boolean(m.fechaFin);
export const maintenanceState = m => m.fechaFin ? 'Finalizado' : m.fechaInicio ? 'En proceso' : 'Programado';
export const userName = user => user?.nombre || [user?.nombres, user?.apellidos].filter(Boolean).join(' ') || user?.codigo || 'Usuario';
export function addMonths(date, months) {
  const d = new Date(date);
  if (!Number.isFinite(d.getTime())) return null;
  const day = d.getUTCDate();
  d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() + months);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return d.toISOString().slice(0, 10);
}
export function preventiveSchedule(equipment, maintenance, incidents = [], today = new Date().toISOString().slice(0, 10)) {
  if (equipment.estado === 'Retirado') return { label: 'No aplica (retirado)', next: null, last: null };
  const own = maintenance.filter(m => m.tipoMantenimiento === 'Preventivo' && maintenanceForEquipment(m, equipment, incidents));
  const active = own.find(m => maintenanceState(m) === 'En proceso');
  const pending = own.filter(m => maintenanceState(m) === 'Programado' && m.fechaProgramada).sort((a, b) => a.fechaProgramada.localeCompare(b.fechaProgramada))[0];
  const last = own.filter(m => m.fechaFin).sort((a, b) => new Date(b.fechaFin) - new Date(a.fechaFin))[0];
  const next = pending?.fechaProgramada || addMonths(last?.fechaFin || equipment.fechaAdquisicion, Number(last?.frecuenciaMeses) || 6);
  if (active) return { label: 'Preventivo en proceso', next: active.fechaProgramada, last: last?.fechaFin };
  if (!next) return { label: 'Sin programación', next: null, last: last?.fechaFin };
  const days = (new Date(next) - new Date(today)) / 86400000;
  return { label: days < 0 ? 'Preventivo vencido' : pending ? 'Preventivo programado' : days <= 30 ? 'Preventivo próximo' : 'Preventivo al día', next, last: last?.fechaFin };
}

export const equipmentCanBeScheduled = (equipment, incidents = []) => equipment.estado === 'Disponible' && !incidents.some(i => incidentForEquipment(i, equipment) && i.estado !== 'Cerrada');
export const canExecuteMaintenance = (maintenance, user) => user?.rol === 'tecnico' && sameId(maintenance.tecnicoId, user.id);
