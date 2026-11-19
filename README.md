# Canelo Scout Invitational MVP

Maqueta funcional para presentar el flujo digital del Canelo Scout Invitational 2026.

Para continuar desde otro equipo, consulta [el contexto y las limitaciones](docs/CONTEXTO.md). Repositorio: [PeterFerreras/CaneloScout](https://github.com/PeterFerreras/CaneloScout).

## Alcance

- Registro público sin creación de cuenta.
- Validación de campos, cálculo de edad y autorización para menores.
- Carga simulada de fotografía y comprobante de pago.
- Revisión y aprobación de solicitudes.
- Profundidad por posición principal y secundaria.
- Construcción de equipos y operación del róster.
- Asignación de números, check-in y mediciones.
- Media Center para prensa y scouts.

## Ejecutar localmente

### Aplicación con varios eventos

En PowerShell, desde la raíz del proyecto, con Node.js 22.13 o posterior:

```powershell
npm ci
$env:ADMIN_PASSWORD = Read-Host 'Contraseña del administrador (mínimo 12 caracteres)' -MaskInput
npm start
```

Abre el [panel de eventos](http://127.0.0.1:8091/admin/) e inicia sesión con
`admin` y la contraseña que configuraste. Crea un evento con sus fechas, sede e
instrucciones de pago. Marca **Habilitar formulario público** para obtener un
enlace y un QR descargable. La [página pública](http://127.0.0.1:8091/) lista los
eventos disponibles.
En el panel, **Ver formulario de inscripción** abre una vista previa incluso
antes de habilitar un evento. El enlace público aparece cuando abres las
inscripciones.

Cada evento tiene sus propias solicitudes, equipos, check-in, mediciones y
perfiles de prensa. El administrador revisa los comprobantes manualmente y
decide qué perfiles deportivos publicar. Puedes cerrar las inscripciones desde
**Configuración** sin perder las solicitudes recibidas.

Los datos y archivos se guardan en `data/registrations.sqlite`. Por defecto el
servidor escucha en `127.0.0.1:8091`. Antes de distribuir el QR, configura
`PUBLIC_ORIGIN` con la dirección HTTPS accesible desde los teléfonos. Ese
dominio debe dirigir al servidor Node, mediante un proxy HTTPS o el proveedor
de alojamiento. Usa `BIND_HOST` y `PORT` si el entorno de alojamiento lo requiere.
Una dirección local sirve para pruebas en el mismo equipo.

### Maqueta de presentación

El MVP es un sitio estático. Puede abrirse `dist/index.html` directamente o servirse con cualquier servidor HTTP:

```powershell
python -m http.server 8080 --directory dist
```

Después, abrir `http://localhost:8080`.

## Persistencia

La maqueta usa `localStorage` para simular solicitudes y cambios dentro del navegador. No incluye base de datos ni almacenamiento real de archivos.

El comprobante ampliado es de ejemplo, la creación de equipos adicionales y la publicación son simuladas y el panel no está protegido. No introducir datos reales.

Para producción se recomienda separar:

- interfaz pública;
- panel administrativo autenticado;
- API y base de datos;
- almacenamiento privado de fotografías y comprobantes;
- publicación controlada de perfiles para prensa.

## Publicación

El contenido de `dist` puede desplegarse en MonsterASP, Netlify, Cloudflare Pages, GitHub Pages u otro hosting estático. Las funciones reales de registro y archivos requerirán un backend.

## Privacidad

Los nombres y datos incluidos son ficticios. El repositorio no contiene credenciales, datos personales reales ni identidad institucional ajena al proyecto.
