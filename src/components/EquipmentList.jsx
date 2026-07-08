import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { getEquipos, deleteEquipo, getIncidents, getMantenimientos } from '../services/api';
import { AuthContext } from '../auth/AuthContext';

function EquipmentList() {
  const [equipos, setEquipos] = useState([]);
  const [incidencias, setIncidencias] = useState([]);
  const [mantenimientos, setMantenimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  // Filtros
  const [filtroCodigo, setFiltroCodigo] = useState('');
  const [filtroLab, setFiltroLab] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [eqData, incData, mantData] = await Promise.all([
        getEquipos(),
        getIncidents(),
        getMantenimientos()
      ]);
      setEquipos(eqData);
      setIncidencias(incData);
      setMantenimientos(mantData);
    } catch (error) {
      console.error('Error al cargar datos del inventario:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de eliminar este equipo?')) {
      try {
        await deleteEquipo(id);
        cargarDatos();
      } catch (error) {
        console.error('Error al eliminar equipo:', error);
      }
    }
  };

  const getCriticidadBadge = (criticidad) => {
    switch (criticidad) {
      case 'Baja': return 'bg-success';
      case 'Media': return 'bg-info text-dark';
      case 'Alta': return 'bg-warning text-dark';
      case 'Crítica': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  const getEstadoBadge = (estado) => {
    switch (estado) {
      case 'Disponible': return 'bg-success';
      case 'En mantenimiento': return 'bg-warning text-dark';
      case 'Dañado': return 'bg-danger';
      case 'Retirado': return 'bg-secondary';
      default: return 'bg-dark';
    }
  };

  const getMantenimientoBadge = (estado) => {
    switch (estado) {
      case 'Al día': return 'bg-success';
      case 'Próximo mantenimiento': return 'bg-info text-dark';
      case 'Requiere mantenimiento': return 'bg-warning text-dark';
      case 'Recomendado reemplazo': return 'bg-danger';
      case 'Requiere evaluación': return 'bg-dark text-white'; 
      default: return 'bg-secondary';
    }
  };

  const calcularAntiguedad = (fechaAdquisicion) => {
    if (!fechaAdquisicion) return 'Desconocida';
    const ac = new Date();
    const fa = new Date(fechaAdquisicion);
    let años = ac.getFullYear() - fa.getFullYear();
    let meses = ac.getMonth() - fa.getMonth();
    if (meses < 0) {
      años--;
      meses += 12;
    }
    if (años === 0 && meses === 0) return 'Nuevo';
    return `${años > 0 ? años + ' años' : ''} ${meses > 0 ? meses + ' meses' : ''}`.trim();
  };

  const calcularEstadoMantenimiento = (equipo) => {
    const eqIncidencias = incidencias.filter(i => i.codigoEquipo === equipo.codigoPatrimonial);
    const eqMantenimientos = mantenimientos.filter(m => eqIncidencias.find(i => i.id === m.incidenciaId));
    
    // Obtener antigüedad en años
    const ac = new Date();
    const fa = new Date(equipo.fechaAdquisicion || ac);
    const diffTime = Math.abs(ac - fa);
    const añosAntiguedad = diffTime / (1000 * 60 * 60 * 24 * 365.25);

    // Obtener meses desde último mantenimiento
    let mesesSinMantenimiento = 999;
    if (eqMantenimientos.length > 0) {
      const ultimoMant = eqMantenimientos.sort((a, b) => new Date(b.fechaFin || 0) - new Date(a.fechaFin || 0))[0];
      if (ultimoMant.fechaFin) {
        const fm = new Date(ultimoMant.fechaFin);
        mesesSinMantenimiento = (ac.getFullYear() - fm.getFullYear()) * 12 + (ac.getMonth() - fm.getMonth());
      }
    } else {
      mesesSinMantenimiento = añosAntiguedad * 12;
    }

    if (añosAntiguedad >= 5) return 'Recomendado reemplazo';
    if (eqIncidencias.length >= 3 || añosAntiguedad >= 4) return 'Requiere evaluación';
    if (mesesSinMantenimiento >= 6) return 'Requiere mantenimiento';
    if (mesesSinMantenimiento >= 4) return 'Próximo mantenimiento';

    return 'Al día';
  };

  const laboratorios = ['Laboratorio 1', 'Laboratorio 2', 'Laboratorio 3', 'Laboratorio 4', 'Administración'];
  const tipos = ['PC', 'Monitor', 'Impresora', 'Router', 'Switch', 'Proyector', 'Otro'];
  const estados = ['Disponible', 'En mantenimiento', 'Dañado', 'Retirado'];

  const equiposProcesados = equipos.map(e => ({
    ...e,
    estadoMantenimiento: calcularEstadoMantenimiento(e),
    antiguedadTexto: calcularAntiguedad(e.fechaAdquisicion)
  }));

  const equiposFiltrados = equiposProcesados.filter(e => {
    return (
      (filtroCodigo === '' || e.codigoPatrimonial.toLowerCase().includes(filtroCodigo.toLowerCase())) &&
      (filtroLab === '' || e.laboratorio === filtroLab) &&
      (filtroTipo === '' || e.tipoEquipo === filtroTipo) &&
      (filtroEstado === '' || e.estado === filtroEstado) // Changed to use e.estado (operational)
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
              <option value="Operativo">Operativo</option>
              <option value="Requiere mantenimiento">Requiere mantenimiento</option>
              <option value="Requiere evaluación">Requiere evaluación</option>
              <option value="Recomendado reemplazo">Recomendado reemplazo</option>
              <option value="En mantenimiento">En mantenimiento</option>
              <option value="Averiado">Averiado</option>
              <option value="Fuera de servicio">Fuera de servicio</option>
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
                  <th>Criticidad</th>
                  <th>Antigüedad</th>
                  <th>Operativo</th>
                  <th>Mantenimiento</th>
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
                        <span className={`badge border ${getCriticidadBadge(equipo.criticidad || 'Media')}`}>
                          {equipo.criticidad || 'Media'}
                        </span>
                      </td>
                      <td className="text-muted small">{equipo.antiguedadTexto}</td>
                      <td>
                        <span className={`badge ${getEstadoBadge(equipo.estado)}`}>
                          {equipo.estado}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getMantenimientoBadge(equipo.estadoMantenimiento)}`}>
                          {equipo.estadoMantenimiento}
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
