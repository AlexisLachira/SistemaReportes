import { useState, useContext } from 'react';
import { workOnIncident } from '../services/workflow';
import { AuthContext } from '../auth/AuthContext';

function MaintenanceTracker({ mantenimiento, incidencia, onUpdate }) {
  const { user } = useContext(AuthContext);
  
  const [formData, setFormData] = useState({
    diagnostico: mantenimiento.diagnostico || '',
    actividades: mantenimiento.actividades || '',
    repuestos: mantenimiento.repuestos || '',
    observacionesTecnico: mantenimiento.observacionesTecnico || '',
    tiempoEmpleado: mantenimiento.tiempoEmpleado || ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const isTecnico = user?.rol === 'tecnico';
  const isActive = incidencia.estado === 'Asignada';
  
  const canEdit = isTecnico && isActive && String(mantenimiento.tecnicoId) === String(user.id);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveProgress = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await workOnIncident(mantenimiento.id, 'save', formData, user);
      setMessage('Progreso guardado correctamente');
      setTimeout(() => setMessage(''), 3000);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error(error);
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async () => {
    if (!window.confirm('¿Estás seguro de marcar esta reparación como finalizada?')) return;
    
    setLoading(true);
    try {
      await workOnIncident(mantenimiento.id, 'finish', formData, user);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error(error);
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    setLoading(true);
    try {
      await workOnIncident(mantenimiento.id, 'start', {}, user);
      onUpdate?.();
    } catch (err) { setMessage(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="card border-0 shadow-sm mt-4 border-top border-warning border-3">
      <div className="card-header bg-white border-bottom-0 pt-3 pb-0">
        <h5 className="mb-0 fw-bold"><i className="bi bi-tools me-2 text-warning"></i>Registro de Mantenimiento</h5>
      </div>
      <div className="card-body">
        
        {message && <div className="alert alert-info py-2">{message}</div>}

        <div className="row g-3 mb-4 text-muted small">
          <div className="col-md-4">
            <span className="fw-bold d-block">Técnico Asignado:</span>
            {mantenimiento.nombreTecnico || mantenimiento.tecnicoId}
          </div>
          <div className="col-md-4">
            <span className="fw-bold d-block">Fecha Programada:</span>
            {mantenimiento.fechaProgramada || 'No especificada'}
          </div>
          <div className="col-md-4">
            <span className="fw-bold d-block">Fecha Inicio:</span>
            {mantenimiento.fechaInicio || 'No iniciada'}
          </div>
          <div className="col-12">
            <span className="fw-bold d-block">Observaciones Iniciales (Admin):</span>
            <div className="bg-light p-2 rounded">{mantenimiento.observacionesIniciales || 'Ninguna'}</div>
          </div>
        </div>

        <form onSubmit={handleSaveProgress}>
          <div className="row g-3">
            <div className="col-12">
              <label className="form-label fw-semibold">Diagnóstico</label>
              <textarea 
                name="diagnostico"
                className="form-control" 
                rows="2"
                value={formData.diagnostico}
                onChange={handleChange}
                disabled={!canEdit || !mantenimiento.fechaInicio}
                placeholder="Describa la causa raíz del problema..."
              ></textarea>
            </div>
            
            <div className="col-md-6">
              <label className="form-label fw-semibold">Actividades Realizadas</label>
              <textarea 
                name="actividades"
                className="form-control" 
                rows="3"
                value={formData.actividades}
                onChange={handleChange}
                disabled={!canEdit || !mantenimiento.fechaInicio}
                placeholder="¿Qué acciones se tomaron?"
              ></textarea>
            </div>
            
            <div className="col-md-6">
              <label className="form-label fw-semibold">Repuestos Utilizados</label>
              <textarea 
                name="repuestos"
                className="form-control" 
                rows="3"
                value={formData.repuestos}
                onChange={handleChange}
                disabled={!canEdit || !mantenimiento.fechaInicio}
                placeholder="Liste las piezas cambiadas si las hubo..."
              ></textarea>
            </div>

            <div className="col-md-9">
              <label className="form-label fw-semibold">Observaciones del Técnico</label>
              <input 
                type="text"
                name="observacionesTecnico"
                className="form-control" 
                value={formData.observacionesTecnico}
                onChange={handleChange}
                disabled={!canEdit || !mantenimiento.fechaInicio}
              />
            </div>
            
            <div className="col-md-3">
              <label className="form-label fw-semibold">Tiempo Empleado (horas)</label>
              <input 
                type="number"
                step="0.5"
                min="0"
                name="tiempoEmpleado"
                className="form-control" 
                value={formData.tiempoEmpleado}
                onChange={handleChange}
                disabled={!canEdit || !mantenimiento.fechaInicio}
                placeholder="Ej: 2.5"
              />
            </div>
          </div>

          {canEdit && !mantenimiento.fechaInicio && <button type="button" className="btn btn-primary mt-3" disabled={loading} onClick={handleStart}>Iniciar mantenimiento</button>}
          {canEdit && mantenimiento.fechaInicio && (
            <div className="d-flex justify-content-end align-items-center mt-4 pt-3 border-top gap-2">
              <button type="submit" className="btn btn-outline-primary" disabled={loading}>
                <i className="bi bi-save me-1"></i> Guardar Progreso
              </button>
              <button type="button" className="btn btn-success shadow-sm" onClick={handleFinalize} disabled={loading}>
                <i className="bi bi-check-circle me-1"></i> Finalizar Reparación
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default MaintenanceTracker;
