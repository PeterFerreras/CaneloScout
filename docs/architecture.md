# Arquitectura propuesta

## MVP de presentación

La entrega actual funciona completamente en el navegador y está orientada a validar el diseño, el recorrido y las reglas operativas con el cliente.

## Evolución a producción

1. La aplicación pública recibe la solicitud sin exigir una cuenta al jugador.
2. La API valida los datos y registra la solicitud.
3. Las imágenes y comprobantes se guardan en almacenamiento privado.
4. El panel administrativo requiere autenticación y permisos.
5. Los organizadores aprueban jugadores y forman los equipos.
6. Durante el evento se registran check-in, número y mediciones.
7. Solo los perfiles autorizados se publican en el Media Center.

## Entidades principales

- Evento
- Solicitud
- Jugador
- Documento
- Posición
- Equipo
- Róster
- Medición
- Usuario administrativo
- Perfil público

## Criterios de seguridad

- Documentos privados mediante enlaces temporales.
- Validación de tipo y tamaño de archivo.
- Registro de cambios administrativos.
- Separación entre información privada y perfil público.
- Copias de seguridad y política de retención.
