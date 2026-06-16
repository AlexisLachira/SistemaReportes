import { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Al cargar, verificar si hay sesión en localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('usuario');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (codigo, contrasena) => {
    try {
      // Simular llamada a API para obtener usuarios
      const response = await fetch('http://localhost:3001/usuarios');
      const usuarios = await response.json();
      
      const foundUser = usuarios.find(
        (u) => u.codigo === codigo && u.contrasena === contrasena
      );

      if (foundUser) {
        setUser(foundUser);
        localStorage.setItem('usuario', JSON.stringify(foundUser));
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
