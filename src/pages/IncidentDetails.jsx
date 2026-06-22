import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getIncidentById, updateIncident, deleteIncident } from '../services/api';
import { AuthContext } from '../auth/AuthContext';

function IncidentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [incidencia, setIncidencia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const { user } = useContext(AuthContext);

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

  const handleChangeEstado = async (nuevoEstado) => {
    try {
      const updated = await updateIncident(id, { ...incidencia, estado: nuevoEstado });
      setIncidencia(updated);
    } catch (err) {}
  };

  const handleDelete = async () => {
    try {
      await deleteIncident(id);
      navigate('/incidencias');
    } catch (err) {}
  };

  const getPrioridadBadge = (p) => {
    switch(p) {
      case 'Alta': return 'bg-danger';
      case 'Media': return 'bg-warning text-dark';
      case 'Baja': return 'bg-info text-dark';
      default: return 'bg-secondary';
    }
  };

  const getEstadoBadge = (e) => {
    switch(e) {
      case 'Pendiente': return 'bg-danger';
      case 'En proceso': return 'bg-warning text-dark';
      case 'Resuelto': return 'bg-success';
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

  if (error) {
    return (
      <div className="text-center p-5 text-muted">
        <i className="bi bi-x-circle text-danger fs-1 mb-3 d-block"></i>
        <h4>{error}</h4>
        <button className="btn btn-primary mt-3" onClick={() => navigate('/incidencias')}>
          <i className="bi bi-arrow-left me-2"></i>Volver al listado
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <h1 className="h3 fw-bold text-primary mb-1">
            <i className="bi bi-search me-2"></i> Detalle de Incidencia
          </h1>
          <p className="text-muted mb-0">Información completa del reporte #{incidencia.id}</p>
        </div>
        <div>
          <button className="btn btn-outline-secondary me-2 shadow-sm" onClick={() => navigate('/incidencias')}>
            <i className="bi bi-arrow-left me-1"></i> Volver
          </button>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center flex-wrap gap-2 border-bottom-0">
          <h5 className="mb-0 fw-bold">
            <span className="text-primary me-3">{incidencia.codigoEquipo}</span>
            <span className={`badge ${getEstadoBadge(incidencia.estado)} me-2`}>{incidencia.estado}</span>
            <span className={`badge ${getPrioridadBadge(incidencia.prioridad)}`}>{incidencia.prioridad}</span>
          </h5>
          <div className="btn-group">
            {user && user.rol === 'administrador' && (
              <>
                <Link to={`/editar-incidencia/${incidencia.id}`} className="btn btn-outline-primary">
                  <i className="bi bi-pencil me-1"></i> Editar
                </Link>
                <button className="btn btn-outline-danger" onClick={() => setShowConfirm(true)}>
                  <i className="bi bi-trash me-1"></i> Eliminar
                </button>
              </>
            )}
          </div>
        </div>

        <div className="card-body bg-light">
          <div className="row g-4">
            <div className="col-md-6 col-lg-4">
              <div className="bg-white p-3 rounded shadow-sm h-100 border">
                <small className="text-muted text-uppercase fw-bold" style={{fontSize: '0.75rem'}}>Código de Equipo</small>
                <p className="fs-5 fw-semibold mb-0 text-dark">{incidencia.codigoEquipo}</p>
              </div>
            </div>
            <div className="col-md-6 col-lg-4">
              <div className="bg-white p-3 rounded shadow-sm h-100 border">
                <small className="text-muted text-uppercase fw-bold" style={{fontSize: '0.75rem'}}>Tipo de Equipo</small>
                <p className="fs-5 fw-semibold mb-0 text-dark">{incidencia.tipoEquipo}</p>
              </div>
            </div>
            <div className="col-md-6 col-lg-4">
              <div className="bg-white p-3 rounded shadow-sm h-100 border">
                <small className="text-muted text-uppercase fw-bold" style={{fontSize: '0.75rem'}}>Laboratorio</small>
                <p className="fs-5 fw-semibold mb-0 text-dark">{incidencia.laboratorio}</p>
              </div>
            </div>
            <div className="col-md-6 col-lg-4">
              <div className="bg-white p-3 rounded shadow-sm h-100 border">
                <small className="text-muted text-uppercase fw-bold" style={{fontSize: '0.75rem'}}>Fecha de Reporte</small>
                <p className="fs-5 fw-semibold mb-0 text-dark">{incidencia.fecha}</p>
              </div>
            </div>
            <div className="col-md-6 col-lg-4">
              <div className="bg-white p-3 rounded shadow-sm h-100 border">
                <small className="text-muted text-uppercase fw-bold" style={{fontSize: '0.75rem'}}>Reportante</small>
                <p className="fs-5 fw-semibold mb-0 text-dark">{incidencia.reportante}</p>
              </div>
            </div>
            <div className="col-md-6 col-lg-4">
              <div className="bg-white p-3 rounded shadow-sm h-100 border">
                <small className="text-muted text-uppercase fw-bold" style={{fontSize: '0.75rem'}}>Prioridad</small>
                <div>
                  <span className={`badge ${getPrioridadBadge(incidencia.prioridad)} fs-6`}>{incidencia.prioridad}</span>
                </div>
              </div>
            </div>
            <div className="col-12">
              <div className="bg-white p-4 rounded shadow-sm h-100 border">
                <small className="text-muted text-uppercase fw-bold mb-2 d-block" style={{fontSize: '0.75rem'}}>Descripción de la Falla</small>
                <p className="mb-0 text-dark" style={{ lineHeight: '1.6' }}>{incidencia.descripcion}</p>
              </div>
            </div>
          </div>

          {user && user.rol === 'administrador' && (
            <div className="mt-4 pt-4 border-top">
              <h6 className="fw-bold mb-3 text-secondary text-uppercase" style={{fontSize: '0.8rem'}}><i className="bi bi-gear-fill me-2"></i>Gestión de Estado</h6>
              <div className="d-flex flex-wrap gap-2">
                <button
                  className={`btn ${incidencia.estado === 'Pendiente' ? 'btn-danger' : 'btn-outline-danger'}`}
                  onClick={() => handleChangeEstado('Pendiente')}
                >
                  <i className="bi bi-hourglass-split me-1"></i> Pendiente
                </button>
                <button
                  className={`btn ${incidencia.estado === 'En proceso' ? 'btn-warning' : 'btn-outline-warning text-dark'}`}
                  onClick={() => handleChangeEstado('En proceso')}
                >
                  <i className="bi bi-tools me-1"></i> En Proceso
                </button>
                <button
                  className={`btn ${incidencia.estado === 'Resuelto' ? 'btn-success' : 'btn-outline-success'}`}
                  onClick={() => handleChangeEstado('Resuelto')}
                >
                  <i className="bi bi-check-circle me-1"></i> Resuelto
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showConfirm && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal d-block" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header bg-danger text-white border-bottom-0">
                  <h5 className="modal-title"><i className="bi bi-exclamation-triangle-fill me-2"></i>Confirmar Eliminación</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowConfirm(false)}></button>
                </div>
                <div className="modal-body">
                  ¿Está seguro de que desea eliminar la incidencia <strong>{incidencia.codigoEquipo}</strong>? Esta acción no se puede deshacer.
                </div>
                <div className="modal-footer border-top-0 bg-light">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowConfirm(false)}>Cancelar</button>
                  <button type="button" className="btn btn-danger" onClick={handleDelete}>Eliminar Definitivamente</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default IncidentDetails;
