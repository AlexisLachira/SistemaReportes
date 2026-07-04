import { useState, useEffect } from 'react';
import { getHistorialByIncidencia } from '../services/api';

function IncidentHistory({ incidenciaId }) {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (incidenciaId) {
      getHistorialByIncidencia(incidenciaId)
        .then(data => {
          // Ordenar por fecha descendente
          const sorted = data.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
          setHistorial(sorted);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [incidenciaId]);

  if (loading) {
    return <div className="text-center py-3"><span className="spinner-border spinner-border-sm text-primary"></span></div>;
  }

  return (
    <div className="card border-0 shadow-sm mt-4 bg-light">
      <div className="card-body">
        <h6 className="fw-bold mb-4"><i className="bi bi-clock-history me-2 text-primary"></i>Historial de la Incidencia</h6>
        
        {historial.length === 0 ? (
          <p className="text-muted small mb-0">No hay registros en el historial.</p>
        ) : (
          <div className="timeline position-relative ps-3" style={{ borderLeft: '2px solid #dee2e6' }}>
            {historial.map((reg, index) => (
              <div key={reg.id || index} className="mb-4 position-relative">
                <div className="position-absolute bg-primary rounded-circle" style={{ width: '12px', height: '12px', left: '-23px', top: '4px' }}></div>
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="fw-semibold text-dark">{reg.accion}</span>
                  <span className="badge bg-secondary opacity-75">
                    {new Date(reg.fecha).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
                <div className="small text-muted mb-1">
                  <i className="bi bi-person me-1"></i> {reg.usuario}
                </div>
                {reg.observacion && (
                  <div className="bg-white p-2 rounded shadow-sm border small mt-2">
                    {reg.observacion}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default IncidentHistory;
