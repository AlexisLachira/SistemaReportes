# Documentación Técnica del Sistema: Reporte y Gestión de Equipos Dañados
**Institución:** Universidad Nacional de Piura (UNP)  
**Escuela Profesional:** Ingeniería Informática  
**Módulos Clave:** Autenticación Institucional & Registro de Incidencias  
**Entornos:** Testing (JSON Server / `db.json`) | Producción (PostgreSQL)

---

## 1. Resumen Ejecutivo y Alcance

El **Sistema de Reporte de Equipos Dañados** es una solución integral diseñada para optimizar la gestión, trazabilidad y mantenimiento del equipamiento tecnológico en los diferentes **ambientes y laboratorios** de cómputo de la universidad.

El sistema contempla:
* **Autenticación Delegada (Federada):** La universidad es dueña de las credenciales de los usuarios; el sistema valida el correo y la contraseña a través de la **API Central Universitaria**, eliminando el almacenamiento local de contraseñas.
* **Soporte para Múltiples Ambientes:** Administración de diversos espacios físicos (*Laboratorio 1, Laboratorio 2, Laboratorio 3, Laboratorio 4, Oficinas Administrativas, etc.*).
* **Registro de Incidencias Inteligente:** Selección en cascada (*Ambiente ➔ Tipo de Equipo ➔ Equipo*) y cálculo algorítmico automatizado de la prioridad de atención.
* **Dualidad de Persistencia:** Modo de desarrollo/testing rápido mediante **JSON Server** (`db.json`) y arquitectura lista para producción con **PostgreSQL (PSQL)**.

---

## 2. Requisitos del Sistema

### 2.1. Requisitos Funcionales (RF)

#### Módulo de Autenticación
* **RF-01 (Validación Externa):** El sistema debe permitir iniciar sesión validando el identificador (correo institucional o código) y contraseña contra la API central de la universidad.
* **RF-02 (Cero Almacenamiento de Credenciales):** El sistema no debe almacenar contraseñas ni hashes en su base de datos local.
* **RF-03 (Roles de Sistema):** El sistema debe discriminar roles internos (`administrador`, `tecnico`, `alumno`) para proteger rutas y vistas en la interfaz.
* **RF-04 (Control de Estado de Cuenta):** Cuentas con estado `Inactivo` (p. ej., técnicos dados de baja) deben ser rechazadas con su respectivo mensaje.
* **RF-05 (Persistencia de Sesión):** Almacenar de forma segura el perfil de usuario y token de sesión para navegación continua.

#### Módulo de Registro de Incidencias
* **RF-06 (Gestión Multiambiente):** El sistema debe admitir múltiples ambientes (laboratorios, salas y áreas administrativas).
* **RF-07 (Selección en Cascada):** El formulario de registro debe filtrar de forma dinámica:
  1. *Ambiente* (solo muestra ambientes con equipos disponibles).
  2. *Tipo de Equipo* (solo los tipos presentes en dicho ambiente).
  3. *Equipo Específico* (por código patrimonial).
* **RF-08 (Cálculo Automático de Prioridad):** El sistema debe calcular la prioridad (`Baja`, `Media`, `Alta`, `Crítica`) cruzando la criticidad patrimonial del equipo con el impacto reportado (*usuarios afectados* y *nivel de interrupción*).
* **RF-09 (Trazabilidad y Auditoría):** Al crear una incidencia, se debe registrar automáticamente una entrada en el historial con fecha, hora, usuario reportante y acción realizada.
* **RF-10 (Transición de Estado del Equipo):** El equipo reportado debe cambiar su estado en el inventario a `Dañado` o `En mantenimiento`.

### 2.2. Requisitos No Funcionales (RNF)
* **RNF-01 (Seguridad):** Cumplimiento de estándares de privacidad institucional al no retener credenciales de los estudiantes o docentes.
* **RNF-02 (Responsividad y Portabilidad):** Interfaz fluida adaptable a computadoras de escritorio y dispositivos móviles (con capacidad de empaquetado como PWA o APK mediante Capacitor).
* **RNF-03 (Integridad Relacional):** En producción (PostgreSQL), garantizar claves foráneas (`ON DELETE RESTRICT`) y unicidad patrimonial.
* **RNF-04 (Rendimiento en Testing):** Uso de JSON Server para pruebas unitarias y de interfaz desacopladas de servidores SQL.

---

## 3. Stack Tecnológico

| Capa | Entorno de Pruebas / Testing | Entorno de Producción |
| :--- | :--- | :--- |
| **Frontend** | React 19, Vite, React Router v7 | React 19, Vite, React Router v7 |
| **UI & Estilos** | Bootstrap 5, Bootstrap Icons, CSS Custom | Bootstrap 5, Bootstrap Icons, CSS Custom |
| **Visualización** | Recharts (gráficos dinámicos) | Recharts |
| **Exportación** | jsPDF, jsPDF-AutoTable, XLSX | jsPDF, jsPDF-AutoTable, XLSX |
| **Backend / API** | JSON Server local (`npm run server`) | Backend REST (Node.js/Express, Spring o FastAPI) |
| **Autenticación** | Simulación en `db.json` / Mock API | API Central Universitaria (SSO / OAuth2 / LDAP) |
| **Base de Datos** | Archivo plano `src/data/db.json` | **PostgreSQL (PSQL)** (3ra Forma Normal) |

---

## 4. Arquitectura del Sistema

```mermaid
flowchart LR
    subgraph Cliente["Frontend (React 19 + Vite)"]
        UI_Auth["Módulo Auth / Login"]
        UI_Inc["Módulo Reportar Incidencia"]
        Context["AuthContext & State"]
    end

    subgraph ServiciosExt["Servicios Externos"]
        API_Uni["API Central Universidad<br>(Valida Correo / Password)"]
    end

    subgraph BackendApp["Backend / API de Incidencias"]
        ControladorAuth["Auth Controller"]
        ControladorInc["Incidencias Controller"]
        ServicioPrioridad["Algoritmo de Prioridad"]
    end

    subgraph Persistencia["Capa de Datos"]
        DB_Test[("Testing:<br>JSON Server (db.json)")]
        DB_Prod[("Producción:<br>PostgreSQL (PSQL)")]
    end

    UI_Auth -->|1. Envia credenciales| ControladorAuth
    ControladorAuth -->|2. Valida credenciales| API_Uni
    API_Uni -- 3. Datos de usuario OK --> ControladorAuth
    
    UI_Inc -->|4. Registro de falla| ControladorInc
    ControladorInc --> ServicioPrioridad
    
    ControladorAuth -. Pruebas .-> DB_Test
    ControladorInc -. Pruebas .-> DB_Test
    
    ControladorAuth == Producción ==> DB_Prod
    ControladorInc == Producción ==> DB_Prod
```

---

## 5. Modelo Relacional de Base de Datos (PostgreSQL - Producción)

### 5.1. Diagrama Entidad-Relación (DER)

```mermaid
erDiagram
    ROL_SISTEMA ||--o{ USUARIO_INSTITUCIONAL : "define rol"
    USUARIO_INSTITUCIONAL ||--o{ INCIDENCIA : "reporta"
    AMBIENTE ||--o{ EQUIPO : "alberga (1 a N)"
    AMBIENTE ||--o{ INCIDENCIA : "ocurre en (1 a N)"
    EQUIPO ||--o{ INCIDENCIA : "presenta falla"
    INCIDENCIA ||--o{ HISTORIAL_INCIDENCIA : "genera trazabilidad"
    USUARIO_INSTITUCIONAL ||--o{ HISTORIAL_INCIDENCIA : "ejecuta accion"

    ROL_SISTEMA {
        int id_rol PK
        varchar nombre "Administrador, Tecnico, Alumno"
    }

    USUARIO_INSTITUCIONAL {
        varchar codigo_institucional PK "Validado por API Uni"
        varchar correo UK "correo institucional"
        varchar nombres
        varchar apellidos
        varchar especialidad "Solo aplica a tecnicos"
        varchar estado "Activo, Inactivo"
        int id_rol FK
        timestamp fecha_registro
    }

    AMBIENTE {
        int id_ambiente PK
        varchar codigo_ambiente UK "LAB-01, LAB-02, ADM-01"
        varchar nombre "Laboratorio 1, Lab Redes, Administracion"
        varchar tipo_ambiente "Computo, Administrativo, Servidores"
        varchar pabellon
        int capacidad_equipos
        varchar estado "Operativo, Mantenimiento"
    }

    EQUIPO {
        int id_equipo PK
        varchar codigo_patrimonial UK "PC-LAB01-001"
        varchar numero_serie
        varchar tipo_equipo "PC, Monitor, Impresora, Switch"
        varchar marca
        varchar modelo
        varchar criticidad "Baja, Media, Alta, Critica"
        varchar estado "Disponible, Danado, En mantenimiento"
        int id_ambiente FK "Ambiente donde esta ubicado"
    }

    INCIDENCIA {
        int id_incidencia PK
        varchar codigo_reportante FK "Usuario que genero el reporte"
        int id_ambiente FK "Ambiente de la falla"
        int id_equipo FK "Equipo averiado"
        text descripcion
        varchar usuarios_afectados "1, 2-10, 11-30, >30"
        varchar impide_actividades "No, Parcialmente, Impide"
        varchar prioridad "Baja, Media, Alta, Critica"
        varchar estado "Reportada, Revisada, Asignada, Reparada, Cerrada"
        timestamp fecha_reporte
    }

    HISTORIAL_INCIDENCIA {
        int id_historial PK
        int id_incidencia FK
        varchar codigo_usuario FK "Responsable de la accion"
        varchar accion "Reporto, Asigno, Cambio estado"
        timestamp fecha_registro
    }
```

### 5.2. Script DDL en PostgreSQL

```sql
-- Creación de tablas para entorno de producción (PostgreSQL)

CREATE TABLE rol_sistema (
    id_rol SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE usuario_institucional (
    codigo_institucional VARCHAR(20) PRIMARY KEY,
    correo VARCHAR(100) NOT NULL UNIQUE,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    especialidad VARCHAR(100),
    estado VARCHAR(20) DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo')),
    id_rol INT NOT NULL REFERENCES rol_sistema(id_rol),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ambiente (
    id_ambiente SERIAL PRIMARY KEY,
    codigo_ambiente VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    tipo_ambiente VARCHAR(50) NOT NULL,
    pabellon VARCHAR(50),
    capacidad_equipos INT DEFAULT 0,
    estado VARCHAR(20) DEFAULT 'Operativo' CHECK (estado IN ('Operativo', 'Mantenimiento'))
);

CREATE TABLE equipo (
    id_equipo SERIAL PRIMARY KEY,
    codigo_patrimonial VARCHAR(50) NOT NULL UNIQUE,
    numero_serie VARCHAR(50),
    tipo_equipo VARCHAR(50) NOT NULL,
    marca VARCHAR(50) NOT NULL,
    modelo VARCHAR(50) NOT NULL,
    criticidad VARCHAR(20) DEFAULT 'Media' CHECK (criticidad IN ('Baja', 'Media', 'Alta', 'Crítica')),
    estado VARCHAR(30) DEFAULT 'Disponible' CHECK (estado IN ('Disponible', 'Dañado', 'En mantenimiento', 'De baja')),
    id_ambiente INT NOT NULL REFERENCES ambiente(id_ambiente),
    fecha_adquisicion DATE
);

CREATE TABLE incidencia (
    id_incidencia SERIAL PRIMARY KEY,
    codigo_reportante VARCHAR(20) NOT NULL REFERENCES usuario_institucional(codigo_institucional),
    id_ambiente INT NOT NULL REFERENCES ambiente(id_ambiente),
    id_equipo INT NOT NULL REFERENCES equipo(id_equipo),
    descripcion TEXT NOT NULL,
    usuarios_afectados VARCHAR(20) NOT NULL,
    impide_actividades VARCHAR(30) NOT NULL,
    prioridad VARCHAR(20) NOT NULL CHECK (prioridad IN ('Baja', 'Media', 'Alta', 'Crítica')),
    estado VARCHAR(30) DEFAULT 'Reportada' CHECK (estado IN ('Reportada', 'Revisada', 'Asignada', 'Reparada', 'Cerrada')),
    fecha_reporte TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE historial_incidencia (
    id_historial SERIAL PRIMARY KEY,
    id_incidencia INT NOT NULL REFERENCES incidencia(id_incidencia) ON DELETE CASCADE,
    codigo_usuario VARCHAR(20) NOT NULL REFERENCES usuario_institucional(codigo_institucional),
    accion VARCHAR(100) NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 6. Diagramas de Flujo de Procesos

### 6.1. Flujo de Autenticación (Login)

```mermaid
flowchart TD
    Inicio([Inicio]) --> Entrada[Usuario ingresa Código/Correo y Contraseña]
    Entrada --> CheckVacios{¿Campos vacíos?}
    
    CheckVacios -- Sí --> ErrorVacio[Mostrar: 'Complete todos los campos']
    ErrorVacio --> Entrada
    
    CheckVacios -- No --> CheckFormato{¿Formato institucional válido?}
    CheckFormato -- No --> ErrorFormato[Mostrar: 'Formato inválido']
    ErrorFormato --> Entrada
    
    CheckFormato -- Sí --> EnviaAPI[Backend consulta API Central de la Universidad]
    
    EnviaAPI --> ValidaUni{¿Credenciales válidas en la Universidad?}
    ValidaUni -- No --> ErrorAuth[Mostrar: 'Usuario o contraseña institucional incorrecta']
    ErrorAuth --> Entrada
    
    ValidaUni -- Sí --> SyncPerfil[Sincronizar/Consultar usuario_institucional en BD]
    SyncPerfil --> CheckActivo{¿Usuario se encuentra Activo?}
    
    CheckActivo -- No --> ErrorInactivo[Mostrar: 'Cuenta inactiva en el sistema']
    ErrorInactivo --> Entrada
    
    CheckActivo -- Sí --> GenToken[Generar Token JWT y guardar perfil en sesión]
    GenToken --> RedirigeDash[Redireccionar al Dashboard principal]
    RedirigeDash --> FinLogin([Fin])
```

### 6.2. Flujo de Registro de Incidencia

```mermaid
flowchart TD
    InicioInc([Inicio]) --> CargaListas[Cargar Ambientes y Equipos GET /equipos]
    
    CargaListas --> SelAmbiente[Paso 1: Seleccionar Ambiente / Laboratorio]
    SelAmbiente --> FiltraTipos[Filtrar tipos de equipo presentes en ese ambiente]
    
    FiltraTipos --> SelTipo[Paso 2: Seleccionar Tipo: PC, Monitor, Proyector...]
    SelTipo --> FiltraEquipos[Filtrar equipos disponibles del tipo seleccionado]
    
    FiltraEquipos --> SelEquipo[Paso 3: Seleccionar Equipo por Código Patrimonial]
    
    SelEquipo --> FormDetalle[Ingresar descripción, usuarios afectados y nivel de interrupción]
    FormDetalle --> CalculoPrioridad[Algoritmo calcula prioridad automática:<br>Baja, Media, Alta o Crítica]
    
    CalculoPrioridad --> Enviar[Clic en 'Registrar Incidencia']
    
    Enviar --> Valida{¿Formulario válido y descripción >= 10 caracteres?}
    Valida -- No --> MuestraError[Señalar campos obligatorios]
    MuestraError --> FormDetalle
    
    Valida -- Sí --> InsertaIncidencia[INSERT INTO incidencia<br>Estado: 'Reportada', vinculando código_reportante]
    
    InsertaIncidencia --> InsertaHistorial[INSERT INTO historial_incidencia<br>Acción: 'Reportó incidencia']
    
    InsertaHistorial --> ActualizaEquipo[UPDATE equipo<br>Cambiar estado a 'Dañado' o 'En mantenimiento']
    
    ActualizaEquipo --> MensajeOK[Mostrar alerta de éxito]
    MensajeOK --> RedirigeListado[Redirigir a listado de incidencias]
    RedirigeListado --> FinInc([Fin])
```

---

## 7. Guía de Ejecución Rápida

### Modo Testing (Actual)
```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar base de datos simulada (puerto 3001)
npm run server

# 3. Iniciar aplicación React (puerto 5173)
npm run dev
```

### Variables de Entorno (`.env`)
* **Testing:** `VITE_API_URL=http://localhost:3001`
* **Producción:** `VITE_API_URL=https://api-reportes.unp.edu.pe` (o URL del backend conectado a PostgreSQL).
