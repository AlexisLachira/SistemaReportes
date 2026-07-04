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
import Inventory from "./pages/Inventory";
import NewEquipment from "./pages/NewEquipment";
import MaintenanceManagement from "./pages/MaintenanceManagement";
import MyMaintenances from "./pages/MyMaintenances";
import Technicians from "./pages/Technicians";
import NewTechnician from "./pages/NewTechnician";
import EquipmentHistory from "./pages/EquipmentHistory";
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
    <div className="d-flex vh-100 vw-100 overflow-hidden bg-light">
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      <div className="d-flex flex-column flex-grow-1 overflow-auto">
        <Navbar onToggleSidebar={toggleSidebar} />

        <main className="container-fluid p-4">
          <Routes>
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/nueva-incidencia" element={<ProtectedRoute><NewIncident /></ProtectedRoute>} />
            <Route path="/incidencias" element={<ProtectedRoute><IncidentList /></ProtectedRoute>} />
            <Route path="/incidencias/:id" element={<ProtectedRoute><IncidentDetails /></ProtectedRoute>} />
            <Route path="/editar-incidencia/:id" element={<RoleProtectedRoute rol="administrador"><NewIncident /></RoleProtectedRoute>} />
            
            <Route path="/mantenimientos" element={<RoleProtectedRoute rol="administrador"><MaintenanceManagement /></RoleProtectedRoute>} />
            <Route path="/mis-mantenimientos" element={<RoleProtectedRoute rol="tecnico"><MyMaintenances /></RoleProtectedRoute>} />

            <Route path="/inventario" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
            <Route path="/nuevo-equipo" element={<RoleProtectedRoute rol="administrador"><NewEquipment /></RoleProtectedRoute>} />
            <Route path="/editar-equipo/:id" element={<RoleProtectedRoute rol="administrador"><NewEquipment /></RoleProtectedRoute>} />
            <Route path="/equipo/:codigo/historial" element={<ProtectedRoute><EquipmentHistory /></ProtectedRoute>} />
            
            <Route path="/tecnicos" element={<RoleProtectedRoute rol="administrador"><Technicians /></RoleProtectedRoute>} />
            <Route path="/nuevo-tecnico" element={<RoleProtectedRoute rol="administrador"><NewTechnician /></RoleProtectedRoute>} />
            <Route path="/editar-tecnico/:id" element={<RoleProtectedRoute rol="administrador"><NewTechnician /></RoleProtectedRoute>} />
            
            <Route path="/reportes" element={<RoleProtectedRoute rol="administrador"><Reports /></RoleProtectedRoute>} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;