import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../auth/AuthContext';

function Login() {
  const [codigo, setCodigo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (!codigo.trim() || !contrasena.trim()) {
      setError('Por favor, complete todos los campos');
      return;
    }

    if (codigo !== 'admin' && !/^\d{9}$/.test(codigo)) {
      setError('El código de alumno debe tener exactamente 9 dígitos numéricos');
      return;
    }

    setLoading(true);
    const result = await login(codigo, contrasena);
    setLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="form-container login-container">
        <div className="login-header">
          <div className="sidebar-logo-icon" style={{ fontSize: '3rem', textAlign: 'center', marginBottom: '10px' }}>🖥️</div>
          <h2 className="form-title" style={{ textAlign: 'center' }}>Sistema de Reporte</h2>
          <p className="form-subtitle" style={{ textAlign: 'center' }}>Universidad Nacional de Piura</p>
        </div>
        
        {error && (
          <div className="form-message error-msg">
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group full-width">
            <label className="form-label">Código de Alumno o Usuario</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ej: 202300001 o admin"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
            />
          </div>

          <div className="form-group full-width">
            <label className="form-label">Contraseña</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
            />
          </div>

          <div className="form-actions" style={{ justifyContent: 'center', marginTop: '1.5rem' }}>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? '⏳ Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
