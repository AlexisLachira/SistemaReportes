/**
 * Filters — Barra de filtros para el listado de incidencias
 * Permite buscar por código, filtrar por laboratorio, prioridad y estado
 * @param {Object} filtros - Objeto con los valores actuales de los filtros
 * @param {Function} onFilterChange - Callback para actualizar los filtros
 */
function Filters({ filtros, onFilterChange }) {
  // Opciones de filtro
  const laboratorios = ['Laboratorio 1', 'Laboratorio 2', 'Laboratorio 3', 'Laboratorio 4', 'Administración'];
  const prioridades = ['Alta', 'Media', 'Baja'];
  const estados = ['Pendiente', 'En proceso', 'Resuelto'];

  // Manejar cambio de un filtro individual
  const handleChange = (field, value) => {
    onFilterChange({ ...filtros, [field]: value });
  };

  // Limpiar todos los filtros
  const clearFilters = () => {
    onFilterChange({ busqueda: '', laboratorio: '', prioridad: '', estado: '' });
  };

  return (
    <div className="filters-bar">
      {/* Búsqueda por código */}
      <div className="filter-group">
        <label className="filter-label">Buscar por código</label>
        <input
          type="text"
          placeholder="Ej: PC-L1-05"
          value={filtros.busqueda}
          onChange={(e) => handleChange('busqueda', e.target.value)}
          className="filter-input"
        />
      </div>

      {/* Filtrar por laboratorio */}
      <div className="filter-group">
        <label className="filter-label">Laboratorio</label>
        <select
          value={filtros.laboratorio}
          onChange={(e) => handleChange('laboratorio', e.target.value)}
          className="filter-select"
        >
          <option value="">Todos</option>
          {laboratorios.map((lab) => (
            <option key={lab} value={lab}>{lab}</option>
          ))}
        </select>
      </div>

      {/* Filtrar por prioridad */}
      <div className="filter-group">
        <label className="filter-label">Prioridad</label>
        <select
          value={filtros.prioridad}
          onChange={(e) => handleChange('prioridad', e.target.value)}
          className="filter-select"
        >
          <option value="">Todas</option>
          {prioridades.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {/* Filtrar por estado */}
      <div className="filter-group">
        <label className="filter-label">Estado</label>
        <select
          value={filtros.estado}
          onChange={(e) => handleChange('estado', e.target.value)}
          className="filter-select"
        >
          <option value="">Todos</option>
          {estados.map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
      </div>

      {/* Botón limpiar filtros */}
      <button className="filter-clear" onClick={clearFilters}>
        ✕ Limpiar
      </button>
    </div>
  );
}

export default Filters;
