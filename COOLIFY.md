# Despliegue en Coolify

Guía paso a paso para desplegar el frontend de Concesionaria en una instancia de [Coolify](https://coolify.io).

> **Antes de empezar**: el backend ya tiene que estar desplegado y accesible públicamente (ver [`COOLIFY.md` del back](https://github.com/EMGomez32/concesionariaBack/blob/main/COOLIFY.md)).

---

## 1. Crear la app del frontend

1. **+ New** → **Application** → **Public Repository** (o GitHub conectado).
2. Repo: `https://github.com/EMGomez32/ConcesionariaFront`.
3. Branch: `main`.
4. **Build pack**: Dockerfile.
5. **Dockerfile location**: `Dockerfile` (raíz).
6. **Port**: `80`.

---

## 2. Build args (CRÍTICO)

Vite **bakea** las variables al hacer `npm run build`, así que la URL del backend debe pasarse como **Build Argument**, no como env var de runtime.

En la pestaña **Build** → **Build Arguments**:

| Nombre | Valor |
|---|---|
| `VITE_API_BASE_URL` | `https://api.tudominio.com/api` (URL pública del backend, **terminando en `/api`**) |

> ⚠ Si cambias esta URL después, Coolify debe **rebuildear** la imagen, no basta con un restart.

---

## 3. Variables de entorno (runtime)

En **Environment Variables**:

| Variable | Valor | Descripción |
|---|---|---|
| `BACKEND_ORIGIN` | `https://api.tudominio.com` | Origen del backend SIN path. Usado para la CSP de nginx. Si lo omitís, el entrypoint lo deriva de `VITE_API_BASE_URL`. |

Eso es todo. El frontend no necesita más env vars en runtime — todo lo demás está en el bundle de Vite.

---

## 4. Healthcheck

El Dockerfile incluye un `HEALTHCHECK` que pega un GET a `/`. Coolify lo usa automáticamente.

---

## 5. Dominio y SSL

En **Domains**:
- Apuntar tu dominio (`app.tudominio.com`) al subdominio Coolify.
- Activar **HTTPS automatic** (Let's Encrypt).
- Importante: en el backend, asegurate que **`CORS_ALLOWED_ORIGINS` incluya `https://app.tudominio.com`** y **`APP_BASE_URL=https://app.tudominio.com`**.

---

## 6. Auto-deploy

Coolify puede auto-deployar al push a `main`:

1. **Webhooks** → **Generate webhook URL**.
2. En GitHub: Settings → Webhooks → Add webhook → pegá la URL → Content type JSON → Push events.

---

## 7. Verificar el deploy

Después del primer deploy:

1. Acceder a `https://app.tudominio.com/login`.
2. Loguear con el primer super_admin que creaste en el back.
3. Abrir DevTools → Network → verificar que las requests salen a `https://api.tudominio.com/api/...`.
4. DevTools → Console → no deberías ver errores de CSP.

---

## 8. Troubleshooting

| Síntoma | Causa probable | Fix |
|---|---|---|
| Login falla con CORS | `CORS_ALLOWED_ORIGINS` del back no incluye el dominio del front | Agregarlo en el back y reiniciar la app |
| Las requests del front van a `localhost:3000` | `VITE_API_BASE_URL` no se pasó como build arg, o se pasó como env var de runtime | Configurar en **Build Arguments** y rebuildear |
| Error de CSP "Refused to connect to..." | `BACKEND_ORIGIN` no coincide con el origen del back | Setear `BACKEND_ORIGIN=https://api.tudominio.com` (sin `/api`) y restart |
| Página en blanco después del primer load | El bundle baked tiene una URL vieja (cambiaste el back de URL) | Rebuildear el front con el nuevo `VITE_API_BASE_URL` |
| Las imágenes subidas no cargan | Backend no está sirviendo `/uploads/` o CSP bloquea | Verificar que `BACKEND_ORIGIN` esté en el `img-src` de la CSP (ya está si seguiste estos pasos) |

---

## 9. Resumen final

- Frontend público en `https://app.tudominio.com`
- Backend público en `https://api.tudominio.com`
- Auto-deploy al push de cada repo
- Build args para el front (Vite bakea), env vars para el back (Node lee runtime)
- CSP estricta del front genera dinámicamente con la env var `BACKEND_ORIGIN`
- nginx con gzip + cache largo en assets versionados + SPA fallback
