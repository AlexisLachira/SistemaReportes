import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { createIncident, getIncidentById, updateIncident } from '../services/api';
import { AuthContext } from '../auth/AuthContext';

function IncidentForm({ editId = null }) {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    codigoEquipo: '',
    tipoEquipo: '',
    laboratorio: '',
    descripcion: '',
    fecha: new Date().toISOString().split('T')[0],
    reportante: user && user.rol === 'alumno' ? user.codigo : '',
    prioridad: '',
    estado: 'Pendiente',
  });

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const tiposEquipo = ['PC', 'Monitor', 'Teclado', 'Mouse', 'Impresora', 'Proyector', 'Otro'];
  const laboratorios = ['Laboratorio 1', 'Laboratorio 2', 'Laboratorio 3', 'Laboratorio 4', 'Administración'];
  const prioridades = ['Alta', 'Media', 'Baja'];

  useEffect(() => {
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
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.codigoEquipo.trim()) newErrors.codigoEquipo = 'Obligatorio';
    if (!formData.tipoEquipo) newErrors.tipoEquipo = 'Seleccione';
    if (!formData.laboratorio) newErrors.laboratorio = 'Seleccione';
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
      if (editId) {
        await updateIncident(editId, formData);
        setMessage({ type: 'success', text: 'Incidencia actualizada exitosamente' });
      } else {
        await createIncident(formData);
        setMessage({ type: 'success', text: 'Incidencia registrada exitosamente' });
        setFormData({
          codigoEquipo: '', tipoEquipo: '', laboratorio: '',
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
            <div className="col-md-6">
              <label className="form-label fw-semibold">Código de Equipo <span className="text-danger">*</span></label>
              <input
                type="text"
                name="codigoEquipo"
                value={formData.codigoEquipo}
                onChange={handleChange}
                placeholder="Ej: PC-L1-05"
                className={`form-control ${errors.codigoEquipo ? 'is-invalid' : ''}`}
              />
              {errors.codigoEquipo && <div className="invalid-feedback">{errors.codigoEquipo}</div>}
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Tipo de Equipo <span className="text-danger">*</span></label>
              <select
                name="tipoEquipo"
                value={formData.tipoEquipo}
                onChange={handleChange}
                className={`form-select ${errors.tipoEquipo ? 'is-invalid' : ''}`}
              >
                <option value="">Seleccionar...</option>
                {tiposEquipo.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              {errors.tipoEquipo && <div className="invalid-feedback">{errors.tipoEquipo}</div>}
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Laboratorio <span className="text-danger">*</span></label>
              <select
                name="laboratorio"
                value={formData.laboratorio}
                onChange={handleChange}
                className={`form-select ${errors.laboratorio ? 'is-invalid' : ''}`}
              >
                <option value="">Seleccionar...</option>
                {laboratorios.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              {errors.laboratorio && <div className="invalid-feedback">{errors.laboratorio}</div>}
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
