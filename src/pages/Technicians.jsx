import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTecnicos, deleteTecnico } from '../services/api';

function Technicians() {
  const [tecnicos, setTecnicos] = useState([]);
  const [filtrados, setFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    fetchTecnicos();
  }, []);

  const fetchTecnicos = async () => {
    setLoading(true);
    try {
      const data = await getTecnicos();
      setTecnicos(data);
      setFiltrados(data);
    } catch (error) {
      console.error('Error al cargar técnicos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let resultado = [...tecnicos];
    if (busqueda) {
      const b = busqueda.toLowerCase();
      resultado = resultado.filter(t => 
        t.nombres.toLowerCase().includes(b) || 
        t.apellidos.toLowerCase().includes(b) || 
        t.dni.includes(b) ||
        t.especialidad.toLowerCase().includes(b)
      );
    }
    setFiltrados(resultado);
  }, [busqueda, tecnicos]);

  const handleDelete = async (id) => {
    try {
      await deleteTecnico(id);
      setTecnicos(tecnicos.filter(t => t.id !== id));
      setConfirmDelete(null);
    } catch (error) {
      console.error('Error al eliminar técnico:', error);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <h1 className="h3 fw-bold text-primary mb-1">
            <i className="bi bi-people-fill me-2"></i> Gestión de Técnicos
          </h1>
          <p className="text-muted mb-0">Administra el personal técnico del sistema</p>
        </div>
        <Link to="/nuevo-tecnico" className="btn btn-primary shadow-sm">
          <i className="bi bi-plus-lg me-1"></i> Nuevo Técnico
        </Link>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row">
            <div className="col-md-6 col-lg-4">
              <label className="form-label text-muted small fw-bold">Buscar</label>
              <div className="input-group">
                <span className="input-group-text bg-white"><i className="bi bi-search text-muted"></i></span>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Nombre, DNI o especialidad..." 
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center border-bottom-0">
          <h6 className="mb-0 fw-bold">Técnicos Registrados</h6>
          <span className="badge bg-light text-secondary border">{filtrados.length} resultados</span>
        </div>
        
        <div className="card-body p-0">
          <div className="table-responsive">
            {filtrados.length === 0 ? (
              <div className="text-center p-5 text-muted">
                <i className="bi bi-search fs-1 mb-3 d-block opacity-50"></i>
                <p>No se encontraron técnicos</p>
              </div>
            ) : (
              <table className="table table-hover table-striped align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="px-3">Personal</th>
                    <th>Especialidad</th>
                    <th>Contacto</th>
                    <th>Ingreso</th>
                    <th>Estado</th>
                    <th className="text-end px-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map(tec => (
                    <tr key={tec.id}>
                      <td className="px-3">
                        <div className="d-flex align-items-center">
                          <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3 shadow-sm" style={{ width: '40px', height: '40px' }}>
                            {tec.nombres.charAt(0)}{tec.apellidos.charAt(0)}
                          </div>
                          <div>
                            <div className="fw-bold">{tec.nombres} {tec.apellidos}</div>
                            <div className="small text-muted">DNI: {tec.dni}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="badge bg-light text-dark border">{tec.especialidad}</span></td>
                      <td>
                        <div className="small"><i className="bi bi-envelope me-1 text-muted"></i>{tec.correo}</div>
                        <div className="small"><i className="bi bi-telephone me-1 text-muted"></i>{tec.telefono}</div>
                      </td>
                      <td>{tec.fechaIngreso}</td>
                      <td>
                        <span className={`badge ${tec.estado === 'Activo' ? 'bg-success' : 'bg-secondary'}`}>
                          {tec.estado}
                        </span>
                      </td>
                      <td className="text-end px-3">
                        <div className="btn-group">
                          <Link to={`/editar-tecnico/${tec.id}`} className="btn btn-sm btn-outline-primary" title="Editar">
                            <i className="bi bi-pencil"></i>
                          </Link>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => setConfirmDelete(tec.id)} title="Eliminar">
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {confirmDelete && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal d-block" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header bg-danger text-white border-bottom-0">
                  <h5 className="modal-title"><i className="bi bi-exclamation-triangle-fill me-2"></i>Confirmar Eliminación</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setConfirmDelete(null)}></button>
                </div>
                <div className="modal-body">
                  ¿Está seguro de que desea eliminar este técnico? Esta acción no se puede deshacer.
                </div>
                <div className="modal-footer border-top-0 bg-light">
                  <button type="button" className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancelar</button>
                  <button type="button" className="btn btn-danger" onClick={() => handleDelete(confirmDelete)}>Eliminar Definitivamente</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Technicians;
