import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getIncidentById, updateIncident, deleteIncident, getTecnicos, createMantenimiento, createHistorial, getMantenimientos, getEquipos, updateEquipo } from '../services/api';
import { AuthContext } from '../auth/AuthContext';
import MaintenanceTracker from '../components/MaintenanceTracker';
import IncidentHistory from '../components/IncidentHistory';

function IncidentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [incidencia, setIncidencia] = useState(null);
  const [mantenimiento, setMantenimiento] = useState(null);
  const [tecnicos, setTecnicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const { user } = useContext(AuthContext);

  const [assignForm, setAssignForm] = useState({ tecnicoId: '', fechaProgramada: '', prioridad: 'Media', tipoMantenimiento: 'Correctivo', observacionesIniciales: '' });
  const [assignLoading, setAssignLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getIncidentById(id);
        setIncidencia(data);

        const mants = await getMantenimientos();
        const mant = mants.find(m => m.incidenciaId === id);
        if (mant) setMantenimiento(mant);

        if (user.rol === 'administrador') {
          const tecs = await getTecnicos();
          setTecnicos(tecs);
        }
      } catch (err) {
        setError('No se pudo encontrar la incidencia solicitada.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, user.rol, refreshTrigger]);

  const reloadData = () => setRefreshTrigger(prev => prev + 1);

  const handleChangeEstado = async (nuevoEstado) => {
    try {
      const updated = await updateIncident(id, { ...incidencia, estado: nuevoEstado });
      await createHistorial({
        incidenciaId: id,
        usuario: user.nombre,
        accion: `Cambió estado a ${nuevoEstado}`,
        observacion: 'Cambio manual realizado por el administrador'
      });
      
      // Update equipment status if closed
      if (nuevoEstado === 'Cerrada') {
        const equipos = await getEquipos();
        const eq = equipos.find(e => e.codigoPatrimonial === incidencia.codigoEquipo);
        if (eq) {
          await updateEquipo(eq.id, { ...eq, estado: 'Operativo' });
        }
      }

      setIncidencia(updated);
      reloadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteIncident(id);
      navigate('/incidencias');
    } catch (err) {}
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!assignForm.tecnicoId) {
      alert('Debe seleccionar un técnico antes de asignar.');
      return;
    }
    setAssignLoading(true);
    try {
      const tecSeleccionado = tecnicos.find(t => t.id === assignForm.tecnicoId);
      const nombreTec = tecSeleccionado ? `${tecSeleccionado.nombres} ${tecSeleccionado.apellidos}` : assignForm.tecnicoId;

      const newMant = await createMantenimiento({
        incidenciaId: id,
        equipoId: incidencia.equipoId || '',
        tecnicoId: assignForm.tecnicoId,
        nombreTecnico: nombreTec,
        fechaProgramada: assignForm.fechaProgramada,
        prioridad: assignForm.prioridad,
        tipoMantenimiento: assignForm.tipoMantenimiento,
        observacionesIniciales: assignForm.observacionesIniciales,
        fechaInicio: '',
        diagnostico: '',
        actividades: '',
        repuestos: '',
        observacionesTecnico: '',
        tiempoEmpleado: '',
        fechaFin: ''
      });
      
      const updated = await updateIncident(id, { ...incidencia, estado: 'Asignada' });
      
      await createHistorial({
        incidenciaId: id,
        usuario: user.nombre,
        accion: 'Asignó técnico',
        observacion: `Asignado a ${nombreTec} (${assignForm.tecnicoId})`
      });

      setIncidencia(updated);
      setMantenimiento(newMant);
      reloadData();
    } catch (error) {
      console.error(error);
    } finally {
      setAssignLoading(false);
    }
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
      case 'Reportada': return 'bg-danger';
      case 'Revisada': return 'bg-warning text-dark';
      case 'Asignada': return 'bg-primary';
      case 'Reparada': return 'bg-success';
      case 'Cerrada': return 'bg-secondary';
      default: return 'bg-secondary';
    }
  };

  if (loading && !incidencia) {
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
          <button className="btn btn-outline-secondary me-2 shadow-sm" onClick={() => navigate(-1)}>
            <i className="bi bi-arrow-left me-1"></i> Volver
          </button>
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center flex-wrap gap-2 border-bottom-0">
          <h5 className="mb-0 fw-bold">
            <span className="text-primary me-3">{incidencia.codigoEquipo}</span>
            <span className={`badge ${getEstadoBadge(incidencia.estado)} me-2`}>{incidencia.estado}</span>
            <span className={`badge ${getPrioridadBadge(incidencia.prioridad)}`}>{incidencia.prioridad}</span>
          </h5>
          <div className="btn-group">
            {user && user.rol === 'administrador' && (
              <>
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

          {user && user.rol === 'administrador' && incidencia.estado !== 'Cerrada' && (
            <div className="mt-4 pt-4 border-top">
              <h6 className="fw-bold mb-3 text-secondary text-uppercase" style={{fontSize: '0.8rem'}}>
                <i className="bi bi-gear-fill me-2"></i>Gestión de Estado
              </h6>
              <div className="d-flex flex-wrap gap-2">
                {incidencia.estado === 'Reportada' && (
                  <button className="btn btn-info" onClick={() => handleChangeEstado('Revisada')}>
                    <i className="bi bi-arrow-right me-1"></i>Marcar como Revisada
                  </button>
                )}
                {incidencia.estado === 'Reparada' && (
                  <button className="btn btn-secondary" onClick={() => handleChangeEstado('Cerrada')}>
                    <i className="bi bi-check-lg me-1"></i>Cerrar Incidencia
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {user && user.rol === 'administrador' && !mantenimiento && incidencia.estado === 'Revisada' && (
        <div className="card border-0 shadow-sm mb-4 border-top border-primary border-3">
          <div className="card-header bg-white pt-3 pb-0 border-bottom-0">
            <h5 className="fw-bold"><i className="bi bi-person-plus-fill me-2 text-primary"></i>Asignar Mantenimiento</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleAssign}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Seleccionar Técnico</label>
                  <select 
                    className="form-select" 
                    required
                    value={assignForm.tecnicoId}
                    onChange={(e) => setAssignForm({...assignForm, tecnicoId: e.target.value})}
                  >
                    <option value="">-- Elige un técnico --</option>
                    {tecnicos.filter(t => t.estado === 'Activo').map(t => (
                      <option key={t.id} value={t.id}>{t.nombres} {t.apellidos}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-semibold">Fecha Programada</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    required
                    value={assignForm.fechaProgramada}
                    onChange={(e) => setAssignForm({...assignForm, fechaProgramada: e.target.value})}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-semibold">Prioridad Mantenimiento</label>
                  <select 
                    className="form-select"
                    value={assignForm.prioridad}
                    onChange={(e) => setAssignForm({...assignForm, prioridad: e.target.value})}
                  >
                    <option value="Baja">Baja</option>
                    <option value="Media">Media</option>
                    <option value="Alta">Alta</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-semibold">Tipo Mantenimiento</label>
                  <select 
                    className="form-select"
                    value={assignForm.tipoMantenimiento}
                    onChange={(e) => setAssignForm({...assignForm, tipoMantenimiento: e.target.value})}
                  >
                    <option value="Preventivo">Preventivo</option>
                    <option value="Correctivo">Correctivo</option>
                  </select>
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold">Observaciones Iniciales (Opcional)</label>
                  <textarea 
                    className="form-control" 
                    rows="2"
                    placeholder="Instrucciones para el técnico..."
                    value={assignForm.observacionesIniciales}
                    onChange={(e) => setAssignForm({...assignForm, observacionesIniciales: e.target.value})}
                  ></textarea>
                </div>
                <div className="col-12 text-end">
                  <button type="submit" className="btn btn-primary shadow-sm" disabled={assignLoading}>
                    {assignLoading ? 'Asignando...' : 'Asignar Técnico y Programar'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {mantenimiento && (
        <MaintenanceTracker 
          mantenimiento={mantenimiento} 
          incidencia={incidencia} 
          onUpdate={reloadData}
        />
      )}

      <IncidentHistory incidenciaId={id} key={`hist-${refreshTrigger}`} />

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
