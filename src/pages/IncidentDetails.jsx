import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getIncidentById, updateIncident, deleteIncident } from '../services/api';

/**
 * IncidentDetails — Página de detalle completo de una incidencia
 * Obtiene el ID de la URL con useParams y carga datos con Fetch API
 */
function IncidentDetails() {
  // Obtener ID de la URL
  const { id } = useParams();
  const navigate = useNavigate();

  // Estado: datos de la incidencia
  const [incidencia, setIncidencia] = useState(null);
  // Estado: cargando
  const [loading, setLoading] = useState(true);
  // Estado: error
  const [error, setError] = useState(null);
  // Estado: diálogo de confirmación
  const [showConfirm, setShowConfirm] = useState(false);

  // Cargar incidencia al montar o cuando cambia el ID
  useEffect(() => {
    const fetchIncidencia = async () => {
      setLoading(true);
      try {
        const data = await getIncidentById(id);
        setIncidencia(data);
      } catch (err) {
        setError('No se pudo encontrar la incidencia solicitada.');
      } finally {
        setLoading(false);
      }
    };
    fetchIncidencia();
  }, [id]);

  // Cambiar estado de la incidencia
  const handleChangeEstado = async (nuevoEstado) => {
    try {
      const updated = await updateIncident(id, { ...incidencia, estado: nuevoEstado });
      setIncidencia(updated);
    } catch (err) {
      console.error('Error al cambiar estado:', err);
    }
  };

  // Eliminar incidencia
  const handleDelete = async () => {
    try {
      await deleteIncident(id);
      navigate('/incidencias');
    } catch (err) {
      console.error('Error al eliminar:', err);
    }
  };

  // Obtener clase CSS para badges
  const getPrioridadClass = (p) => {
    const c = { Alta: 'badge-alta', Media: 'badge-media', Baja: 'badge-baja' };
    return c[p] || '';
  };

  const getEstadoClass = (e) => {
    const c = { Pendiente: 'badge-pendiente', 'En proceso': 'badge-en-proceso', Resuelto: 'badge-resuelto' };
    return c[e] || '';
  };

  // Estado de carga
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <span className="loading-text">Cargando detalle...</span>
      </div>
    );
  }

  // Estado de error
  if (error) {
    return (
      <div className="empty-state">
        <span className="empty-state-icon">❌</span>
        <span className="empty-state-text">{error}</span>
        <button className="btn btn-primary" onClick={() => navigate('/incidencias')}>
          Volver al listado
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>🔍 Detalle de Incidencia</h1>
        <p>Información completa del reporte #{incidencia.id}</p>
      </div>

      <div className="detail-container">
        {/* Encabezado con código y acciones */}
        <div className="detail-header">
          <div className="detail-title">
            <span className="table-code">{incidencia.codigoEquipo}</span>
            <span className={`badge ${getEstadoClass(incidencia.estado)}`}>
              {incidencia.estado}
            </span>
            <span className={`badge ${getPrioridadClass(incidencia.prioridad)}`}>
              {incidencia.prioridad}
            </span>
          </div>
          <div className="detail-actions">
            <Link to={`/editar-incidencia/${incidencia.id}`} className="btn btn-sm btn-primary">
              ✏️ Editar
            </Link>
            <button className="btn btn-sm btn-danger" onClick={() => setShowConfirm(true)}>
              🗑️ Eliminar
            </button>
            <button className="btn btn-sm btn-outline" onClick={() => navigate('/incidencias')}>
              ← Volver
            </button>
          </div>
        </div>

        {/* Cuerpo del detalle */}
        <div className="detail-body">
          <div className="detail-grid">
            <div className="detail-field">
              <span className="detail-label">Código de Equipo</span>
              <span className="detail-value">{incidencia.codigoEquipo}</span>
            </div>
            <div className="detail-field">
              <span className="detail-label">Tipo de Equipo</span>
              <span className="detail-value">{incidencia.tipoEquipo}</span>
            </div>
            <div className="detail-field">
              <span className="detail-label">Laboratorio</span>
              <span className="detail-value">{incidencia.laboratorio}</span>
            </div>
            <div className="detail-field">
              <span className="detail-label">Fecha de Reporte</span>
              <span className="detail-value">{incidencia.fecha}</span>
            </div>
            <div className="detail-field">
              <span className="detail-label">Reportante</span>
              <span className="detail-value">{incidencia.reportante}</span>
            </div>
            <div className="detail-field">
              <span className="detail-label">Prioridad</span>
              <span className="detail-value">
                <span className={`badge ${getPrioridadClass(incidencia.prioridad)}`}>
                  {incidencia.prioridad}
                </span>
              </span>
            </div>
            <div className="detail-field full-width">
              <span className="detail-label">Descripción de la Falla</span>
              <div className="detail-description">
                {incidencia.descripcion}
              </div>
            </div>
          </div>

          {/* Sección para cambiar estado */}
          <div className="detail-status-section">
            <h3 className="detail-status-title">Cambiar Estado de la Incidencia</h3>
            <div className="status-buttons">
              <button
                className={`btn btn-sm ${incidencia.estado === 'Pendiente' ? 'btn-danger' : 'btn-outline'}`}
                onClick={() => handleChangeEstado('Pendiente')}
              >
                ⏳ Pendiente
              </button>
              <button
                className={`btn btn-sm ${incidencia.estado === 'En proceso' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => handleChangeEstado('En proceso')}
              >
                🔧 En Proceso
              </button>
              <button
                className={`btn btn-sm ${incidencia.estado === 'Resuelto' ? 'btn-success' : 'btn-outline'}`}
                onClick={() => handleChangeEstado('Resuelto')}
              >
                ✅ Resuelto
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Diálogo de confirmación para eliminar */}
      {showConfirm && (
        <div className="confirm-overlay">
          <div className="confirm-dialog">
            <h3 className="confirm-title">⚠️ Confirmar Eliminación</h3>
            <p className="confirm-message">
              ¿Está seguro de que desea eliminar la incidencia <strong>{incidencia.codigoEquipo}</strong>?
              Esta acción no se puede deshacer.
            </p>
            <div className="confirm-actions">
              <button className="btn btn-outline" onClick={() => setShowConfirm(false)}>
                Cancelar
              </button>
              <button className="btn btn-danger" onClick={handleDelete}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default IncidentDetails;
