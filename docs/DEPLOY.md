# 🚀 Deploy de Autenza en la Raspberry Pi

Runbook para desplegar **Autenza** (`autenza.nebulant.com.ar`) en la Raspberry Pi (arm64) detrás de Cloudflare Tunnel, **reemplazando** el deploy anterior (DriveSoft).

> **Validado:** el stack completo (`migrate deploy` → backend healthy → nginx proxy → login con JWT) fue probado localmente end-to-end antes de este runbook. En la Pi cambia solo el puerto (`8082`) y que el build es arm64 nativo (más lento).

## Topología

```
Browser ──HTTPS──> Cloudflare ──tunnel──> Pi:8082 (nginx/front, autenza-frontend)
                                             ├── /            -> SPA (React)
                                             └── /api/*       -> autenza-backend:3000
                                                                   └── autenza-db:5432 (interno)
```

- **Solo el frontend publica puerto** (`FRONTEND_HOST_PORT=8082`). `db` y `backend` son **internos** → no colisionan con los `3000`/`5432` que ya usan otras apps de la Pi.
- Proyecto compose aislado: `name: autenza` (contenedores `autenza-*`, volumen `autenza_pgdata`) → no pisa a club2/asistencia ni al viejo DriveSoft.

---

## 0. Prerrequisitos (en la Pi)
- Docker + Compose v2 (`docker compose version`).
- `cloudflared` como servicio systemd (tunnel `83151ee6...`, config `/etc/cloudflared/config.yml`).
- Repo clonado/actualizado en la Pi con el branch a desplegar (`feat/sprint1-hardening-and-audit`).

---

## 1. Bajar el deploy anterior (DriveSoft) para liberar el puerto 8082
```bash
# En la carpeta del stack viejo (drivesoft/concesionaria):
docker compose down            # NO uses -v si querés conservar su volumen
# Verificá que nada quede escuchando en 8082:
sudo ss -ltnp | grep 8082 || echo "8082 libre"
```

---

## 2. Configurar el `.env` de la raíz (secretos + puerto)
```bash
cp .env.example .env
# Generá secretos fuertes y NUEVOS:
openssl rand -hex 32     # -> JWT_SECRET
openssl rand -hex 32     # -> JWT_REFRESH_SECRET (distinto)
openssl rand -hex 24     # -> POSTGRES_PASSWORD
```
`.env` en la Pi:
```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<password_fuerte>
POSTGRES_DB=concesionaria
FRONTEND_HOST_PORT=8082
NODE_ENV=production
JWT_SECRET=<hex_32>
JWT_REFRESH_SECRET=<otro_hex_32>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
LOG_LEVEL=info
# VITE_API_BASE_URL=/api   # (default, dejar comentado)
```
> `FRONTEND_HOST_PORT=8082` es lo que hace que el front quede en el puerto que rutea cloudflared.

---

## 3. Build y arranque
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```
- Compila en la Pi (arm64) → Prisma genera el engine arm64 correcto. **Es lento** (varios minutos).
- El backend, al arrancar, corre `npx prisma migrate deploy` (migraciones versionadas; la URL la resuelve `prisma.config.ts` desde `DATABASE_URL`).
- El override `prod` agrega backups diarios de Postgres en `./backups`.

Verificá:
```bash
docker compose ps            # los 3 servicios (autenza-*) Healthy/Started
docker compose logs backend --tail=30
```

---

## 4. Sembrar datos iniciales (una sola vez)
```bash
docker compose exec backend npm run seed
```
Crea roles, plan Free, **Concesionaria Demo** y usuario:
```
usuario:  admin@demo.com
password: admin123      # cambiala apenas entres
```
> Corré el seed **una sola vez** (usa `create`, no `upsert`).

---

## 5. Rutear autenza.nebulant.com.ar en Cloudflare Tunnel
En `/etc/cloudflared/config.yml`, reemplazá la regla vieja (drivesoft) por:
```yaml
ingress:
  - hostname: autenza.nebulant.com.ar
    service: http://localhost:8082
  # ... resto de reglas (club, asistencia) ...
  - service: http_status:404
```
Creá el DNS y reiniciá:
```bash
cloudflared tunnel route dns 83151ee6-123e-44d1-9b9b-1a0b3a38d4c6 autenza.nebulant.com.ar
sudo systemctl restart cloudflared
```

---

## 6. Smoke test en producción
```bash
# En la Pi:
curl -s http://localhost:8082/health
curl -s -X POST http://localhost:8082/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"admin123"}'
```
Desde el navegador: `https://autenza.nebulant.com.ar` → login → probar vehículo → presupuesto → venta → cuota → cobro. **Refrescar en `/vehiculos`** debe seguir cargando (SPA fallback ✅).

---

## 7. Actualizar (redeploy)
```bash
git pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

---

## 8. Backups / rollback
- Dumps en `./backups` (retención 7d/4s/6m). **Probar un restore** al menos una vez; para clientes reales, replicar **fuera de la Pi**.
- Rollback: `git checkout <sha>` + `up -d --build`; si una migración fue destructiva, restaurar el backup previo.

---

## 9. Troubleshooting (gotchas ya vistos)

| Síntoma | Causa | Solución |
|---|---|---|
| `Error: P3015 Could not find the migration file at migration.sql` | Carpeta de migración **vacía** (un `prisma migrate dev` interrumpido dejó el dir sin `.sql`). git no trackea dirs vacíos, así que aparece solo en algunos entornos | Borrar la carpeta vacía en `prisma/migrations/`. La real de índices de reportes queda pendiente (backlog `E4-04`) |
| `port is already allocated` en 8082 | El stack viejo (DriveSoft) sigue arriba | Paso 1: `docker compose down` del stack viejo |
| Build ERESOLVE (`react-helmet-async` vs React 19) | peer dep | Ya resuelto: `FrontConcesionaria/.npmrc` (`legacy-peer-deps=true`) |
| 404 al refrescar en rutas del SPA | — | Ya resuelto: `FrontConcesionaria/nginx.conf` (`try_files ... /index.html`) |
| API 404/red desde el navegador | `VITE_API_BASE_URL` mal horneada o proxy nginx | Debe ser `/api` (default). `docker compose logs frontend`; `backend` debe estar Healthy |
| No puedo loguear | No se corrió el seed | `docker compose exec backend npm run seed` |
| Colisión de puertos 3000/5432 | Estás publicando db/backend | No: el base los deja internos. Solo publicá db/backend en local con `docker-compose.dev.yml` |

---

## 10. Endurecimiento pendiente (antes de clientes reales)
Ver [`PLAN_MVP_LANZAMIENTO.md`](./PLAN_MVP_LANZAMIENTO.md) §2 y §5:
- Tokens a cookies `httpOnly` (hoy en `localStorage`).
- Backend Dockerfile multi-stage + usuario no-root.
- Rotar password del admin demo; crear usuarios reales.
- Backups replicados fuera de la Pi + restore probado.
- Migración real de índices de reportes (`E4-04`) + arreglar los errores de tipos del front (`E2-05`, hoy el type-check está fuera del build).

---

*Runbook validado end-to-end en local (2026-07-03). Alineado con [`PLAN_MVP_LANZAMIENTO.md`](./PLAN_MVP_LANZAMIENTO.md).*
