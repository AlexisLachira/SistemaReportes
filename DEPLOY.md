# Guía de Despliegue: Frontend (Vercel) y Backend (Glitch/Render)

Esta guía explica paso a paso cómo publicar tu proyecto React en Internet de manera gratuita, manteniendo la arquitectura de `json-server`.

Para que el proyecto funcione en la nube, se debe alojar en dos partes separadas:
1. **El Backend (API):** La carpeta `backend/` que proveerá los datos JSON.
2. **El Frontend (React):** La carpeta principal del proyecto que mostrará la interfaz.

---

## FASE 1: Despliegue del Backend (API)

Como Vercel es un servicio *Serverless* (sin servidor continuo) optimizado para páginas estáticas, no puede mantener ejecutándose a `json-server`. Por eso usaremos un servicio especializado como **Glitch.com** o **Render.com**.

### Opción Elegida: Render.com (Web Service)

Render es excelente para alojar tu API, pero es importante que conozcas un detalle técnico de su plan gratuito: el disco es *efímero*. Esto significa que si la API está inactiva por 15 minutos, se apaga. Al encenderse nuevamente, **cualquier incidencia que hayas creado se borrará** y la base de datos regresará a su estado original (el archivo `db.json` que subiste). Para un proyecto académico esto suele ser útil porque el profesor siempre encontrará el sistema "limpio", pero tenlo en cuenta.

#### Pasos para desplegar en Render:
1. Sube tu carpeta `backend/` a un repositorio nuevo en GitHub (o sube todo el proyecto y configura el directorio raíz).
2. Inicia sesión en [Render.com](https://render.com/).
3. Haz clic en **"New"** -> **"Web Service"**.
4. Conecta tu cuenta de GitHub y selecciona el repositorio donde subiste el backend.
5. Configura el servicio así:
   - **Name:** *sistema-incidencias-api* (o el nombre que quieras).
   - **Root Directory:** `backend` (solo si subiste todo el proyecto en un solo repositorio. Si subiste la carpeta backend como su propio repositorio, déjalo en blanco).
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
6. En la parte inferior, haz clic en **"Create Web Service"**.
7. Render empezará a compilar tu aplicación. Al finalizar, te dará una URL (ej. `https://tu-api.onrender.com`).
8. **Verificación:** Ingresa a `https://tu-api.onrender.com/incidencias` en tu navegador. Si ves el código JSON, ¡el backend está funcionando!

---

## FASE 2: Despliegue del Frontend (React en Vercel)

Una vez que tengas la URL de tu backend funcionando, es hora de publicar tu interfaz visual.

1. **Subir a GitHub:**
   Asegúrate de que todo tu código fuente esté en un repositorio de GitHub (puedes excluir la carpeta `backend/` si lo deseas, o mantenerla ahí).
   
2. **Conectar con Vercel:**
   - Ingresa a [Vercel.com](https://vercel.com/) e inicia sesión con tu cuenta de GitHub.
   - Haz clic en **"Add New Project"** y selecciona tu repositorio.
   - Vercel detectará automáticamente que es un proyecto **Vite / React**. No cambies los comandos de construcción.

3. **Configurar las Variables de Entorno (¡CRÍTICO!):**
   Antes de hacer clic en "Deploy", despliega la sección de **"Environment Variables"** en Vercel.
   - **Name:** `VITE_API_URL`
   - **Value:** *La URL pública que obtuviste en Render* (ej. `https://tu-api.onrender.com`) *(Importante: No le agregues la barra final `/` ni endpoints como `/incidencias`)*.
   - Haz clic en **Add**.

4. **Desplegar:**
   Haz clic en **Deploy**. Vercel compilará tu aplicación React. Al finalizar, te entregará una URL pública (ej. `https://progvisual.vercel.app`).

---

## FASE 3: Verificación Post-Despliegue

Al ingresar a tu nueva URL de Vercel, verifica los siguientes puntos para confirmar que el entorno se inyectó correctamente:

- [ ] **Login:** Inicia sesión con cualquier usuario. Si carga rápido, la conexión es exitosa.
- [ ] **Dashboard:** Confirma que las métricas (Equipos Disponibles, Incidencias Críticas) reflejan los números correctos.
- [ ] **Registro de Incidencias:** Ingresa un reporte nuevo. Revisa la consola si tienes errores.
- [ ] **Historial y Mantenimientos:** Todo el flujo debe permanecer idéntico a localhost.

### ¿Qué pasa si uso localhost de nuevo?
Tu proyecto sigue funcionando perfectamente en local. El archivo `.env` configurado asegura que, mientras estés programando en tu PC, React apunte a `http://localhost:3001`. Vercel ignorará el `.env` local y usará la variable que definiste en su panel web.
