# SCM Business & Innovation Fair — Plataforma educativa interactiva

Versión rediseñada de la experiencia educativa para Secundaria del Colegio Sagrado Corazón de La Molina.

## Cambios principales de esta versión

- Acceso **sin clave**.
- Ficha inicial del estudiante con:
  - Nombres
  - Apellidos
  - Año / grado
  - Sección
- Rediseño visual completo con identidad institucional más profesional.
- Imágenes ultrarrealistas ya integradas en las secciones principales.
- Nueva galería vertical **9:16** en la pantalla de bienvenida con 6 escenas.
- Cambio automático de imagen cada **5 segundos**, con flechas, indicadores y barra de progreso.
- Logo oficial de **SCM Business & Innovation Fair** integrado en la bienvenida.
- Sidebar responsive con iconos full color.
- Panel lateral derecho simplificado con mensaje motivador y zoom de lectura.
- Progreso guardado localmente según los datos del estudiante.
- Juegos educativos interactivos.
- Cuestionario de 10 preguntas con retroalimentación.
- Diploma final personalizado con nombre, apellidos, grado, sección, fecha y puntaje.
- Descarga de diploma en PDF.

## Ejecutar directamente

Puedes abrir `index.html` en un navegador moderno.

## Ejecutar con servidor local

Requiere Node.js 18 o superior.

```bash
npm start
```

Luego abre:

```text
http://localhost:8080
```

No se solicita ninguna clave de acceso.

## Archivos principales

- `index.html` — estructura de la plataforma.
- `styles.css` — diseño responsive y estilos visuales.
- `app.js` — progreso, navegación, juegos, cuestionario y diploma.
- `server.js` — servidor estático local.
- `assets/` — logo e imágenes de la experiencia.

## Nota sobre el progreso

El avance se guarda en el navegador usando una clave local construida a partir de los datos del estudiante. Si se borra el almacenamiento del navegador o se cambia de dispositivo, el progreso local no se conserva automáticamente.
