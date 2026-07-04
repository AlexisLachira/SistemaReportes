import { useState, useContext } from 'react';
import { updateMantenimiento, updateIncident, createHistorial } from '../services/api';
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
  
  const canEdit = isTecnico && isActive && mantenimiento.tecnicoId === user.id;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveProgress = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateMantenimiento(mantenimiento.id, {
        ...mantenimiento,
        ...formData
      });
      await createHistorial({
        incidenciaId: incidencia.id,
        usuario: user.nombre,
        accion: 'Actualizó progreso',
        observacion: 'El técnico guardó avances en el mantenimiento'
      });
      setMessage('Progreso guardado correctamente');
      setTimeout(() => setMessage(''), 3000);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error(error);
      setMessage('Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async () => {
    if (!window.confirm('¿Estás seguro de marcar esta reparación como finalizada?')) return;
    
    setLoading(true);
    try {
      // 1. Update mantenimiento with end date
      await updateMantenimiento(mantenimiento.id, {
        ...mantenimiento,
        ...formData,
        fechaFin: new Date().toISOString().split('T')[0]
      });
      
      // 2. Update incident status
      await updateIncident(incidencia.id, {
        ...incidencia,
        estado: 'Reparada'
      });

      // 3. Add to history
      await createHistorial({
        incidenciaId: incidencia.id,
        usuario: user.nombre,
        accion: 'Finalizó mantenimiento',
        observacion: 'El técnico marcó la incidencia como Reparada'
      });
      
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error(error);
      alert('Error al finalizar el mantenimiento');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeStatus = async (nuevoEstado) => {
    setLoading(true);
    try {
      await updateIncident(incidencia.id, {
        ...incidencia,
        estado: nuevoEstado
      });
      
      await createHistorial({
        incidenciaId: incidencia.id,
        usuario: user.nombre,
        accion: `Cambió estado a ${nuevoEstado}`,
        observacion: 'Actualización rápida de estado por el técnico'
      });
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card border-0 shadow-sm mt-4 border-top border-warning border-3">
      <div className="card-header bg-white border-bottom-0 pt-3 pb-0">
        <h5 className="mb-0 fw-bold"><i className="bi bi-tools me-2 text-warning"></i>Registro de Mantenimiento</h5>
      </div>
      <div className="card-body">
        
        {message && <div className="alert alert-success py-2">{message}</div>}

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
                disabled={!canEdit}
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
                disabled={!canEdit}
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
                disabled={!canEdit}
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
                disabled={!canEdit}
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
                disabled={!canEdit}
                placeholder="Ej: 2.5"
              />
            </div>
          </div>

          {canEdit && (
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
