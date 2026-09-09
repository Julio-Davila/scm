# SCM · Función SI Anidada para Google Sheets

Aplicación web estática, responsiva y lista para desplegar.

## Archivos
- `index.html`: estructura de la aplicación.
- `styles.css`: diseño responsive desktop/mobile.
- `app.js`: autenticación por hash SHA-256, progreso, juegos, cuestionario y diploma.
- `assets/logo-scm.png`: logo institucional suministrado.
- `assets/mascota-scm.png`: mascota suministrada.

## Acceso
- Secciones disponibles: `MONET` y `DA VINCI`.
- Clave configurada: `SCM2026`.
- En el código no se almacena la clave en texto plano: se compara contra su huella SHA-256.

> Nota de seguridad: al ser una app 100% estática, una persona con conocimientos técnicos puede inspeccionar el código del navegador. Para autenticación real con control de usuarios, la validación debe migrarse a un backend/servicio de identidad y mantener el secreto fuera del frontend.

## Despliegue
Puedes subir toda la carpeta directamente a servicios de hosting estático (GitHub Pages, Netlify, Vercel, Cloudflare Pages, hosting escolar, etc.). El archivo de entrada es `index.html`.

## Funcionalidades
- Pantalla de bienvenida con nombre, apellido, sección y clave.
- Sidebar persistente en desktop y menú hamburguesa en móvil.
- Teoría con ejemplos y laboratorio interactivo.
- Tips de teclado.
- 2 videos de YouTube integrados.
- Infografías nativas en HTML/CSS.
- Crucigrama.
- Reto mental.
- Sopa de letras con exactamente 10 palabras.
- Cuestionario de 10 preguntas con feedback inmediato.
- Progreso, estrellas y mensajes motivadores.
- Diploma personalizado descargable en PNG al llegar al 100%.
- Avance guardado en `localStorage`.
