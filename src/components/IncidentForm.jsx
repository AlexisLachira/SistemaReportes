import { sameId, userName } from '../domain/maintenance';
import { reportIncident } from '../services/workflow';
import EquipmentLookup from './EquipmentLookup';
import { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getIncidentById, updateIncident, getEquipos } from '../services/api';
import { AuthContext } from '../auth/AuthContext';

function IncidentForm({ editId = null }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const requestedId = params.get('equipoId');
  const originId = params.get('origenMantenimientoId');
  const { user } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    codigoEquipo: '',
    equipoId: '', 
    tipoEquipo: '',
    laboratorio: '',
    estadoEquipo: '', 
    descripcion: '',
    fecha: new Date().toISOString().split('T')[0],
    reportante: userName(user),
    prioridad: '',
    estado: 'Reportada',
    usuariosAfectados: '',
    impideActividades: ''
  });

  const [equiposList, setEquiposList] = useState([]);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(!!editId);

  // States for cascade selection
  const [selectedAmbiente, setSelectedAmbiente] = useState('');
  const [selectedTipo, setSelectedTipo] = useState('');

  useEffect(() => {
    getEquipos().then(equipos => {
      setEquiposList(equipos);
      if (!editId && requestedId && originId) {
        const eq = equipos.find(e => sameId(e.id, requestedId));
        if (!eq) { setMessage({ type: 'error', text: 'Equipo no encontrado.' }); return; }
        setSelectedAmbiente(eq.laboratorio); setSelectedTipo(eq.tipoEquipo);
        setFormData(prev => ({ ...prev, equipoId: eq.id, codigoEquipo: eq.codigoPatrimonial, laboratorio: eq.laboratorio, tipoEquipo: eq.tipoEquipo, origenMantenimientoId: originId }));
      }
    }).catch(() => setMessage({ type: 'error', text: 'No se pudo consultar el inventario.' }));

    if (editId) {
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
  }, [editId, requestedId, originId]);

  const selectable = useMemo(() => equiposList.filter(e => e.estado === 'Disponible' || ((editId || originId) && sameId(e.id, formData.equipoId))), [equiposList, editId, originId, formData.equipoId]);
  const ambientes = useMemo(() => [...new Set(selectable.map(e => e.laboratorio))], [selectable]);
  const tiposDisponibles = useMemo(() => [...new Set(selectable.filter(e => e.laboratorio === selectedAmbiente).map(e => e.tipoEquipo))], [selectable, selectedAmbiente]);
  const equiposDisponibles = useMemo(() => selectable.filter(e => e.laboratorio === selectedAmbiente && e.tipoEquipo === selectedTipo), [selectable, selectedAmbiente, selectedTipo]);

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
      const selectedEquipo = equiposList.find(eq => String(eq.id) === String(value));
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
        await reportIncident(dataToSave, user);
        setMessage({ type: 'success', text: 'Incidencia registrada exitosamente' });
      }
      setTimeout(() => navigate('/incidencias'), 1500);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Error al guardar la incidencia.' });
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
          {!editId && !originId && <EquipmentLookup onClear={() => {
            setSelectedAmbiente(''); setSelectedTipo('');
            setFormData(prev => ({ ...prev, equipoId: '', codigoEquipo: '', laboratorio: '', tipoEquipo: '', prioridad: '' }));
            setMessage({ type: '', text: '' });
          }} onSelect={(eq) => {
            if (eq.estado !== 'Disponible') {
              setMessage({ type: 'error', text: 'El equipo no está disponible para una nueva incidencia. Revise sus incidencias existentes.' });
              return;
            }
            setSelectedAmbiente(eq.laboratorio);
            setSelectedTipo(eq.tipoEquipo);
            setFormData(prev => ({ ...prev, equipoId: eq.id, codigoEquipo: eq.codigoPatrimonial, laboratorio: eq.laboratorio, tipoEquipo: eq.tipoEquipo, estadoEquipo: eq.estado, prioridad: calculatePriority(eq, prev.usuariosAfectados, prev.impideActividades) }));
            setMessage({ type: 'success', text: `Equipo cargado: ${eq.codigoPatrimonial} - ${eq.marca} ${eq.modelo}` });
          }} />}
          <div className="row g-4">
            
            {/* Paso 1: Ambiente */}
            <div className="col-md-4">
              <label className="form-label fw-semibold">1. Ambiente o Ubicación <span className="text-danger">*</span></label>
              <select
                value={selectedAmbiente}
                onChange={(e) => handleCascadeChange('ambiente', e.target.value)}
                className={`form-select ${errors.ambiente ? 'is-invalid' : ''}`}
                disabled={!!editId || !!originId}
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
                disabled={!selectedAmbiente || !!editId || !!originId}
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
                disabled={!selectedTipo || !!editId || !!originId}
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
