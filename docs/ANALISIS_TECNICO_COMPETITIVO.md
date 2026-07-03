# Análisis técnico-competitivo — SaaS de gestión de concesionaria

> **Fecha:** 2026-07-03
> **Alcance:** auditoría integral del backend Node.js, base de datos, seguridad, DevOps, performance, frontend/UX + análisis competitivo real del mercado (Mendoza / Argentina / LatAm).
> **Método:** lectura directa del código (`BackConcesionaria/`, `FrontConcesionaria/`, `docker-compose*.yml`, `schema.prisma`) por un comité de agentes especializados + investigación web de competidores.
> **Documento hermano:** [`PLAN_SCRUM.md`](./PLAN_SCRUM.md) (plan de saneamiento). Este informe amplía y prioriza aquel plan con foco competitivo y de producto.

---

## 1. Resumen ejecutivo

El sistema es un **SaaS multi-tenant de gestión integral de concesionaria de autos** (stock, clientes, presupuestos, ventas, financiación propia y externa, cobranzas, gastos, posventa, auditoría y billing de suscripción), con backend **Express 5 + TypeScript estricto + Prisma/PostgreSQL** y frontend **React 19 + Vite + TanStack Query**, desplegado con Docker sobre una Raspberry Pi detrás de Cloudflare Tunnel.

**Veredicto general: es un MVP avanzado con muy buenos cimientos, pero todavía NO es un producto vendible a escala.** Estimo que está en **~65-70% del camino** hacia un SaaS profesional regional.

Lo que ya juega en primera:
- **Arquitectura limpia (Clean Architecture / DDD)** en el 96% de las rutas, bien nombrada y con capas separadas.
- **Aislamiento multi-tenant "fail-closed"** vía extensión de Prisma + `AsyncLocalStorage` — es la decisión técnica más valiosa del proyecto y lo que te diferencia de muchos competidores PyME.
- **Modelo de datos serio**: 38 entidades, `Decimal(12,2)` para dinero, soft-delete, enums exhaustivos, migraciones versionadas.
- **Frontend con identidad visual propia** (design system, dark mode) y flujos coherentes.

Lo que hoy **impide venderlo con confianza**:
1. **~10 tablas "hoja" sin `concesionariaId`** → riesgo de fuga cross-tenant por IDOR en subentidades.
2. **`GET /api/concesionarias/:id` sin autorización** → enumeración de datos de otros clientes.
3. **Sin validación de entrada (DTO/Zod) en los controllers nuevos** → basura entra a la DB, superficie de ataque.
4. **Cobertura de tests <10%** → no se puede refactorizar ni escalar con confianza.
5. **Sin capa de reporting/BI** (el objetivo declarado del producto): sin tablas de hechos, sin snapshots, dashboard que trae *todos* los registros para contar.
6. **DevOps a medio camino**: Dockerfile backend sin multi-stage y como root, Postgres expuesto en el compose, sin CI/CD, observabilidad pobre.
7. **Gaps de producto** para competir en Argentina: sin integración con MercadoLibre/portales, sin cotización por patente, sin facturación fiscal (AFIP/ARCA), sin WhatsApp.

La buena noticia: **ninguno de estos problemas es estructural**. Los cimientos (multi-tenancy, capas, modelo de datos) están bien; lo que falta es *hardening*, *cobertura* y *features de mercado*. Con 3-4 sprints enfocados pasás de "proyecto interno sólido" a "MVP vendible".

---

## 2. Descripción del sistema analizado

| Capa | Tecnología | Estado |
|---|---|---|
| Backend | Express **5.2.1**, TypeScript **5.9.3** (`strict: true`), Node 22, CommonJS | Activo |
| ORM / DB | Prisma + PostgreSQL 16, **38 modelos** (`schema.prisma`, 372 líneas) | Activo |
| Frontend | React **19**, Vite **7**, TanStack Query **v5**, Zustand, React Router 7, react-hook-form | Activo |
| Estilos | Design system propio en CSS (variables, dark mode) — sin MUI/Tailwind/shadcn | Activo |
| Infra | Docker + docker-compose (`base` / `dev` / `prod`), Postgres, backups programados | Activo |
| Deploy | Raspberry Pi (arm64) + **Cloudflare Tunnel** (TLS en el edge) | Producción informal |

**Módulos funcionales (26 recursos):** concesionarias, sucursales, usuarios, roles, clientes, proveedores, vehículos, vehículo-archivos, movimientos, ingresos, reservas, presupuestos, ventas, gastos (+ categorías), gastos fijos (+ categorías), posventa (casos + ítems), financieras, financiaciones, solicitudes de financiación, auditoría, billing.

**Dominio de negocio cubierto:** ciclo completo compra→preparación→publicación→reserva→presupuesto→venta→entrega, con canje/permuta, financiación propia (cuotas + cobranzas) y externa (solicitudes a financieras), gastos por vehículo y fijos, y posventa. Es un **alcance funcional amplio y realista** para una agencia/concesionaria.

---

## 3. Nivel actual del sistema y del backend Node.js

Puntajes por dimensión (1-10), consolidados de la auditoría:

| Dimensión | Nota | Comentario |
|---|:--:|---|
| Arquitectura backend | **7** | Clean Architecture buena; lastre de arquitectura legacy y DI hardcodeada |
| Modelo de datos (Prisma/PG) | **7** | Sólido en tipos y relaciones; huecos de tenant y de reporting |
| Seguridad | **6** | Multi-tenant fail-closed excelente; faltan authz granular, validación y gestión de secretos |
| API REST | **6** | Convenciones correctas; sin versionado, envelope inconsistente, Swagger desactualizado |
| Testing | **2** | Setup correcto pero cobertura <10% — **bloqueante** |
| DevOps / Docker | **4** | Compose funcional; Dockerfile inseguro, sin CI/CD, observabilidad pobre |
| Performance / escalabilidad | **5** | Base OK; sin cache/colas/jobs, dashboard ineficiente, uploads sin control |
| Frontend / UX | **8** | Profesional y coherente; falta a11y, validación cliente y pulido enterprise |
| Preparación BI / reportes | **3** | El objetivo del producto está **sin fundaciones** en la DB |
| **Global ponderado** | **~5.5** | **MVP avanzado, pre-producto** |

**Traducción comercial:** hoy podés hacer demos y onboardear 5-20 clientes tolerantes. Para vender con SLA, cobrar en serio y soportar 100+ concesionarias necesitás cerrar los bloqueantes de las secciones 6, 10, 13 y 14.

---

## 4. Comparativa con la competencia (mercado real)

Investigación web de competidores reales en Argentina/LatAm/España. El mercado se divide en **dos ligas** y tu producto hoy apunta a la segunda.

### Liga A — Incumbentes enterprise (concesionarios oficiales / importadoras)

| Producto | Región | Cliente | Fortalezas | Debilidad / tu oportunidad |
|---|---|---|---|---|
| **Autologica Sky DMS** | Rosario 🇦🇷, 20+ países | Oficiales, multimarca | 30+ años, cloud, multi-empresa/sucursal, KPIs + IA nativa, interfaces OEM, posventa/repuestos/taller | Caro, pesado, orientado a redes grandes; overkill y lento de implementar para una agencia PyME |
| **Oversoft** | 🇦🇷 | Oficiales + importadoras | Procesa "6 de cada 10 autos 0KM" de Argentina; contable/impositivo fuerte | Legacy, no self-serve, no apunta a usados/agencias chicas |

> No competís de frente con estos **todavía**. Son tu "norte" técnico (multi-sucursal, KPIs, posventa) pero no tu campo de batalla comercial inicial.

### Liga B — PyME / agencias / usados (**tu competencia real**)

| Producto | Región | Fortalezas | Debilidades | Qué aprender / diferenciar |
|---|---|---|---|---|
| **deConcesionarias** | 🇦🇷 | **Certificado por MercadoLibre**, 90+ agencias, 82.300 autos gestionados, 32.700 ventas/año, **cotización por patente**, multipublicación en +10 portales, CRM omnicanal (ML/WhatsApp/IG en un inbox), **WhatsApp Business con IA** | Sin precios públicos; foco comercial/CRM más que en back-office contable/financiación | Es el rival a batir en Argentina. Su fuerte es *captación y publicación*. Tu oportunidad: **back-office financiero + cobranzas + multi-sucursal** que ellos cubren menos |
| **AutoSite** | 🇦🇷 | New/usados/planes de ahorro, taller, repuestos, contabilidad integrada | Producto más tradicional, UX legacy | Cubren contabilidad; vos ganás en UX moderna y multi-tenant real |
| **AutoGestión CRM (SOTE)** | 🇦🇷 | CRM+ERP unificado (leads, ventas, stock, docs, finanzas) | Menos conocido, alcance medio | Referencia de "sistema operativo único" para la agencia |
| **Octosis DMS** | 🇦🇷 | Administrativo-contable + integración WhatsApp | UX/stack más antiguo | WhatsApp como canal es tabla-stakes |
| **Dealcar** | 🇪🇸 (referencia de modelo) | 750+ concesionarios, **self-serve**, **precios públicos**, agentes de IA, REBU, multipublicación, sin permanencia | Mercado España (portales/impuestos distintos) | **Modelo comercial a copiar**: pricing transparente por tramos + onboarding en 24 h |

**Pricing de referencia (Dealcar, único con precios públicos):**
- Básico **€99,90/mes** — 35 vehículos, 2 usuarios
- Estándar **€129,90/mes** — 75 vehículos, 3 usuarios (roles/permisos, multi-sociedad, tasación)
- Profesional **€159,90/mes** — 100 vehículos, 5 usuarios (API, stock compartido, soporte premium)
- +150 € de implementación · 10% dto. anual · sin permanencia

**Lectura estratégica:** en Argentina el ganador PyME (deConcesionarias) compite por **captación de leads + publicación + CRM**. Tu arquitectura está mejor preparada para el **back-office operativo-financiero real** (financiación propia con cuotas, cobranzas, multi-sucursal, gastos por unidad, auditoría). Esa es tu **cuña de diferenciación**: "el back-office serio que tu CRM no te da". Pero para entrar necesitás paridad mínima en captación (MercadoLibre + WhatsApp), o te ven como "solo administración".

---

## 5. Fortalezas, debilidades y diferenciación

### Fortalezas principales
1. **Multi-tenancy fail-closed real** (extensión Prisma + contexto async): sin tenant en contexto, la query se **bloquea**. Está testeado (`tenant-isolation.db.test.ts`). Muchos competidores PyME no tienen aislamiento a este nivel.
2. **Clean Architecture / DDD** bien aplicada (dominio, aplicación, infraestructura, interfaz) con nombres claros.
3. **Modelo de datos maduro**: `Decimal` para dinero, soft-delete, enums de estado exhaustivos, migraciones versionadas (`migrate deploy`), tabla `AuditLog`.
4. **Alcance funcional amplio** que cubre el ciclo completo, incluyendo **financiación propia + cobranzas** (esto es diferencial: muchos CRMs no lo tienen).
5. **Frontend profesional** con design system propio, dark mode y TanStack Query bien usado.
6. **Billing de suscripción ya modelado** (Plan, Subscription, Invoice, Payment) — infraestructura SaaS pensada desde el diseño.

### Debilidades principales
1. **Tests casi inexistentes** (<10%) — el mayor bloqueante para crecer.
2. **Validación de entrada ausente** en la arquitectura nueva (controllers reciben `req.body` crudo).
3. **Fugas potenciales cross-tenant** en ~10 subentidades sin `concesionariaId` + `GET concesionarias/:id` sin authz.
4. **Sin fundaciones de BI/reporting** — contradice el objetivo declarado del producto.
5. **DevOps no productivo** (Dockerfile inseguro, DB expuesta, sin CI/CD, sin observabilidad).
6. **Deuda de doble arquitectura** (legacy `modules/` conviviendo).
7. **Sin features de captación** (MercadoLibre, WhatsApp, cotización por patente) que el mercado argentino da por sentadas.

### Oportunidades de diferenciación (tu narrativa de venta)
- **"Back-office financiero de verdad"**: financiación propia con plan de cuotas, cobranzas, mora y refinanciación — donde los CRM de captación son débiles.
- **Multi-tenant/multi-sucursal serio** desde el día uno, con aislamiento probado → apto para **grupos con varias bocas** y para revender como white-label.
- **Trazabilidad y auditoría por diseño** → argumento fuerte para clientes que quieren control interno (fraude, arqueos, comisiones).
- **UX moderna** frente a incumbentes legacy (AutoSite/Octosis/Oversoft).
- **Precio transparente y self-serve** (modelo Dealcar) frente a deConcesionarias que oculta precios.

---

## 6. Riesgos (técnicos, de seguridad, de producto)

### Riesgos técnicos
| Riesgo | Impacto | Prioridad |
|---|---|---|
| Cobertura de tests <10% | No podés refactorizar/escalar sin romper | 🔴 Alta |
| DI hardcodeada en controllers (`new PrismaXRepository()`) | Imposible mockear; tests frágiles | 🔴 Alta |
| Doble arquitectura (legacy `modules/` viva en sucursales) | Inconsistencia, riesgo de seguridad al agregar rutas legacy sin fail-closed | 🟠 Media |
| Sin capa BI (fact tables/snapshots) | Reportes lentos, dashboards que no escalan | 🟠 Media |
| Sin jobs/colas ni cache (Redis) | Operaciones síncronas, no escala a volumen | 🟠 Media |

### Riesgos de seguridad (detalle en §10)
| Riesgo | Severidad |
|---|:--:|
| `GET /api/concesionarias/:id` sin authz → enumeración de tenants | 🔴 Crítico |
| Tokens (access+refresh) en `localStorage` → robo vía XSS | 🔴 Crítico |
| ~10 subentidades sin `concesionariaId` → IDOR cross-tenant | 🔴 Crítico |
| Mass assignment en `CreateUsuario` (`data: any`) → escalada de privilegios | 🟠 Alto |
| Sin rate-limit específico de login ni bloqueo de cuenta | 🟠 Alto |
| Sin recuperación de contraseña ni verificación de email | 🟠 Alto |
| `.env` con secretos + `POSTGRES_PASSWORD=postgres` | 🟡 Medio |
| Sin validación de DTOs en controllers | 🟡 Medio |

### Riesgos de producto
- **Paridad de mercado**: sin MercadoLibre/portales ni WhatsApp, en Argentina te comparan de menos frente a deConcesionarias.
- **Facturación fiscal (AFIP/ARCA)**: sin comprobantes electrónicos legales, la venta no cierra el circuito administrativo real → objeción de compra dura.
- **Reporting**: prometés "tableros e indicadores" pero la DB no está preparada; si demostrás dashboards que tardan, perdés credibilidad.
- **Soporte/SLA**: correr en una Raspberry Pi sin observabilidad ni backups probados es un riesgo de continuidad que un cliente que paga no tolera.

---

## 7. Análisis de arquitectura Node.js

**Framework:** Express 5 + TS estricto. Decisión pragmática y correcta para el tamaño del equipo. **No migrar a NestJS** salvo que sumes equipo — el ROI está en *arreglar Express con librerías*, no en reescribir.

**Estructura (arquitectura nueva, activa en ~96% de rutas):**
```
domain/          entidades, interfaces de repos, excepciones tipadas (BaseException)
application/     use-cases (Create*/Get*/Update*/Delete*)  ← lógica de negocio
infrastructure/  prisma.extension.ts (multi-tenant), audit.extension.ts, JwtTokenService, context.ts, logger
interface/       controllers, routes, middlewares (context/auth/authorize/error)
```

**Lo que está bien:**
- Separación de capas real y agnóstica del dominio.
- Multi-tenancy centralizado en `infrastructure/database/prisma.extension.ts` + `security/context.ts` (`AsyncLocalStorage`) — **fail-closed**.
- Manejo de errores **centralizado** (`error.middleware.ts`) con `correlationId` y mapeo de errores Prisma (P2002).
- Validación de env con **Zod fail-fast** (`config/env.ts`), CORS tipado por allowlist.
- Nombres consistentes y legibles.

**Lo que está mal / riesgoso:**
- **DTOs inexistentes** (`application/dtos/` vacío): controllers pasan `req.body` crudo al use-case. Sin mapeo de entrada/salida ⇒ sin validación ni control de qué campos entran/salen.
- **DI hardcodeada**: cada controller hace `new PrismaXRepository()` en el constructor ⇒ no se puede inyectar un mock ⇒ tests imposibles sin DB real.
- **Doble arquitectura**: `modules/` (MVC legacy, 4.057 LOC) sigue montado para `sucursales`, con multi-tenancy por checks manuales (`requireSameTenant`) en vez de fail-closed. Riesgo: alguien agrega una ruta legacy sin aislamiento y filtra datos.
- **Envelope de respuesta inconsistente**: unos endpoints devuelven `{ success, data, meta }` (via `ApiResponse.success`) y otros el objeto crudo.
- **Validación dual de env** (`config/env.ts` Zod + `config/index.ts` manual): redundante.

**Refactors urgentes (0-4 semanas):**
1. **DI con `awilix` o `tsyringe`** → controllers reciben dependencias inyectadas. Habilita testing.
2. **Validación con Zod por use-case/route** (schema de entrada) → cierra el hueco de seguridad y de datos.
3. **DTOs de salida** → controlás qué se serializa (evita filtrar `passwordHash` u otros campos).
4. **Matar la arquitectura legacy**: migrar `sucursales` a `interface/` y borrar `modules/`, `middlewares/` legacy y `tenancy.ts` (marcado obsoleto).
5. **Unificar el envelope de respuesta** en todos los controllers.

---

## 8. Análisis de API REST

**Bien:** recursos en plural, verbos correctos (GET/POST/PATCH/DELETE), `201 Created`, `204 No Content`, `400/401/403/404`, paginación (`limit`/`page`/`sortBy`/`sortOrder`, defaults sensatos), búsqueda case-insensitive, formato de error con código + `correlationId`.

**Mal / falta:**
- **Sin versionado**: base path `/api`, no `/api/v1`. Cualquier cambio rompe clientes. **Prioridad antes de tener clientes externos consumiendo la API.**
- **Swagger/OpenAPI desactualizado**: existe `config/swagger.ts` sirviendo `/api-docs`, pero apunta a `./src/modules/**` (legacy) y no hay JSDoc → doc incompleta.
- **Envelope inconsistente** (ver §7).
- **Faltan `409 Conflict`, `422 Unprocessable Entity`, `429 Too Many Requests`** explícitos.
- **`limit` sin tope**: `?limit=100000` puede tumbar la API. Validar máximo (p.ej. 100).
- **Health duplicado**: `/health` (app.ts) y `/api/health` (routes) con formatos distintos.
- Fechas ISO8601 **sin timezone** explícito.

**Acciones:** versionar en `/api/v1`; regenerar Swagger contra la arquitectura nueva (o usar `zod-to-openapi` desde los schemas Zod, matando la doble fuente); topar `limit`; homogeneizar envelope y códigos.

---

## 9. Análisis de Prisma y PostgreSQL

**38 modelos** (14 maestras + ~24 transaccionales). **Fortalezas:** `Decimal(12,2)` para todo lo monetario (¡bien, no `Float`!), `createdAt`/`updatedAt`/`deletedAt` (soft-delete), enums de estado exhaustivos, unique compuestos correctos en las tablas raíz (`[concesionariaId, email]`, `[concesionariaId, vin]`, etc.), migraciones versionadas.

### 🔴 Problema crítico: subentidades sin `concesionariaId`
Estas tablas **hoja** no llevan la columna de tenant (heredan el tenant sólo por su padre). Si un query las toca por su propio `id` sin joinear al padre, **no hay barrera de aislamiento**:

`VehiculoArchivo`, `PresupuestoItem`, `PresupuestoExtra`, `VentaExtra`, `VentaPago`, `VentaCanjeVehiculo`, `Cuota`, `PagoCuota`, `PostventaItem`, `SolicitudFinanciacionArchivo`.

> **Verificar** cuáles ya están cubiertas por la extensión fail-closed (que actúa sobre modelos con `concesionariaId`). Las que no la tengan quedan **fuera** del escudo automático. El test `subentity-idor.db.test.ts` ya existe — extenderlo a todas estas tablas.

**Fix:** agregar `concesionariaId` + FK + `@@index([concesionariaId])` a las 10 tablas, y asegurar que la extensión de Prisma las cubra.

### 🟠 Otros hallazgos de modelo
- **Faltan unique de negocio:** `Cliente @@unique([concesionariaId, dni])`, `Proveedor @@unique([concesionariaId, nombre])`. Hoy podés duplicar clientes/proveedores.
- **Índices de Cliente no scopeados por tenant:** `@@index([dni])`, `@@index([telefono])` deberían ser `[concesionariaId, dni]` / `[concesionariaId, telefono]`.
- **Sin `createdBy`/`updatedBy`/`deletedBy`** en entidades críticas (Venta, Presupuesto, Financiacion, Cuota…) → no sabés *quién* hizo cada cambio a nivel fila.
- **Sin historial de transiciones de estado**: presupuesto/venta/reserva/financiación/cuota tienen `estado` pero no se registra el cambio. Falta tabla `EstadoHistorial(entidadTipo, entidadId, estadoAnterior, estadoNuevo, motivo, cambiadoPor, createdAt)`.
- **`AuditLog` sin before/after estructurado**: `detalle` es string libre. Para compliance querés JSON `{ campo: {antes, después} }`.
- **Strings sin `@db.VarChar(n)`**: no crítico en PG, pero conviene acotar `email`/`dni`/`nombre`.

### 🔴 Preparación para reportes/BI (hoy insuficiente)
El producto promete "tableros, indicadores, métricas". La DB **no tiene fundaciones**:
- Sin **tablas de hechos** (`VentaFact`, `CuotaFact`) con márgenes/gastos precomputados.
- Sin **snapshots diarios** (`DailySnapshot`: stock, ventas, cobranzas, márgenes por día) → no podés graficar "evolución" sin recalcular todo.
- Sin campos denormalizados de agregación (`mes`, `año`, `margenBruto` en `Venta`).

**Índices a agregar para reportes** (compuestos por tenant + fecha/estado): `Venta[concesionariaId, fechaVenta]`, `Cuota[concesionariaId, estado, vencimiento]`, `GastoVehiculo[concesionariaId, fecha]`, `IngresoVehiculo[concesionariaId, fechaIngreso]`, `PostventaCaso[concesionariaId, estado]`, `AuditLog[concesionariaId, createdAt]`, `RefreshToken[usuarioId]`/`[expiresAt]`.

---

## 10. Análisis de seguridad

### Controles ya implementados (bien)
JWT firmado con secretos de env (access 15m / refresh 7d + rotación), **bcrypt (rounds 10)**, **multi-tenant fail-closed**, CORS por allowlist (no `*`), **Helmet**, hook de **auditoría transversal** que redacta `passwordHash`/`token`, Winston con correlationId, rate-limit global.

### Hallazgos (ordenados por severidad)

| # | Sev. | Hallazgo | Ubicación | Fix |
|:--:|:--:|---|---|---|
| 1 | 🔴 | `GET /api/concesionarias/:id` sin `authorize` → cualquier usuario enumera tenants (nombre, CUIT, email, dirección) | `interface/routes/concesionaria.routes.ts` | Scopear a la propia concesionaria; sólo `super_admin` ve ajenas |
| 2 | 🔴 | Access+refresh tokens en `localStorage` → robo por XSS | `FrontConcesionaria/src/store/authStore.ts` | Mover a cookies `httpOnly`+`Secure`+`SameSite`; `credentials:true` en CORS |
| 3 | 🔴 | ~10 subentidades sin `concesionariaId` → IDOR cross-tenant (ver §9) | `schema.prisma` | Agregar tenant + cubrir con extensión + tests IDOR |
| 4 | 🟠 | Mass assignment en `CreateUsuario/UpdateUsuario` (`data: any`) → set de `roles`/`activo`/`sucursalId` desde el body | `application/use-cases/usuarios/CreateUsuario.ts` | Zod con allowlist de campos; fijar `roles`/`activo` en lógica |
| 5 | 🟠 | Rate-limit sólo global (100/15min); sin límite específico de login ni bloqueo de cuenta | `app.ts` | `loginLimiter` (5/15min, `skipSuccessful`) + lockout + auditar intentos fallidos |
| 6 | 🟠 | Sin recuperación de contraseña ni verificación de email | (no existe) | Endpoints `forgot-password`/`reset-password` con token hash 1h + email |
| 7 | 🟡 | `.env` con secretos reales y `POSTGRES_PASSWORD=postgres` | raíz del repo | Rotar secretos, password fuerte, secrets manager en prod |
| 8 | 🟡 | Sin validación de DTOs en controllers (garbage-in) | controllers | Zod por endpoint |
| 9 | 🟡 | Stack trace condicionado a `NODE_ENV` (riesgo si default mal seteado) | `error.middleware.ts` | Nunca stack al cliente; sólo a logs |

> **Nota:** existe un `debug.routes.ts` en el backend (mencionado en el plan de saneamiento como P0 `/debug`). **Confirmar que esté deshabilitado/protegido en producción** — un endpoint de debug expuesto es crítico.

**Faltantes de madurez (roadmap):** 2FA/MFA para `admin`/`super_admin`, verificación de email en alta, whitelisting de IP para `super_admin`, política de contraseñas, WAF en el edge (Cloudflare ya ayuda).

---

## 11. Análisis de roles y permisos

**Modelo actual:** enum `RolNombre` (`admin`, `vendedor`, `cobrador`, `postventa`, `lectura`, `super_admin`) + `UsuarioRol` (N:M). La autorización es **por rol string** vía `authorize('super_admin')` a nivel ruta.

**Limitaciones:**
- **Sin permisos por acción/módulo finos**: no podés expresar "vendedor puede crear venta pero no ver márgenes/gastos".
- **Sin permisos a nivel fila**: un vendedor ve *todas* las ventas, no sólo las suyas; no hay noción de "área"/cartera.
- **Roles globales** (el enum no es por-tenant): OK si todos los tenants comparten el set, pero impide roles personalizados por cliente (feature vendible en plan enterprise).
- **Sin Row-Level Security de PostgreSQL** (el aislamiento vive sólo en la app).

**Modelo profesional recomendado:** tablas `Permission(entidad, accion)` + `RolPermission` + (opcional) `UsuarioAreaAsignacion(area, sucursalId, canViewAll)`, con chequeo declarativo `can('venta:read:own')`. RLS de Postgres como segunda barrera (defensa en profundidad) para el multi-tenant.

---

## 12. Análisis de logs, auditoría y trazabilidad

**Hoy:** Winston (`logs/error.log`, `logs/all.log`) + `correlationId`; tabla `AuditLog` con `usuario`, `entidad`, `entidadId`, `accion` (enum: create/update/cancel/delete_soft/login/logout), `ip`, `userAgent`; hook de auditoría automático que redacta secretos. **Es una base por encima del promedio PyME.**

**Gaps:**
1. **`detalle` no estructurado** → no hay diff antes/después. Migrar a JSON `{campo:{antes,después}}`.
2. **Sin historial de transiciones de estado** (tabla `EstadoHistorial`, ver §9).
3. **Sin `createdBy`/`updatedBy` a nivel fila** en entidades críticas.
4. **Logs se pierden en `docker down`** (no hay volumen persistente ni agregación central).
5. **`console.log` residual** en el código legacy (`sucursal.controller.ts`).

**Propuesta de eventos a auditar sí o sí:** login/logout, fallos de login, cambios de rol/permiso, creación/cancelación de venta, cambios de precio, registro de pagos/cobranzas, bajas lógicas, cambios de estado de financiación/cuota. Esto es **argumento de venta** (control interno, anti-fraude).

---

## 13. Análisis DevOps y Docker

**Bien:** compose con servicios separados (`db`/`backend`/`frontend`), volumen persistente de Postgres, healthchecks (`pg_isready`, HTTP), `depends_on: service_healthy`, `migrate deploy` (no `db push`), overrides `dev`/`prod`, **backups diarios con retención** en `prod` (`prodrigestivill/postgres-backup-local`, 7d/4w/6m), Dockerfile **frontend** multi-stage correcto.

**Mal / bloqueante para producción:**
- **Dockerfile backend NO multi-stage y corre como root**: imagen gorda con devDeps, `npm install` (no `npm ci`), `COPY . .` que rompe la caché. **Reescribir** (usar el patrón del frontend: builder → runtime slim + `USER node`).
- **Postgres expuesto** (`5432:5432`) en el compose → accesible desde afuera. **Quitar el port mapping** (el backend conecta por red interna).
- **Sin CI/CD** (`.github/workflows` inexistente): sin lint/test/build/scan automáticos.
- **Observabilidad pobre**: logs locales que se pierden, sin métricas (Prometheus), sin traces, sin alertas (¿y si falla un backup?).
- **Backups en el mismo host** (la Pi): si se quema la Pi, se van los backups. **Replicar off-site** (S3/rclone) y **probar el restore**.
- **Sin staging**, sin rollback definido, sin imágenes tagueadas por commit.
- **Seeders nunca corren** en compose (¿cómo se crean datos iniciales del tenant?).

> **Matiz importante:** en producción el TLS/HTTPS lo resuelve **Cloudflare Tunnel** (cloudflared) en el edge, así que el "sin HTTPS" del compose está mitigado. Pero eso **no está documentado en el repo** y el tráfico interno Pi↔servicios es HTTP plano; conviene documentarlo en `DEPLOY.md` y no depender de un único punto.

**Checklist mínimo para "productivo":** Dockerfile backend seguro · DB no expuesta · CI (lint+test+build+`trivy`) · logs persistentes/centralizados · backup off-site + restore test · staging · imágenes versionadas.

---

## 14. Análisis de performance

- **Dashboard ineficiente (🔴):** `useDashboard` hace 4 `getAll()` que **traen todos los registros** sólo para leer `totalResults`. Con 10k ventas/clientes transferís todo en cada carga. **Fix:** endpoint `/dashboard/stats` con `count`/agregación server-side (o `_count`).
- **Sin lazy-loading de rutas (🟠):** las 23 páginas van al bundle inicial (~250-300 KB gzip estimado). **Fix:** `React.lazy` + `Suspense` por ruta.
- **Uploads sin control (🔴 para producción):** `vehiculo-archivos` sin límite de tamaño, sin validación MIME, sin streaming, sin compresión, posiblemente guardando en DB. **Fix:** `multer` (límite + filtro MIME) + `sharp` (resize/compress) + storage externo (S3/MinIO), guardando sólo URL/metadata.
- **Sin jobs/colas ni Redis (🟠):** todo es síncrono (emails, reportes, limpieza de tokens). **Fix:** BullMQ + Redis para background jobs; Redis además para cache y rate-limit distribuido.
- **Pool de Postgres por defecto (max ~10)** para multi-tenant: subir a ~20-30 con timeouts explícitos.
- **N+1 potencial** en listados que incluyen relaciones completas: usar `select` de campos en vez de `include` masivo.
- **Sin cache HTTP** (ETag/Cache-Control) en GETs estables; `staleTime` de TanStack Query muy corto (30-120s) — subir a 5 min en datos estables.

---

## 15. Mejoras UX/UI

**Estado:** frontend **profesional y vendible a PyME** (8/10). Design system propio, dark mode, `DataTable` con skeleton/empty/paginación, toasts, rutas protegidas, formularios con react-hook-form.

**Faltantes para nivel producto:**
- **Validación en cliente con Zod** (hoy sólo react-hook-form sin schema) → feedback inmediato en formularios.
- **Accesibilidad (a11y):** faltan ARIA, navegación por teclado en tablas, `role="dialog"` en modales, contraste. (Importante para sector público/licitaciones.)
- **Tablas:** sin *sort*, *export CSV/Excel*, ni *bulk actions* → tareas frecuentes lentas.
- **Gráficos reales:** hoy el dashboard usa gráficos "simulados" → integrar Recharts/Chart.js con datos reales (cuando exista la capa BI).
- **`Select` sin búsqueda** → dolor con muchos vehículos/clientes.
- **Wizard de venta:** el flujo de venta (venta + estado vehículo + cierre de reserva + financiación) merece un asistente multipaso con preview/confirmación.
- **Mobile:** responsive OK pero inputs no optimizados para touch; una **PWA** para vendedores en el salón sería diferencial.

---

## 16. Mejoras de negocio (producto vendible)

**Problema que resuelve:** reemplaza el Excel/WhatsApp/cuaderno de la agencia por un sistema único con stock, ventas, financiación propia, cobranzas y control. **Dolor urgente y con valor económico claro** (evita pérdida de plata por cobranzas mal seguidas, stock sin trazar, comisiones mal liquidadas).

**Empaquetado sugerido (inspirado en Dealcar, adaptado a Argentina):**

| Plan | Público | Incluye | Precio orientativo* |
|---|---|---|---|
| **Básico** | Agencia chica (1 boca) | Stock, clientes, presupuestos, ventas, gastos, dashboard básico | USD 30-50/mes |
| **Profesional** | Agencia con financiación propia | + Financiación/cuotas/cobranzas, posventa, roles/permisos, auditoría, reportes | USD 70-120/mes |
| **Enterprise** | Grupos multi-sucursal / white-label | + Multi-sucursal consolidado, BI avanzado, API, integraciones (ML/WhatsApp/AFIP), soporte SLA, roles personalizados | USD 150+/mes o a medida |

\* *Rango a validar con el mercado local; en ARS ajustar por inflación/indexación.*

**Diferenciales para el pitch:** back-office financiero real + multi-tenant probado + auditoría por diseño + UX moderna + precio transparente.

**Objeciones esperables y respuesta:**
- *"¿Y la facturación AFIP?"* → hoy no; es el feature #1 de roadmap para cerrar el circuito (ver §19).
- *"¿Publica en MercadoLibre?"* → roadmap; mientras tanto, posicionar como back-office complementario.
- *"¿Está seguro mi dato / el de mis clientes?"* → multi-tenant fail-closed + auditoría (fuerte), tras cerrar los fixes de §10.
- *"¿Qué pasa si se cae?"* → necesitás observabilidad + backups off-site probados antes de prometer SLA.

**Para una demo profesional:** datos semilla realistas, dashboard con datos reales (no simulados), flujo completo venta→cobranza, y un caso multi-sucursal.

---

## 17. Tabla comparativa con competidores

Leyenda: ✅ sólido · 🟡 parcial · ❌ ausente

| Funcionalidad | Tu sistema | deConcesionarias | Autologica | AutoSite | Nivel top regional | Brecha | Prioridad |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| Stock / inventario | ✅ | ✅ | ✅ | ✅ | ✅ | — | — |
| Presupuestos / ventas | ✅ | ✅ | ✅ | ✅ | ✅ | Baja | — |
| **Financiación propia + cobranzas** | ✅ | 🟡 | ✅ | ✅ | ✅ | **Ninguna (tu fuerte)** | Mantener |
| Multi-tenant aislado (fail-closed) | ✅ | 🟡 | ✅ | 🟡 | ✅ | Ninguna | Mantener |
| Multi-sucursal consolidado | 🟡 | 🟡 | ✅ | ✅ | ✅ | Media | Media |
| Auditoría / trazabilidad | 🟡 | 🟡 | ✅ | 🟡 | ✅ | Media | Alta |
| **Reportes / BI / tableros** | 🟡 | ✅ | ✅ | ✅ | ✅ | **Alta** | 🔴 Alta |
| **Integración MercadoLibre / portales** | ❌ | ✅ | 🟡 | 🟡 | ✅ | **Alta** | 🔴 Alta |
| **Cotización por patente** | ❌ | ✅ | ❌ | 🟡 | ✅ | Alta | Media |
| **WhatsApp / CRM omnicanal** | ❌ | ✅ | 🟡 | 🟡 | ✅ | Alta | Media |
| **Facturación electrónica (AFIP/ARCA)** | ❌ | 🟡 | ✅ | ✅ | ✅ | **Alta** | 🔴 Alta |
| Posventa / taller / repuestos | 🟡 | ❌ | ✅ | ✅ | 🟡 | Media | Baja |
| App móvil / PWA | ❌ | 🟡 | 🟡 | ❌ | 🟡 | Media | Baja |
| Testing / calidad / SLA | ❌ | ✅ | ✅ | ✅ | ✅ | **Alta** | 🔴 Alta |
| Precio transparente / self-serve | 🟡 | ❌ | ❌ | ❌ | 🟡 | **Oportunidad** | Media |
| UX moderna | ✅ | ✅ | 🟡 | ❌ | ✅ | Ninguna | Mantener |

**Dónde estás bien:** financiación/cobranzas, multi-tenant, UX, alcance funcional.
**Dónde igualás:** stock/ventas/presupuestos.
**Dónde estás por debajo:** BI/reportes, integraciones (ML/WhatsApp/AFIP), testing/SLA.
**Dónde diferenciarte:** back-office financiero + precio transparente + auditoría por diseño.
**Urgente:** BI, facturación fiscal, testing, y los fixes de seguridad.

---

## 18. Matriz de prioridades

| Mejora | Problema que resuelve | Neg. | Téc. | UX | Seg. | Compl. | Riesgo de NO hacerlo | Prioridad |
|---|---|:--:|:--:|:--:|:--:|:--:|---|:--:|
| Fix authz `concesionarias/:id` + tenant en 10 subentidades | Fuga cross-tenant | Alto | Alto | — | Alto | Baja | Filtración de datos entre clientes → fin del SaaS | 🔴 P0 |
| Tokens a cookies httpOnly | Robo por XSS | Alto | Med | — | Alto | Media | Secuestro de sesiones | 🔴 P0 |
| Validación de entrada (Zod) + DTOs | Datos basura / superficie de ataque | Med | Alto | Med | Alto | Media | Bugs y vulnerabilidades | 🔴 P0 |
| Rotar secretos + secrets manager + password DB | Compromiso total | Alto | Baja | — | Alto | Baja | Robo de claves JWT/DB | 🔴 P0 |
| Suite de tests (DI + unit + integración) | No poder evolucionar | Alto | Alto | — | Med | Alta | Regresiones, cero confianza para vender | 🔴 P0 |
| Capa BI (fact tables + snapshots + endpoints agregados) | Tableros/indicadores prometidos | Alto | Alto | Alto | — | Alta | Producto no cumple su promesa | 🔴 P1 |
| Dockerfile seguro + DB no expuesta + CI/CD | No productivo | Med | Alto | — | Alto | Media | Downtime, brechas, deploys rotos | 🔴 P1 |
| Facturación electrónica AFIP/ARCA | Circuito legal | Alto | Alto | Med | — | Alta | Objeción de compra dura | 🟠 P1 |
| Historial de estados + `createdBy` + auditoría estructurada | Trazabilidad/compliance | Med | Med | Baja | Med | Media | Sin control interno vendible | 🟠 P2 |
| Uploads reales (S3 + sharp + límites) | Fotos de vehículos | Med | Med | Alto | Med | Media | UX pobre, riesgo de storage | 🟠 P2 |
| Integración MercadoLibre/portales | Paridad de captación | Alto | Alto | Alto | — | Alta | Te ven "solo administración" | 🟠 P2 |
| Redis + colas (BullMQ) + cache | Escala/async | Med | Alto | Baja | — | Media | No escala a volumen | 🟡 P2 |
| Matar arquitectura legacy | Deuda técnica | Baja | Med | — | Med | Baja | Inconsistencia/riesgo | 🟡 P2 |
| Permisos finos + RLS | Seguridad granular | Med | Med | Baja | Alto | Media | Límite en planes enterprise | 🟡 P3 |
| WhatsApp / CRM omnicanal | Captación | Alto | Med | Alto | — | Media | Menos competitivo | 🟡 P3 |
| a11y + lazy load + export/sort tablas | Pulido enterprise | Med | Baja | Alto | — | Baja | Menos "premium" | 🟢 P3 |
| PWA vendedores | Movilidad salón | Med | Med | Alto | — | Media | Diferencial no capturado | 🟢 P3 |

---

## 19. Roadmap por etapas

### Etapa 1 — Correcciones críticas (estabilizar y asegurar) · 2-3 sprints
**Objetivo:** que sea seguro y confiable. Área: Backend + Seguridad + DevOps.
- Fix authz `concesionarias/:id`; `concesionariaId` + índices + cobertura fail-closed en las 10 subentidades; extender tests IDOR.
- Tokens a cookies httpOnly; rotar secretos; password fuerte de DB; secrets manager; confirmar `/debug` off.
- Validación Zod por endpoint + DTOs de salida; rate-limit de login + lockout.
- DI (`awilix`/`tsyringe`) + arranque de suite de tests (meta 30% en flujos core).
- Dockerfile backend multi-stage + `USER node`; quitar `5432` expuesto; CI mínimo (lint+test+build+`trivy`); logs persistentes.
- **Resultado esperado:** apto para onboardear clientes reales sin riesgo de fuga ni de sesión.

### Etapa 2 — MVP vendible · 2-3 sprints
**Objetivo:** demo y venta con circuito completo. Área: Backend + Producto + Data.
- **Capa BI base:** `VentaFact`/`CuotaFact`, `DailySnapshot`, endpoints agregados; dashboard con datos reales + gráficos (Recharts).
- Historial de estados + `createdBy`/`updatedBy` + `AuditLog` estructurado (JSON diff).
- Recuperación de contraseña + verificación de email.
- Uploads reales (S3/MinIO + `sharp` + límites) para fotos de vehículos.
- Versionado `/api/v1` + Swagger regenerado + envelope unificado.
- Matar arquitectura legacy (`sucursales` → `interface/`).
- **Resultado esperado:** demo profesional, planes Básico/Profesional cobrables.

### Etapa 3 — Producto profesional · 3-4 sprints
**Objetivo:** competir en serio. Área: Backend + Integraciones + Infra.
- **Facturación electrónica AFIP/ARCA** (comprobantes legales).
- **Integración MercadoLibre + portales** (publicación y leads) + **WhatsApp Business**.
- Redis + BullMQ (emails, reportes, limpieza, sync); cache HTTP/servidor.
- Permisos finos por acción/módulo + RLS de Postgres; 2FA para admin.
- Observabilidad (Prometheus/Grafana + alertas), staging, backups off-site + restore test.
- Multi-sucursal consolidado (KPIs por boca, tipo Autologica).
- **Resultado esperado:** paridad competitiva con la liga PyME argentina + SLA defendible.

### Etapa 4 — Producto top regional · continuo
**Objetivo:** destacarse en Mendoza/Argentina/LatAm.
- BI avanzado + tableros ejecutivos + analítica (mora predictiva, rotación de stock, forecast de ventas).
- **Cotización por patente** (infoauto/SUCERP u homólogo).
- PWA/app móvil para vendedores; portal público de stock por cliente (white-label).
- Marketplace de módulos + configuración por cliente; multi-moneda/multi-país.
- Certificaciones de seguridad, SLA y soporte profesional.

---

## 20. Historias de usuario (mejoras priorizadas)

**HU-01 · Aislamiento total de datos entre concesionarias** · 🔴 P0 · Módulo: Core/Seguridad
- *Como* dueño de una concesionaria, *quiero* que ningún usuario de otra concesionaria pueda ver mis datos (ni siquiera adivinando IDs), *para* confiar mis datos comerciales al sistema.
- **Criterios:** (a) `GET /concesionarias/:id` sólo devuelve la propia salvo `super_admin`; (b) las 10 subentidades llevan `concesionariaId` y quedan bajo la extensión fail-closed; (c) test IDOR por cada subentidad pasa en verde.
- **Dependencias:** extensión Prisma. **Notas:** migración con backfill de `concesionariaId` desde el padre. **Riesgo si no:** fuga cross-tenant = fin del producto.

**HU-02 · Sesiones a prueba de XSS** · 🔴 P0 · Módulo: Auth
- *Como* usuario, *quiero* que mi sesión no pueda ser robada por un script malicioso, *para* estar seguro.
- **Criterios:** tokens en cookies `httpOnly`+`Secure`+`SameSite`; frontend sin tokens en `localStorage`; CORS con `credentials:true`; refresh funciona.
- **Riesgo si no:** secuestro de sesión.

**HU-03 · Validación de entrada en toda la API** · 🔴 P0 · Módulo: Backend transversal
- *Como* operador, *quiero* que el sistema rechace datos inválidos con mensajes claros, *para* no corromper la información.
- **Criterios:** schema Zod por endpoint; `422` con detalle de errores; allowlist de campos (sin mass assignment); `roles`/`activo` no seteables desde el body.
- **Notas:** habilita también la doc OpenAPI desde los mismos schemas.

**HU-04 · Confianza para evolucionar (tests)** · 🔴 P0 · Módulo: Calidad
- *Como* equipo, *quiero* una suite de tests de los flujos críticos, *para* refactorizar y lanzar sin miedo.
- **Criterios:** DI inyectable; unit de use-cases core; integración de venta, cobranza y aislamiento; CI que corre en cada PR; cobertura ≥30% (core) subiendo a 60%.

**HU-05 · Tableros de gestión con datos reales** · 🔴 P1 · Módulo: BI/Reportes
- *Como* gerente, *quiero* ver ventas, márgenes, stock y cobranzas del período con gráficos, *para* tomar decisiones.
- **Criterios:** endpoint `/dashboard/stats` con agregación server-side (sin traer todos los registros); `DailySnapshot` alimenta series temporales; gráficos reales; filtros por sucursal/fecha; carga <1s con 50k registros.
- **Dependencias:** fact tables + índices. **Riesgo si no:** el producto no cumple su promesa central.

**HU-06 · Facturación electrónica AFIP/ARCA** · 🟠 P1 · Módulo: Ventas/Fiscal
- *Como* administrativo, *quiero* emitir el comprobante fiscal legal desde la venta, *para* cerrar el circuito sin doble carga.
- **Criterios:** integración con el WS de AFIP/ARCA; numeración/CAE; PDF; contingencia; auditoría del comprobante.
- **Notas:** feature de mayor esfuerzo pero de mayor peso comercial en Argentina.

**HU-07 · Trazabilidad de cambios de estado y responsables** · 🟠 P2 · Módulo: Auditoría
- *Como* auditor/dueño, *quiero* saber quién cambió qué y cuándo (estados de venta/financiación, precios, pagos), *para* controlar y prevenir fraude.
- **Criterios:** tabla `EstadoHistorial`; `createdBy`/`updatedBy` en entidades críticas; `AuditLog` con diff JSON; vista de historial por entidad en el frontend.

**HU-08 · Gestión real de fotos de vehículos** · 🟠 P2 · Módulo: Inventario
- *Como* vendedor, *quiero* subir varias fotos por auto rápido y verlas optimizadas, *para* publicar mejor.
- **Criterios:** límite de tamaño + validación MIME; compresión/resize (`sharp`); storage externo (S3/MinIO) guardando URL+metadata; galería en la ficha; borrado seguro.

**HU-09 · Publicación en MercadoLibre y portales** · 🟠 P2 · Módulo: Integraciones
- *Como* agencia, *quiero* publicar mi stock en MercadoLibre desde el sistema y recibir los leads en un inbox, *para* no cargar dos veces.
- **Criterios:** OAuth ML; publicar/pausar desde la ficha; sync de estado; leads asociados al vehículo/cliente.
- **Notas:** paridad con deConcesionarias. **Riesgo si no:** te ven como "solo back-office".

**HU-10 · Despliegue productivo y confiable** · 🟠 P1 · Módulo: DevOps
- *Como* responsable técnico, *quiero* CI/CD, imágenes seguras, backups off-site probados y alertas, *para* ofrecer un SLA creíble.
- **Criterios:** Dockerfile backend multi-stage + no-root; DB no expuesta; pipeline lint+test+build+scan; backup replicado + restore test mensual; alertas de fallo de backup/health.

---

## 21. Recomendación final

**Tenés un producto con cimientos por encima del promedio de la competencia PyME argentina** —multi-tenancy fail-closed, Clean Architecture, modelo de datos serio, financiación/cobranzas y UX moderna— **envuelto en una capa de MVP que todavía no aguanta escrutinio de venta seria.** No es un problema de rediseño; es de **cierre**.

**Secuencia recomendada, sin ambigüedad:**
1. **Primero, no filtrar datos y no perder sesiones** (HU-01, HU-02, HU-03, rotar secretos). Sin esto, cualquier venta es un riesgo legal.
2. **Segundo, poder evolucionar** (HU-04: DI + tests + CI). Es el habilitador de todo lo demás.
3. **Tercero, cumplir la promesa del producto** (HU-05: BI real) y **cerrar el circuito** (HU-06: AFIP) — eso convierte "sistema lindo" en "sistema que se paga solo".
4. **Cuarto, paridad de mercado** (HU-08/09: fotos + MercadoLibre/WhatsApp) para no quedar como "solo administración" frente a deConcesionarias.

**Tu posicionamiento ganador** no es "otro CRM de captación" (ahí deConcesionarias ya ganó), sino **"el back-office financiero-operativo serio y multi-sucursal para concesionarias, con captación integrada"**. Esa cuña —financiación propia + cobranzas + multi-tenant probado + auditoría por diseño + precio transparente— es defendible y difícil de copiar rápido.

Con Etapa 1 + Etapa 2 (≈4-6 sprints) tenés un **MVP vendible en Mendoza**. Con Etapa 3 competís de igual a igual en Argentina. Etapa 4 es el salto regional.

---

*Documento generado por auditoría de código directa (`BackConcesionaria/`, `FrontConcesionaria/`, `schema.prisma`, `docker-compose*.yml`) + investigación competitiva web. Algunos hallazgos marcados "verificar" requieren confirmación puntual antes de accionar. Ver [`PLAN_SCRUM.md`](./PLAN_SCRUM.md) para el desglose de sprints en curso.*

### Fuentes competitivas
- deConcesionarias — https://deconcesionarias.com.ar/
- Autologica Sky DMS — https://www.autologica.com/
- Oversoft — https://oversoft.net/
- AutoSite — https://autosite.com.ar/
- AutoGestión CRM (SOTE) — https://crmsote.com/
- Octosis DMS — https://octosis.com.ar/
- Dealcar (referencia de modelo/pricing) — https://dealcar.io/precio
- Comparativa de software para concesionarios (Argentina) — https://www.comparasoftware.com.ar/concesionario
