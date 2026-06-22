import { useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import NewIncident from "./pages/NewIncident";
import IncidentDetails from "./pages/IncidentDetails";
import Reports from "./pages/Reports";
import IncidentList from "./components/IncidentList";
import Login from "./pages/Login";
import { AuthProvider } from "./auth/AuthContext";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { RoleProtectedRoute } from "./auth/RoleProtectedRoute";

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  // Si estamos en la página de login, no mostramos el layout
  if (location.pathname === '/login') {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>
    );
  }

  return (
    <div className="app-layout">
      {/* Overlay para cerrar sidebar en móvil */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? "active" : ""}`}
        onClick={closeSidebar}
      />

      {/* Barra lateral de navegación */}
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      {/* Área principal */}
      <div className="main-area">
        <Navbar onToggleSidebar={toggleSidebar} />

        <main className="page-content">
          <Routes>
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/nueva-incidencia" element={<ProtectedRoute><NewIncident /></ProtectedRoute>} />
            <Route path="/incidencias" element={<ProtectedRoute><IncidentList /></ProtectedRoute>} />
            <Route path="/incidencias/:id" element={<ProtectedRoute><IncidentDetails /></ProtectedRoute>} />
            <Route path="/editar-incidencia/:id" element={<RoleProtectedRoute rol="administrador"><NewIncident /></RoleProtectedRoute>} />
            <Route path="/reportes" element={<RoleProtectedRoute rol="administrador"><Reports /></RoleProtectedRoute>} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

/**
 * App — Componente raíz de la aplicación
 * Configura el AuthProvider globalmente
 */
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;