import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { createIncident, getIncidentById, updateIncident } from '../services/api';
import { AuthContext } from '../auth/AuthContext';

/**
 * IncidentForm — Formulario controlado para crear/editar incidencias
 * Usa useState para cada campo y validaciones básicas
 * @param {number|null} editId - ID de incidencia a editar (null = crear nueva)
 */
function IncidentForm({ editId = null }) {
  const navigate = useNavigate();

  const { user } = useContext(AuthContext);

  // Estado del formulario con useState (formulario controlado)
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

  // Estado para errores de validación
  const [errors, setErrors] = useState({});

  // Estado para mensajes de éxito/error
  const [message, setMessage] = useState({ type: '', text: '' });

  // Estado de carga
  const [loading, setLoading] = useState(false);

  // Opciones para los selects
  const tiposEquipo = ['PC', 'Monitor', 'Teclado', 'Mouse', 'Impresora', 'Proyector', 'Otro'];
  const laboratorios = ['Laboratorio 1', 'Laboratorio 2', 'Laboratorio 3', 'Laboratorio 4', 'Administración'];
  const prioridades = ['Alta', 'Media', 'Baja'];

  // Si hay editId, cargar datos existentes con useEffect
  useEffect(() => {
    if (editId) {
      setLoading(true);
      getIncidentById(editId)
        .then((data) => {
          setFormData({
            codigoEquipo: data.codigoEquipo,
            tipoEquipo: data.tipoEquipo,
            laboratorio: data.laboratorio,
            descripcion: data.descripcion,
            fecha: data.fecha,
            reportante: data.reportante,
            prioridad: data.prioridad,
            estado: data.estado,
          });
        })
        .catch(() => setMessage({ type: 'error', text: 'Error al cargar la incidencia' }))
        .finally(() => setLoading(false));
    }
  }, [editId]);

  // Manejar cambios en los campos del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Limpiar error del campo al escribir
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  // Validar todos los campos requeridos
  const validate = () => {
    const newErrors = {};
    if (!formData.codigoEquipo.trim()) newErrors.codigoEquipo = 'El código de equipo es obligatorio';
    if (!formData.tipoEquipo) newErrors.tipoEquipo = 'Seleccione un tipo de equipo';
    if (!formData.laboratorio) newErrors.laboratorio = 'Seleccione un laboratorio';
    if (!formData.descripcion.trim()) newErrors.descripcion = 'La descripción es obligatoria';
    if (formData.descripcion.trim().length > 0 && formData.descripcion.trim().length < 10) {
      newErrors.descripcion = 'La descripción debe tener al menos 10 caracteres';
    }
    if (!formData.fecha) newErrors.fecha = 'La fecha es obligatoria';
    if (!formData.reportante.trim()) newErrors.reportante = 'El nombre del reportante es obligatorio';
    if (!formData.prioridad) newErrors.prioridad = 'Seleccione una prioridad';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!validate()) return;

    setLoading(true);
    try {
      if (editId) {
        await updateIncident(editId, formData);
        setMessage({ type: 'success', text: '¡Incidencia actualizada exitosamente!' });
      } else {
        await createIncident(formData);
        setMessage({ type: 'success', text: '¡Incidencia registrada exitosamente!' });
        // Limpiar formulario después de crear
        setFormData({
          codigoEquipo: '', tipoEquipo: '', laboratorio: '',
          descripcion: '', fecha: new Date().toISOString().split('T')[0],
          reportante: user && user.rol === 'alumno' ? user.codigo : '', prioridad: '', estado: 'Pendiente',
        });
      }
      // Redirigir a la lista después de 1.5 segundos
      setTimeout(() => navigate('/incidencias'), 1500);
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al guardar la incidencia. Verifica que JSON Server esté ejecutándose.' });
    } finally {
      setLoading(false);
    }
  };

  if (loading && editId) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <span className="loading-text">Cargando incidencia...</span>
      </div>
    );
  }

  return (
    <div className="form-container">
      <h2 className="form-title">
        {editId ? '✏️ Editar Incidencia' : '📝 Registrar Nueva Incidencia'}
      </h2>
      <p className="form-subtitle">
        {editId
          ? 'Modifique los campos necesarios y guarde los cambios.'
          : 'Complete todos los campos para reportar un equipo dañado.'}
      </p>

      {/* Mensaje de éxito o error */}
      {message.text && (
        <div className={`form-message ${message.type === 'success' ? 'success' : 'error-msg'}`}>
          {message.type === 'success' ? '✅' : '❌'} {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          {/* Código de equipo */}
          <div className="form-group">
            <label className="form-label">
              Código de Equipo <span className="required">*</span>
            </label>
            <input
              type="text"
              name="codigoEquipo"
              value={formData.codigoEquipo}
              onChange={handleChange}
              placeholder="Ej: PC-L1-05"
              className={`form-input ${errors.codigoEquipo ? 'error' : ''}`}
            />
            {errors.codigoEquipo && <span className="form-error">{errors.codigoEquipo}</span>}
          </div>

          {/* Tipo de equipo */}
          <div className="form-group">
            <label className="form-label">
              Tipo de Equipo <span className="required">*</span>
            </label>
            <select
              name="tipoEquipo"
              value={formData.tipoEquipo}
              onChange={handleChange}
              className={`form-select ${errors.tipoEquipo ? 'error' : ''}`}
            >
              <option value="">Seleccionar...</option>
              {tiposEquipo.map((tipo) => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>
            {errors.tipoEquipo && <span className="form-error">{errors.tipoEquipo}</span>}
          </div>

          {/* Laboratorio */}
          <div className="form-group">
            <label className="form-label">
              Laboratorio <span className="required">*</span>
            </label>
            <select
              name="laboratorio"
              value={formData.laboratorio}
              onChange={handleChange}
              className={`form-select ${errors.laboratorio ? 'error' : ''}`}
            >
              <option value="">Seleccionar...</option>
              {laboratorios.map((lab) => (
                <option key={lab} value={lab}>{lab}</option>
              ))}
            </select>
            {errors.laboratorio && <span className="form-error">{errors.laboratorio}</span>}
          </div>

          {/* Fecha */}
          <div className="form-group">
            <label className="form-label">
              Fecha <span className="required">*</span>
            </label>
            <input
              type="date"
              name="fecha"
              value={formData.fecha}
              onChange={handleChange}
              className={`form-input ${errors.fecha ? 'error' : ''}`}
            />
            {errors.fecha && <span className="form-error">{errors.fecha}</span>}
          </div>

          {/* Reportante */}
          <div className="form-group">
            <label className="form-label">
              Reportante <span className="required">*</span>
            </label>
            <input
              type="text"
              name="reportante"
              value={formData.reportante}
              onChange={handleChange}
              placeholder="Nombre completo"
              className={`form-input ${errors.reportante ? 'error' : ''}`}
              readOnly={user && user.rol === 'alumno'}
              style={user && user.rol === 'alumno' ? { backgroundColor: '#f5f5f5', color: '#888' } : {}}
            />
            {errors.reportante && <span className="form-error">{errors.reportante}</span>}
          </div>

          {/* Prioridad */}
          <div className="form-group">
            <label className="form-label">
              Prioridad <span className="required">*</span>
            </label>
            <select
              name="prioridad"
              value={formData.prioridad}
              onChange={handleChange}
              className={`form-select ${errors.prioridad ? 'error' : ''}`}
            >
              <option value="">Seleccionar...</option>
              {prioridades.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            {errors.prioridad && <span className="form-error">{errors.prioridad}</span>}
          </div>

          {/* Descripción */}
          <div className="form-group full-width">
            <label className="form-label">
              Descripción de la Falla <span className="required">*</span>
            </label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              placeholder="Describa detalladamente el problema encontrado en el equipo..."
              className={`form-textarea ${errors.descripcion ? 'error' : ''}`}
            />
            {errors.descripcion && <span className="form-error">{errors.descripcion}</span>}
          </div>
        </div>

        {/* Botones de acción */}
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => navigate('/incidencias')}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? '⏳ Guardando...' : (editId ? '💾 Guardar Cambios' : '📤 Registrar Incidencia')}
          </button>
        </div>
      </form>
    </div>
  );
}

export default IncidentForm;
