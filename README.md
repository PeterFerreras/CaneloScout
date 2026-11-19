# CaneloScout — aplicación de scouting y eventos deportivos

CaneloScout evoluciona a partir de la maqueta visual conservada en `dist/index.html`.

## Portales y recorridos

**Portal público** (sin inicio de sesión):
- `/`: presentación del programa y ediciones disponibles.
- `/eventos`: catálogo de eventos públicos.
- `/eventos/:id`: ficha informativa del evento.
- `/registro?event=:id`: inscripción real al evento abierto (4 pasos).
- `/prensa?event=:id`: perfiles autorizados y publicados en Media Center.
- `/seguimiento?codigo=:id`: consulta pública del estado, mediante el código no predecible de la solicitud.

**Back office** (autenticación obligatoria):
- `/admin/`: lista, creación y configuración de ediciones.
- `/admin/?event=:id&vista=solicitudes`: revisión de expedientes y comprobantes.
- `/admin/?event=:id&vista=rosters`: profundidad por posición y equipos.
- `/admin/?event=:id&vista=operacion`: check-in, números y mediciones.
- `/admin/?event=:id&vista=prensa`: controles de publicación.
- `/admin/preview?event=:id`: vista previa del registro (no guarda datos).

**Importante:** el público y el back office comparten datos y servicios, pero tienen menús, estilos y documentos HTML diferentes. No se debe volver a mostrar la administración en la navegación pública.

## Ejecución local

Se necesita **Node.js 22.13 o posterior**.

```powershell
npm ci
$env:ADMIN_PASSWORD = Read-Host 'Contraseña del administrador (mínimo 12 caracteres)' -MaskInput
npm start
```

Abre `http://127.0.0.1:8091/` para el portal público y `http://127.0.0.1:8091/admin/` para ingresar como `admin`.

El primer paso es crear un evento en el panel, con nombre, descripción pública, fechas, sede e instrucciones de pago. Al habilitar las inscripciones, el sistema muestra su enlace y QR.

Para compartir enlaces desde dispositivos externos, configura `PUBLIC_ORIGIN` con la URL HTTPS pública del servidor, no con `127.0.0.1`. Usa `BIND_HOST` y `PORT` según el alojamiento.

## Organización del código

- `server.mjs`: rutas, seguridad, datos y acciones del servidor Node.js.
- `server/views.mjs`: plantillas de salida y layouts independientes.
- `registration.js`: validación, pasos, carga de archivos y envío del registro público.
- `public.css`: adaptación visual del portal público y Media Center.
- `operations.js` y `operations.css`: interfaz operativa privada.
- `dist/index.html`: **maqueta original de referencia**, no aplicación de producción.
- `data/registrations.sqlite`: datos y archivos persistentes (excluidos de Git).

Ejecuta `npm run check` para revisar sintaxis sin iniciar el servidor.

## Recorrido para presentar al cliente

1. Mostrar la portada pública y los eventos disponibles.
2. Crear y editar una edición desde el back office, con fechas, sede y descripción.
3. Abrir la inscripción, mostrar el enlace y descargar el QR.
4. Completar un formulario público de prueba, incluida la fotografía y el comprobante.
5. Revisar el expediente, aprobar al jugador y asignarlo a un equipo por posición.
6. Registrar asistencia, número de chaqueta y mediciones.
7. Autorizar la publicación y mostrar el perfil en Media Center.

Hay datos ficticios de demostración cuando no existe ningún evento; no deben confundirse con datos persistentes.

## Límites antes del uso real

La aplicación es una **versión de demostración operativa**. Antes de procesar inscripciones reales, faltan usuarios y roles individuales, recuperación de cuenta, auditoría, endurecimiento de permisos, protección y retención de documentos, pruebas integrales y revisión del despliegue. No usar documentos ni datos personales reales durante la presentación.
