import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { getEquipos, deleteEquipo } from '../services/api';
import { AuthContext } from '../auth/AuthContext';

function EquipmentList() {
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  // Filtros
  const [filtroCodigo, setFiltroCodigo] = useState('');
  const [filtroLab, setFiltroLab] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  const cargarEquipos = async () => {
    setLoading(true);
    try {
      const data = await getEquipos();
      setEquipos(data);
    } catch (error) {
      console.error('Error al cargar equipos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarEquipos();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de eliminar este equipo?')) {
      try {
        await deleteEquipo(id);
        cargarEquipos();
      } catch (error) {
        console.error('Error al eliminar equipo:', error);
      }
    }
  };

  const getEstadoBadge = (estado) => {
    switch (estado) {
      case 'Operativo': return 'bg-success';
      case 'En mantenimiento': return 'bg-warning text-dark';
      case 'Averiado': return 'bg-danger';
      case 'Fuera de servicio': return 'bg-secondary';
      default: return 'bg-dark';
    }
  };

  const laboratorios = ['Laboratorio 1', 'Laboratorio 2', 'Laboratorio 3', 'Laboratorio 4', 'Administración'];
  const tipos = ['PC', 'Monitor', 'Impresora', 'Router', 'Switch', 'Proyector', 'Otro'];
  const estados = ['Operativo', 'En mantenimiento', 'Averiado', 'Fuera de servicio'];

  const equiposFiltrados = equipos.filter(e => {
    return (
      (filtroCodigo === '' || e.codigoPatrimonial.toLowerCase().includes(filtroCodigo.toLowerCase())) &&
      (filtroLab === '' || e.laboratorio === filtroLab) &&
      (filtroTipo === '' || e.tipoEquipo === filtroTipo) &&
      (filtroEstado === '' || e.estado === filtroEstado)
    );
  });

  return (
    <div className="card border-0 shadow-sm mt-4">
      <div className="card-header bg-white border-bottom-0 pt-3 pb-0">
        <h5 className="mb-0 fw-bold"><i className="bi bi-pc-display me-2 text-primary"></i>Inventario de Equipos</h5>
      </div>
      
      <div className="card-body">
        {/* Filtros */}
        <div className="row g-2 mb-4">
          <div className="col-12 col-md-3">
            <input 
              type="text" 
              className="form-control form-control-sm" 
              placeholder="Buscar por código..." 
              value={filtroCodigo}
              onChange={(e) => setFiltroCodigo(e.target.value)}
            />
          </div>
          <div className="col-12 col-md-3">
            <select className="form-select form-select-sm" value={filtroLab} onChange={(e) => setFiltroLab(e.target.value)}>
              <option value="">Todos los laboratorios</option>
              {laboratorios.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div className="col-12 col-md-3">
            <select className="form-select form-select-sm" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
              <option value="">Todos los tipos</option>
              {tipos.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="col-12 col-md-3">
            <select className="form-select form-select-sm" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
              <option value="">Todos los estados</option>
              {estados.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Código</th>
                  <th>Tipo</th>
                  <th>Marca/Modelo</th>
                  <th>Laboratorio</th>
                  <th>Estado</th>
                  <th className="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {equiposFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={user?.rol === 'administrador' ? "6" : "5"} className="text-center text-muted py-4">
                      No se encontraron equipos.
                    </td>
                  </tr>
                ) : (
                  equiposFiltrados.map((equipo) => (
                    <tr key={equipo.id}>
                      <td><span className="fw-semibold text-primary">{equipo.codigoPatrimonial}</span></td>
                      <td>{equipo.tipoEquipo}</td>
                      <td>{equipo.marca} {equipo.modelo}</td>
                      <td>{equipo.laboratorio}</td>
                      <td>
                        <span className={`badge ${getEstadoBadge(equipo.estado)}`}>
                          {equipo.estado}
                        </span>
                      </td>
                      <td className="text-end">
                        <Link to={`/equipo/${equipo.codigoPatrimonial}/historial`} className="btn btn-sm btn-outline-info me-2" title="Ver Historial">
                          <i className="bi bi-clock-history"></i>
                        </Link>
                        {user?.rol === 'administrador' && (
                          <>
                            <Link to={`/editar-equipo/${equipo.id}`} className="btn btn-sm btn-outline-primary me-2" title="Editar">
                              <i className="bi bi-pencil"></i>
                            </Link>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(equipo.id)} title="Eliminar">
                              <i className="bi bi-trash"></i>
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default EquipmentList;
