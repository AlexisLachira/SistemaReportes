import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../auth/AuthContext';

function Login() {
  const [codigo, setCodigo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!codigo || !contrasena) {
      setError('Por favor, complete todos los campos');
      return;
    }
    if (codigo !== 'admin' && !/^\d{9}$/.test(codigo)) {
      setError('El código debe ser "admin" o tener exactamente 9 dígitos');
      return;
    }

    setIsLoading(true);
    const result = await login(codigo, contrasena);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
    setIsLoading(false);
  };

  return (
    <div className="login-bg">
      <div className="login-card card p-4 p-sm-5">
        <div className="text-center mb-4">
          <div className="bg-primary text-white d-inline-flex justify-content-center align-items-center rounded-circle mb-3 shadow-sm" style={{width: '60px', height: '60px'}}>
            <i className="bi bi-pc-display-horizontal fs-2"></i>
          </div>
          <h4 className="fw-bold text-primary mb-1">UNP Soporte</h4>
          <p className="text-muted small">Sistema de Reporte de Equipos</p>
        </div>

        {error && (
          <div className="alert alert-danger py-2 small d-flex align-items-center" role="alert">
            <i className="bi bi-exclamation-circle-fill me-2"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-floating mb-3">
            <input
              type="text"
              className="form-control"
              id="codigoInput"
              placeholder="Código"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
            />
            <label htmlFor="codigoInput">Código Institucional / Admin</label>
          </div>
          
          <div className="form-floating mb-4">
            <input
              type="password"
              className="form-control"
              id="passwordInput"
              placeholder="Contraseña"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
            />
            <label htmlFor="passwordInput">Contraseña</label>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-100 py-2 fw-semibold" 
            disabled={isLoading}
          >
            {isLoading ? (
              <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Ingresando...</>
            ) : (
              <><i className="bi bi-box-arrow-in-right me-2"></i> Iniciar Sesión</>
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <small className="text-muted border-top pt-3 d-block">
            Solo para uso de alumnos y personal autorizado de la Facultad de Ingeniería Informática.
          </small>
        </div>
      </div>
    </div>
  );
}

export default Login;
