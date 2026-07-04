import { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../auth/AuthContext';

function Sidebar({ isOpen, onClose }) {
  const { user } = useContext(AuthContext);

  return (
    <>
      {/* Overlay para móvil */}
      {isOpen && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-md-none" 
          style={{ zIndex: 1040 }}
          onClick={onClose}
        ></div>
      )}

      <div className={`sidebar-wrapper d-flex flex-column ${isOpen ? 'show' : ''}`}>
        <div className="sidebar-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0 fw-bold">UNP Soporte</h5>
          <button className="btn-close btn-close-white d-md-none" onClick={onClose}></button>
        </div>

        <div className="p-3">
          <ul className="nav flex-column nav-pills">
            <li className="nav-item">
              <NavLink to="/" className={({ isActive }) => `nav-link sidebar-link ${isActive ? 'active' : ''}`} onClick={onClose}>
                <i className="bi bi-grid-1x2-fill sidebar-icon"></i> Dashboard
              </NavLink>
            </li>
            <li className="nav-item mt-2">
              <NavLink to="/nueva-incidencia" className={({ isActive }) => `nav-link sidebar-link ${isActive ? 'active' : ''}`} onClick={onClose}>
                <i className="bi bi-plus-circle-fill sidebar-icon"></i> Nueva Incidencia
              </NavLink>
            </li>
            <li className="nav-item mt-2">
              <NavLink to="/incidencias" className={({ isActive }) => `nav-link sidebar-link ${isActive ? 'active' : ''}`} onClick={onClose}>
                <i className="bi bi-card-list sidebar-icon"></i> Listado
              </NavLink>
            </li>
            
            <li className="nav-item mt-2">
              <NavLink to="/inventario" className={({ isActive }) => `nav-link sidebar-link ${isActive ? 'active' : ''}`} onClick={onClose}>
                <i className="bi bi-pc-display sidebar-icon"></i> Inventario de Equipos
              </NavLink>
            </li>
            
            {user && user.rol === 'administrador' && (
              <li className="nav-item mt-2 border-top pt-2">
                <NavLink to="/reportes" className={({ isActive }) => `nav-link sidebar-link ${isActive ? 'active' : ''}`} onClick={onClose}>
                  <i className="bi bi-bar-chart-fill sidebar-icon"></i> Reportes
                </NavLink>
              </li>
            )}
          </ul>
        </div>
      </div>
    </>
  );
}

export default Sidebar;