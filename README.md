# Sistema de Reporte de Equipos Dañados

Aplicación web académica desarrollada en **React** para la **Escuela Profesional de Ingeniería Informática de la Universidad Nacional de Piura (UNP)**. 

El sistema permite gestionar de manera integral las incidencias y reportes de equipos informáticos dañados en los diferentes laboratorios de cómputo, facilitando la comunicación entre alumnos, administradores y el equipo de soporte técnico.

## 🚀 Características Principales

* **Roles de Usuario**:
  * **Administrador**: Control total. Puede ver todas las incidencias, gestionar el inventario de equipos, asignar técnicos, auditar el historial y acceder al centro de monitoreo (Dashboard) y reportes exportables.
  * **Técnico**: Recepciona las incidencias asignadas, gestiona el proceso de mantenimiento y documenta las reparaciones realizadas.
  * **Alumno**: Puede registrar nuevas incidencias de los equipos y visualizar únicamente el estado de los que él ha reportado.
* **Flujo de Estados Estricto**: Ciclo de vida controlado y consistente: `Reportada` → `Revisada` → `Asignada` → `Reparada` → `Cerrada`.
* **Módulo de Mantenimientos e Historial**: Gestión de mantenimientos vinculados directamente a cada incidencia con un historial de trazabilidad por equipo.
* **Dashboard Administrativo**: Centro de monitoreo con estadísticas dinámicas, gráficos visuales (Chart.js/Recharts) y KPIs en tiempo real.
* **Módulo de Reportes Profesionales**: Filtros avanzados y generación de reportes exportables a formatos **PDF** y **Excel**.
* **Gestión de Inventario**: Administración completa del hardware patrimonial de los laboratorios.

## 🛠️ Tecnologías Utilizadas

* **React v19+** (Vite)
* **React Router v7** (Para la navegación y protección de rutas)
* **Context API** (Gestión global de sesión y autenticación)
* **JSON Server** (API REST local completa)
* **Bootstrap 5 & Vanilla CSS** (Diseño moderno, utilidades responsive y layouts fluidos)

## 📦 Instalación y Configuración Local

1. Clona el repositorio:
   ```bash
   git clone https://github.com/AlexisLachira/SistemaReportes.git
   cd SistemaReportes
   ```

2. Instala las dependencias principales (React y herramientas):
   ```bash
   npm install
   ```

3. Ejecuta la base de datos simulada (JSON Server) en una terminal:
   ```bash
   npm run server
   ```
   *Esto iniciará la API en `http://localhost:3001`*

4. En una **segunda terminal**, ejecuta la aplicación React:
   ```bash
   npm run dev
   ```
   *La aplicación estará disponible en `http://localhost:5173` (o el puerto que indique Vite)*

## 🔐 Usuarios de Prueba (Login)

Para explorar los distintos roles de la aplicación, puedes usar las siguientes credenciales:

| Rol | Código/Usuario | Contraseña |
|-----|----------------|------------|
| **Administrador** | `admin` | `admin123` |
| **Técnico 1** | `TEC001` | `tecnico123` |
| **Técnico 2** | `TEC002` | `tecnico123` |
| **Alumno 1** | `202300001` | `alumno123` |
| **Alumno 2** | `202300002` | `alumno123` |

## 📂 Estructura del Proyecto

```text
src/
├── auth/           # Contexto y componentes de protección de rutas (Login)
├── components/     # Componentes modulares (Navbar, Formularios, Filtros, Listas, etc.)
├── data/           # Base de datos simulada (db.json)
├── pages/          # Vistas (Dashboard, Login, Reportes, Historial, Mantenimientos)
├── services/       # Funciones centralizadas para llamadas a la API (Fetch)
├── App.jsx         # Configuración de enrutamiento principal
├── main.jsx        # Punto de entrada de React
└── index.css       # Sistema de diseño y overrides de estilos globales
```

---
*Desarrollado para la Universidad Nacional de Piura (UNP) - 2026*
