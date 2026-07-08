import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../auth/AuthContext';
import { getEquipos, getIncidents, getMantenimientos, getHistorial } from '../services/api';

function EquipmentHistory() {
  const { codigo } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [equipo, setEquipo] = useState(null);
  const [incidencias, setIncidencias] = useState([]);
  const [mantenimientos, setMantenimientos] = useState([]);
  const [historialEventos, setHistorialEventos] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('resumen');

  // Filtros
  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const [allEquipos, allIncidencias, allMants, allHist] = await Promise.all([
          getEquipos(),
          getIncidents(),
          getMantenimientos(),
          getHistorial()
        ]);

        const eq = allEquipos.find(e => e.codigoPatrimonial === codigo);
        if (!eq) {
          setError('Equipo no encontrado.');
          return;
        }

        // Obtener todas las incidencias de este equipo
        const eqIncs = allIncidencias.filter(i => i.codigoEquipo === codigo);
        
        // Seguridad:
        if (user.rol === 'alumno') {
          const hasReported = eqIncs.some(i => i.reportante === user.nombre || i.reportante === user.codigo);
          if (!hasReported) {
            setError('Acceso denegado: No tienes permisos para ver el historial de este equipo.');
            return;
          }
        } else if (user.rol === 'tecnico') {
          // Obtener los ids de incidencia de este equipo
          const eqIncIds = eqIncs.map(i => i.id);
          // Verificar si el técnico ha hecho mantenimiento en alguna
          const hasMaintained = allMants.some(m => eqIncIds.includes(m.incidenciaId) && m.tecnicoId === user.id);
          if (!hasMaintained) {
            setError('Acceso denegado: No tienes permisos para ver el historial de este equipo.');
            return;
          }
        }

        // Llenar estados
        setEquipo(eq);
        setIncidencias(eqIncs);
        
        const eqIncIds = eqIncs.map(i => i.id);
        const eqMants = allMants.filter(m => eqIncIds.includes(m.incidenciaId));
        setMantenimientos(eqMants);

        const eqHist = allHist.filter(h => eqIncIds.includes(h.incidenciaId));
        setHistorialEventos(eqHist.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)));

      } catch (err) {
        console.error(err);
        setError('Ocurrió un error al cargar el historial.');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [codigo, user]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-5 text-muted">
        <i className="bi bi-x-circle text-danger fs-1 mb-3 d-block"></i>
        <h4>{error}</h4>
        <button className="btn btn-primary mt-3" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left me-2"></i>Volver
        </button>
      </div>
    );
  }

  // Cálculos estadísticos
  const totalIncidencias = incidencias.length;
  const prevCount = mantenimientos.filter(m => m.tipoMantenimiento === 'Preventivo').length;
  const corrCount = mantenimientos.filter(m => m.tipoMantenimiento === 'Correctivo' || !m.tipoMantenimiento).length;
  
  const cerrados = mantenimientos.filter(m => m.fechaInicio && m.fechaFin);
  let tiempoPromedio = 0;
  if (cerrados.length > 0) {
    const totalDias = cerrados.reduce((acc, m) => {
      const inicio = new Date(m.fechaInicio);
      const fin = new Date(m.fechaFin);
      const diffTime = Math.abs(fin - inicio);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return acc + (diffDays === 0 ? 1 : diffDays);
    }, 0);
    tiempoPromedio = (totalDias / cerrados.length).toFixed(1);
  }

  const ultimaReparacion = cerrados.length > 0 
    ? cerrados.sort((a, b) => new Date(b.fechaFin) - new Date(a.fechaFin))[0].fechaFin 
    : 'Ninguna';

  // Combinación para la tabla
  let tablaData = mantenimientos.map(mant => {
    const inc = incidencias.find(i => i.id === mant.incidenciaId);
    return { ...mant, inc };
  });

  // Filtros
  if (filtroFecha) {
    tablaData = tablaData.filter(d => (d.fechaInicio && d.fechaInicio.includes(filtroFecha)) || (d.inc.fecha && d.inc.fecha.includes(filtroFecha)));
  }
  if (filtroTipo) {
    tablaData = tablaData.filter(d => (d.tipoMantenimiento || 'Correctivo') === filtroTipo);
  }
  if (filtroEstado) {
    tablaData = tablaData.filter(d => d.inc.estado === filtroEstado);
  }

  // Sort descending
  tablaData.sort((a, b) => {
    const dateA = new Date(a.fechaInicio || a.inc.fecha);
    const dateB = new Date(b.fechaInicio || b.inc.fecha);
    return dateB - dateA;
  });

  const getEstadoBadge = (estado) => {
    switch (estado) {
      case 'Reportada': return 'bg-danger';
      case 'Revisada': return 'bg-warning text-dark';
      case 'Asignada': return 'bg-primary';
      case 'Reparada': return 'bg-success';
      case 'Cerrada': return 'bg-secondary';
      default: return 'bg-light text-dark border';
    }
  };

  return (
    <div>
      <div className="mb-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <h1 className="h3 fw-bold text-primary mb-1">
            <i className="bi bi-clock-history me-2"></i> Historial de Equipo
          </h1>
          <p className="text-muted mb-0">Trazabilidad y mantenimiento del equipo {equipo.codigoPatrimonial}</p>
        </div>
        <div>
          <button className="btn btn-outline-secondary me-2 shadow-sm" onClick={() => navigate(-1)}>
            <i className="bi bi-arrow-left me-1"></i> Volver
          </button>
        </div>
      </div>

      <div className="row g-4 mb-4">
        {/* Info General */}
        <div className="col-12 col-lg-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white pt-3 pb-0 border-bottom-0">
              <h5 className="fw-bold mb-0 text-primary">Información General</h5>
            </div>
            <div className="card-body bg-light rounded m-3">
              <ul className="list-unstyled mb-0 small">
                <li className="mb-2"><span className="fw-bold text-muted">Código:</span> {equipo.codigoPatrimonial}</li>
                <li className="mb-2"><span className="fw-bold text-muted">N° Serie:</span> {equipo.numeroSerie}</li>
                <li className="mb-2"><span className="fw-bold text-muted">Tipo:</span> {equipo.tipoEquipo}</li>
                <li className="mb-2"><span className="fw-bold text-muted">Marca/Modelo:</span> {equipo.marca} {equipo.modelo}</li>
                <li className="mb-2"><span className="fw-bold text-muted">Laboratorio:</span> {equipo.laboratorio}</li>
                <li className="mb-2">
                  <span className="fw-bold text-muted">Estado Actual:</span> 
                  <span className={`badge bg-${equipo.estado === 'Disponible' ? 'success' : 'danger'} ms-2`}>{equipo.estado}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="col-12 col-lg-8">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white pt-3 pb-0 border-bottom-0">
              <h5 className="fw-bold mb-0 text-primary">Indicadores Clave</h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-sm-6 col-md-4">
                  <div className="p-3 bg-light rounded text-center h-100 border border-light shadow-sm">
                    <h3 className="fw-bold text-dark mb-0">{totalIncidencias}</h3>
                    <p className="text-muted small text-uppercase fw-bold mb-0">Total Incidencias</p>
                  </div>
                </div>
                <div className="col-sm-6 col-md-4">
                  <div className="p-3 bg-light rounded text-center h-100 border border-light shadow-sm">
                    <h3 className="fw-bold text-success mb-0">{prevCount}</h3>
                    <p className="text-muted small text-uppercase fw-bold mb-0">Mant. Preventivos</p>
                  </div>
                </div>
                <div className="col-sm-6 col-md-4">
                  <div className="p-3 bg-light rounded text-center h-100 border border-light shadow-sm">
                    <h3 className="fw-bold text-danger mb-0">{corrCount}</h3>
                    <p className="text-muted small text-uppercase fw-bold mb-0">Mant. Correctivos</p>
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="p-3 bg-light rounded text-center h-100 border border-light shadow-sm">
                    <h3 className="fw-bold text-dark mb-0">{tiempoPromedio} días</h3>
                    <p className="text-muted small text-uppercase fw-bold mb-0">Promedio Reparación</p>
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="p-3 bg-light rounded text-center h-100 border border-light shadow-sm">
                    <h3 className="fw-bold text-primary fs-4 mb-0 mt-2">{ultimaReparacion}</h3>
                    <p className="text-muted small text-uppercase fw-bold mb-0">Última Reparación</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white pt-0 pb-0 border-bottom">
          <ul className="nav nav-tabs border-bottom-0 pt-3">
            <li className="nav-item">
              <button 
                className={`nav-link border-0 text-dark fw-semibold ${activeTab === 'resumen' ? 'active bg-light border-bottom border-primary border-3 text-primary' : ''}`}
                onClick={() => setActiveTab('resumen')}
              >
                <i className="bi bi-table me-2"></i>Historial Detallado
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link border-0 text-dark fw-semibold ${activeTab === 'timeline' ? 'active bg-light border-bottom border-primary border-3 text-primary' : ''}`}
                onClick={() => setActiveTab('timeline')}
              >
                <i className="bi bi-list-nested me-2"></i>Línea de Tiempo Global
              </button>
            </li>
          </ul>
        </div>
        
        <div className="card-body p-0">
          {activeTab === 'resumen' && (
            <div>
              {/* Filtros */}
              <div className="bg-light p-3 border-bottom row g-3">
                <div className="col-md-4">
                  <label className="form-label small fw-bold text-muted mb-1">Fecha</label>
                  <input type="month" className="form-control form-control-sm" value={filtroFecha} onChange={(e) => setFiltroFecha(e.target.value)} />
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-bold text-muted mb-1">Tipo</label>
                  <select className="form-select form-select-sm" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
                    <option value="">Todos</option>
                    <option value="Preventivo">Preventivo</option>
                    <option value="Correctivo">Correctivo</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-bold text-muted mb-1">Estado Incidencia</label>
                  <select className="form-select form-select-sm" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                    <option value="">Todos</option>
                    <option value="Reparada">Reparada</option>
                    <option value="Cerrada">Cerrada</option>
                    <option value="En mantenimiento">En mantenimiento</option>
                  </select>
                </div>
              </div>
              
              <div className="table-responsive">
                {tablaData.length === 0 ? (
                  <div className="text-center p-5 text-muted">
                    <i className="bi bi-search fs-1 mb-3 d-block opacity-50"></i>
                    <p>No se encontraron registros que coincidan con los filtros.</p>
                  </div>
                ) : (
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="px-3">Incidencia</th>
                        <th>Fecha</th>
                        <th>Tipo</th>
                        <th>Técnico</th>
                        <th>Tiempo Empleado</th>
                        <th>Estado</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tablaData.map(d => (
                        <tr key={d.id}>
                          <td className="px-3"><span className="badge bg-light text-primary border">#{d.inc.id}</span></td>
                          <td><span className="small">{d.fechaInicio || d.inc.fecha}</span></td>
                          <td><span className={`badge ${d.tipoMantenimiento === 'Preventivo' ? 'bg-success' : 'bg-warning text-dark'}`}>{d.tipoMantenimiento || 'Correctivo'}</span></td>
                          <td><span className="small text-muted">{d.tecnicoId}</span></td>
                          <td>{d.tiempoEmpleado ? `${d.tiempoEmpleado} hrs` : '-'}</td>
                          <td><span className={`badge ${getEstadoBadge(d.inc.estado)}`}>{d.inc.estado}</span></td>
                          <td>
                            <Link to={`/incidencias/${d.inc.id}`} className="btn btn-sm btn-outline-primary py-0">Ver</Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="p-4 bg-light">
              {historialEventos.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-clock-history fs-1 mb-3 d-block opacity-50"></i>
                  <p>No hay eventos registrados en la línea de tiempo.</p>
                </div>
              ) : (
                <div className="position-relative">
                  <div className="position-absolute h-100 border-start border-2 border-primary" style={{ left: '1rem', top: 0 }}></div>
                  {historialEventos.map((evento, index) => (
                    <div key={evento.id} className="position-relative mb-4" style={{ paddingLeft: '3rem' }}>
                      <div 
                        className="position-absolute bg-primary rounded-circle border border-3 border-white shadow"
                        style={{ width: '1.2rem', height: '1.2rem', left: '0.4rem', top: '0.2rem' }}
                      ></div>
                      <div className="card border-0 shadow-sm">
                        <div className="card-body py-2 px-3">
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <h6 className="mb-0 fw-bold text-primary">{evento.accion}</h6>
                            <small className="text-muted fw-semibold">
                              {new Date(evento.fecha).toLocaleString()}
                            </small>
                          </div>
                          <p className="mb-1 text-dark small">{evento.observacion}</p>
                          <div className="d-flex justify-content-between align-items-center">
                            <small className="text-muted">
                              <i className="bi bi-person-fill me-1"></i> {evento.usuario}
                            </small>
                            <small className="text-muted">
                              <i className="bi bi-tag me-1"></i> Inc. #{evento.incidenciaId}
                            </small>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EquipmentHistory;
