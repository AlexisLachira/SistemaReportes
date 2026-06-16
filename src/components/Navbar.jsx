import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../auth/AuthContext';

/**
 * Navbar — Barra de navegación superior
 * Muestra el título del sistema, fecha actual y usuario simulado
 * @param {Function} onToggleSidebar - Función para abrir/cerrar sidebar en móvil
 */
function Navbar({ onToggleSidebar }) {
  const [currentDate, setCurrentDate] = useState('');
  const { user, logout } = useContext(AuthContext);

  // Actualizar fecha actual al montar el componente
  useEffect(() => {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setCurrentDate(now.toLocaleDateString('es-PE', options));
  }, []);

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button className="menu-toggle" onClick={onToggleSidebar}>
          ☰
        </button>
        <div>
          <div className="navbar-title">Sistema de Reporte de Equipos Dañados</div>
          <div className="navbar-subtitle">{currentDate}</div>
        </div>
      </div>
      <div className="navbar-right">
        <div className="navbar-user">
          <div className="navbar-avatar">{user ? user.nombre.substring(0, 2).toUpperCase() : 'U'}</div>
          <div className="navbar-user-info">
            <span className="navbar-user-name">{user ? user.nombre : 'Usuario'}</span>
            <span className="navbar-user-role" style={{ textTransform: 'capitalize' }}>{user ? user.rol : 'Rol'}</span>
          </div>
          <button className="btn btn-outline btn-sm" style={{ marginLeft: '1rem', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={logout}>
            Salir
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;