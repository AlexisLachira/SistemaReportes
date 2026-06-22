import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { getIncidents } from '../services/api';
import IncidentCard from '../components/IncidentCard';
import Statistics from '../components/Statistics';
import { AuthContext } from '../auth/AuthContext';

function Dashboard() {
  const [incidencias, setIncidencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getIncidents();
        const dataRole = user.rol === 'administrador' 
          ? data 
          : data.filter(i => i.reportante === user.nombre || i.reportante === user.codigo);
        setIncidencias(dataRole);
      } catch (error) {
        console.error('Error al cargar datos del dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const total = incidencias.length;
  const pendientes = incidencias.filter((i) => i.estado === 'Pendiente').length;
  const enProceso = incidencias.filter((i) => i.estado === 'En proceso').length;
  const resueltos = incidencias.filter((i) => i.estado === 'Resuelto').length;

  const recientes = [...incidencias]
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .slice(0, 5);

  const getEstadoBadge = (estado) => {
    switch(estado) {
      case 'Pendiente': return 'bg-danger';
      case 'En proceso': return 'bg-warning text-dark';
      case 'Resuelto': return 'bg-success';
      default: return 'bg-secondary';
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="h3 fw-bold text-primary mb-1">
          <i className="bi bi-graph-up me-2"></i> Dashboard
        </h1>
        <p className="text-muted">Resumen general de incidencias de equipos dañados</p>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <IncidentCard label="Total" valor={total} icon="bi-box-seam" bg="primary" />
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <IncidentCard label="Pendientes" valor={pendientes} icon="bi-hourglass-split" bg="danger" />
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <IncidentCard label="En Proceso" valor={enProceso} icon="bi-tools" bg="warning" textDark />
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <IncidentCard label="Resueltos" valor={resueltos} icon="bi-check-circle" bg="success" />
        </div>
      </div>

      {user && user.rol === 'administrador' && (
        <Statistics incidencias={incidencias} />
      )}

      <div className="card border-0 shadow-sm mt-4">
        <div className="card-header bg-white border-bottom-0 pt-3 pb-0">
          <h5 className="mb-0 fw-bold"><i className="bi bi-clock-history me-2 text-muted"></i>Incidencias Recientes</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Código</th>
                  <th>Tipo</th>
                  <th>Laboratorio</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th className="text-end">Acción</th>
                </tr>
              </thead>
              <tbody>
                {recientes.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center text-muted py-4">No hay incidencias registradas.</td>
                  </tr>
                ) : (
                  recientes.map((inc) => (
                    <tr key={inc.id}>
                      <td><span className="fw-semibold text-primary">{inc.codigoEquipo}</span></td>
                      <td>{inc.tipoEquipo}</td>
                      <td>{inc.laboratorio}</td>
                      <td>{inc.fecha}</td>
                      <td>
                        <span className={`badge ${getEstadoBadge(inc.estado)}`}>
                          {inc.estado}
                        </span>
                      </td>
                      <td className="text-end">
                        <Link to={`/incidencias/${inc.id}`} className="btn btn-sm btn-outline-primary">
                          <i className="bi bi-eye"></i> Ver
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
