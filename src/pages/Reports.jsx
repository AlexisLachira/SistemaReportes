import { useState, useEffect } from 'react';
import { getIncidents } from '../services/api';
import Statistics from '../components/Statistics';

/**
 * Reports — Página de reportes y estadísticas ampliadas
 * Muestra gráficos de distribución y tabla de incidencias resueltas
 */
function Reports() {
  // Estado: incidencias
  const [incidencias, setIncidencias] = useState([]);
  // Estado: cargando
  const [loading, setLoading] = useState(true);

  // Cargar datos con useEffect y Fetch API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getIncidents();
        setIncidencias(data);
      } catch (error) {
        console.error('Error al cargar reportes:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filtrar incidencias resueltas
  const resueltas = incidencias.filter((i) => i.estado === 'Resuelto');

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <span className="loading-text">Cargando reportes...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>📈 Reportes y Estadísticas</h1>
        <p>Análisis detallado de las incidencias de equipos dañados</p>
      </div>

      {/* Tarjetas resumen */}
      <div className="dashboard-cards">
        <div className="stat-card card-total">
          <div className="stat-card-icon">📦</div>
          <div className="stat-card-info">
            <span className="stat-card-value">{incidencias.length}</span>
            <span className="stat-card-label">Total Registradas</span>
          </div>
        </div>
        <div className="stat-card card-resuelto">
          <div className="stat-card-icon">✅</div>
          <div className="stat-card-info">
            <span className="stat-card-value">{resueltas.length}</span>
            <span className="stat-card-label">Resueltas</span>
          </div>
        </div>
        <div className="stat-card card-proceso">
          <div className="stat-card-icon">📊</div>
          <div className="stat-card-info">
            <span className="stat-card-value">
              {incidencias.length > 0 ? Math.round((resueltas.length / incidencias.length) * 100) : 0}%
            </span>
            <span className="stat-card-label">Tasa de Resolución</span>
          </div>
        </div>
      </div>

      {/* Gráficos de estadísticas */}
      <Statistics incidencias={incidencias} />

      {/* Tabla de incidencias resueltas */}
      <div className="recent-section">
        <h2 className="recent-title">✅ Incidencias Resueltas</h2>
        <div className="table-section">
          <div className="table-container">
            {resueltas.length === 0 ? (
              <div className="empty-state">
                <span className="empty-state-icon">📭</span>
                <span className="empty-state-text">No hay incidencias resueltas aún</span>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Tipo</th>
                    <th>Laboratorio</th>
                    <th>Reportante</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {resueltas.map((inc) => (
                    <tr key={inc.id}>
                      <td><span className="table-code">{inc.codigoEquipo}</span></td>
                      <td>{inc.tipoEquipo}</td>
                      <td>{inc.laboratorio}</td>
                      <td>{inc.reportante}</td>
                      <td>{inc.fecha}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Reports;
