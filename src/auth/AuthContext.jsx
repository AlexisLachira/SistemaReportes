import { userName } from '../domain/maintenance';
import { createContext, useState } from 'react';
import { getUsuarios, getTecnicos } from '../services/api';

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('usuario') || 'null');
      if (!stored) return null;
      const profile = { ...stored, nombre: userName(stored) };
      delete profile.contrasena;
      return profile;
    } catch { return null; }
  });
  const loading = false;

  const login = async (codigo, contrasena) => {
    try {
      const [usuarios, tecnicos] = await Promise.all([
        getUsuarios(),
        getTecnicos()
      ]);
      
      const allUsers = [...usuarios, ...tecnicos];
      
      const foundUser = allUsers.find(
        (u) => u.codigo === codigo && u.contrasena === contrasena
      );

      if (foundUser) {
        // Asegurarnos de que el técnico no puede iniciar sesión si está Inactivo
        if (foundUser.rol === 'tecnico' && foundUser.estado === 'Inactivo') {
          return { success: false, message: 'Cuenta de técnico inactiva' };
        }
        
        const profile = { ...foundUser, nombre: userName(foundUser) };
        delete profile.contrasena;
        setUser(profile);
        localStorage.setItem('usuario', JSON.stringify(profile));
        return { success: true };
      } else {
        return { success: false, message: 'Credenciales inválidas' };
      }
    } catch (error) {
      console.error('Error en login:', error);
      return { success: false, message: 'Error de conexión con el servidor' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('usuario');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
