# ELITE CONTROL

Panel privado de administración para gestión de modelos, aplicaciones, metas, turnos, producción, reposiciones, deudas, abonos y reportes individuales por WhatsApp.

## Requisitos

- Node.js 20.19+ (recomendado Node 22).
- Proyecto Supabase `xgdhzjxozttqnybeghkn`.
- Publicable key del proyecto (nunca usar `service_role` ni una secret key en el navegador).

## Variables de entorno

Copia `.env.example` a `.env.local` y configura:

```env
VITE_SUPABASE_URL=https://xgdhzjxozttqnybeghkn.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=TU_PUBLISHABLE_KEY
```

La publishable key está diseñada para usarse en aplicaciones cliente. La seguridad de los datos depende además de las políticas RLS instaladas en Supabase.

## Ejecutar localmente

```bash
npm install
npm run dev
```

## Compilar

```bash
npm run build
npm run preview
```

## Configuración requerida en Supabase Auth

Después de publicar, abre **Supabase → Authentication → URL Configuration**:

1. En **Site URL**, guarda la URL principal desplegada en Vercel.
2. En **Redirect URLs**, agrega esa misma URL y el patrón de rutas `https://TU-DOMINIO.vercel.app/**`.
3. Comprueba que el proveedor **Email** esté activo.

La aplicación solicita un enlace de acceso por correo. El trigger ya presente en la base vincula el usuario autenticado al rol de administradora únicamente cuando su email coincide con `tatianasoto326@gmail.com`. No hay acceso para cuentas distintas ni para modelos.

## Seguridad

- No contiene contraseñas ni claves `service_role`.
- Las operaciones de datos se hacen con el usuario autenticado.
- Todas las tablas operativas llevan RLS y las políticas consultan `public.admins`.
- Las modelos no tienen pantalla de acceso.
- No se han sembrado datos ficticios de modelos, turnos ni producción.

## Módulos

- Resumen con indicadores de operación.
- Directorio de modelos y datos de contacto.
- Catálogo de aplicaciones y metas por modelo/aplicación.
- Programación de turnos y captura de producción.
- Seguimiento de reposiciones.
- Deudas, cuotas y abonos.
- Generación de reportes por turno con enlace para WhatsApp.

## Notas de uso

El reporte se genera y se guarda en ELITE CONTROL. El botón de WhatsApp abre un mensaje preparado para que la administradora lo revise y envíe; el sistema no envía mensajes automáticamente ni afirma que se hayan entregado.
