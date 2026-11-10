# OperativAI — sitio + portal de clientes

Una sola app (Vite + React + TypeScript + Tailwind v4) que es a la vez:

- **Landing** en `/`: atención con IA en WhatsApp, Instagram y Facebook, integración, precios, FAQ y contacto.
- **Portal de clientes** en `/portal/*`: registro con código por correo, inicio de sesión y las primeras pantallas
  (resumen, conversaciones, canales), conectado a la API [`operativ_server`](https://github.com/zeuticamx/operativ_server).

## Arranque

```bash
npm install
npm run dev          # http://localhost:3000
```

En desarrollo Vite hace proxy de `/api` y `/socket.io` a `http://localhost:8000` (la API con
`uvicorn main:socket_app --reload --port 8000`). Para apuntar a otra API local: `API_PROXY=http://host:puerto npm run dev`.

Se usa el puerto **3000** porque es el origen que la API acepta por defecto (`FRONTEND_ORIGINS`).

## Producción

Copia `.env.example` a `.env` y pon `VITE_API_URL` con la URL pública de la API (sin `/api`). En la API:

- agrega el dominio del sitio a `FRONTEND_ORIGINS`;
- deja `COOKIE_SECURE=true` y `COOKIE_SAMESITE=none` si sitio y API viven en dominios distintos.

El servidor que sirva `dist/` debe redirigir cualquier ruta desconocida a `index.html` (SPA).

## Sesión

- El access token vive solo en memoria; el refresh va en la cookie HttpOnly `op_refresh` que pone la API.
- Al abrir la página se llama a `POST /api/auth/refresh`; si responde, la sesión sigue sin volver a pedir contraseña.
- Ante un 401 el cliente refresca una vez y repite la petición (`src/lib/api.ts`).

## Estructura

```
src/
  lib/api.ts          cliente HTTP + tipos de la API
  lib/auth.tsx        contexto de sesión
  lib/contenido.ts    textos, planes, precios, FAQ y WhatsApp de ventas (editar aquí)
  components.tsx      logo, íconos de canal, spinner
  landing/            secciones de la landing
  portal/             acceso (entrar/registro), layout y páginas del portal
design-system/        sistema de diseño (colores, tipografía, reglas)
```

## Endpoints usados hasta ahora

| Pantalla | Endpoint |
|---|---|
| Registro | `POST /auth/registro` → `POST /auth/verificar` (`/auth/reenviar-codigo`) |
| Entrar / salir | `POST /auth/login`, `POST /auth/logout`, `POST /auth/refresh`, `GET /auth/yo` |
| Resumen | `GET /conversaciones/metricas` |
| Conversaciones | `GET /conversaciones` |
| Canales | `GET /canales` |

## Pendiente

- Flujos de conexión de canales (`/canales/meta/*`, `/canales/whatsapp/neuroapi/*`, `/canales/instagram/neuroapi/*`).
- Detalle de conversación, tomar/volver a IA, tiempo real con Socket.IO.
- Mi agente, agenda, CRM, reportes, cuenta y plan (ya tienen ruta con "próximamente").
- Recuperar contraseña, inicio con Google, aceptar invitaciones.
- Endpoint de contacto para la landing (hoy el formulario abre WhatsApp con el mensaje armado).
- Confirmar el número de WhatsApp de ventas en `src/lib/contenido.ts`.
