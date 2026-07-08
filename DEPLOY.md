# Guía de Despliegue: Frontend (Vercel) y Backend (Glitch/Render)

Esta guía explica paso a paso cómo publicar tu proyecto React en Internet de manera gratuita, manteniendo la arquitectura de `json-server`.

Para que el proyecto funcione en la nube, se debe alojar en dos partes separadas:
1. **El Backend (API):** La carpeta `backend/` que proveerá los datos JSON.
2. **El Frontend (React):** La carpeta principal del proyecto que mostrará la interfaz.

---

## FASE 1: Despliegue del Backend (API)

Como Vercel es un servicio *Serverless* (sin servidor continuo) optimizado para páginas estáticas, no puede mantener ejecutándose a `json-server`. Por eso usaremos un servicio especializado como **Glitch.com** o **Render.com**.

### Opción Recomendada: Glitch.com (Datos Persistentes)
1. Inicia sesión en [Glitch.com](https://glitch.com/).
2. Haz clic en **"New Project"** -> **"Import from GitHub"** (o puedes subir la carpeta manualmente si creas un proyecto básico de Node).
3. Sube únicamente el contenido de tu carpeta `backend/` (el `db.json` y el `package.json`).
4. Glitch detectará automáticamente el archivo `package.json` y ejecutará el script `"start": "json-server --host 0.0.0.0 --port 3001 db.json"`.
5. Obtén la URL en vivo de tu proyecto (ej. `https://tu-proyecto-glitch.glitch.me`).
6. **Importante:** Añade `/incidencias` a la URL en tu navegador web para asegurarte de que responde con código JSON.

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
   - **Value:** *La URL pública que obtuviste en Glitch o Render* (ej. `https://tu-proyecto-glitch.glitch.me`) *(Importante: No le agregues la barra final `/` ni endpoints como `/incidencias`)*.
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
