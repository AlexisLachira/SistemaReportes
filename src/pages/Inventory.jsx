import { useContext } from 'react';
import { Link } from 'react-router-dom';
import EquipmentList from '../components/EquipmentList';
import { AuthContext } from '../auth/AuthContext';

function Inventory() {
  const { user } = useContext(AuthContext);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 fw-bold text-primary mb-1">
            <i className="bi bi-box-seam me-2"></i> Inventario de Equipos
          </h1>
          <p className="text-muted">Gestión de equipos informáticos de la institución</p>
        </div>
        
        {user?.rol === 'administrador' && (
          <Link to="/nuevo-equipo" className="btn btn-primary d-flex align-items-center shadow-sm">
            <i className="bi bi-plus-circle me-2"></i>
            <span className="d-none d-sm-inline">Nuevo Equipo</span>
          </Link>
        )}
      </div>

      <EquipmentList />
    </div>
  );
}

export default Inventory;
