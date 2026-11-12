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
