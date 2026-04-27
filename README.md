# Concesionaria — Frontend

SPA del sistema multi-tenant de gestión de concesionarias. Consume la API del backend ([concesionariaBack](https://github.com/EMGomez32/concesionariaBack)).

## Stack

- **React 19** + **TypeScript** estricto + **Vite**
- **React Router 7** + **TanStack Query** (queries cacheadas)
- **Zustand** para auth/UI store
- Diseño con **design system propio** (CSS tokens, dark theme)
- **Vitest** para tests unitarios
- En producción se sirve con **nginx** (multi-stage Docker), con CSP estricta

## Páginas implementadas

| Sección | Pantallas |
|---|---|
| Auth | Login, recuperar password, restablecer password, activar cuenta |
| Admin (super_admin) | Concesionarias |
| Tenant config | Sucursales, Usuarios (con flujo de invitación), Auditoría, Billing |
| Stock | Vehículos (lista/detalle/alta), Catálogo (marcas/modelos/versiones), Ingresos, Movimientos, Reservas |
| CRM | Clientes, Proveedores |
| Operaciones | Presupuestos, Ventas |
| Finanzas | Caja (movimientos + cierres diarios), Financiación, Solicitudes externas, Gastos vehiculares, Gastos fijos |
| Postventa | Casos y reclamos |

## Desarrollo local

```bash
npm install
cp .env.example .env
# Editar VITE_API_BASE_URL si tu back no está en localhost:3000

npm run dev      # Vite dev server en http://localhost:5173
npm run lint     # ESLint
npm run build    # Build de producción → dist/
npm run preview  # Servir el build localmente
```

## Variables de entorno

Solo una, a configurar como **build arg** (Vite la inlinea al bundle):

| Variable | Descripción |
|---|---|
| `VITE_API_BASE_URL` | URL pública del backend, **terminando en `/api`**. Ej: `https://api.tudominio.com/api`. Default local: `http://localhost:3000/api`. |

En runtime (solo nginx):

| Variable | Descripción |
|---|---|
| `BACKEND_ORIGIN` | Origen del backend para la CSP de nginx. Si no se setea, se deriva de `VITE_API_BASE_URL` quitando el path. |

## Despliegue

Para deploy en Coolify ver [COOLIFY.md](./COOLIFY.md).

El Dockerfile es multi-stage (build con Vite → nginx en runtime), con healthcheck, gzip, cache largo en assets versionados, y CSP parametrizada vía `envsubst`.

```bash
# Build local
docker build \
    --build-arg VITE_API_BASE_URL=https://api.tudominio.com/api \
    -t concesionaria-front .

docker run --rm -p 8080:80 \
    -e BACKEND_ORIGIN=https://api.tudominio.com \
    concesionaria-front
```

## Estructura

```
src/
├── api/              # Clients de los endpoints (axios + tipos)
├── components/       # UI compartida (Button, Modal, Input...) + forms
├── pages/            # Una carpeta por feature
├── store/            # Zustand: authStore, uiStore, sidebarStore
├── types/            # Tipos compartidos por dominio
├── utils/            # Helpers (api, error, etc.)
├── config/           # Configuración estática (nav, etc.)
└── hooks/            # Hooks custom (useConcesionarias, etc.)
```

## Licencia

Privado.
