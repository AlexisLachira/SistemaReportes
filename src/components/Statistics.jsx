function Statistics({ incidencias }) {
  // Calculamos los porcentajes (simulado con barras de progreso Bootstrap)
  const total = incidencias.length || 1; // evitar division por 0
  const pendientes = incidencias.filter(i => i.estado === 'Pendiente').length;
  const enProceso = incidencias.filter(i => i.estado === 'En proceso').length;
  const resueltos = incidencias.filter(i => i.estado === 'Resuelto').length;

  const getPercent = (val) => Math.round((val / total) * 100);

  return (
    <div className="card border-0 shadow-sm mt-4">
      <div className="card-header bg-white border-bottom-0 pt-3 pb-0">
        <h5 className="mb-0 fw-bold"><i className="bi bi-pie-chart-fill me-2 text-primary"></i>Distribución de Estados</h5>
      </div>
      <div className="card-body">
        <div className="mb-3">
          <div className="d-flex justify-content-between mb-1">
            <span className="text-danger fw-semibold small">Pendientes ({pendientes})</span>
            <span className="text-muted small">{getPercent(pendientes)}%</span>
          </div>
          <div className="progress" style={{ height: '8px' }}>
            <div className="progress-bar bg-danger" role="progressbar" style={{ width: `${getPercent(pendientes)}%` }}></div>
          </div>
        </div>
        
        <div className="mb-3">
          <div className="d-flex justify-content-between mb-1">
            <span className="text-warning text-dark fw-semibold small">En Proceso ({enProceso})</span>
            <span className="text-muted small">{getPercent(enProceso)}%</span>
          </div>
          <div className="progress" style={{ height: '8px' }}>
            <div className="progress-bar bg-warning" role="progressbar" style={{ width: `${getPercent(enProceso)}%` }}></div>
          </div>
        </div>

        <div className="mb-3">
          <div className="d-flex justify-content-between mb-1">
            <span className="text-success fw-semibold small">Resueltos ({resueltos})</span>
            <span className="text-muted small">{getPercent(resueltos)}%</span>
          </div>
          <div className="progress" style={{ height: '8px' }}>
            <div className="progress-bar bg-success" role="progressbar" style={{ width: `${getPercent(resueltos)}%` }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Statistics;
