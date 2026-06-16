import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import NewIncident from "./pages/NewIncident";
import IncidentDetails from "./pages/IncidentDetails";
import Reports from "./pages/Reports";
import IncidentList from "./components/IncidentList";

/**
 * App — Componente raíz de la aplicación
 * Define el layout principal (Sidebar + Navbar + Contenido)
 * y configura las rutas con React Router
 */
function App() {
  // Estado para controlar la visibilidad del sidebar en móvil
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Función para alternar el sidebar en dispositivos móviles
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

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
            <Route path="/" element={<Dashboard />} />
            <Route path="/nueva-incidencia" element={<NewIncident />} />
            <Route path="/incidencias" element={<IncidentList />} />
            <Route path="/incidencias/:id" element={<IncidentDetails />} />
            <Route path="/editar-incidencia/:id" element={<NewIncident />} />
            <Route path="/reportes" element={<Reports />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;