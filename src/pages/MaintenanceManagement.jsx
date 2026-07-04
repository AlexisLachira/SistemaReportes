import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMantenimientos, getIncidents, getTecnicos } from '../services/api';

function MaintenanceManagement() {
  const [mantenimientos, setMantenimientos] = useState([]);
  const [incidencias, setIncidencias] = useState({});
  const [tecnicos, setTecnicos] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mantsData, incsData, tecsData] = await Promise.all([
          getMantenimientos(),
          getIncidents(),
          getTecnicos()
        ]);
        
        // Map incidencias
        const incMap = {};
        incsData.forEach(inc => {
          incMap[inc.id] = inc;
        });
        
        // Map tecnicos
        const tecMap = {};
        tecsData.forEach(tec => {
          tecMap[tec.id] = tec;
        });

        // Ordenar mantenimientos (más recientes primero)
        const sorted = mantsData.sort((a, b) => new Date(b.fechaInicio || b.fechaProgramada || 0) - new Date(a.fechaInicio || a.fechaProgramada || 0));

        setMantenimientos(sorted);
        setIncidencias(incMap);
        setTecnicos(tecMap);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
          <i className="bi bi-tools me-2"></i> Gestión de Mantenimientos
        </h1>
        <p className="text-muted">Vista global de todos los mantenimientos asignados a los técnicos</p>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="px-3">Incidencia</th>
                  <th>Detalle</th>
                  <th>Técnico Asignado</th>
                  <th>Fecha Programada</th>
                  <th>Estado Actual</th>
                  <th className="text-end px-3">Acción</th>
                </tr>
              </thead>
              <tbody>
                {mantenimientos.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center text-muted py-4">No hay mantenimientos registrados.</td>
                  </tr>
                ) : (
                  mantenimientos.map(mant => {
                    const inc = incidencias[mant.incidenciaId] || {};
                    const tec = tecnicos[mant.tecnicoId];
                    const tecNombre = mant.nombreTecnico || (tec ? `${tec.nombres || ''} ${tec.apellidos || ''}`.trim() : mant.tecnicoId);
                    
                    return (
                      <tr key={mant.id}>
                        <td className="px-3 fw-semibold text-primary">INC-{inc.fecha ? inc.fecha.split('-')[0] : new Date().getFullYear()}-{inc.id ? inc.id.toString().padStart(3, '0') : '000'}</td>
                        <td>{inc.codigoEquipo || ''} <br/><small className="text-muted">{inc.tipoEquipo || ''} {inc.laboratorio ? `• ${inc.laboratorio}` : ''}</small></td>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="bg-light rounded-circle d-flex align-items-center justify-content-center me-2 text-primary fw-bold" style={{ width: '32px', height: '32px' }}>
                              {tecNombre.charAt(0).toUpperCase()}
                            </div>
                            {tecNombre}
                          </div>
                        </td>
                        <td>{mant.fechaProgramada || mant.fechaInicio || 'Sin definir'}</td>
                        <td>
                          <span className={`badge ${getEstadoBadge(inc.estado)}`}>
                            {inc.estado || 'Desconocido'}
                          </span>
                        </td>
                        <td className="text-end px-3">
                          <Link to={`/incidencias/${inc.id}`} className="btn btn-sm btn-outline-primary">
                            Ver Detalle
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MaintenanceManagement;
