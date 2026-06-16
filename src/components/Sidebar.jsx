import { NavLink } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../auth/AuthContext';

/**
 * Sidebar — Menú lateral de navegación
 * Usa NavLink de React Router para resaltar la ruta activa
 * @param {boolean} isOpen - Si el sidebar está abierto (móvil)
 * @param {Function} onClose - Función para cerrar el sidebar
 */
function Sidebar({ isOpen, onClose }) {
  const { user } = useContext(AuthContext);

  // Definir los items del menú con sus rutas e iconos
  const menuItems = [
    { path: '/', label: 'Dashboard', icon: '📊', roles: ['administrador', 'alumno'] },
    { path: '/nueva-incidencia', label: 'Nueva Incidencia', icon: '➕', roles: ['administrador', 'alumno'] },
    { path: '/incidencias', label: 'Incidencias', icon: '📋', roles: ['administrador', 'alumno'] },
    { path: '/reportes', label: 'Reportes', icon: '📈', roles: ['administrador'] },
  ];

  const visibleMenuItems = menuItems.filter(item => user && item.roles.includes(user.rol));

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
        {visibleMenuItems.map((item) => (
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