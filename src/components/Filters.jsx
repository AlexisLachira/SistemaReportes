function Filters({ filtros, onFilterChange }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onFilterChange({ ...filtros, [name]: value });
  };

  const laboratorios = ['Laboratorio 1', 'Laboratorio 2', 'Laboratorio 3', 'Laboratorio 4', 'Administración'];
  const prioridades = ['Alta', 'Media', 'Baja'];
  const estados = ['Pendiente', 'En proceso', 'Resuelto'];

  return (
    <div className="card border-0 shadow-sm mb-4 bg-light">
      <div className="card-body">
        <h6 className="card-title text-muted mb-3"><i className="bi bi-funnel-fill me-2"></i>Filtros de Búsqueda</h6>
        <div className="row g-3">
          <div className="col-12 col-md-3">
            <input
              type="text"
              name="busqueda"
              className="form-control"
              placeholder="Buscar código..."
              value={filtros.busqueda}
              onChange={handleChange}
            />
          </div>
          <div className="col-12 col-md-3">
            <select
              name="laboratorio"
              className="form-select"
              value={filtros.laboratorio}
              onChange={handleChange}
            >
              <option value="">Todos los Labs</option>
              {laboratorios.map(lab => <option key={lab} value={lab}>{lab}</option>)}
            </select>
          </div>
          <div className="col-12 col-md-3">
            <select
              name="prioridad"
              className="form-select"
              value={filtros.prioridad}
              onChange={handleChange}
            >
              <option value="">Todas las Prioridades</option>
              {prioridades.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="col-12 col-md-3">
            <select
              name="estado"
              className="form-select"
              value={filtros.estado}
              onChange={handleChange}
            >
              <option value="">Todos los Estados</option>
              {estados.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Filters;
