import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function TechnicianForm({ initialData, onSubmit, isEditing }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    codigo: '',
    contrasena: 'tec123',
    rol: 'tecnico',
    dni: '',
    nombres: '',
    apellidos: '',
    especialidad: '',
    telefono: '',
    correo: '',
    estado: 'Activo',
    fechaIngreso: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-white pt-4 pb-0 border-bottom-0">
        <h5 className="fw-bold mb-0">
          <i className={`bi bi-${isEditing ? 'pencil-square text-primary' : 'person-plus-fill text-success'} me-2`}></i>
          {isEditing ? 'Editar Técnico' : 'Registrar Nuevo Técnico'}
        </h5>
      </div>
      <div className="card-body p-4">
        <form onSubmit={handleSubmit}>
          <h6 className="text-secondary fw-bold mb-3 border-bottom pb-2">Información Personal</h6>
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <label className="form-label fw-semibold">DNI</label>
              <input type="text" className="form-control" name="dni" required value={formData.dni} onChange={handleChange} maxLength="8" pattern="[0-9]{8}" title="Debe contener 8 dígitos" />
            </div>
            <div className="col-md-4">
              <label className="form-label fw-semibold">Nombres</label>
              <input type="text" className="form-control" name="nombres" required value={formData.nombres} onChange={handleChange} />
            </div>
            <div className="col-md-4">
              <label className="form-label fw-semibold">Apellidos</label>
              <input type="text" className="form-control" name="apellidos" required value={formData.apellidos} onChange={handleChange} />
            </div>
          </div>

          <h6 className="text-secondary fw-bold mb-3 border-bottom pb-2">Contacto y Especialidad</h6>
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <label className="form-label fw-semibold">Teléfono</label>
              <input type="tel" className="form-control" name="telefono" required value={formData.telefono} onChange={handleChange} />
            </div>
            <div className="col-md-4">
              <label className="form-label fw-semibold">Correo Electrónico</label>
              <input type="email" className="form-control" name="correo" required value={formData.correo} onChange={handleChange} />
            </div>
            <div className="col-md-4">
              <label className="form-label fw-semibold">Especialidad</label>
              <select className="form-select" name="especialidad" required value={formData.especialidad} onChange={handleChange}>
                <option value="">Seleccione especialidad...</option>
                <option value="Hardware y Redes">Hardware y Redes</option>
                <option value="Software y Sistemas">Software y Sistemas</option>
                <option value="Electrónica">Electrónica</option>
                <option value="Soporte General">Soporte General</option>
              </select>
            </div>
          </div>

          <h6 className="text-secondary fw-bold mb-3 border-bottom pb-2">Datos del Sistema</h6>
          <div className="row g-3 mb-4">
            <div className="col-md-3">
              <label className="form-label fw-semibold">Código de Usuario</label>
              <input type="text" className="form-control" name="codigo" required value={formData.codigo} onChange={handleChange} pattern="^TEC[0-9]{3}$" title="El código debe empezar por TEC seguido de 3 números (Ej: TEC001)" />
            </div>
            <div className="col-md-3">
              <label className="form-label fw-semibold">Contraseña</label>
              <input type="text" className="form-control" name="contrasena" required value={formData.contrasena} onChange={handleChange} />
            </div>
            <div className="col-md-3">
              <label className="form-label fw-semibold">Fecha de Ingreso</label>
              <input type="date" className="form-control" name="fechaIngreso" required value={formData.fechaIngreso} onChange={handleChange} />
            </div>
            <div className="col-md-3">
              <label className="form-label fw-semibold">Estado</label>
              <select className="form-select" name="estado" required value={formData.estado} onChange={handleChange}>
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <button type="button" className="btn btn-light border shadow-sm" onClick={() => navigate('/tecnicos')}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary shadow-sm px-4">
              <i className="bi bi-save me-2"></i> {isEditing ? 'Guardar Cambios' : 'Registrar Técnico'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TechnicianForm;
