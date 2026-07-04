import { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

const COLORS = ['#0d6efd', '#198754', '#dc3545', '#ffc107', '#0dcaf0', '#6c757d', '#212529'];

function Statistics({ incidencias, mantenimientos, tecnicos, equipos }) {

  // 1. Incidencias por Laboratorio
  const byLab = useMemo(() => {
    const counts = incidencias.reduce((acc, inc) => {
      acc[inc.laboratorio] = (acc[inc.laboratorio] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(counts).map(key => ({ name: key, value: counts[key] })).sort((a, b) => b.value - a.value);
  }, [incidencias]);

  // 2. Incidencias por Estado
  const byEstado = useMemo(() => {
    const counts = incidencias.reduce((acc, inc) => {
      acc[inc.estado] = (acc[inc.estado] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
  }, [incidencias]);

  // 3. Incidencias por Prioridad
  const byPrioridad = useMemo(() => {
    const counts = incidencias.reduce((acc, inc) => {
      acc[inc.prioridad] = (acc[inc.prioridad] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
  }, [incidencias]);

  // 4. Incidencias Registradas por Mes
  const byMonth = useMemo(() => {
    const counts = incidencias.reduce((acc, inc) => {
      if (!inc.fecha) return acc;
      // inc.fecha format is usually YYYY-MM-DD
      const monthStr = inc.fecha.substring(0, 7); // YYYY-MM
      acc[monthStr] = (acc[monthStr] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(counts).sort().map(key => ({ name: key, Total: counts[key] }));
  }, [incidencias]);

  // 5. Ranking: Equipos con mayor número de averías
  const topEquipos = useMemo(() => {
    const counts = incidencias.reduce((acc, inc) => {
      acc[inc.codigoEquipo] = (acc[inc.codigoEquipo] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(counts)
      .map(key => ({ codigo: key, averias: counts[key] }))
      .sort((a, b) => b.averias - a.averias)
      .slice(0, 5);
  }, [incidencias]);

  // 6. Ranking: Técnicos con más mantenimientos realizados
  const topTecnicos = useMemo(() => {
    const counts = mantenimientos.reduce((acc, mant) => {
      if (mant.tecnicoId) {
        acc[mant.tecnicoId] = (acc[mant.tecnicoId] || 0) + 1;
      }
      return acc;
    }, {});
    return Object.keys(counts)
      .map(key => {
        const tec = tecnicos.find(t => t.id === key);
        return { 
          nombre: tec ? tec.nombre : key, 
          mantenimientos: counts[key] 
        };
      })
      .sort((a, b) => b.mantenimientos - a.mantenimientos)
      .slice(0, 5);
  }, [mantenimientos, tecnicos]);


  return (
    <div className="mt-5">
      <h4 className="fw-bold text-secondary mb-4"><i className="bi bi-bar-chart-fill me-2"></i>Análisis Gráfico</h4>
      
      <div className="row g-4 mb-4">
        {/* Incidencias por Laboratorio */}
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white pt-3 border-bottom-0">
              <h6 className="fw-bold mb-0 text-muted text-uppercase small">Incidencias por Laboratorio</h6>
            </div>
            <div className="card-body" style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byLab} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} tick={{fontSize: 12}} />
                  <YAxis tick={{fontSize: 12}} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0d6efd" radius={[4, 4, 0, 0]} name="Incidencias" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Incidencias Registradas por Mes */}
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white pt-3 border-bottom-0">
              <h6 className="fw-bold mb-0 text-muted text-uppercase small">Tendencia Mensual de Averías</h6>
            </div>
            <div className="card-body" style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={byMonth} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{fontSize: 12}} />
                  <YAxis tick={{fontSize: 12}} />
                  <Tooltip />
                  <Line type="monotone" dataKey="Total" stroke="#198754" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Incidencias por Estado (Pie) */}
        <div className="col-12 col-md-6 col-lg-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white pt-3 border-bottom-0">
              <h6 className="fw-bold mb-0 text-muted text-uppercase small">Distribución por Estado</h6>
            </div>
            <div className="card-body" style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byEstado} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {byEstado.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Incidencias por Prioridad (Donut) */}
        <div className="col-12 col-md-6 col-lg-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white pt-3 border-bottom-0">
              <h6 className="fw-bold mb-0 text-muted text-uppercase small">Distribución por Prioridad</h6>
            </div>
            <div className="card-body" style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byPrioridad} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    <Cell fill="#dc3545" /> {/* Alta */}
                    <Cell fill="#ffc107" /> {/* Media */}
                    <Cell fill="#0dcaf0" /> {/* Baja */}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Rankings (Tablas) */}
        <div className="col-12 col-lg-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white pt-3 border-bottom-0">
              <h6 className="fw-bold mb-0 text-muted text-uppercase small">Top Rankings</h6>
            </div>
            <div className="card-body d-flex flex-column gap-3">
              
              <div>
                <span className="fw-bold d-block text-dark mb-2 border-bottom pb-1"><i className="bi bi-exclamation-triangle-fill text-danger me-2"></i>Equipos con más averías</span>
                <ul className="list-group list-group-flush small">
                  {topEquipos.length === 0 ? <li className="list-group-item text-muted">Sin datos</li> : topEquipos.map((e, idx) => (
                    <li key={idx} className="list-group-item d-flex justify-content-between align-items-center px-0 py-1">
                      {e.codigo}
                      <span className="badge bg-danger rounded-pill">{e.averias}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-auto">
                <span className="fw-bold d-block text-dark mb-2 border-bottom pb-1"><i className="bi bi-tools text-primary me-2"></i>Técnicos más activos</span>
                <ul className="list-group list-group-flush small">
                  {topTecnicos.length === 0 ? <li className="list-group-item text-muted">Sin datos</li> : topTecnicos.map((t, idx) => (
                    <li key={idx} className="list-group-item d-flex justify-content-between align-items-center px-0 py-1">
                      <span className="text-truncate" style={{maxWidth: '150px'}}>{t.nombre}</span>
                      <span className="badge bg-primary rounded-pill">{t.mantenimientos}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Statistics;
