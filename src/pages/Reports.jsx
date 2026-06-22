import { useState, useEffect } from 'react';
import { getIncidents } from '../services/api';
import Statistics from '../components/Statistics';
import IncidentCard from '../components/IncidentCard';

function Reports() {
  const [incidencias, setIncidencias] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const resueltas = incidencias.filter((i) => i.estado === 'Resuelto');

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
          <i className="bi bi-bar-chart-line-fill me-2"></i> Reportes y Estadísticas
        </h1>
        <p className="text-muted">Análisis detallado de las incidencias de equipos dañados</p>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <IncidentCard 
            label="Total Registradas" 
            valor={incidencias.length} 
            icon="bi-box-seam" 
            bg="primary" 
          />
        </div>
        <div className="col-12 col-md-4">
          <IncidentCard 
            label="Resueltas" 
            valor={resueltas.length} 
            icon="bi-check-circle" 
            bg="success" 
          />
        </div>
        <div className="col-12 col-md-4">
          <IncidentCard 
            label="Tasa de Resolución" 
            valor={`${incidencias.length > 0 ? Math.round((resueltas.length / incidencias.length) * 100) : 0}%`} 
            icon="bi-percent" 
            bg="info" 
            textDark 
          />
        </div>
      </div>

      <Statistics incidencias={incidencias} />

      <div className="card border-0 shadow-sm mt-4">
        <div className="card-header bg-white border-bottom-0 pt-3 pb-0">
          <h5 className="mb-0 fw-bold"><i className="bi bi-check2-all me-2 text-success"></i>Incidencias Resueltas</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            {resueltas.length === 0 ? (
              <div className="text-center p-5 text-muted">
                <i className="bi bi-inbox fs-1 mb-3 d-block opacity-50"></i>
                <p>No hay incidencias resueltas aún.</p>
              </div>
            ) : (
              <table className="table table-hover table-striped align-middle mb-0">
                <thead className="table-light">
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
                      <td><span className="fw-semibold text-primary">{inc.codigoEquipo}</span></td>
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
