import { NavLink } from 'react-router-dom';

/**
 * Sidebar — Menú lateral de navegación
 * Usa NavLink de React Router para resaltar la ruta activa
 * @param {boolean} isOpen - Si el sidebar está abierto (móvil)
 * @param {Function} onClose - Función para cerrar el sidebar
 */
function Sidebar({ isOpen, onClose }) {
  // Definir los items del menú con sus rutas e iconos
  const menuItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/nueva-incidencia', label: 'Nueva Incidencia', icon: '➕' },
    { path: '/incidencias', label: 'Incidencias', icon: '📋' },
    { path: '/reportes', label: 'Reportes', icon: '📈' },
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Encabezado del sidebar con logo institucional */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🖥️</div>
          <span className="sidebar-logo-text">Reporte Equipos</span>
        </div>
        <div className="sidebar-institution">
          Universidad Nacional de Piura — Ing. Informática
        </div>
      </div>

      {/* Navegación principal */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-title">Menú Principal</div>
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
            onClick={onClose}
          >
            <span className="sidebar-link-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer del sidebar */}
      <div className="sidebar-footer">
        © 2025 UNP — Facultad de Ingeniería Industrial
      </div>
    </aside>
  );
}

export default Sidebar;