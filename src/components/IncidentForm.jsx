import { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createIncident, getIncidentById, updateIncident, getEquipos, getEquipoById, updateEquipo, createHistorial } from '../services/api';
import { AuthContext } from '../auth/AuthContext';

function IncidentForm({ editId = null }) {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    codigoEquipo: '',
    equipoId: '', 
    tipoEquipo: '',
    laboratorio: '',
    estadoEquipo: '', 
    descripcion: '',
    fecha: new Date().toISOString().split('T')[0],
    reportante: user ? user.nombre : '',
    prioridad: '',
    estado: 'Reportada',
    usuariosAfectados: '',
    impideActividades: ''
  });

  const [equiposList, setEquiposList] = useState([]);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  // States for cascade selection
  const [selectedAmbiente, setSelectedAmbiente] = useState('');
  const [selectedTipo, setSelectedTipo] = useState('');

  useEffect(() => {
    getEquipos().then(setEquiposList).catch(console.error);

    if (editId) {
      setLoading(true);
      getIncidentById(editId)
        .then((data) => {
          if (data.estado === 'Cerrada') {
            setMessage({ type: 'error', text: 'No se puede editar una incidencia que ya ha sido cerrada.' });
          } else {
            setFormData(data);
            setSelectedAmbiente(data.laboratorio);
            setSelectedTipo(data.tipoEquipo);
          }
        })
        .catch(() => setMessage({ type: 'error', text: 'Error al cargar la incidencia' }))
        .finally(() => setLoading(false));
    }
  }, [editId]);

  const ambientes = useMemo(() => [...new Set(equiposList.filter(e => e.estado === 'Disponible').map(e => e.laboratorio))], [equiposList]);
  const tiposDisponibles = useMemo(() => [...new Set(equiposList.filter(e => e.laboratorio === selectedAmbiente && e.estado === 'Disponible').map(e => e.tipoEquipo))], [equiposList, selectedAmbiente]);
  const equiposDisponibles = useMemo(() => equiposList.filter(e => e.laboratorio === selectedAmbiente && e.tipoEquipo === selectedTipo && e.estado === 'Disponible'), [equiposList, selectedAmbiente, selectedTipo]);

  const calculatePriority = (equipo, users, disruption) => {
    if (!equipo || !users || !disruption) return '';
    
    const crit = equipo.criticidad || 'Media';
    if (crit === 'Crítica') return 'Crítica';

    let score = 0;
    
    // Base score from criticality
    if (crit === 'Baja') score += 1;
    if (crit === 'Media') score += 2;
    if (crit === 'Alta') score += 4;

    // Users impact
    if (users === '2-10') score += 1;
    if (users === '11-30') score += 2;
    if (users === '>30') score += 3;

    // Disruption impact
    if (disruption === 'Afecta parcialmente') score += 1;
    if (disruption === 'Impide actividades') score += 2;

    if (score <= 2) return 'Baja';
    if (score <= 4) return 'Media';
    if (score <= 6) return 'Alta';
    return 'Crítica';
  };

  const handleCascadeChange = (level, value) => {
    if (level === 'ambiente') {
      setSelectedAmbiente(value);
      setSelectedTipo('');
      setFormData({ ...formData, codigoEquipo: '', equipoId: '', laboratorio: value, tipoEquipo: '', prioridad: '' });
    } else if (level === 'tipo') {
      setSelectedTipo(value);
      setFormData({ ...formData, codigoEquipo: '', equipoId: '', tipoEquipo: value, prioridad: '' });
    } else if (level === 'equipo') {
      const selectedEquipo = equiposList.find(eq => eq.id === value);
      if (selectedEquipo) {
        const priority = calculatePriority(selectedEquipo, formData.usuariosAfectados, formData.impideActividades);
        setFormData({
          ...formData,
          codigoEquipo: selectedEquipo.codigoPatrimonial,
          equipoId: selectedEquipo.id,
          estadoEquipo: selectedEquipo.estado,
          prioridad: priority
        });
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newData = { ...formData, [name]: value };

    if (name === 'usuariosAfectados' || name === 'impideActividades') {
      if (formData.equipoId) {
        const selectedEquipo = equiposList.find(eq => eq.id === formData.equipoId);
        newData.prioridad = calculatePriority(selectedEquipo, newData.usuariosAfectados, newData.impideActividades);
      }
    }

    setFormData(newData);
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  const validate = () => {
    const newErrors = {};
    if (!selectedAmbiente) newErrors.ambiente = 'Seleccione ambiente';
    if (!selectedTipo) newErrors.tipo = 'Seleccione tipo';
    if (!formData.equipoId) newErrors.equipoId = 'Seleccione equipo';
    if (!formData.descripcion.trim()) newErrors.descripcion = 'Obligatorio';
    else if (formData.descripcion.trim().length < 10) newErrors.descripcion = 'Mínimo 10 caracteres';
    if (!formData.fecha) newErrors.fecha = 'Obligatorio';
    if (!formData.reportante.trim()) newErrors.reportante = 'Obligatorio';
    if (!formData.usuariosAfectados) newErrors.usuariosAfectados = 'Seleccione cantidad';
    if (!formData.impideActividades) newErrors.impideActividades = 'Seleccione nivel';
    
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
      delete dataToSave.estadoEquipo;

      if (editId) {
        await updateIncident(editId, dataToSave);
        setMessage({ type: 'success', text: 'Incidencia actualizada exitosamente' });
      } else {
        const newInc = await createIncident(dataToSave);
        
        await createHistorial({
          incidenciaId: newInc.id,
          usuario: user.nombre,
          accion: 'Reportó incidencia',
          observacion: 'Falla inicial reportada. Prioridad calculada: ' + dataToSave.prioridad
        });

        if (formData.equipoId) {
          try {
            const eqData = await getEquipoById(formData.equipoId);
            await updateEquipo(formData.equipoId, { ...eqData, estado: 'Dañado' });
          } catch (e) {
            console.error('Error al actualizar el estado del equipo', e);
          }
        }

        setMessage({ type: 'success', text: 'Incidencia registrada exitosamente' });
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
          <fieldset disabled={message.type === 'error' && message.text.includes('cerrada')}>
          <div className="row g-4">
            
            {/* Paso 1: Ambiente */}
            <div className="col-md-4">
              <label className="form-label fw-semibold">1. Ambiente o Ubicación <span className="text-danger">*</span></label>
              <select
                value={selectedAmbiente}
                onChange={(e) => handleCascadeChange('ambiente', e.target.value)}
                className={`form-select ${errors.ambiente ? 'is-invalid' : ''}`}
                disabled={!!editId}
              >
                <option value="">Seleccione ambiente...</option>
                {ambientes.map(amb => <option key={amb} value={amb}>{amb}</option>)}
              </select>
              {errors.ambiente && <div className="invalid-feedback">{errors.ambiente}</div>}
            </div>

            {/* Paso 2: Tipo de Equipo */}
            <div className="col-md-4">
              <label className="form-label fw-semibold">2. Tipo de Activo <span className="text-danger">*</span></label>
              <select
                value={selectedTipo}
                onChange={(e) => handleCascadeChange('tipo', e.target.value)}
                className={`form-select ${errors.tipo ? 'is-invalid' : ''}`}
                disabled={!selectedAmbiente || !!editId}
              >
                <option value="">Seleccione tipo...</option>
                {tiposDisponibles.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              {errors.tipo && <div className="invalid-feedback">{errors.tipo}</div>}
            </div>

            {/* Paso 3: Equipo */}
            <div className="col-md-4">
              <label className="form-label fw-semibold">3. Equipo Específico <span className="text-danger">*</span></label>
              <select
                name="equipoId"
                value={formData.equipoId}
                onChange={(e) => handleCascadeChange('equipo', e.target.value)}
                className={`form-select ${errors.equipoId ? 'is-invalid' : ''}`}
                disabled={!selectedTipo || !!editId}
              >
                <option value="">Seleccione equipo...</option>
                {equiposDisponibles.map(eq => (
                  <option key={eq.id} value={eq.id}>
                    {eq.codigoPatrimonial} - {eq.marca} {eq.modelo}
                  </option>
                ))}
              </select>
              {errors.equipoId && <div className="invalid-feedback">{errors.equipoId}</div>}
            </div>

            <hr className="my-4 text-muted" />

            {/* Factores de Impacto */}
            <div className="col-md-6">
              <label className="form-label fw-semibold">Usuarios Afectados <span className="text-danger">*</span></label>
              <select
                name="usuariosAfectados"
                value={formData.usuariosAfectados}
                onChange={handleChange}
                className={`form-select ${errors.usuariosAfectados ? 'is-invalid' : ''}`}
              >
                <option value="">Seleccionar...</option>
                <option value="1">1 usuario</option>
                <option value="2-10">2 a 10 usuarios</option>
                <option value="11-30">11 a 30 usuarios (Lab parcial)</option>
                <option value=">30">Más de 30 usuarios (Lab completo / Facultad)</option>
              </select>
              {errors.usuariosAfectados && <div className="invalid-feedback">{errors.usuariosAfectados}</div>}
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Interrupción del Servicio <span className="text-danger">*</span></label>
              <select
                name="impideActividades"
                value={formData.impideActividades}
                onChange={handleChange}
                className={`form-select ${errors.impideActividades ? 'is-invalid' : ''}`}
              >
                <option value="">Seleccionar...</option>
                <option value="No afecta">No afecta actividades (Estético o menor)</option>
                <option value="Afecta parcialmente">Afecta parcialmente (Se puede seguir trabajando)</option>
                <option value="Impide actividades">Impide actividades (Equipo inoperable)</option>
              </select>
              {errors.impideActividades && <div className="invalid-feedback">{errors.impideActividades}</div>}
            </div>

            <div className="col-md-4 mt-4">
              <label className="form-label fw-semibold">Prioridad Calculada</label>
              <input
                type="text"
                value={formData.prioridad || 'Se calcula automáticamente'}
                readOnly
                className={`form-control bg-light fw-bold ${
                  formData.prioridad === 'Crítica' ? 'text-danger' : 
                  formData.prioridad === 'Alta' ? 'text-warning' : 
                  formData.prioridad === 'Media' ? 'text-info' : 'text-success'
                }`}
              />
            </div>

            <div className="col-md-4 mt-4">
              <label className="form-label fw-semibold">Fecha de Reporte <span className="text-danger">*</span></label>
              <input
                type="date"
                name="fecha"
                value={formData.fecha}
                onChange={handleChange}
                className={`form-control ${errors.fecha ? 'is-invalid' : ''}`}
              />
            </div>

            <div className="col-md-4 mt-4">
              <label className="form-label fw-semibold">Reportante <span className="text-danger">*</span></label>
              <input
                type="text"
                name="reportante"
                value={formData.reportante}
                readOnly
                className={`form-control bg-light ${errors.reportante ? 'is-invalid' : ''}`}
              />
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
          </fieldset>
        </form>
      </div>
    </div>
  );
}

export default IncidentForm;
