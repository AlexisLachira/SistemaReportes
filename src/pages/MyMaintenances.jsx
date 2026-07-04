import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { getMantenimientos, getIncidents } from '../services/api';
import { AuthContext } from '../auth/AuthContext';

function MyMaintenances() {
  const { user } = useContext(AuthContext);
  const [misMantenimientos, setMisMantenimientos] = useState([]);
  const [filtrados, setFiltrados] = useState([]);
  const [incidencias, setIncidencias] = useState({});
  const [loading, setLoading] = useState(true);

  // Estados de los filtros
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroPrioridad, setFiltroPrioridad] = useState('');
  const [filtroLaboratorio, setFiltroLaboratorio] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const [mantsData, incsData] = await Promise.all([
          getMantenimientos(),
          getIncidents()
        ]);
        
        const incMap = {};
        incsData.forEach(inc => {
          incMap[inc.id] = inc;
        });
        
        const asignados = mantsData.filter(m => m.tecnicoId === user.id);
        
        const orderPriority = {
          'Asignada': 1,
          'En mantenimiento': 2,
          'Esperando repuestos': 3,
          'Reparada': 4,
          'Cerrada': 5,
        };

        const sorted = asignados.sort((a, b) => {
          const stateA = incMap[a.incidenciaId]?.estado || '';
          const stateB = incMap[b.incidenciaId]?.estado || '';
          return (orderPriority[stateA] || 99) - (orderPriority[stateB] || 99);
        });

        setMisMantenimientos(sorted);
        setIncidencias(incMap);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  // Aplicar filtros
  useEffect(() => {
    let resultado = [...misMantenimientos];

    if (filtroEstado) {
      resultado = resultado.filter(mant => incidencias[mant.incidenciaId]?.estado === filtroEstado);
    }
    if (filtroPrioridad) {
      resultado = resultado.filter(mant => 
        (mant.prioridad === filtroPrioridad) || (incidencias[mant.incidenciaId]?.prioridad === filtroPrioridad)
      );
    }
    if (filtroLaboratorio) {
      resultado = resultado.filter(mant => incidencias[mant.incidenciaId]?.laboratorio === filtroLaboratorio);
    }

    setFiltrados(resultado);
  }, [misMantenimientos, incidencias, filtroEstado, filtroPrioridad, filtroLaboratorio]);

  const getEstadoBadge = (estado) => {
    switch (estado) {
      case 'Reportada': return 'bg-danger';
      case 'Revisada': return 'bg-warning text-dark';
      case 'Asignada': return 'bg-primary';
      case 'Reparada': return 'bg-success';
      case 'Cerrada': return 'bg-secondary';
      default: return 'bg-light text-dark border';
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
      <div className="mb-4">
        <h1 className="h3 fw-bold text-primary mb-1">
          <i className="bi bi-wrench-adjustable me-2"></i> Mis Mantenimientos
        </h1>
        <p className="text-muted">Lista de trabajos de mantenimiento que te han sido asignados</p>
      </div>

      {/* Panel de Filtros */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label small fw-bold text-muted">Estado</label>
              <select className="form-select" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                <option value="">Todos los estados</option>
                <option value="Asignada">Asignada</option>
                <option value="Reparada">Reparada</option>
                <option value="Cerrada">Cerrada</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label small fw-bold text-muted">Prioridad</label>
              <select className="form-select" value={filtroPrioridad} onChange={(e) => setFiltroPrioridad(e.target.value)}>
                <option value="">Todas las prioridades</option>
                <option value="Alta">Alta</option>
                <option value="Media">Media</option>
                <option value="Baja">Baja</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label small fw-bold text-muted">Laboratorio</label>
              <select className="form-select" value={filtroLaboratorio} onChange={(e) => setFiltroLaboratorio(e.target.value)}>
                <option value="">Todos los laboratorios</option>
                <option value="Laboratorio 1">Laboratorio 1</option>
                <option value="Laboratorio 2">Laboratorio 2</option>
                <option value="Laboratorio 3">Laboratorio 3</option>
                <option value="Laboratorio 4">Laboratorio 4</option>
                <option value="Administración">Administración</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {filtrados.length === 0 ? (
          <div className="col-12 text-center text-muted py-5 bg-light rounded">
            <i className="bi bi-search fs-1 d-block mb-3 opacity-50"></i>
            No se encontraron mantenimientos con los filtros actuales.
          </div>
        ) : (
          filtrados.map(mant => {
            const inc = incidencias[mant.incidenciaId];
            if (!inc) return null;

            return (
              <div className="col-12 col-md-6 col-lg-4" key={mant.id}>
                <div className="card h-100 border-0 shadow-sm hover-shadow transition">
                  <div className="card-header bg-white border-bottom-0 pt-4 pb-0 d-flex justify-content-between align-items-start">
                    <span className="badge bg-light text-primary border px-2 py-1">INC-{inc.fecha ? inc.fecha.split('-')[0] : new Date().getFullYear()}-{inc.id.toString().padStart(3, '0')}</span>
                    <span className={`badge ${getEstadoBadge(inc.estado)}`}>{inc.estado}</span>
                  </div>
                  <div className="card-body">
                    <h5 className="card-title fw-bold mb-1">{inc.codigoEquipo}</h5>
                    <p className="text-muted small mb-3">{inc.tipoEquipo} • {inc.laboratorio}</p>
                    
                    <div className="bg-light p-3 rounded small mb-3">
                      <strong>Reporte:</strong><br/>
                      <span className="text-truncate d-block" style={{ maxWidth: '100%' }}>{inc.descripcion}</span>
                    </div>

                    <div className="d-flex justify-content-between align-items-center mb-1 small">
                      <span className="text-muted">Fecha Programada:</span>
                      <span className="fw-semibold">{mant.fechaProgramada || 'Sin definir'}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center small">
                      <span className="text-muted">Prioridad:</span>
                      <span className={`fw-semibold text-${mant.prioridad === 'Alta' ? 'danger' : mant.prioridad === 'Media' ? 'warning' : 'info'}`}>
                        {mant.prioridad || inc.prioridad}
                      </span>
                    </div>
                  </div>
                  <div className="card-footer bg-white border-top-0 pb-4 text-center">
                    <Link to={`/incidencias/${inc.id}`} className="btn btn-primary w-100 shadow-sm">
                      <i className="bi bi-box-arrow-in-right me-2"></i>Atender Mantenimiento
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default MyMaintenances;
