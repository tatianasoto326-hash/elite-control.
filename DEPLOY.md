# Publicación de ELITE CONTROL

La aplicación ya está preparada para Vite + React y Supabase. No se publicó automáticamente porque la cuenta Vercel conectada devolvió `403 Forbidden` al intentar crear el proyecto dentro del equipo `Tatis`.

## 1. Crear el proyecto en Vercel

En Vercel, usando el equipo correcto:

- Nombre: `elite-control`
- Framework: `Vite`
- Root Directory: `.`
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `dist`
- Node.js: `22.x` o superior compatible

La cuenta debe tener permiso para crear proyectos en el equipo. No hace falta conectar un repositorio para probarlo si se usa una carga directa del código; para despliegues automáticos posteriores, conectar un repositorio Git.

## 2. Variables de entorno en Vercel

Crear estas variables para Production, Preview y Development:

- `VITE_SUPABASE_URL` = `https://xgdhzjxozttqnybeghkn.supabase.co`
- `VITE_SUPABASE_PUBLISHABLE_KEY` = la publishable key del proyecto ELITE CONTROL (Supabase → Project Settings → API Keys).

Usar la publishable key. Nunca poner una `service_role` o secret key en variables `VITE_*` ni en el navegador.

## 3. Direcciones permitidas para el enlace de acceso

Cuando Vercel entregue la URL, abre Supabase → Authentication → URL Configuration:

- Site URL: pega la URL principal del despliegue.
- Redirect URLs: agrega la URL principal y el patrón `https://TU-DOMINIO.vercel.app/**`.
- Email provider: debe estar habilitado.

La dirección de correo de administradora está restringida en la interfaz a `tatianasoto326@gmail.com`. El trigger de la base crea el rol de administradora solo para ese correo.

## 4. Primer acceso

Abre la URL publicada, pulsa **Enviar enlace de acceso** y revisa el correo `tatianasoto326@gmail.com`. Abre el enlace desde el mismo navegador. Si Supabase aún usa el SMTP de prueba, puede aplicar límites de envío; para operación regular conviene configurar SMTP propio en Authentication → SMTP Settings.

## 5. Prueba inicial sugerida

1. Crea una ficha de prueba con datos reales o claramente identificados como prueba.
2. Agrega una aplicación.
3. Asigna la aplicación y la meta diaria a esa modelo.
4. Programa un turno y registra tokens.
5. Genera un reporte; verifica el texto en WhatsApp antes de enviarlo.
6. Borra los registros de prueba antes de iniciar la operación real.

## Nota sobre la API de datos

Las 12 tablas de `public` tienen RLS habilitado. Se otorgó `SELECT`, `INSERT`, `UPDATE` y `DELETE` a `authenticated`, y no se otorgaron permisos de tablas a `anon`. El esquema `public` debe permanecer dentro de los esquemas expuestos en la Data API de Supabase.
