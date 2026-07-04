import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { createIncident, getIncidentById, updateIncident, getEquipos } from '../services/api';
import { AuthContext } from '../auth/AuthContext';

function IncidentForm({ editId = null }) {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    codigoEquipo: '',
    equipoId: '', // Nuevo campo para guardar el ID del equipo
    tipoEquipo: '',
    laboratorio: '',
    estadoEquipo: '', // Estado actual del equipo (read-only visual)
    descripcion: '',
    fecha: new Date().toISOString().split('T')[0],
    reportante: user && user.rol === 'alumno' ? user.codigo : '',
    prioridad: '',
    estado: 'Pendiente',
  });

  const [equiposList, setEquiposList] = useState([]);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const prioridades = ['Alta', 'Media', 'Baja'];

  useEffect(() => {
    // Cargar equipos para el selector
    getEquipos().then(setEquiposList).catch(console.error);

    if (editId) {
      setLoading(true);
      getIncidentById(editId)
        .then((data) => {
          setFormData(data);
        })
        .catch(() => setMessage({ type: 'error', text: 'Error al cargar la incidencia' }))
        .finally(() => setLoading(false));
    }
  }, [editId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'codigoEquipo') {
      const selectedEquipo = equiposList.find(eq => eq.codigoPatrimonial === value);
      if (selectedEquipo) {
        setFormData({
          ...formData,
          codigoEquipo: selectedEquipo.codigoPatrimonial,
          equipoId: selectedEquipo.id,
          tipoEquipo: selectedEquipo.tipoEquipo,
          laboratorio: selectedEquipo.laboratorio,
          estadoEquipo: selectedEquipo.estado
        });
      } else {
        setFormData({
          ...formData,
          codigoEquipo: value,
          equipoId: '',
          tipoEquipo: '',
          laboratorio: '',
          estadoEquipo: ''
        });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
    
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.codigoEquipo) newErrors.codigoEquipo = 'Seleccione';
    if (!formData.descripcion.trim()) newErrors.descripcion = 'Obligatorio';
    else if (formData.descripcion.trim().length < 10) newErrors.descripcion = 'Mínimo 10 caracteres';
    if (!formData.fecha) newErrors.fecha = 'Obligatorio';
    if (!formData.reportante.trim()) newErrors.reportante = 'Obligatorio';
    if (!formData.prioridad) newErrors.prioridad = 'Seleccione';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!validate()) return;

    setLoading(true);
    try {
      const dataToSave = { ...formData };
      delete dataToSave.estadoEquipo; // No necesitamos guardar esto en la base de datos de incidencias, solo visual

      if (editId) {
        await updateIncident(editId, dataToSave);
        setMessage({ type: 'success', text: 'Incidencia actualizada exitosamente' });
      } else {
        await createIncident(dataToSave);
        setMessage({ type: 'success', text: 'Incidencia registrada exitosamente' });
        setFormData({
          codigoEquipo: '', equipoId: '', tipoEquipo: '', laboratorio: '', estadoEquipo: '',
          descripcion: '', fecha: new Date().toISOString().split('T')[0],
          reportante: user && user.rol === 'alumno' ? user.codigo : '', prioridad: '', estado: 'Pendiente',
        });
      }
      setTimeout(() => navigate('/incidencias'), 1500);
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexión con el servidor.' });
    } finally {
      setLoading(false);
    }
  };

  if (loading && editId) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body p-4">
        {message.text && (
          <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'} d-flex align-items-center`} role="alert">
            <i className={`bi ${message.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`}></i>
            <div>{message.text}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="row g-4">
            <div className="col-md-12">
              <label className="form-label fw-semibold">Equipo <span className="text-danger">*</span></label>
              <select
                name="codigoEquipo"
                value={formData.codigoEquipo}
                onChange={handleChange}
                className={`form-select ${errors.codigoEquipo ? 'is-invalid' : ''}`}
              >
                <option value="">Seleccione un equipo del inventario...</option>
                {equiposList.map(eq => (
                  <option key={eq.id} value={eq.codigoPatrimonial}>
                    {eq.codigoPatrimonial} - {eq.tipoEquipo} ({eq.laboratorio})
                  </option>
                ))}
              </select>
              {errors.codigoEquipo && <div className="invalid-feedback">{errors.codigoEquipo}</div>}
            </div>

            <div className="col-md-4">
              <label className="form-label fw-semibold">Tipo de Equipo</label>
              <input
                type="text"
                value={formData.tipoEquipo}
                readOnly
                className="form-control bg-light"
              />
            </div>

            <div className="col-md-4">
              <label className="form-label fw-semibold">Laboratorio</label>
              <input
                type="text"
                value={formData.laboratorio}
                readOnly
                className="form-control bg-light"
              />
            </div>

            <div className="col-md-4">
              <label className="form-label fw-semibold">Estado Actual del Equipo</label>
              <input
                type="text"
                value={formData.estadoEquipo || ''}
                readOnly
                className="form-control bg-light text-danger fw-semibold"
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Prioridad <span className="text-danger">*</span></label>
              <select
                name="prioridad"
                value={formData.prioridad}
                onChange={handleChange}
                className={`form-select ${errors.prioridad ? 'is-invalid' : ''}`}
              >
                <option value="">Seleccionar...</option>
                {prioridades.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              {errors.prioridad && <div className="invalid-feedback">{errors.prioridad}</div>}
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Fecha de Reporte <span className="text-danger">*</span></label>
              <input
                type="date"
                name="fecha"
                value={formData.fecha}
                onChange={handleChange}
                className={`form-control ${errors.fecha ? 'is-invalid' : ''}`}
              />
              {errors.fecha && <div className="invalid-feedback">{errors.fecha}</div>}
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Reportante <span className="text-danger">*</span></label>
              <input
                type="text"
                name="reportante"
                value={formData.reportante}
                onChange={handleChange}
                placeholder="Código de alumno o nombre"
                className={`form-control ${errors.reportante ? 'is-invalid' : ''}`}
                readOnly={user && user.rol === 'alumno'}
              />
              {errors.reportante && <div className="invalid-feedback">{errors.reportante}</div>}
            </div>

            <div className="col-12">
              <label className="form-label fw-semibold">Descripción de la Falla <span className="text-danger">*</span></label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                rows="4"
                placeholder="Describa detalladamente el problema encontrado en el equipo..."
                className={`form-control ${errors.descripcion ? 'is-invalid' : ''}`}
              />
              {errors.descripcion && <div className="invalid-feedback">{errors.descripcion}</div>}
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <button type="button" className="btn btn-light border" onClick={() => navigate('/incidencias')}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary px-4" disabled={loading}>
              {loading ? (
                <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Guardando...</>
              ) : (
                editId ? <><i className="bi bi-save me-2"></i>Guardar Cambios</> : <><i className="bi bi-send me-2"></i>Registrar Incidencia</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default IncidentForm;
