# Contexto del proyecto

## Objetivo

Propuesta de MVP para Canelo Scout Invitational: inscripción abierta de peloteros, revisión de solicitudes y pagos, organización de equipos por posición, operación del evento y perfiles deportivos para prensa y scouts.

El evento de referencia es el 7 y 8 de noviembre de 2026 en República Dominicana. Fechas, montos, cuentas de pago y contactos deben confirmarse con la organización antes de recibir registros reales.

## Flujo

1. El pelotero se registra sin cuenta, indica posición principal y secundaria y selecciona foto y comprobante.
2. El organizador revisa la solicitud y cambia su estado.
3. Se asignan jugadores aprobados a equipos considerando ambas posiciones.
4. Durante el evento se registran números, asistencia y mediciones.
5. El Media Center presenta perfiles deportivos aprobados.

Se calcula la edad para el evento y se solicitan datos del tutor para menores. La autorización de imagen y datos deportivos aparece en el formulario.

## Estado real

Es una maqueta estática, no un sistema de producción. Los cambios se guardan en localStorage del navegador. No hay servidor, autenticación, base de datos ni carga persistente de archivos. La vista ampliada del comprobante es un ejemplo, no el archivo seleccionado. La creación de equipos adicionales y la publicación son simulaciones. Algunas mediciones, notas y datos del formulario aún no se conservan; el enlace del perfil de prensa es demostrativo.

El panel administrativo está disponible públicamente y no debe usarse con datos reales. Para operar el evento se necesitan autenticación y permisos, validación en servidor, almacenamiento privado, persistencia, auditoría, copias de seguridad y publicación controlada.

## Continuidad

- Código: `dist/index.html`.
- Instrucciones: `README.md`.
- Arquitectura propuesta: `docs/architecture.md`.
- Catálogo: entregado por separado en PDF.
- Demo: https://rosterflow-invitational-2026.builtchalet.chatgpt.site/
- Referencia: https://canelo-scout-registro.netlify.app/
- Cuenta GitHub prevista: `peterferreras`; publicación pendiente.

No se ha seleccionado proveedor definitivo ni validado costos o capacidad. La elección depende del volumen de registros, concurrencia, tamaño y retención de archivos.
