import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { getIncidents, getEquipos, getMantenimientos, getTecnicos, getHistorial } from '../services/api';
import IncidentCard from '../components/IncidentCard';
import Statistics from '../components/Statistics';
import { AuthContext } from '../auth/AuthContext';

function Dashboard() {
  const [incidencias, setIncidencias] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [mantenimientos, setMantenimientos] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [historialGlobal, setHistorialGlobal] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [incidenciasData, equiposData, mantsData] = await Promise.all([
          getIncidents(),
          getEquipos(),
          getMantenimientos()
        ]);
        
        let tecsData = [];
        let histData = [];
        if (user.rol === 'administrador') {
          tecsData = await getTecnicos();
          histData = await getHistorial();
        }

        let dataRole = incidenciasData;
        if (user.rol === 'alumno') {
          dataRole = incidenciasData.filter(i => i.reportante === user.nombre || i.reportante === user.codigo);
        } else if (user.rol === 'tecnico') {
          // Para el técnico en el dashboard, mostramos todas las suyas asignadas
          const mantsDelTecnico = mantsData.filter(m => m.tecnicoId === user.id).map(m => m.incidenciaId);
          dataRole = incidenciasData.filter(i => mantsDelTecnico.includes(i.id));
        }
        
        setIncidencias(dataRole);
        setEquipos(equiposData);
        setMantenimientos(mantsData);
        setTecnicos(tecsData);
        setHistorialGlobal(histData.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)));
      } catch (error) {
        console.error('Error al cargar datos del dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  // --- MÉTRICAS BÁSICAS ---
  const reportadas = incidencias.filter(i => i.estado === 'Reportada').length;
  const revisadas = incidencias.filter(i => i.estado === 'Revisada').length;
  const asignadas = incidencias.filter(i => i.estado === 'Asignada').length;
  const reparadas = incidencias.filter(i => i.estado === 'Reparada').length;
  const cerradas = incidencias.filter(i => i.estado === 'Cerrada').length;
  
  // Admin Métricas extras
  const incidenciasAbiertas = incidencias.filter(i => i.estado !== 'Cerrada').length;
  const incidenciasCriticas = incidencias.filter(i => i.prioridad === 'Alta' && i.estado !== 'Cerrada').length;
  const mantsEnProcesoGlobal = mantenimientos.filter(m => m.fechaInicio && !m.fechaFin).length;

  // Técnicos stats
  const tecnicosTotal = tecnicos.length;
  const tecnicosActivos = tecnicos.filter(t => t.estado === 'Activo').length;

  // Técnico Dashboard stats (Mantenimientos)
  const mantsPendientes = incidencias.filter(i => i.estado === 'Asignada').length;
  const mantsFinalizados = incidencias.filter(i => i.estado === 'Reparada' || i.estado === 'Cerrada').length;

  // --- INDICADORES RÁPIDOS ---
  // Tiempo promedio
  const mantsCerrados = mantenimientos.filter(m => m.fechaInicio && m.fechaFin);
  let tiempoPromedio = 0;
  if (mantsCerrados.length > 0) {
    const totalDias = mantsCerrados.reduce((acc, m) => {
      const inicio = new Date(m.fechaInicio);
      const fin = new Date(m.fechaFin);
      const diffTime = Math.abs(fin - inicio);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return acc + (diffDays === 0 ? 1 : diffDays);
    }, 0);
    tiempoPromedio = (totalDias / mantsCerrados.length).toFixed(1);
  }

  const porcentajeResueltas = incidencias.length > 0 ? ((cerradas / incidencias.length) * 100).toFixed(0) : 0;

  // Peor laboratorio y peor equipo (solo cálculo simple, optimizado)
  let peorLab = 'N/A';
  let peorEquipo = 'N/A';
  if (incidencias.length > 0) {
    const labCounts = incidencias.reduce((acc, inc) => { acc[inc.laboratorio] = (acc[inc.laboratorio] || 0) + 1; return acc; }, {});
    peorLab = Object.keys(labCounts).sort((a,b) => labCounts[b] - labCounts[a])[0];

    const eqCounts = incidencias.reduce((acc, inc) => { acc[inc.codigoEquipo] = (acc[inc.codigoEquipo] || 0) + 1; return acc; }, {});
    peorEquipo = Object.keys(eqCounts).sort((a,b) => eqCounts[b] - eqCounts[a])[0];
  }

  // Equipos stats
  const equiposTotal = equipos.length;
  const equiposOperativos = equipos.filter(e => e.estado === 'Operativo').length;
  const equiposAveriados = equipos.filter(e => e.estado === 'Averiado' || e.estado === 'Fuera de servicio').length;
  const equiposMantenimiento = equipos.filter(e => e.estado === 'En mantenimiento').length;

  const recientes = [...incidencias]
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .slice(0, 5);

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

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="h3 fw-bold text-primary mb-1">
          <i className="bi bi-graph-up me-2"></i> {user.rol === 'administrador' ? 'Centro de Monitoreo' : 'Dashboard'}
        </h1>
        <p className="text-muted">Resumen general en tiempo real</p>
      </div>

      {user.rol === 'alumno' && (
        <>
          <h5 className="mb-3 text-secondary"><i className="bi bi-person me-2"></i>Tus Incidencias</h5>
          <div className="row g-3 mb-4">
            <div className="col-12 col-sm-4">
              <IncidentCard label="Registradas" valor={incidencias.length} icon="bi-megaphone" bg="primary" />
            </div>
            <div className="col-12 col-sm-4">
              <IncidentCard label="En Proceso" valor={asignadas + reparadas} icon="bi-tools" bg="warning" textDark />
            </div>
            <div className="col-12 col-sm-4">
              <IncidentCard label="Resueltas" valor={cerradas} icon="bi-check-circle" bg="success" />
            </div>
          </div>
        </>
      )}

      {user.rol === 'tecnico' && (
        <>
          <h5 className="mb-3 text-secondary"><i className="bi bi-tools me-2"></i>Tu Actividad</h5>
          <div className="row g-3 mb-4">
            <div className="col-12 col-sm-6">
              <IncidentCard label="Asignaciones Pendientes" valor={mantsPendientes} icon="bi-clock-history" bg="danger" />
            </div>
            <div className="col-12 col-sm-6">
              <IncidentCard label="Mantenimientos Finalizados" valor={mantsFinalizados} icon="bi-check-circle" bg="success" />
            </div>
          </div>
        </>
      )}

      {user.rol === 'administrador' && (
        <>
          {/* Indicadores Rápidos (Top) */}
          <div className="row g-3 mb-4">
            <div className="col-6 col-md-3">
              <div className="card bg-white border-0 shadow-sm border-start border-primary border-4 h-100">
                <div className="card-body py-2 px-3">
                  <small className="text-muted text-uppercase fw-bold" style={{fontSize: '0.7rem'}}>T. Promedio Reparación</small>
                  <h4 className="fw-bold mb-0 text-dark">{tiempoPromedio} <small className="fs-6 text-muted">días</small></h4>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="card bg-white border-0 shadow-sm border-start border-success border-4 h-100">
                <div className="card-body py-2 px-3">
                  <small className="text-muted text-uppercase fw-bold" style={{fontSize: '0.7rem'}}>Resolución Global</small>
                  <h4 className="fw-bold mb-0 text-success">{porcentajeResueltas}%</h4>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="card bg-white border-0 shadow-sm border-start border-danger border-4 h-100">
                <div className="card-body py-2 px-3">
                  <small className="text-muted text-uppercase fw-bold" style={{fontSize: '0.7rem'}}>Lab. Crítico</small>
                  <h5 className="fw-bold mb-0 text-dark text-truncate mt-1">{peorLab}</h5>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="card bg-white border-0 shadow-sm border-start border-warning border-4 h-100">
                <div className="card-body py-2 px-3">
                  <small className="text-muted text-uppercase fw-bold" style={{fontSize: '0.7rem'}}>Equipo más averiado</small>
                  <h5 className="fw-bold mb-0 text-dark mt-1">{peorEquipo}</h5>
                </div>
              </div>
            </div>
          </div>

          <h5 className="mb-3 text-secondary mt-2"><i className="bi bi-pc-display me-2"></i>Monitoreo de Infraestructura</h5>
          <div className="row g-3 mb-4">
            <div className="col-12 col-sm-6 col-lg-3">
              <IncidentCard label="Equipos Registrados" valor={equiposTotal} icon="bi-pc-display-horizontal" bg="primary" />
            </div>
            <div className="col-12 col-sm-6 col-lg-3">
              <IncidentCard label="Equipos Operativos" valor={equiposOperativos} icon="bi-check-circle" bg="success" />
            </div>
            <div className="col-12 col-sm-6 col-lg-3">
              <IncidentCard label="En Mantenimiento" valor={equiposMantenimiento} icon="bi-tools" bg="warning" textDark />
            </div>
            <div className="col-12 col-sm-6 col-lg-3">
              <IncidentCard label="Fuera de Servicio" valor={equiposAveriados} icon="bi-exclamation-triangle" bg="danger" />
            </div>
          </div>

          <h5 className="mb-3 text-secondary mt-4"><i className="bi bi-ticket-detailed me-2"></i>Monitoreo Operativo</h5>
          <div className="row g-3 mb-4">
            <div className="col-12 col-sm-6 col-lg-3">
              <IncidentCard label="Incidencias Abiertas" valor={incidenciasAbiertas} icon="bi-folder2-open" bg="primary" />
            </div>
            <div className="col-12 col-sm-6 col-lg-3">
              <IncidentCard label="Mants. En Proceso" valor={mantsEnProcesoGlobal} icon="bi-gear-wide-connected" bg="info" />
            </div>
            <div className="col-12 col-sm-6 col-lg-2">
              <IncidentCard label="Inc. Críticas" valor={incidenciasCriticas} icon="bi-fire" bg="danger" />
            </div>
            <div className="col-12 col-sm-6 col-lg-2">
              <IncidentCard label="Técnicos Activos" valor={tecnicosActivos} icon="bi-person-check-fill" bg="dark" />
            </div>
            <div className="col-12 col-sm-6 col-lg-2">
              <IncidentCard label="Inc. Cerradas" valor={cerradas} icon="bi-check-all" bg="success" />
            </div>
          </div>
        </>
      )}

      {user && user.rol === 'administrador' && (
        <Statistics 
          incidencias={incidencias} 
          mantenimientos={mantenimientos}
          tecnicos={tecnicos}
          equipos={equipos}
        />
      )}

      <div className="row mt-4 g-4">
        {/* Tabla de Incidencias Recientes */}
        <div className={user.rol === 'administrador' ? 'col-lg-8' : 'col-12'}>
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-bottom-0 pt-3 pb-0">
              <h5 className="mb-0 fw-bold"><i className="bi bi-clock-history me-2 text-muted"></i>Últimas Incidencias Reportadas</h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Código</th>
                      <th>Tipo</th>
                      <th>Laboratorio</th>
                      <th>Fecha</th>
                      <th>Estado</th>
                      <th className="text-end">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recientes.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center text-muted py-4">No hay incidencias registradas.</td>
                      </tr>
                    ) : (
                      recientes.map((inc) => (
                        <tr key={inc.id}>
                          <td><span className="fw-semibold text-primary">{inc.codigoEquipo}</span></td>
                          <td>{inc.tipoEquipo}</td>
                          <td>{inc.laboratorio}</td>
                          <td>{inc.fecha}</td>
                          <td>
                            <span className={`badge ${getEstadoBadge(inc.estado)}`}>
                              {inc.estado}
                            </span>
                          </td>
                          <td className="text-end">
                            <Link to={`/incidencias/${inc.id}`} className="btn btn-sm btn-outline-primary">
                              <i className="bi bi-eye"></i> Ver
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Panel de Actividad Reciente (Solo Admin) */}
        {user.rol === 'administrador' && (
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-white border-bottom-0 pt-3 pb-0 d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold"><i className="bi bi-activity me-2 text-primary"></i>Actividad Reciente</h5>
              </div>
              <div className="card-body p-0">
                <ul className="list-group list-group-flush mt-2">
                  {historialGlobal.length === 0 ? (
                    <li className="list-group-item text-muted text-center py-4">No hay actividad.</li>
                  ) : (
                    historialGlobal.slice(0, 7).map((hist, idx) => (
                      <li key={idx} className="list-group-item px-4 py-3 border-bottom-0 border-top">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="fw-bold text-dark small">{hist.accion}</span>
                          <small className="text-muted" style={{fontSize: '0.7rem'}}>
                            {new Date(hist.fecha).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}
                          </small>
                        </div>
                        <p className="mb-1 text-muted small text-truncate">{hist.observacion}</p>
                        <div className="d-flex justify-content-between">
                          <small className="text-primary fw-semibold" style={{fontSize: '0.7rem'}}>Por: {hist.usuario}</small>
                          <small className="text-secondary" style={{fontSize: '0.7rem'}}>Incidencia #{hist.incidenciaId}</small>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

export default Dashboard;
