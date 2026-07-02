# 🏉 Plan de Scrum — Saneamiento y evolución del SaaS Concesionaria

> **Objetivo del plan:** llevar el sistema de un **prototipo funcional avanzado (~4/10, no vendible)** a un **producto SaaS multi-cliente seguro, vendible y competitivo** en Mendoza / Argentina / LatAm, aplicando de forma ordenada todos los cambios detectados en la auditoría técnica + comercial.

| | |
|---|---|
| **Fecha** | 2026-07-02 |
| **Producto** | SaaS de gestión para concesionarias/agencias de autos |
| **Stack** | Node.js · Express 5 · TypeScript · Prisma 7 · PostgreSQL 16 · React 19 · Docker |
| **Objetivo comercial** | Vender como SaaS multi-cliente (multi-concesionaria) |
| **Duración de sprint** | 2 semanas |
| **Equipo** | 1 PO · 1 Scrum Master · 2 Devs full-stack · 1 QA |
| **Velocity objetivo** | ~34 pts/sprint (Sprint 1 ~26 por ramp-up) |
| **Horizonte** | 7 sprints (Etapas 1–3, ~3,5 meses) + Sprint 0 · Etapa 4 en Sprints 8+ |

---

## Índice

1. [Marco de trabajo](#1-marco-de-trabajo)
2. [Roles y responsabilidades](#2-roles-y-responsabilidades)
3. [Épicas y releases](#3-épicas-y-releases)
4. [Product Backlog priorizado](#4-product-backlog-priorizado)
5. [Plan de sprints](#5-plan-de-sprints)
6. [Definition of Ready / Definition of Done](#6-definition-of-ready--definition-of-done)
7. [Ceremonias](#7-ceremonias)
8. [Métricas y tablero](#8-métricas-y-tablero)
9. [Gestión de riesgos](#9-gestión-de-riesgos)
10. [Cómo arrancar](#10-cómo-arrancar)
11. [Anexo: mapa de hallazgos de la auditoría](#anexo-mapa-de-hallazgos-de-la-auditoría)

---

## 1. Marco de trabajo

| Parámetro | Valor |
|---|---|
| Framework | Scrum + tablero Kanban de estados |
| Duración de sprint | 2 semanas |
| Velocity objetivo | ~34 pts/sprint (ramp 26 → 34) |
| Escala de estimación | Fibonacci (1, 2, 3, 5, 8, 13) |
| Releases | 4 (una por etapa del roadmap) |
| Horizonte Etapas 1–3 | 7 sprints (~3,5 meses) + Sprint 0 de setup |
| Etapa 4 (top regional) | backlog de alto nivel, Sprints 8+ |

**Prioridades del backlog:**
- **P0** — bloquea la venta / seguridad (acceso cross-tenant, secretos, core roto).
- **P1** — necesario para un MVP vendible (trazabilidad, monetización básica, demo creíble).
- **P2** — producto profesional (API documentada, BI, facturación fiscal).

---

## 2. Roles y responsabilidades

- **Product Owner (PO)** — dueño del backlog. Prioriza, escribe y valida criterios de aceptación, acepta historias en la Review. Decide qué entra a cada sprint y protege el alcance.
- **Scrum Master (SM)** — facilita ceremonias, remueve impedimentos, protege el Sprint Goal. **Clave en Etapa 1: cero features nuevas hasta cerrar los P0.**
- **Devs (x2, full-stack)** — implementación + tests unitarios/integración + PRs con review cruzado. Sugerencia de foco: uno backend/infra, otro frontend.
- **QA** — valida en staging contra criterios de aceptación; mantiene los tests de regresión, en especial el **test de aislamiento multi-tenant** (gate de seguridad).

---

## 3. Épicas y releases

| Épica | Foco | Release | Etapa | Pts aprox. |
|---|---|---|---|---|
| **E1 · Seguridad & Hardening** | Cerrar acceso cross-tenant, secretos, backdoors | R1 | 1 | 34 |
| **E2 · Estabilización & Arquitectura** | Core roto + unificar a 1 arquitectura | R1 | 1 | 31 |
| **E3 · DevOps productivo** | De local a producción segura | R1 | 1 | 22 |
| **E4 · Datos & Trazabilidad** | Soft-delete, auditoría real, índices | R2 | 2 | 26 |
| **E5 · Jobs & Performance** | Vencimientos automáticos, tuning | R2 | 2/3 | 11 |
| **E6 · UX & Credibilidad** | Dashboard real, roles UI, temas, forms | R2 | 2 | 26 |
| **E7 · Monetización** | MercadoPago, límites de plan, AFIP | R3 | 3 | 42 |
| **E8 · API Pro & Docs** | OpenAPI real, versionado, contratos | R3 | 3 | 8 |
| **E9 · Reportes & BI** | KPIs del sector, vistas materializadas | R3 | 3 | 13 |
| **E10 · Top Regional** | Multipublicador, IA WhatsApp, F&I, móvil | R4 | 4 | ~90 |

**Releases:**
- **R1 — Hardening & Estabilización** (Sprints 1–3): sistema seguro, un solo árbol de código, core funcionando, desplegable en producción.
- **R2 — MVP vendible** (Sprints 4–5): trazabilidad real, demo creíble, primeros clientes cobrables.
- **R3 — Producto profesional** (Sprints 6–7): cobro recurrente automático, facturación fiscal, reportes con KPIs.
- **R4 — Top regional** (Sprints 8+): multipublicador, CRM omnicanal + IA, F&I, app móvil.

---

## 4. Product Backlog priorizado

> Cada historia cita el hallazgo verificado de la auditoría (ver [Anexo](#anexo-mapa-de-hallazgos-de-la-auditoría)).

### 🔴 Épica E1 — Seguridad & Hardening

| ID | Historia | Pts | Prior. | Criterios de aceptación (resumen) |
|---|---|---|---|---|
| E1-01 | `authenticate` global **fail-closed** en `/api` + auth/authorize en todas las rutas vivas | 8 | P0 | Sin token → 401 en todo salvo allowlist (`/auth/login`, `/auth/refresh`, `/health`); las ~20 rutas hoy públicas quedan protegidas; test "sin token = 401" en verde |
| E1-02 | Extensión Prisma fail-closed + scope de sub-entidades por padre (IDOR) | 8 | P0 | Query en modelo no-global sin `tenantId` → rechaza (no corre crudo); `PostventaItem`/`Cuota`/`Venta*` se filtran vía el padre; test "tenant A no ve datos de tenant B" en verde |
| E1-03 | Sacar secretos del repo + secret management por entorno | 5 | P0 | 0 secretos en `docker-compose.yml`/git; JWT ≥32 bytes aleatorios; password Postgres fuerte |
| E1-04 | Eliminar `/api/debug` y `prisma-studio` del bundle de producción | 2 | P0 | `/api/debug/*` no existe en prod; `prisma-studio` solo en `compose.dev.yml` |
| E1-05 | Rate-limit dedicado en `/auth/login` + lockout por intentos | 3 | P0 | 5–10 intentos/min por IP+email; bloqueo temporal tras N fallos; test de fuerza bruta |
| E1-06 | Logout revoca refresh token + forgot/reset password | 5 | P0 | Logout marca `isRevoked=true`; reset con token de un uso y expiración |
| E1-07 | Quitar bypass `admin` en `authorize()` + base de RBAC por permiso | 3 | P1 | `admin` ya no es comodín; `super_admin` bypass explícito y auditado |

### 🔴 Épica E2 — Estabilización & Arquitectura

| ID | Historia | Pts | Prior. | Criterios de aceptación |
|---|---|---|---|---|
| E2-01 | Arreglar `createVenta` (`Venta.estado`) + test de integración real | 5 | P0 | `POST /ventas` crea venta+pagos+canje en transacción sin `PrismaClientValidationError`; test contra **DB real** (no mock) en verde |
| E2-02 | Unificar a **un solo cliente Prisma** con una cadena de extensiones | 8 | P0 | Un único `PrismaClient`/pool; `src/prisma/index.ts` eliminado; tenancy+softDelete+parentProtection en una sola extensión |
| E2-03 | Eliminar arquitectura muerta `src/modules/` (migrar lo vivo) | 8 | P0 | `src/modules/` borrado (~96 archivos); validaciones y sucursales migradas a la capa Clean; build en verde |
| E2-04 | Error handler único + jerarquía de excepciones (validación → 400) | 5 | P0 | Body inválido → **400** con detalle por campo (no 500); un solo formato de error |
| E2-05 | Contrato de respuesta único (envelope) vía middleware | 5 | P1 | Todas las respuestas 2xx = `{success,data,meta}`; front consume un solo shape |

### 🔴 Épica E3 — DevOps productivo

| ID | Historia | Pts | Prior. | Criterios |
|---|---|---|---|---|
| E3-01 | `prisma migrate deploy` + healthchecks + `depends_on: service_healthy` | 3 | P0 | Deploy aplica migraciones versionadas (no `db push`); backend espera DB lista |
| E3-02 | Dockerfile backend multi-stage + `npm ci` + usuario no-root | 3 | P1 | Imagen final sin devDeps ni fuente TS; corre como no-root |
| E3-03 | Reverse proxy (Traefik/nginx) + HTTPS/TLS (Let's Encrypt) | 5 | P0 | Todo bajo HTTPS; `:3000`/`:5432` no expuestos al host en prod |
| E3-04 | Backups automáticos Postgres + prueba de restore | 3 | P0 | `pg_dump` programado a almacenamiento externo; restore verificado |
| E3-05 | CI/CD (lint+test+build+deploy staging) + scripts `lint`/`test` | 5 | P1 | Cada PR corre lint+test; merge a `main` despliega a staging |
| E3-06 | Separación entornos dev/staging/prod + `.gitignore` raíz + sacar `.env` | 3 | P1 | `compose.dev/prod.yml`; `FrontConcesionaria/.env` fuera del tracking |

### 🟠 Épica E4 — Datos & Trazabilidad (R2)

| ID | Historia | Pts | Prior. |
|---|---|---|---|
| E4-01 | Soft-delete aplicado en relaciones `include`/`select` | 5 | P1 |
| E4-02 | Auditoría transversal (hook post-write) con actor / ip / userAgent / before-after | 8 | P1 |
| E4-03 | Login/logout audit + `AuditLog` append-only (sin `deletedAt`) | 3 | P1 |
| E4-04 | Índices compuestos `[concesionariaId, fecha]` + índices con `deletedAt` | 3 | P1 |
| E4-05 | `createdById` / `updatedById` / `deletedById` en entidades financieras | 5 | P2 |
| E4-06 | `CUIT` / `DNI` unique + obligatorios donde corresponde | 2 | P2 |

### 🟠 Épica E5 — Jobs & Performance (R2)

| ID | Historia | Pts | Prior. |
|---|---|---|---|
| E5-01 | Worker de vencimientos: cuotas / reservas / financiaciones / presupuestos | 5 | P1 |
| E5-02 | Clamp de `limit` de paginación + `compression` + tuning del pool pg | 3 | P1 |
| E5-03 | Caché de catálogos casi estáticos (roles, planes, categorías) | 3 | P2 |

### 🟠 Épica E6 — UX & Credibilidad (R2)

| ID | Historia | Pts | Prior. |
|---|---|---|---|
| E6-01 | Dashboard con datos reales (endpoints de KPI; nunca datos inventados) | 8 | P1 |
| E6-02 | Control de roles en la UI (`RequireRole` + ruta `/403`) | 3 | P1 |
| E6-03 | Arreglar el sistema de temas (contraste/legibilidad por defecto) | 5 | P1 |
| E6-04 | Formularios clave a `react-hook-form` + `zod`; quitar `alert()` nativos | 5 | P2 |
| E6-05 | Tablas responsive (scroll/vista card en mobile) + accesibilidad básica | 5 | P2 |

### 🟢 Épica E7 — Monetización (R3)

| ID | Historia | Pts | Prior. |
|---|---|---|---|
| E7-01 | Unificar y **proteger** el módulo de billing con auth (`super_admin`) | 3 | P1 |
| E7-02 | Integración MercadoPago Suscripciones (preapproval) + webhooks | 13 | P1 |
| E7-03 | Enforcement de límites de plan (`maxUsuarios`/`maxVehiculos`/`maxSucursales`) | 5 | P1 |
| E7-04 | `subscriptionGuard`: bloqueo por estado (`past_due`/`canceled`/trial vencido) | 3 | P1 |
| E7-05 | Generación automática de invoices por período (job) | 5 | P2 |
| E7-06 | Facturación electrónica AFIP/ARCA del propio SaaS | 13 | P2 |

### 🟢 Épica E8 — API Pro & Docs (R3)

| ID | Historia | Pts | Prior. |
|---|---|---|---|
| E8-01 | OpenAPI real (tsoa / zod-openapi) + versionado `/api/v1` efectivo | 5 | P2 |
| E8-02 | Paginación / filtros / sorting con whitelist estandarizados | 3 | P2 |

### 🟢 Épica E9 — Reportes & BI (R3)

| ID | Historia | Pts | Prior. |
|---|---|---|---|
| E9-01 | Reportes con `aggregate`/`groupBy` + KPIs del sector (días en stock, margen/unidad, mora) | 8 | P2 |
| E9-02 | Vistas materializadas / rollups mensuales por tenant | 5 | P2 |

### 🔵 Épica E10 — Top Regional (R4, backlog de alto nivel)

- Multipublicador (Mercado Libre + portales, stock sincronizado automáticamente).
- CRM omnicanal + agente IA en WhatsApp (calificación de leads, agenda 24/7).
- Módulo F&I (financiación + seguros dentro del deal, con comisiones).
- App móvil / PWA para el vendedor (alta de vehículo desde foto de patente).
- Self-checkout de planes (landing → pago → alta automática por webhook).
- Costeo real por vehículo completo (compra + acondicionamiento + gastos + impuestos → margen neto).

---

## 5. Plan de sprints

### Sprint 0 — Fundaciones (3–5 días)

**Objetivo:** dejar el andamiaje listo para ejecutar sin fricción.

- Configurar tablero (Jira / GitHub Projects / Trello) con estados y épicas cargadas.
- Definir DoR/DoD con el equipo. Setear repos, ramas (`main` / `develop` / `feature/*`), convención de PRs.
- CI skeleton (mínimo lint + build) y entorno **staging** funcionando.
- Refinement inicial del backlog P0; estimar Sprints 1–3.

### 🔴 Release 1 — Hardening & Estabilización (Sprints 1–3)

#### Sprint 1 · "Cerrar las puertas y arreglar el core" (~26 pts)
> **Sprint Goal:** *nadie accede sin login, no hay backdoors, y se puede registrar una venta.*

`E1-01` (8) · `E1-03` (5) · `E1-04` (2) · `E1-05` (3) · `E1-06` (5) · `E2-01` (5) → **28**

**Demo de Review:** intento de acceso sin token = 401; `/debug` caído; alta de venta end-to-end en verde.

#### Sprint 2 · "Una sola arquitectura" (~34 pts)
> **Sprint Goal:** *un solo árbol de código y un solo aislamiento de tenant, verificado con tests.*

`E2-02` (8) · `E2-03` (8) · `E1-02` (8) · `E2-04` (5) · `E2-05` (5) → **34**

**Review:** `src/modules/` eliminado; test "tenant A ≠ tenant B" en verde; validación devuelve 400.

#### Sprint 3 · "Producción de verdad" (~32 pts) → **entrega Release 1**
> **Sprint Goal:** *desplegable en producción de forma segura y reproducible.*

`E3-01` (3) · `E3-03` (5) · `E3-04` (3) · `E3-05` (5) · `E3-02` (3) · `E3-06` (3) · `E1-07` (3) · `E4-06` (2) · `E5-02` (3) → **33**

**Review:** deploy a staging con HTTPS + migraciones + backup probado; pipeline CI verde.

### 🟠 Release 2 — MVP vendible (Sprints 4–5)

#### Sprint 4 · "Trazabilidad y datos confiables" (~35 pts)
> **Goal:** *el sistema audita lo que mueve plata y los números no mienten.*

`E4-01` (5) · `E4-02` (8) · `E4-03` (3) · `E4-04` (3) · `E4-05` (5) · `E5-01` (5) · `E8-02` (3) · `E5-03` (3) → **35**

#### Sprint 5 · "Demo que cierra clientes" (~32 pts) → **entrega Release 2**
> **Goal:** *primera demo creíble frente a un dueño de concesionaria.*

`E6-01` (8) · `E6-02` (3) · `E6-03` (5) · `E6-04` (5) · `E6-05` (5) · `E7-01` (3) · buffer QA (3) → **32**

### 🟢 Release 3 — Producto profesional (Sprints 6–7)

#### Sprint 6 · "Cobrar solo — parte 1" (~34 pts)
> **Goal:** *el SaaS cobra suscripciones automáticamente y aplica límites de plan.*

Spike MercadoPago (3) · `E7-02` (13) · `E7-03` (5) · `E7-04` (3) · `E7-05` (5) · `E8-01` (5) → **34**

#### Sprint 7 · "Facturación + BI" (~34 pts) → **entrega Release 3**
> **Goal:** *facturación fiscal + reportes con KPIs del sector.*

`E7-06` (13) · `E9-01` (8) · `E9-02` (5) · pulido UX/a11y (5) · hardening/tests (3) → **34**

### 🔵 Release 4 — Top regional (Sprints 8+)

Se refina el backlog de la Épica E10 cuando R3 esté cerca de cerrar.

---

## 6. Definition of Ready / Definition of Done

### DoR — una historia entra al sprint solo si:
- Tiene criterios de aceptación claros y testeables (los escribe/valida el PO).
- Está estimada y entra en un sprint (si es > 13 pts, se parte).
- Dependencias identificadas; sin bloqueos abiertos.

### DoD — una historia está "Done" solo si:
- ✅ Código revisado (PR aprobado por otro dev).
- ✅ Tests unitarios **+ de integración** escritos y en verde.
  - **Gate obligatorio:** para toda historia de E1/E2, el test de **aislamiento multi-tenant** debe pasar.
- ✅ Lint sin errores; **sin `any` nuevos**.
- ✅ QA validó en **staging** contra los criterios de aceptación.
- ✅ OpenAPI / documentación actualizada si tocó la API.
- ✅ PO aceptó la historia en la Review.
- ✅ Desplegado a staging vía pipeline.

---

## 7. Ceremonias (sprint de 2 semanas)

| Ceremonia | Cuándo | Duración | Quiénes |
|---|---|---|---|
| Sprint Planning | Día 1 | 2–3 h | Todo el equipo |
| Daily Standup | Diario | 15 min | Devs + QA (SM facilita) |
| Backlog Refinement | Mitad de sprint | 1 h | PO + equipo |
| Sprint Review (demo) | Último día | 1 h | Equipo + stakeholders |
| Retrospectiva | Último día | 1 h | Equipo |

---

## 8. Métricas y tablero

**Estados del board:**
`Backlog → Ready (cumple DoR) → In Progress → In Review (PR) → QA/Testing → Done (cumple DoD)`
Límite WIP recomendado: 2 por dev.

**Métricas a seguir:**
- **Velocity** por sprint (para ajustar el compromiso).
- **Sprint burndown** + **Release burnup**.
- **% de P0 cerrados** (KPI estrella de Release 1).
- **Escaped defects** (bugs en prod vs staging).
- **Cobertura de tests sobre aislamiento de tenant** (no puede bajar).

---

## 9. Gestión de riesgos

| Riesgo | Mitigación |
|---|---|
| La unificación de arquitectura rompe features | Migrar módulo por módulo, mantener el test de tenant siempre en verde antes de borrar la capa muerta |
| Regresión de aislamiento multi-tenant | Test de integración "tenant A ≠ tenant B" como **gate de DoD** en E1/E2 |
| MercadoPago con incógnitas técnicas | **Spike** de 3 pts en Sprint 6 antes de comprometer la integración |
| Scope creep (meter features en Etapa 1) | El SM protege el Sprint Goal; nada nuevo entra sin pasar por el PO |
| `createVenta` oculto por mocks | Regla: toda lógica financiera lleva test de integración contra DB real |

---

## 10. Cómo arrancar

1. **Hoy:** el PO carga estas épicas/historias en el tablero y confirma la prioridad P0.
2. **Sprint 0 (esta semana):** setup de tablero + CI + staging + DoR/DoD.
3. **Sprint 1:** foco absoluto en *cerrar las puertas*. Ninguna feature nueva.
4. **Primera historia recomendada:** `E2-01` (arreglar `createVenta` + test) — rápida y desbloquea el core.

---

## Anexo: mapa de hallazgos de la auditoría

Referencia rápida de los hallazgos verificados que originan cada épica (evidencia = archivo:línea sobre el código real).

| Épica | Hallazgo verificado | Severidad | Evidencia clave |
|---|---|---|---|
| E1 | Rutas públicas + contexto *fail-open* → acceso cross-tenant sin login | Crítico | `venta.routes.ts:6-9`, `context.middleware.ts:12-26` |
| E1 | Secretos JWT + password Postgres hardcodeados en el repo | Crítico | `docker-compose.yml:29-30` |
| E1 | `/api/debug` con `$queryRaw` (emails, todas las concesionarias, stack traces) | Crítico | `routes/index.ts:38`, `debug.routes.ts:47-102` |
| E1 | IDOR en sub-entidades sin `concesionariaId` propio | Crítico | `PrismaPostventaItemRepository.ts:14-26` |
| E2 | `createVenta` roto en runtime (`Venta.estado` no existe) | Crítico | `venta.service.ts:66` vs `schema.prisma:504-544` |
| E2 | Dos arquitecturas conviviendo (~96 archivos muertos) | Alto | `routes/index.ts:4`, `src/modules/*` |
| E2 | Dos clientes Prisma con tenancy divergente | Crítico | `infrastructure/database/prisma.ts:8`, `src/prisma/index.ts:11` |
| E2 | Contrato de respuesta inconsistente (3 formas en runtime) | Alto | `VehiculoController.ts:21` vs `sucursal.controller.ts:35` |
| E2 | Validación devuelve 500 en vez de 400 | Alto | `error.middleware.ts:19-34`, `validate.ts:15` |
| E3 | `prisma db push` en prod ignorando migraciones existentes | Crítico | `docker-compose.yml:34` |
| E3 | `prisma-studio` expuesto sin auth en `:5555` | Crítico | `docker-compose.yml:38-50` |
| E3 | Sin healthchecks, HTTPS, backups, CI/CD | Alto | `docker-compose.yml`, `Dockerfile` |
| E4 | Soft-delete no filtra `include` → reportes/plata contaminados | Alto | `softDelete.ts:20-35`, `venta.service.ts:37-52` |
| E4 | Auditoría de negocio es código muerto (solo audita sucursales) | Crítico (trazabilidad) | `routes/index.ts:45`, `modules/*.controller.ts` |
| E5 | Cero jobs → vencimientos de cuotas/reservas nunca se ejecutan | Alto | grep `cron/setInterval` = 0 |
| E6 | Dashboard con datos inventados + tema roto + sin roles en UI | Alto | `DashboardPage.tsx:10-13`, `App.tsx:46-96` |
| E7 | Billing montado sin auth; sin pasarela; límites no se aplican | Crítico | `interface/routes/billing.routes.ts`, `billing.service.ts:107-138` |

---

*Documento generado a partir de la auditoría técnica + comercial (comité de 11 especialistas + verificación adversarial sobre el código real). Actualizar el backlog y las estimaciones en cada Refinement.*
