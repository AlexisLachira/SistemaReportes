import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';

export function RoleProtectedRoute({ children, rol }) {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.rol !== rol) {
    // Si no tiene el rol, redirigir al dashboard (o mostrar mensaje de acceso denegado)
    return <Navigate to="/" replace />;
  }

  return children;
}
