import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEquipo, getEquipoById, updateEquipo } from '../services/api';

function EquipmentForm({ editId = null }) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    codigoPatrimonial: '',
    numeroSerie: '',
    tipoEquipo: '',
    marca: '',
    modelo: '',
    laboratorio: '',
    estado: 'Disponible',
    fechaAdquisicion: new Date().toISOString().split('T')[0],
    observaciones: '',
  });

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const tiposEquipo = ['PC', 'Monitor', 'Impresora', 'Router', 'Switch', 'Proyector', 'Otro'];
  const laboratorios = ['Laboratorio 1', 'Laboratorio 2', 'Laboratorio 3', 'Laboratorio 4', 'Administración'];
  const estados = ['Disponible', 'En mantenimiento', 'Dañado', 'Retirado'];

  useEffect(() => {
    if (editId) {
      setLoading(true);
      getEquipoById(editId)
        .then((data) => {
          setFormData(data);
        })
        .catch(() => setMessage({ type: 'error', text: 'Error al cargar el equipo' }))
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
    if (!formData.codigoPatrimonial.trim()) newErrors.codigoPatrimonial = 'Obligatorio';
    if (!formData.tipoEquipo) newErrors.tipoEquipo = 'Seleccione';
    if (!formData.marca.trim()) newErrors.marca = 'Obligatorio';
    if (!formData.modelo.trim()) newErrors.modelo = 'Obligatorio';
    if (!formData.laboratorio) newErrors.laboratorio = 'Seleccione';
    if (!formData.estado) newErrors.estado = 'Seleccione';
    if (!formData.fechaAdquisicion) newErrors.fechaAdquisicion = 'Obligatorio';
    
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
        await updateEquipo(editId, formData);
        setMessage({ type: 'success', text: 'Equipo actualizado exitosamente' });
      } else {
        await createEquipo(formData);
        setMessage({ type: 'success', text: 'Equipo registrado exitosamente' });
      }
      setTimeout(() => navigate('/inventario'), 1500);
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
              <label className="form-label fw-semibold">Código Patrimonial <span className="text-danger">*</span></label>
              <input
                type="text"
                name="codigoPatrimonial"
                value={formData.codigoPatrimonial}
                onChange={handleChange}
                placeholder="Ej: PC-LAB01-001"
                className={`form-control ${errors.codigoPatrimonial ? 'is-invalid' : ''}`}
              />
              {errors.codigoPatrimonial && <div className="invalid-feedback">{errors.codigoPatrimonial}</div>}
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Número de Serie</label>
              <input
                type="text"
                name="numeroSerie"
                value={formData.numeroSerie}
                onChange={handleChange}
                placeholder="Ej: SN-123456"
                className="form-control"
              />
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
              <label className="form-label fw-semibold">Marca <span className="text-danger">*</span></label>
              <input
                type="text"
                name="marca"
                value={formData.marca}
                onChange={handleChange}
                placeholder="Ej: Dell"
                className={`form-control ${errors.marca ? 'is-invalid' : ''}`}
              />
              {errors.marca && <div className="invalid-feedback">{errors.marca}</div>}
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Modelo <span className="text-danger">*</span></label>
              <input
                type="text"
                name="modelo"
                value={formData.modelo}
                onChange={handleChange}
                placeholder="Ej: OptiPlex 7090"
                className={`form-control ${errors.modelo ? 'is-invalid' : ''}`}
              />
              {errors.modelo && <div className="invalid-feedback">{errors.modelo}</div>}
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
              <label className="form-label fw-semibold">Estado <span className="text-danger">*</span></label>
              <select
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                className={`form-select ${errors.estado ? 'is-invalid' : ''}`}
              >
                {estados.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
              {errors.estado && <div className="invalid-feedback">{errors.estado}</div>}
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Fecha de Adquisición <span className="text-danger">*</span></label>
              <input
                type="date"
                name="fechaAdquisicion"
                value={formData.fechaAdquisicion}
                onChange={handleChange}
                className={`form-control ${errors.fechaAdquisicion ? 'is-invalid' : ''}`}
              />
              {errors.fechaAdquisicion && <div className="invalid-feedback">{errors.fechaAdquisicion}</div>}
            </div>

            <div className="col-12">
              <label className="form-label fw-semibold">Observaciones</label>
              <textarea
                name="observaciones"
                value={formData.observaciones}
                onChange={handleChange}
                rows="3"
                placeholder="Detalles adicionales del equipo..."
                className="form-control"
              />
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <button type="button" className="btn btn-light border" onClick={() => navigate('/inventario')}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary px-4" disabled={loading}>
              {loading ? (
                <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Guardando...</>
              ) : (
                editId ? <><i className="bi bi-save me-2"></i>Guardar Cambios</> : <><i className="bi bi-send me-2"></i>Registrar Equipo</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EquipmentForm;
