import { preventiveSchedule, equipmentCanBeScheduled } from '../domain/maintenance';
import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { getEquipos, deleteEquipo, getIncidents, getMantenimientos } from '../services/api';
import { AuthContext } from '../auth/AuthContext';

function EquipmentList() {
  const [equipos, setEquipos] = useState([]);
  const [incidencias, setIncidencias] = useState([]);
  const [mantenimientos, setMantenimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  // Filtros
  const [filtroCodigo, setFiltroCodigo] = useState('');
  const [filtroLab, setFiltroLab] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroSeguimiento, setFiltroSeguimiento] = useState('');

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [eqData, incData, mantData] = await Promise.all([
        getEquipos(),
        getIncidents(),
        getMantenimientos()
      ]);
      setEquipos(eqData);
      setIncidencias(incData);
      setMantenimientos(mantData);
    } catch (error) {
      console.error('Error al cargar datos del inventario:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(cargarDatos);
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de eliminar este equipo?')) {
      try {
        await deleteEquipo(id);
        cargarDatos();
      } catch (error) {
        window.alert(error.message);
      }
    }
  };

  const getCriticidadBadge = (criticidad) => {
    switch (criticidad) {
      case 'Baja': return 'bg-success';
      case 'Media': return 'bg-info text-dark';
      case 'Alta': return 'bg-warning text-dark';
      case 'Crítica': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  const getEstadoBadge = (estado) => {
    switch (estado) {
      case 'Disponible': return 'bg-success';
      case 'En mantenimiento': return 'bg-warning text-dark';
      case 'Dañado': return 'bg-danger';
      case 'Retirado': return 'bg-secondary';
      default: return 'bg-dark';
    }
  };

  const getMantenimientoBadge = (estado) => {
    switch (estado) {
      case 'Preventivo al día': return 'bg-success';
      case 'Preventivo próximo': return 'bg-info text-dark';
      case 'Preventivo vencido': return 'bg-warning text-dark';
      case 'Preventivo en proceso': return 'bg-danger';
      case 'Preventivo programado': return 'bg-dark text-white'; 
      default: return 'bg-secondary';
    }
  };

  const calcularAntiguedad = (fechaAdquisicion) => {
    if (!fechaAdquisicion) return 'Desconocida';
    const ac = new Date();
    const fa = new Date(fechaAdquisicion);
    let años = ac.getFullYear() - fa.getFullYear();
    let meses = ac.getMonth() - fa.getMonth();
    if (meses < 0) {
      años--;
      meses += 12;
    }
    if (años === 0 && meses === 0) return 'Nuevo';
    return `${años > 0 ? años + ' años' : ''} ${meses > 0 ? meses + ' meses' : ''}`.trim();
  };

  const laboratorios = ['Laboratorio 1', 'Laboratorio 2', 'Laboratorio 3', 'Laboratorio 4', 'Administración'];
  const tipos = ['PC', 'Monitor', 'Impresora', 'Router', 'Switch', 'Proyector', 'Otro'];

  const equiposProcesados = equipos.map(e => ({
    ...e,
    seguimiento: preventiveSchedule(e, mantenimientos, incidencias),
    antiguedadTexto: calcularAntiguedad(e.fechaAdquisicion)
  }));

  const equiposFiltrados = equiposProcesados.filter(e => {
    return (
      (filtroCodigo === '' || e.codigoPatrimonial.toLowerCase().includes(filtroCodigo.toLowerCase())) &&
      (filtroLab === '' || e.laboratorio === filtroLab) &&
      (filtroTipo === '' || e.tipoEquipo === filtroTipo) &&
      (filtroEstado === '' || e.estado === filtroEstado) &&
      (!filtroSeguimiento || e.seguimiento.label === filtroSeguimiento) // Changed to use e.estado (operational)
    );
  });

  return (
    <div className="card border-0 shadow-sm mt-4">
      <div className="card-header bg-white border-bottom-0 pt-3 pb-0">
        <h5 className="mb-0 fw-bold"><i className="bi bi-pc-display me-2 text-primary"></i>Inventario de Equipos</h5>
      </div>
      
      <div className="card-body">
        {/* Filtros */}
        <div className="row g-2 mb-4">
          <div className="col-12 col-md-3">
            <input 
              type="text" 
              className="form-control form-control-sm" 
              placeholder="Buscar por código..." 
              value={filtroCodigo}
              onChange={(e) => setFiltroCodigo(e.target.value)}
            />
          </div>
          <div className="col-12 col-md-3">
            <select className="form-select form-select-sm" value={filtroLab} onChange={(e) => setFiltroLab(e.target.value)}>
              <option value="">Todos los laboratorios</option>
              {laboratorios.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div className="col-12 col-md-3">
            <select className="form-select form-select-sm" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
              <option value="">Todos los tipos</option>
              {tipos.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="col-12 col-md-3">
            <select className="form-select form-select-sm" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
              <option value="">Todos los estados</option>
              {['Disponible', 'En mantenimiento', 'Dañado', 'Retirado'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <label className="form-label small">Seguimiento preventivo<select className="form-select form-select-sm mb-3" value={filtroSeguimiento} onChange={e => setFiltroSeguimiento(e.target.value)}><option value="">Todos</option>{['Preventivo vencido', 'Preventivo próximo', 'Preventivo programado', 'Preventivo en proceso', 'Preventivo al día', 'Sin programación', 'No aplica (retirado)'].map(s => <option key={s}>{s}</option>)}</select></label>
        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Código</th>
                  <th>Tipo</th>
                  <th>Marca/Modelo</th>
                  <th>Laboratorio</th>
                  <th>Criticidad</th>
                  <th>Antigüedad</th>
                  <th>Operativo</th>
                  <th>Seguimiento de mantenimiento</th><th>Evaluación del equipo</th>
                  <th className="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {equiposFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center text-muted py-4">
                      No se encontraron equipos.
                    </td>
                  </tr>
                ) : (
                  equiposFiltrados.map((equipo) => (
                    <tr key={equipo.id}>
                      <td><span className="fw-semibold text-primary">{equipo.codigoPatrimonial}</span>{equipo.codigoInventarioFicticio && <small className="d-block text-muted">Código ficticio</small>}</td>
                      <td>{equipo.tipoEquipo}</td>
                      <td>{equipo.marca} {equipo.modelo}</td>
                      <td>{equipo.laboratorio}</td>
                      <td>
                        <span className={`badge border ${getCriticidadBadge(equipo.criticidad || 'Media')}`}>
                          {equipo.criticidad || 'Media'}
                        </span>
                      </td>
                      <td className="text-muted small">{equipo.antiguedadTexto}</td>
                      <td>
                        <span className={`badge ${getEstadoBadge(equipo.estado)}`}>
                          {equipo.estado}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getMantenimientoBadge(equipo.seguimiento.label)}`}>
                          {equipo.seguimiento.label}
                        </span>
                        <small className="d-block text-muted">{equipo.seguimiento.next ? `Fecha: ${equipo.seguimiento.next}` : 'Sin fecha prevista'}</small>
                      </td>
                      <td><small>{new Date().getFullYear() - new Date(equipo.fechaAdquisicion).getFullYear() >= 5 ? 'Evaluar reemplazo' : incidencias.filter(i => String(i.equipoId) === String(equipo.id) || i.codigoEquipo === equipo.codigoPatrimonial).length >= 3 ? 'Revisar fallas recurrentes' : 'Sin recomendación'}</small></td>
                      <td className="text-end">
                        <Link to={`/equipo/${equipo.codigoPatrimonial}/historial`} className="btn btn-sm btn-outline-info me-2" title="Ver Historial">
                          <i className="bi bi-clock-history"></i>
                        </Link>
                        {user?.rol === 'administrador' && (
                          <>
                            {equipmentCanBeScheduled(equipo, incidencias) && <Link to={`/mantenimientos?equipoId=${encodeURIComponent(equipo.id)}`} className="btn btn-sm btn-outline-success me-2" title="Programar mantenimiento"><i className="bi bi-calendar-plus"></i></Link>}
                            <Link to={`/editar-equipo/${equipo.id}`} className="btn btn-sm btn-outline-primary me-2" title="Editar">
                              <i className="bi bi-pencil"></i>
                            </Link>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(equipo.id)} title="Eliminar">
                              <i className="bi bi-trash"></i>
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default EquipmentList;
