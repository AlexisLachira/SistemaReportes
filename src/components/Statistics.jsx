/**
 * Statistics — Gráficos de barras CSS para visualizar distribución de incidencias
 * Muestra distribución por estado, laboratorio y prioridad
 * @param {Array} incidencias - Lista de incidencias para calcular estadísticas
 */
function Statistics({ incidencias }) {
  // Calcular distribución por estado
  const porEstado = [
    { label: 'Pendiente', count: incidencias.filter((i) => i.estado === 'Pendiente').length, fillClass: 'fill-danger' },
    { label: 'En proceso', count: incidencias.filter((i) => i.estado === 'En proceso').length, fillClass: 'fill-warning' },
    { label: 'Resuelto', count: incidencias.filter((i) => i.estado === 'Resuelto').length, fillClass: 'fill-success' },
  ];

  // Calcular distribución por laboratorio
  const labs = ['Laboratorio 1', 'Laboratorio 2', 'Laboratorio 3', 'Laboratorio 4', 'Administración'];
  const porLaboratorio = labs.map((lab) => ({
    label: lab.replace('Laboratorio ', 'Lab '),
    count: incidencias.filter((i) => i.laboratorio === lab).length,
    fillClass: 'fill-primary',
  }));

  // Calcular distribución por prioridad
  const porPrioridad = [
    { label: 'Alta', count: incidencias.filter((i) => i.prioridad === 'Alta').length, fillClass: 'fill-danger' },
    { label: 'Media', count: incidencias.filter((i) => i.prioridad === 'Media').length, fillClass: 'fill-warning' },
    { label: 'Baja', count: incidencias.filter((i) => i.prioridad === 'Baja').length, fillClass: 'fill-info' },
  ];

  // Función para renderizar un gráfico de barras
  const renderBarChart = (data) => {
    const total = incidencias.length;
    if (total === 0) return <p style={{ color: '#6b7280', fontSize: '0.85rem' }}>Sin datos disponibles</p>;

    return (
      <div className="bar-chart">
        {data.map((item) => (
          <div key={item.label} className="bar-item">
            <span className="bar-label">{item.label}</span>
            <div className="bar-track">
              <div
                className={`bar-fill ${item.fillClass}`}
                style={{ width: `${Math.max((item.count / total) * 100, 5)}%` }}
              >
                {item.count}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="stats-grid">
      {/* Distribución por estado */}
      <div className="stats-card">
        <h3 className="stats-card-title">📊 Por Estado</h3>
        {renderBarChart(porEstado)}
      </div>

      {/* Distribución por laboratorio */}
      <div className="stats-card">
        <h3 className="stats-card-title">🏢 Por Laboratorio</h3>
        {renderBarChart(porLaboratorio)}
      </div>

      {/* Distribución por prioridad */}
      <div className="stats-card">
        <h3 className="stats-card-title">🔔 Por Prioridad</h3>
        {renderBarChart(porPrioridad)}
      </div>
    </div>
  );
}

export default Statistics;
