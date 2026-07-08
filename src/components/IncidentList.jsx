import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { getIncidents, deleteIncident, updateIncident } from '../services/api';
import Filters from './Filters';
import { AuthContext } from '../auth/AuthContext';

function IncidentList() {
  const [incidencias, setIncidencias] = useState([]);
  const [filtradas, setFiltradas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({ busqueda: '', laboratorio: '', prioridad: '', estado: '' });
  const [confirmDelete, setConfirmDelete] = useState(null);
  
  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchIncidencias();
  }, []);

  const fetchIncidencias = async () => {
    setLoading(true);
    try {
      const data = await getIncidents();
      const dataRole = user.rol === 'administrador' 
        ? data 
        : data.filter(i => i.reportante === user.nombre || i.reportante === user.codigo);
      setIncidencias(dataRole);
      setFiltradas(dataRole);
    } catch (error) {
      console.error('Error al cargar incidencias:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("=== DEBUG: ESTADO REAL DE INCIDENCIAS ===");
    incidencias.forEach(inc => {
      console.log(`[ORIGINAL DB] ID: ${inc.id} | Código: ${inc.codigoEquipo} | Estado Real: ${inc.estado}`);
    });

    let resultado = [...incidencias];
    if (filtros.busqueda) {
      resultado = resultado.filter(i => 
        i.codigoEquipo.toLowerCase().includes(filtros.busqueda.toLowerCase()) || 
        i.id.toString().includes(filtros.busqueda)
      );
    }
    if (filtros.laboratorio) resultado = resultado.filter(i => i.laboratorio === filtros.laboratorio);
    if (filtros.prioridad) resultado = resultado.filter(i => i.prioridad === filtros.prioridad);
    if (filtros.estado) {
      resultado = resultado.filter(i => i.estado === filtros.estado);
    } else {
      resultado = resultado.filter(i => i.estado !== 'Cerrada');
    }
    
    // Sort by most recent first (using id descending as proxy for recency, or date)
    resultado.sort((a, b) => {
      const dateA = new Date(a.fecha).getTime();
      const dateB = new Date(b.fecha).getTime();
      if (dateA === dateB) return parseInt(b.id) - parseInt(a.id);
      return dateB - dateA;
    });

    console.log(`=== DEBUG: FILTRO APLICADO ===\nTotal en db.json (original): ${incidencias.length}\nTotal después del filtro (UI): ${resultado.length}`);
    resultado.forEach(inc => {
      console.log(`[FILTRADA UI] ID: ${inc.id} | Estado a mostrar: ${inc.estado}`);
    });

    setFiltradas(resultado);
  }, [filtros, incidencias]);

  const handleChangeEstado = async (incidencia, nuevoEstado) => {
    try {
      await updateIncident(incidencia.id, { ...incidencia, estado: nuevoEstado });
      await import('../services/api').then(({ createHistorial }) => {
        createHistorial({
          incidenciaId: incidencia.id,
          usuario: user.nombre,
          accion: `Cambió estado a ${nuevoEstado}`,
          observacion: 'Actualización de estado desde listado'
        });
      });
      setIncidencias(incidencias.map(i => i.id === incidencia.id ? { ...i, estado: nuevoEstado } : i));
    } catch (error) {}
  };

  const handleDelete = async (id) => {
    try {
      await deleteIncident(id);
      setIncidencias(incidencias.filter(i => i.id !== id));
      setConfirmDelete(null);
    } catch (error) {}
  };

    const getPrioridadBadge = (prioridad) => {
      switch(prioridad) {
        case 'Crítica': return 'bg-dark text-white';
        case 'Alta': return 'bg-danger';
        case 'Media': return 'bg-warning text-dark';
        case 'Baja': return 'bg-success';
        default: return 'bg-secondary';
      }
    };

  const getEstadoBadge = (estado) => {
    switch(estado) {
      case 'Reportada': return 'bg-danger';
      case 'Revisada': return 'bg-warning text-dark';
      case 'Asignada': return 'bg-primary';
      case 'Reparada': return 'bg-success';
      case 'Cerrada': return 'bg-secondary';
      default: return 'bg-secondary';
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
      <div className="mb-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <h1 className="h3 fw-bold text-primary mb-1">
            <i className="bi bi-card-list me-2"></i> Listado de Incidencias
          </h1>
          <p className="text-muted mb-0">Gestiona y filtra todas las incidencias reportadas</p>
        </div>
        {user.rol !== 'tecnico' && (
          <Link to="/nueva-incidencia" className="btn btn-primary shadow-sm">
            <i className="bi bi-plus-lg me-1"></i> Nueva
          </Link>
        )}
      </div>

      <Filters filtros={filtros} onFilterChange={setFiltros} />

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center border-bottom-0">
          <h6 className="mb-0 fw-bold">Incidencias Registradas</h6>
          <span className="badge bg-light text-secondary border">{filtradas.length} resultados</span>
        </div>
        
        <div className="card-body p-0">
          <div className="table-responsive">
            {filtradas.length === 0 ? (
              <div className="text-center p-5 text-muted">
                <i className="bi bi-search fs-1 mb-3 d-block opacity-50"></i>
                <p>No se encontraron incidencias con los filtros aplicados</p>
              </div>
            ) : (
              <table className="table table-hover table-striped align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="px-3">Incidencia / Equipo</th>
                    <th>Tipo</th>
                    <th>Laboratorio</th>
                    <th>Fecha</th>
                    <th>Prioridad</th>
                    <th>Estado</th>
                    <th className="text-end px-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map(inc => (
                    <tr key={inc.id}>
                      <td className="px-3">
                        <span className="fw-bold text-dark d-block">INC-{inc.fecha ? inc.fecha.split('-')[0] : new Date().getFullYear()}-{inc.id.toString().padStart(3, '0')}</span>
                        <span className="fw-semibold text-primary small">{inc.codigoEquipo}</span>
                      </td>
                      <td>{inc.tipoEquipo}</td>
                      <td>{inc.laboratorio}</td>
                      <td>{inc.fecha}</td>
                      <td><span className={`badge ${getPrioridadBadge(inc.prioridad)}`}>{inc.prioridad}</span></td>
                      <td>
                        {user.rol === 'administrador' && inc.estado !== 'Cerrada' ? (
                          <select
                            value={inc.estado}
                            onChange={(e) => handleChangeEstado(inc, e.target.value)}
                            className={`badge border-0 ${getEstadoBadge(inc.estado)} form-select-sm`}
                            style={{ cursor: 'pointer', appearance: 'none' }}
                          >
                            <option value="Reportada" className="bg-white text-dark">Reportada</option>
                            <option value="Revisada" className="bg-white text-dark">Revisada</option>
                            <option value="Asignada" className="bg-white text-dark" disabled>Asignada</option>
                            <option value="Reparada" className="bg-white text-dark" disabled>Reparada</option>
                            <option value="Cerrada" className="bg-white text-dark">Cerrada</option>
                          </select>
                        ) : (
                          <span className={`badge ${getEstadoBadge(inc.estado)}`}>{inc.estado}</span>
                        )}
                      </td>
                      <td className="text-end px-3">
                        <div className="btn-group">
                          <Link to={`/incidencias/${inc.id}`} className="btn btn-sm btn-outline-secondary" title="Ver detalle">
                            <i className="bi bi-eye"></i>
                          </Link>
                          {user.rol === 'administrador' && inc.estado !== 'Cerrada' && (
                            <>
                              <Link to={`/editar-incidencia/${inc.id}`} className="btn btn-sm btn-outline-primary" title="Editar">
                                <i className="bi bi-pencil"></i>
                              </Link>
                              <button className="btn btn-sm btn-outline-danger" onClick={() => setConfirmDelete(inc.id)} title="Eliminar">
                                <i className="bi bi-trash"></i>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Bootstrap (simulado) para confirmar borrado */}
      {confirmDelete && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal d-block" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header bg-danger text-white border-bottom-0">
                  <h5 className="modal-title"><i className="bi bi-exclamation-triangle-fill me-2"></i>Confirmar Eliminación</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setConfirmDelete(null)}></button>
                </div>
                <div className="modal-body">
                  ¿Está seguro de que desea eliminar esta incidencia? Esta acción no se puede deshacer.
                </div>
                <div className="modal-footer border-top-0 bg-light">
                  <button type="button" className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancelar</button>
                  <button type="button" className="btn btn-danger" onClick={() => handleDelete(confirmDelete)}>Eliminar Definitivamente</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default IncidentList;
