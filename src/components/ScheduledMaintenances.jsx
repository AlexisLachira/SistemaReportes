import { useContext, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { scheduleMaintenance, advanceScheduled } from '../services/workflow';
import { maintenanceState, sameId, equipmentCanBeScheduled, canExecuteMaintenance } from '../domain/maintenance';
import { AuthContext } from '../auth/AuthContext';
import { getEquipos, getMantenimientos, getTecnicos, getIncidents } from '../services/api';

const initial = { equipoId: '', tecnicoId: '', tipoMantenimiento: 'Preventivo', fechaProgramada: '', frecuenciaMeses: 6, actividades: '', evidenciaCondicion: '' };
export default function ScheduledMaintenances() {
  const { user } = useContext(AuthContext);
  const [params] = useSearchParams();
  const selectedId = params.get('equipoId') || '';
  const admin = user?.rol === 'administrador';
  const [items, setItems] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [incidencias, setIncidencias] = useState([]);
  const [form, setForm] = useState({ ...initial, equipoId: selectedId });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState({});
  const [filter, setFilter] = useState('');
  useEffect(() => {
    let alive = true;
    Promise.all([getMantenimientos(), getEquipos(), getTecnicos(), getIncidents()]).then(([m, e, t, i]) => {
      if (!alive) return;
      setItems(m.filter(x => !x.incidenciaId)); setEquipos(e); setTecnicos(t); setIncidencias(i);
    }).catch(() => { if (alive) setError('No se pudieron cargar los trabajos programados.'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);
  const change = e => setForm({ ...form, [e.target.name]: e.target.value });
  const save = async e => {
    e.preventDefault(); setError(''); setNotice(''); setBusy(true);
    try {
      const item = await scheduleMaintenance(form, user);
      setItems(prev => [...prev, item]); setForm({ ...initial, equipoId: selectedId });
      setNotice('Mantenimiento programado. El equipo conserva su disponibilidad hasta iniciar el trabajo.');
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  const advance = async item => {
    setBusy(true); setError(''); setNotice('');
    try {
      const updated = await advanceScheduled(item.id, results[item.id], user);
      setItems(prev => prev.map(x => sameId(x.id, item.id) ? updated : x));
      setNotice(updated.fechaFin ? 'Trabajo finalizado y resultado guardado.' : 'Trabajo iniciado.');
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  const eligible = equipos.filter(e => equipmentCanBeScheduled(e, incidencias));
  const validSelection = eligible.some(e => sameId(e.id, form.equipoId));
  const visible = items.filter(x => (admin || sameId(x.tecnicoId, user?.id)) && (!filter || maintenanceState(x) === filter));
  return <section className="card shadow-sm mb-4"><div className="card-body">
    <h2 className="h5">Mantenimientos programados por equipo</h2>
    <p className="text-muted small">El preventivo se programa por fecha. El predictivo documenta una evaluación basada en mediciones y análisis; no genera predicciones automáticas. Las reparaciones de fallas se asignan desde una incidencia.</p>
    {error && <div className="alert alert-danger" role="alert">{error}</div>}
    {notice && <div className="alert alert-success" role="status">{notice}</div>}
    {admin && <form onSubmit={save} className="row g-3 mb-4">
      <p className="text-muted small mb-0">Solo se pueden programar equipos disponibles sin incidencias abiertas.</p>
      <div className="col-md-6"><label className="form-label w-100">Equipo<select required className="form-select" name="equipoId" value={validSelection ? form.equipoId : ''} onChange={change}><option value="">Seleccione...</option>{eligible.map(x => <option key={x.id} value={x.id}>{x.codigoPatrimonial} — {x.marca} {x.modelo}</option>)}</select></label></div>
      <div className="col-md-6"><label className="form-label w-100">Técnico<select required className="form-select" name="tecnicoId" value={form.tecnicoId} onChange={change}><option value="">Seleccione...</option>{tecnicos.filter(t => t.estado === 'Activo').map(t => <option key={t.id} value={t.id}>{t.nombres} {t.apellidos}</option>)}</select></label></div>
      <div className="col-md-4"><label className="form-label w-100">Tipo<select className="form-select" name="tipoMantenimiento" value={form.tipoMantenimiento} onChange={change}>{['Preventivo', 'Predictivo'].map(t => <option key={t}>{t}</option>)}</select></label></div>
      <div className="col-md-4"><label className="form-label w-100">Fecha programada<input required type="date" className="form-control" name="fechaProgramada" value={form.fechaProgramada} onChange={change} /></label></div>
      {form.tipoMantenimiento === 'Preventivo' && <div className="col-md-4"><label className="form-label w-100">Frecuencia (meses)<input required type="number" min="1" max="60" step="1" className="form-control" name="frecuenciaMeses" value={form.frecuenciaMeses} onChange={change} /></label></div>}
      <div className="col-12"><label className="form-label w-100">Actividades previstas<textarea required className="form-control" name="actividades" value={form.actividades} onChange={change} /></label></div>
      {form.tipoMantenimiento === 'Predictivo' && <div className="col-12"><label className="form-label w-100">Mediciones y análisis de condición<textarea required className="form-control" name="evidenciaCondicion" value={form.evidenciaCondicion} onChange={change} placeholder="Indicador, fechas, valores, tendencia y criterio técnico que justifican la intervención" /></label></div>}
      <div><button disabled={busy || loading || !validSelection} className="btn btn-primary">Programar mantenimiento</button></div>
    </form>}
    <label className="form-label">Estado de trabajos programados<select className="form-select mb-3" value={filter} onChange={e => setFilter(e.target.value)}><option value="">Todos</option>{['Programado','En proceso','Finalizado'].map(s => <option key={s}>{s}</option>)}</select></label>
    {loading ? <p role="status">Cargando trabajos...</p> : visible.length === 0 && <p className="text-muted">No hay trabajos programados para mostrar.</p>}
    {visible.map(item => {
      const equipment = equipos.find(e => sameId(e.id, item.equipoId));
      const state = maintenanceState(item);
      const canExecute = canExecuteMaintenance(item, user);
      return <article key={item.id} className="border rounded p-3 mb-2">
        <div className="d-flex justify-content-between gap-2"><strong>{equipment?.codigoPatrimonial || item.codigoEquipo} — {item.tipoMantenimiento}</strong><span className="badge bg-secondary">{state}</span></div>
        <p className="small mt-2">Fecha: {item.fechaProgramada} · Técnico: {tecnicos.find(t => sameId(t.id, item.tecnicoId))?.nombres || item.tecnicoId}</p>
        <p>Actividades: {item.actividades}</p>{item.evidenciaCondicion && <p>Evaluación: {item.evidenciaCondicion}</p>}
        {item.resultado && <p>Resultado: {item.resultado}</p>}
        {canExecute && state === 'En proceso' && <label className="form-label w-100">Resultado del trabajo<textarea className="form-control" value={results[item.id] || ''} onChange={e => setResults({ ...results, [item.id]: e.target.value })} /></label>}
        <div className="d-flex flex-wrap gap-2">
          {canExecute && ['Programado', 'En proceso'].includes(state) && <button type="button" disabled={busy} className="btn btn-outline-primary" onClick={() => advance(item)}>{state === 'Programado' ? 'Iniciar trabajo' : 'Finalizar trabajo'}</button>}
          {canExecute && state === 'En proceso' && <Link className="btn btn-outline-danger" to={`/nueva-incidencia?equipoId=${encodeURIComponent(item.equipoId)}&origenMantenimientoId=${encodeURIComponent(item.id)}`}>Reportar falla detectada</Link>}
          {equipment && <Link className="btn btn-outline-info" to={`/equipo/${encodeURIComponent(equipment.codigoPatrimonial)}/historial`}>Ver historial</Link>}
        </div>
      </article>;
    })}
  </div></section>;
}
