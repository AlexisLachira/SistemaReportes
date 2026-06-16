import { useState, useEffect } from 'react';

/**
 * Navbar — Barra de navegación superior
 * Muestra el título del sistema, fecha actual y usuario simulado
 * @param {Function} onToggleSidebar - Función para abrir/cerrar sidebar en móvil
 */
function Navbar({ onToggleSidebar }) {
  const [currentDate, setCurrentDate] = useState('');

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
          <div className="navbar-avatar">AD</div>
          <div className="navbar-user-info">
            <span className="navbar-user-name">Administrador</span>
            <span className="navbar-user-role">Soporte Técnico</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;