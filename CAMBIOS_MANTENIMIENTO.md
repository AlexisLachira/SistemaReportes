# Implementación de gestión de mantenimiento

Actualización del 16 de noviembre de 2026, aplicada sobre la versión restaurada. La referencia anterior se conserva en FUNCIONAMIENTO_ACTUAL_SISTEMA.md como descripción histórica.

## Respaldo

Antes de modificar el código se guardaron src, backend, configuración y documentación en `.implementation-backup-20261116-114543/`. En la primera implementación se conservaron los datos. En la corrección posterior solicitada se migraron únicamente los códigos de inventario a valores ficticios, con respaldo adicional en `.local-run/inventory-backup-1794849920819/`; se conservaron IDs, registros e historial.

## Qué se implementó

- Nombre unificado: Sistema de Gestión de Mantenimiento de Equipos Informáticos de la UNP. Se actualizó la presentación en acceso, cabecera, título del navegador y cabecera de informes.
- Código patrimonial/inventario como texto. El alta admite códigos institucionales, conserva ceros iniciales y comprueba duplicados en el inventario consultado. Se mantiene el ID interno para relaciones. Por solicitud del usuario, los diez equipos ahora usan códigos ficticios del 740899504221 al 740899504230. Se identifican como códigos ficticios en Inventario y con codigoInventarioFicticio en los datos. No son códigos oficiales verificados. El código se mantiene de solo lectura al editar para evitar romper referencias antiguas; una sustitución por códigos oficiales requerirá un mapeo verificado.
- Registro de incidencias con búsqueda exacta del código, lector que actúe como teclado (Enter), entrada manual y cámara si el navegador ofrece BarcodeDetector. La búsqueda carga equipo, tipo y ubicación. Una búsqueda nueva limpia el equipo anterior para no reportar accidentalmente el equipo equivocado. Se conserva la selección manual por ambiente y tipo.
- Adaptador `getEquipoByCodigo` en src/services/api.js para aislar la consulta al inventario. Hoy consulta el JSON local. No hay endpoint, credenciales ni contrato de API real de la UNP. Esa integración deberá pasar por el backend; los secretos no deben estar en variables VITE.
- Mantenimiento con equipo obligatorio, incidencia opcional y estado propio. El correctivo sigue creándose desde una incidencia revisada. Preventivos y evaluaciones predictivas se programan directamente para un equipo.
- Campo de frecuencia de 1 a 60 meses para preventivos. La referencia inicial es seis meses y puede ajustarse al programar. No se crean automáticamente trabajos recurrentes ni se envían notificaciones.
- Predictivo exige un registro de mediciones y análisis de condición. Es documentación manual de la evaluación e intervención; no se implementó un motor que prediga fallas.

## Cómo opera cada recorrido

### Incidencia y correctivo

1. Alumno o administrador selecciona o busca el equipo, describe la falla e indica impacto.
2. La incidencia queda Reportada y el equipo Dañado.
3. El administrador la marca Revisada y asigna técnico activo y fecha.
4. Se crea un mantenimiento Correctivo en Programado; la incidencia pasa a Asignada.
5. El técnico asignado entra desde Mis mantenimientos y pulsa Iniciar mantenimiento. Se registra fecha real y el equipo pasa a En mantenimiento.
6. Guarda diagnóstico, actividades, repuestos, observaciones y horas.
7. Finaliza con diagnóstico y actividades no vacíos y horas positivas. El trabajo pasa a Finalizado y la incidencia a Reparada.
8. El administrador valida y cierra la incidencia. El equipo queda Disponible solo cuando no hay otra incidencia abierta ni otro trabajo en curso.

Las acciones del listado y del detalle usan el mismo servicio de transiciones. El selector del listado deshabilita saltos que no corresponden. Los errores de operación conservan la pantalla para poder corregir los datos.

### Preventivo independiente

1. El administrador pulsa Programar mantenimiento desde la fila del inventario, o entra en Gestión mantenimientos.
2. Elige equipo disponible sin incidencias abiertas, técnico activo, fecha, frecuencia y actividades previstas. Las incidencias Cerradas no impiden una nueva programación. La disponibilidad se vuelve a validar al guardar.
3. El trabajo queda Programado sin crear incidencia. La programación por sí sola no bloquea el uso del equipo.
4. El técnico lo encuentra en Mis mantenimientos. Solo el técnico asignado puede iniciar, finalizar o reportar una falla detectada; el administrador programa y consulta el seguimiento.
5. Al iniciar pasa a En proceso y el equipo a En mantenimiento.
6. Al finalizar exige resultado; se guarda fechaFin y pasa a Finalizado.
7. El historial y los reportes lo reconocen directamente por equipo, sin depender de una incidencia ficticia.

### Falla detectada durante un preventivo

Mientras el trabajo está En proceso aparece Reportar falla detectada. Abre el formulario con el equipo preseleccionado y guarda el mantenimiento de origen. El servicio comprueba que el usuario sea el técnico asignado al trabajo activo. La nueva falla entra en el recorrido habitual Reportada, Revisada, Asignada, Reparada y Cerrada. Finalizar la limpieza no oculta la falla pendiente ni libera el equipo indebidamente.

### Evaluación predictiva

Comparte programación, asignación, ejecución y resultado con el preventivo, pero exige mediciones y análisis que justifiquen la intervención. El formulario pide indicador, fechas, valores, tendencia y criterio técnico. No interpreta automáticamente ese texto ni genera estimaciones de vida útil.

## Inventario: significado de las columnas

| Información | Qué representa |
| --- | --- |
| Operativo | Disponible, Dañado, En mantenimiento o Retirado |
| Seguimiento de mantenimiento | Situación del preventivo: vencido, próximo, programado, en proceso, al día o sin programación |
| Fecha prevista | Fecha del trabajo preventivo pendiente o referencia calculada desde el último preventivo finalizado y su frecuencia |
| Evaluación del equipo | Recomendación separada de revisión por fallas recurrentes o evaluación de reemplazo por antigüedad |

Un equipo puede estar Disponible y tener un preventivo vencido. Una reparación correctiva no reinicia el plazo preventivo. Si no hay un preventivo registrado, se usa la fecha de adquisición más seis meses como referencia orientativa, no como un calendario oficial de la UNP. Sin fecha válida se muestra Sin programación. Para retirados el seguimiento indica No aplica.

Se corrigió el filtro operativo para usar los estados que realmente guarda el inventario y se añadió filtro de seguimiento preventivo.

## Compatibilidad de módulos

| Módulo | Adaptación |
| --- | --- |
| Gestión mantenimientos | Trabajos sin incidencia y atenciones correctivas en la misma página; estado propio junto al estado de la incidencia |
| Mis mantenimientos | Consulta los trabajos del técnico en ambos recorridos; conserva filtros de incidencias y añade filtro de estado para programados |
| Historial de equipo | Incluye ambos orígenes, resultados, los tres tipos e indicadores correspondientes |
| Inventario | Consulta preventivos por equipo, conserva estado operativo independiente y permite programar desde la fila |
| Reportes | Equipos y laboratorios incluyen mantenimientos independientes; se alinearon los encabezados del PDF de equipos y su campo tipoEquipo |
| Dashboard | Restringe mantenimientos al alcance del rol y cuenta trabajos independientes en las tarjetas del técnico |
| Estadísticas | El ranking de trabajos realizados cuenta los finalizados |
| Formularios de edición | Conservan IDs alfanuméricos y la selección del equipo al editar |
| Técnicos y sesión | El nombre de sesión se construye también a partir de nombres/apellidos; no se persiste contraseña en las nuevas sesiones; se limpiaron efectos que fallaban ESLint sin alterar el papel del rol |
| Eliminaciones | Se bloquea eliminar equipos con historial e incidencias con mantenimiento asociado |

Las relaciones nuevas usan IDs. Los lectores reconocen referencias anteriores por código o incidencia. Al cargar el servidor local se completan en memoria los equipoId ausentes que puedan deducirse y el estado de mantenimientos antiguos a partir de fechas. No se inventan fechas reales ni se renumeran equipos. Estas relaciones se persistirán junto a las escrituras posteriores de JSON Server.

El servidor local evita el watcher del CLI que en pruebas anteriores recargaba instantáneas mientras había escrituras y podía perder cambios. Carga el JSON una vez y persiste las operaciones. Si se edita manualmente el JSON, hay que reiniciarlo.

## Ejecución

Desde la raíz, en dos terminales:

```powershell
npm.cmd run server
npm.cmd run dev
```

Detener y volver a iniciar cualquier servidor anterior para usar el servidor corregido. El modo raíz usa src/data/db.json. La alternativa `npm start` dentro de backend usa backend/db.json; elegir un solo modo de datos en cada sesión.

Comprobaciones:

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run build
```

Para un entorno desechable de revisión visual:

```powershell
node tests/preview.mjs
```

Abre http://127.0.0.1:5419 con API en el puerto 3419 y una copia temporal de los datos. El ejemplo 740899504221 corresponde al primer equipo de demostración y también existe en las bases del proyecto, marcado como ficticio. Escribir `stop` en esa terminal cierra sus procesos y borra la copia temporal; también se cierra automáticamente después de quince minutos. Nunca sirve de sustituto de la base original.

## Verificación realizada

Catorce pruebas de Node correctas. Incluyen escenarios HTTP, permisos exclusivos del técnico, rechazo de programación con incidencias abiertas, seguimiento preventivo y migración de códigos sin pérdida de relaciones. Cubren compatibilidad de registros antiguos, registro por código, duplicados de incidencias, roles y asignación, inicio/avances/finalización/cierre, preventivos independientes, evidencia predictiva, trabajos concurrentes, falla durante preventivo y códigos con ceros iniciales.

Se comprobó en el navegador con datos temporales: login administrador, carga automática mediante código, registro, revisión, asignación, login técnico, inicio, avances, reparación, cierre administrativo, equipo disponible, programación desde inventario, inicio y finalización preventiva y ambos resultados en el historial. La captura `tests/prueba-mantenimientos.jpg` muestra el equipo disponible y sus indicadores de correctivo y preventivo.

ESLint y compilación se ejecutaron. Vite conserva una advertencia por el tamaño del paquete generado. No se comprobó la lectura física de una etiqueta ni la cámara del usuario, ni se revisó visualmente la exportación PDF/Excel.

## Límites pendientes

- Conexión real con inventario UNP: requiere acceso autorizado y contrato de datos; no está implementada.
- Cámara: depende de HTTPS/localhost, permisos y compatibilidad de BarcodeDetector; ante incompatibilidad se informa y permanecen lector/entrada manual.
- Predictivo: evaluación manual documentada; un sistema de predicción real requiere datos periódicos y un método validado.
- JSON Server es un prototipo: las validaciones de rol son del cliente y no reemplazan autorización del backend. Tampoco ofrece transacciones para varias colecciones ni garantías de unicidad ante escrituras concurrentes.
- Los números actuales son ficticios. Una sustitución por códigos oficiales necesita correspondencia verificada. El script scripts/demo-inventory.mjs actualiza códigos y referencias, mantiene IDs y guarda un respaldo con --apply; debe ejecutarse con el servidor de datos detenido.
