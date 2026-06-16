# Sistema de Reporte de Equipos Dañados

Aplicación web académica desarrollada en **React** para la **Escuela Profesional de Ingeniería Informática de la Universidad Nacional de Piura (UNP)**. 

El sistema permite gestionar las incidencias y reportes de equipos informáticos dañados en los diferentes laboratorios de cómputo, facilitando la comunicación entre alumnos y el equipo de soporte técnico.

## 🚀 Características Principales

* **Roles de Usuario**:
  * **Administrador**: Control total. Puede ver todas las incidencias, cambiar sus estados, editarlas, eliminarlas y acceder a la sección de reportes/estadísticas.
  * **Alumno**: Puede registrar nuevas incidencias y visualizar únicamente el estado de las que él ha reportado.
* **Dashboard Interactivo**: Resumen de incidencias y gráficos estadísticos (implementados con CSS puro).
* **Gestión de Incidencias**: Creación, lectura, actualización y eliminación (CRUD) de reportes.
* **Filtros Inteligentes**: Búsqueda por código de equipo, laboratorio, prioridad y estado.
* **Autenticación Simulada**: Sistema de inicio de sesión con protección de rutas y persistencia local (`localStorage`).

## 🛠️ Tecnologías Utilizadas

* **React v19+** (Vite)
* **React Router v7** (Para la navegación y protección de rutas)
* **Context API** (Para gestión del estado de autenticación)
* **JSON Server** (Para simular una API REST completa)
* **Vanilla CSS** (Diseño moderno, responsive y sin frameworks externos)

## 📦 Instalación y Configuración Local

1. Clona el repositorio:
   ```bash
   git clone https://github.com/AlexisLachira/SistemaReportes.git
   cd SistemaReportes
   ```

2. Instala las dependencias:
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
   *La aplicación estará disponible en `http://localhost:5173` (o 5174)*

## 🔐 Usuarios de Prueba (Login)

Para probar la aplicación, puedes usar las siguientes credenciales:

| Rol | Código/Usuario | Contraseña |
|-----|----------------|------------|
| **Administrador** | `admin` | `admin123` |
| **Alumno 1** | `202300001` | `alumno123` |
| **Alumno 2** | `202300002` | `alumno123` |

## 📂 Estructura del Proyecto

```text
src/
├── auth/           # Contexto y componentes de protección de rutas (Login)
├── components/     # Componentes reutilizables (Navbar, Sidebar, Formularios, etc.)
├── data/           # Base de datos simulada (db.json)
├── pages/          # Vistas principales (Dashboard, Login, Reportes, etc.)
├── services/       # Funciones para llamadas a la API (Fetch)
├── App.jsx         # Configuración de enrutamiento principal
├── main.jsx        # Punto de entrada de React
└── index.css       # Sistema de diseño y estilos globales
```

---
*Desarrollado para la Universidad Nacional de Piura (UNP) - 2026*
