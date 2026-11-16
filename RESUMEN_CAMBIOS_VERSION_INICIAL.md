# Cambios respecto a la versión inicial

**Fecha:** 16 de noviembre de 2026.  
**Proyecto:** Sistema de Gestión de Mantenimiento de Equipos Informáticos de la UNP.  
**Referencia inicial:** versión restaurada tras el rollback, descrita en [FUNCIONAMIENTO_ACTUAL_SISTEMA.md](FUNCIONAMIENTO_ACTUAL_SISTEMA.md).  
**Detalle técnico:** [CAMBIOS_MANTENIMIENTO.md](CAMBIOS_MANTENIMIENTO.md).

Este documento resume los cambios que quedaron implementados. Las propuestas pendientes se indican por separado.

## 1. Comparación general

| Aspecto | Versión inicial | Versión actual |
| --- | --- | --- |
| Nombre | Nombres distintos asociados a reportes y gestión de incidencias | Presentación como sistema de gestión de mantenimiento de equipos informáticos |
| Identificación del equipo | Códigos de ejemplo como PC-LAB01-001 | Códigos numéricos ficticios como 740899504221, conservados como texto |
| Selección para una incidencia | Selección por ambiente, tipo y equipo | Se conserva la selección y se añade búsqueda exacta por código y escaneo compatible |
| Origen del mantenimiento | Asignación desde una incidencia | Correctivo desde incidencia; preventivo y evaluación predictiva directamente por equipo |
| Estado del mantenimiento | Seguimiento principalmente dependiente del estado de la incidencia | Estado propio: Programado, En proceso y Finalizado |
| Inicio del trabajo | No había una acción operativa que registrara fechaInicio | El técnico asignado inicia y registra la fecha real |
| Finalización correctiva | Permitía finalizar sin completar datos de solución | Exige diagnóstico, actividades y horas positivas |
| Ejecución de trabajos programados | No existía un recorrido independiente completo | Solo el técnico asignado inicia, finaliza y reporta fallas detectadas |
| Equipos para preventivo/predictivo | No había programación independiente | Solo equipos disponibles sin incidencias abiertas; también se verifica al guardar |
| Inventario | Columna de mantenimiento mezclaba alertas y recomendaciones por antigüedad | Seguimiento preventivo separado del estado operativo y de la evaluación del equipo |
| Historial e informes | Mantenimientos consultados principalmente a través de incidencias | Reconocen también trabajos relacionados directamente con el equipo |

## 2. Nombre e identificación de equipos

Se actualizó el nombre en la presentación del acceso, cabecera, título del navegador y encabezado de informes. El sistema se presenta como **Sistema de Gestión de Mantenimiento de Equipos Informáticos de la UNP**.

Por solicitud del usuario, los diez equipos de demostración utilizan códigos ficticios del **740899504221 al 740899504230**. No son identificadores oficiales verificados de la universidad.

- El código de inventario se almacena como texto para conservar ceros iniciales.
- Los IDs internos de equipos, incidencias, mantenimientos y eventos se conservaron.
- Se actualizaron las referencias codigoEquipo y equipoId donde correspondía.
- No se eliminaron incidencias, trabajos ni eventos del historial durante la migración.
- El inventario identifica visualmente los códigos ficticios; los registros contienen codigoInventarioFicticio.
- El alta comprueba códigos repetidos en el inventario consultado. El código permanece de solo lectura al editar para evitar cambios sin una migración controlada.

La migración se realizó sobre src/data/db.json y backend/db.json con el script [scripts/demo-inventory.mjs](scripts/demo-inventory.mjs). Se guardó respaldo y correspondencia de códigos en `.local-run/inventory-backup-1794849920819/`.

## 3. Búsqueda y escaneo para registrar incidencias

El formulario permite escribir un código o introducirlo mediante un lector de barras que funcione como teclado. También ofrece cámara cuando el navegador dispone de BarcodeDetector.

El recorrido es:

**Código → búsqueda en inventario → equipo, tipo y ubicación cargados → descripción e impacto → registro de incidencia.**

Una nueva búsqueda limpia la selección anterior, evitando registrar una falla sobre otro equipo si el nuevo código no se encuentra. Se conserva el formulario en cascada como alternativa.

La cámara depende de HTTPS o localhost, permisos y compatibilidad del navegador. No se realizó una prueba física con la cámara o las etiquetas del usuario.

El adaptador getEquipoByCodigo consulta actualmente el inventario local. **La API real de la UNP no está conectada.**

## 4. Flujo correctivo conservado y reforzado

El recorrido de la incidencia sigue siendo:

**Reportada → Revisada → Asignada → Reparada → Cerrada.**

1. El alumno o administrador registra una falla; el equipo pasa a Dañado.
2. El administrador revisa y asigna técnico activo y fecha.
3. Se crea un mantenimiento Correctivo en Programado.
4. El técnico asignado inicia el mantenimiento; se registra fechaInicio y el equipo pasa a En mantenimiento.
5. El técnico guarda diagnóstico, actividades, repuestos, observaciones y horas.
6. Finaliza con información de solución obligatoria; el mantenimiento queda Finalizado y la incidencia Reparada.
7. El administrador valida y cierra la incidencia.

El equipo vuelve a Disponible únicamente si no quedan otras incidencias abiertas ni otros trabajos en curso. Las acciones del listado y del detalle utilizan el mismo servicio de transiciones y el selector evita saltos de estado incompatibles.

## 5. Preventivo y predictivo por equipo

El administrador puede programarlos desde Inventario o desde Gestión de mantenimientos, sin crear una incidencia ficticia.

| Tipo | Datos principales | Alcance implementado |
| --- | --- | --- |
| Preventivo | Equipo, técnico, fecha, actividades y frecuencia de 1 a 60 meses | Programación y ejecución con resultado; seguimiento de la próxima fecha |
| Predictivo | Equipo, técnico, fecha, actividades, mediciones y análisis de condición | Evaluación e intervención documentadas manualmente; no genera predicciones automáticas |

Solo se permite programar equipos cuyo estado sea Disponible y que no tengan incidencias abiertas. Una incidencia Cerrada no impide programar nuevamente. La condición se aplica al selector y se vuelve a comprobar al guardar, incluso si el equipo figura incorrectamente como Disponible.

La programación conserva la disponibilidad del equipo hasta iniciar el trabajo. El mantenimiento avanza por **Programado → En proceso → Finalizado** y exige resultado al finalizar.

Si el técnico detecta una falla durante la intervención, puede abrir una incidencia con el equipo preseleccionado y el mantenimiento de origen relacionado. Esa falla continúa por el flujo correctivo habitual. Terminar el preventivo no oculta la falla pendiente.

## 6. Responsabilidades por rol

| Rol | Responsabilidades actuales |
| --- | --- |
| Alumno | Registrar fallas y consultar el seguimiento de sus reportes |
| Administrador | Revisar incidencias, asignar técnicos, programar preventivos/predictivos, consultar avances, administrar inventario y personal, validar y cerrar incidencias |
| Técnico asignado | Iniciar trabajos, registrar actividades y solución, finalizar y reportar fallas detectadas durante sus mantenimientos |

En Gestión de mantenimientos el administrador **ya no dispone de Iniciar trabajo, Finalizar trabajo, Reportar falla detectada ni del campo editable de resultado**. Esas acciones corresponden al técnico asignado. La restricción se aplica también en las funciones del flujo, no solo al ocultar botones.

Estas validaciones siguen siendo del cliente: no sustituyen la autorización que requeriría un backend de producción.

## 7. Inventario, historial, dashboard y reportes

- Se conserva la columna de estado operativo: Disponible, Dañado, En mantenimiento y Retirado.
- La columna Seguimiento de mantenimiento muestra preventivo vencido, próximo, programado, en proceso, al día o sin programación.
- La evaluación por antigüedad o fallas recurrentes aparece por separado.
- Se corrigieron los valores del filtro operativo y se añadió filtro de seguimiento preventivo.
- El botón de programación del inventario se ofrece únicamente para equipos elegibles.
- Una reparación correctiva no reinicia el plazo del preventivo.
- Si no hay preventivo registrado, se usa adquisición más seis meses como referencia orientativa; no representa un calendario oficial de la UNP.
- Mis mantenimientos incluye los trabajos vinculados a incidencias y los independientes del técnico.
- El historial del equipo incluye ambos orígenes, los tres tipos y los resultados.
- Los reportes por equipo y laboratorio reconocen los trabajos independientes.
- Se corrigieron el campo de tipo de equipo y la correspondencia entre encabezados y datos en el PDF de equipos.
- El dashboard cuenta trabajos independientes y limita el alcance de mantenimientos según el rol.
- El ranking de trabajos realizados cuenta mantenimientos finalizados.

**Listado y Gestión de mantenimientos permanecen como módulos separados. Su unificación se propuso, pero no se implementó porque el usuario limitó el alcance de la última corrección.**

## 8. Compatibilidad y ajustes técnicos

- Se conservaron referencias antiguas y se incorporaron relaciones por ID interno cuando podían deducirse.
- Se corrigió el uso de IDs alfanuméricos en formularios de edición.
- Se bloquea borrar equipos con historial e incidencias con mantenimiento relacionado.
- El nombre de sesión también puede construirse desde nombres y apellidos del técnico.
- Las nuevas sesiones no guardan la contraseña dentro del perfil persistido.
- Se corrigieron efectos e inicialización de formularios para que ESLint pase.
- Se sustituyó el comando del servidor de desarrollo por backend/dev-server.mjs. Evita la recarga del watcher que podía perder actualizaciones durante escrituras consecutivas.
- El servidor carga el JSON una vez: después de editar manualmente los datos es necesario reiniciarlo.

JSON Server sigue siendo un prototipo sin transacciones entre colecciones ni garantías de autorización o unicidad propias de producción.

## 9. Verificación y respaldo

La última revisión obtuvo:

- **14 pruebas automatizadas correctas**, incluyendo permisos, disponibilidad, registros antiguos, flujo correctivo, preventivos, fallas durante mantenimiento, códigos con ceros iniciales y migración sin pérdida de relaciones.
- **ESLint correcto.**
- **Compilación Vite correcta**, con advertencia por tamaño del paquete generado.
- Prueba previa en navegador con datos temporales del flujo correctivo y del preventivo independiente. Las restricciones posteriores de rol y selección se comprobaron con pruebas automatizadas.
- Comparación de los datos migrados para confirmar IDs conservados, historial intacto y referencias válidas.

Además del respaldo de inventario, la versión anterior a la implementación se encuentra en `.implementation-backup-20261116-114543/`. La referencia funcional inicial se conserva en FUNCIONAMIENTO_ACTUAL_SISTEMA.md.

## 10. Pendientes y puesta en marcha

Pendientes: API institucional real, sustitución por códigos oficiales mediante correspondencia verificada, prueba física de cámara/etiquetas, predicción real con datos y método validado, autorización y transacciones en un backend de producción.

Para volver a iniciar el sistema desde la raíz, usar dos terminales:

```powershell
npm.cmd run server
```

```powershell
npm.cmd run dev
```

Para verificarlo:

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run build
```

El modo raíz utiliza src/data/db.json. La alternativa de ejecución dentro de backend utiliza backend/db.json; son bases separadas.
