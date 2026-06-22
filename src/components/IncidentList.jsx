import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { getIncidents, deleteIncident, updateIncident } from '../services/api';
import Filters from './Filters';
import { AuthContext } from '../auth/AuthContext';

/**
 * IncidentList — Tabla de incidencias con filtros, cambio de estado y eliminación
 * Usa useEffect para obtener datos con Fetch API desde JSON Server
 */
function IncidentList() {
  // Estado: lista de incidencias
  const [incidencias, setIncidencias] = useState([]);
  // Estado: incidencias filtradas
  const [filtradas, setFiltradas] = useState([]);
  // Estado: cargando
  const [loading, setLoading] = useState(true);
  // Estado: filtros activos
  const [filtros, setFiltros] = useState({
    busqueda: '',
    laboratorio: '',
    prioridad: '',
    estado: '',
  });
  // Estado: diálogo de confirmación para eliminar
  const [confirmDelete, setConfirmDelete] = useState(null);

  const { user } = useContext(AuthContext);

  // Cargar incidencias al montar el componente con useEffect
  useEffect(() => {
    fetchIncidencias();
  }, []);

  // Obtener incidencias desde JSON Server
  const fetchIncidencias = async () => {
    setLoading(true);
    try {
      const data = await getIncidents();
      // Filtrar incidencias según el rol del usuario
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

  // Aplicar filtros cuando cambian los filtros o las incidencias
  useEffect(() => {
    let resultado = [...incidencias];

    if (filtros.busqueda) {
      resultado = resultado.filter((i) =>
        i.codigoEquipo.toLowerCase().includes(filtros.busqueda.toLowerCase())
      );
    }
    if (filtros.laboratorio) {
      resultado = resultado.filter((i) => i.laboratorio === filtros.laboratorio);
    }
    if (filtros.prioridad) {
      resultado = resultado.filter((i) => i.prioridad === filtros.prioridad);
    }
    if (filtros.estado) {
      resultado = resultado.filter((i) => i.estado === filtros.estado);
    }

    setFiltradas(resultado);
  }, [filtros, incidencias]);

  // Cambiar estado de una incidencia
  const handleChangeEstado = async (incidencia, nuevoEstado) => {
    try {
      await updateIncident(incidencia.id, { ...incidencia, estado: nuevoEstado });
      setIncidencias(incidencias.map((i) =>
        i.id === incidencia.id ? { ...i, estado: nuevoEstado } : i
      ));
    } catch (error) {
      console.error('Error al cambiar estado:', error);
    }
  };

  // Eliminar una incidencia
  const handleDelete = async (id) => {
    try {
      await deleteIncident(id);
      setIncidencias(incidencias.filter((i) => i.id !== id));
      setConfirmDelete(null);
    } catch (error) {
      console.error('Error al eliminar:', error);
    }
  };

  // Obtener clase CSS para el badge de prioridad
  const getPrioridadClass = (prioridad) => {
    const clases = { Alta: 'badge-alta', Media: 'badge-media', Baja: 'badge-baja' };
    return clases[prioridad] || '';
  };

  // Obtener clase CSS para el badge de estado
  const getEstadoClass = (estado) => {
    const clases = { Pendiente: 'badge-pendiente', 'En proceso': 'badge-en-proceso', Resuelto: 'badge-resuelto' };
    return clases[estado] || '';
  };

  // Renderizar loading
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <span className="loading-text">Cargando incidencias...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>📋 Listado de Incidencias</h1>
        <p>Gestiona y filtra todas las incidencias reportadas</p>
      </div>

      <div className="table-section">
        {/* Encabezado con título y conteo */}
        <div className="table-header">
          <span className="table-title">Incidencias Registradas</span>
          <span className="table-count">{filtradas.length} de {incidencias.length}</span>
        </div>

        {/* Componente de filtros */}
        <Filters filtros={filtros} onFilterChange={setFiltros} />

        {/* Tabla de datos */}
        <div className="table-container">
          {filtradas.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon">🔍</span>
              <span className="empty-state-text">
                No se encontraron incidencias con los filtros aplicados
              </span>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Tipo</th>
                  <th>Laboratorio</th>
                  <th>Fecha</th>
                  <th>Prioridad</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map((incidencia) => (
                  <tr key={incidencia.id}>
                    <td>
                      <span className="table-code">{incidencia.codigoEquipo}</span>
                    </td>
                    <td>{incidencia.tipoEquipo}</td>
                    <td>{incidencia.laboratorio}</td>
                    <td>{incidencia.fecha}</td>
                    <td>
                      <span className={`badge ${getPrioridadClass(incidencia.prioridad)}`}>
                        {incidencia.prioridad}
                      </span>
                    </td>
                    <td>
                      {user.rol === 'administrador' ? (
                        <select
                          value={incidencia.estado}
                          onChange={(e) => handleChangeEstado(incidencia, e.target.value)}
                          className={`badge ${getEstadoClass(incidencia.estado)}`}
                          style={{ cursor: 'pointer', border: 'none', fontSize: '0.72rem', fontWeight: 600 }}
                        >
                          <option value="Pendiente">Pendiente</option>
                          <option value="En proceso">En proceso</option>
                          <option value="Resuelto">Resuelto</option>
                        </select>
                      ) : (
                        <span className={`badge ${getEstadoClass(incidencia.estado)}`}>
                          {incidencia.estado}
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="table-actions">
                        <Link to={`/incidencias/${incidencia.id}`} className="btn btn-sm btn-outline">
                          👁️ Ver
                        </Link>
                        {/* Solo el admin puede editar o eliminar */}
                        {user.rol === 'administrador' && (
                          <Link to={`/editar-incidencia/${incidencia.id}`} className="btn btn-sm btn-primary">
                            ✏️
                          </Link>
                        )}
                        {user.rol === 'administrador' && (
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => setConfirmDelete(incidencia.id)}
                          >
                            🗑️
                          </button>
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

      {/* Diálogo de confirmación para eliminar */}
      {confirmDelete && (
        <div className="confirm-overlay">
          <div className="confirm-dialog">
            <h3 className="confirm-title">⚠️ Confirmar Eliminación</h3>
            <p className="confirm-message">
              ¿Está seguro de que desea eliminar esta incidencia? Esta acción no se puede deshacer.
            </p>
            <div className="confirm-actions">
              <button className="btn btn-outline" onClick={() => setConfirmDelete(null)}>
                Cancelar
              </button>
              <button className="btn btn-danger" onClick={() => handleDelete(confirmDelete)}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default IncidentList;
