import { useContext } from 'react';
import { AuthContext } from '../auth/AuthContext';

function Navbar({ onToggleSidebar }) {
  const { user, logout } = useContext(AuthContext);

  return (
    <nav className="navbar navbar-expand-lg navbar-dark navbar-custom px-3">
      <div className="container-fluid">
        <button className="btn btn-outline-light d-md-none me-2" onClick={onToggleSidebar}>
          <i className="bi bi-list"></i>
        </button>
        <span className="navbar-brand mb-0 h1 d-none d-md-block">Sistema de Gestión de Incidencias</span>
        
        <div className="d-flex align-items-center ms-auto">
          {user && (
            <div className="d-flex align-items-center text-white">
              <div className="me-3 text-end d-none d-sm-block">
                <div className="fw-bold lh-1">{user.nombre}</div>
                <small className="text-white-50 text-uppercase" style={{ fontSize: '0.75rem' }}>
                  {user.rol}
                </small>
              </div>
              <button className="btn btn-sm btn-light text-primary" onClick={logout}>
                <i className="bi bi-box-arrow-right me-1"></i>
                Salir
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;