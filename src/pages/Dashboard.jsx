import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { getIncidents } from '../services/api';
import IncidentCard from '../components/IncidentCard';
import Statistics from '../components/Statistics';
import { AuthContext } from '../auth/AuthContext';

/**
 * Dashboard — Página principal del sistema
 * Muestra tarjetas de resumen, estadísticas y últimas incidencias
 */
function Dashboard() {
  // Estado: lista de incidencias
  const [incidencias, setIncidencias] = useState([]);
  // Estado: cargando datos
  const [loading, setLoading] = useState(true);

  const { user } = useContext(AuthContext);

  // Cargar incidencias al montar el componente con useEffect y Fetch API
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
  }, []);

  // Calcular estadísticas de las incidencias
  const total = incidencias.length;
  const pendientes = incidencias.filter((i) => i.estado === 'Pendiente').length;
  const enProceso = incidencias.filter((i) => i.estado === 'En proceso').length;
  const resueltos = incidencias.filter((i) => i.estado === 'Resuelto').length;

  // Obtener las últimas 5 incidencias (ordenadas por fecha descendente)
  const recientes = [...incidencias]
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .slice(0, 5);

  // Obtener clase CSS para el badge de estado
  const getEstadoClass = (estado) => {
    const clases = { Pendiente: 'badge-pendiente', 'En proceso': 'badge-en-proceso', Resuelto: 'badge-resuelto' };
    return clases[estado] || '';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <span className="loading-text">Cargando dashboard...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Encabezado del dashboard */}
      <div className="dashboard-header">
        <h1>📊 Dashboard</h1>
        <p>Resumen general de incidencias de equipos dañados</p>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="dashboard-cards">
        <IncidentCard
          label="Total Incidencias"
          valor={total}
          icon="📦"
          cardClass="card-total"
        />
        <IncidentCard
          label="Pendientes"
          valor={pendientes}
          icon="⏳"
          cardClass="card-pendiente"
        />
        <IncidentCard
          label="En Proceso"
          valor={enProceso}
          icon="🔧"
          cardClass="card-proceso"
        />
        <IncidentCard
          label="Resueltos"
          valor={resueltos}
          icon="✅"
          cardClass="card-resuelto"
        />
      </div>

      {/* Sección de estadísticas con gráficos */}
      {user && user.rol === 'administrador' && (
        <Statistics incidencias={incidencias} />
      )}

      {/* Últimas incidencias */}
      <div className="recent-section">
        <h2 className="recent-title">🕐 Incidencias Recientes</h2>
        <div className="table-section">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Tipo</th>
                  <th>Laboratorio</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {recientes.map((inc) => (
                  <tr key={inc.id}>
                    <td><span className="table-code">{inc.codigoEquipo}</span></td>
                    <td>{inc.tipoEquipo}</td>
                    <td>{inc.laboratorio}</td>
                    <td>{inc.fecha}</td>
                    <td>
                      <span className={`badge ${getEstadoClass(inc.estado)}`}>
                        {inc.estado}
                      </span>
                    </td>
                    <td>
                      <Link to={`/incidencias/${inc.id}`} className="btn btn-sm btn-outline">
                        Ver detalle
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
