# 🧩 Adenda de implementación al Plan de Scrum

> **Qué es esto:** un complemento a [`PLAN_SCRUM.md`](./PLAN_SCRUM.md) que incorpora los deltas del [análisis técnico-competitivo del 2026-07-03](./ANALISIS_TECNICO_COMPETITIVO.md).
> **Qué NO es:** un plan nuevo. El `PLAN_SCRUM.md` sigue siendo el documento maestro (épicas, releases, sprints, DoR/DoD, ceremonias). Esta adenda **no lo reemplaza**: lo extiende.
> **Estado de alineación:** el plan maestro ya cubre ~95% de los hallazgos. Esta adenda agrega **5 piezas faltantes** y ajusta la asignación de sprints.
> **Nota:** si preferís un solo documento, avisá y fusiono esta adenda dentro de `PLAN_SCRUM.md` (renumerando el backlog).

---

## 1. Trazabilidad — Historias del análisis → backlog existente

Cada historia de usuario (HU) y hallazgo del nuevo análisis, mapeado a lo que ya existe o a una historia nueva.

| HU / Hallazgo del análisis (2026-07-03) | Estado en `PLAN_SCRUM.md` | Acción |
|---|---|---|
| **HU-01** Aislamiento total (subentidades sin `concesionariaId` + `concesionarias/:id` sin authz) | ✅ Cubierto — `E1-01`, `E1-02` | Reforzar criterio: authz explícito en `GET /concesionarias/:id` dentro de `E1-01` |
| **HU-02** Sesiones a prueba de XSS (tokens en `localStorage`) | ❌ **No cubierto** | **NUEVA `E1-08`** |
| **HU-03** Validación de entrada (Zod) + DTOs en toda la API | 🟡 Parcial — `E2-04` (error→400), `E6-04` (forms front) | **NUEVA `E2-06`** (capa backend) |
| **HU-04** Confianza para evolucionar (DI + tests + cobertura) | 🟡 Sólo como **gate de DoD**, sin historia que lo construya | **NUEVA épica `E11`** |
| **HU-05** Tableros con datos reales + `/dashboard/stats` agregado | 🟡 Parcial — `E6-01` (dashboard), `E9-01/02` (BI) | **NUEVA `E4-07`** (fundaciones de datos) |
| **HU-06** Facturación electrónica AFIP/ARCA | ✅ Cubierto — `E7-06` | Sin cambios |
| **HU-07** Historial de estados + `createdBy` + auditoría estructurada | ✅ Cubierto — `E4-02`, `E4-03`, `E4-05` | Agregar tabla `EstadoHistorial` al alcance de `E4-02` |
| **HU-08** Uploads reales de fotos (S3/MinIO + sharp + límites) | ❌ **No cubierto** (era decisión de alcance, sin historia) | **NUEVA `E5-04`** |
| **HU-09** Publicación MercadoLibre / portales | ✅ Cubierto — `E10` (R4) | Adelantar un **spike** a R3 (ver §4) |
| **HU-10** Despliegue productivo confiable | ✅ Cubierto — `E3-*` | Sin cambios |
| Rate-limit login + lockout | ✅ Cubierto — `E1-05` | Sin cambios |
| Mass assignment `CreateUsuario` | 🟡 Se resuelve con `E2-06` | Incluir caso en criterios de `E2-06` |
| Redis + colas (jobs/cache) | 🟡 `E5-01` asume worker, sin infra explícita | **NUEVA `E5-05`** (opcional/P2) |
| Matar arquitectura legacy | ✅ Cubierto — `E2-03` | Sin cambios |
| Versionado `/api/v1` + Swagger | ✅ Cubierto — `E8-01` | Sin cambios |

**Conclusión:** 5 historias nuevas + 1 épica nueva. Todo lo demás ya está en el plan maestro.

---

## 2. Historias nuevas (para agregar al Product Backlog)

### 🔴 Épica E1 — Seguridad & Hardening (extensión)

| ID | Historia | Pts | Prior. | Criterios de aceptación |
|---|---|---|---|---|
| **E1-08** | **Tokens de sesión a cookies `httpOnly`** | 5 | **P0** | Access + refresh viajan en cookies `httpOnly`+`Secure`+`SameSite=strict`; frontend **sin tokens en `localStorage`** (`authStore` deja de persistir tokens); CORS con `credentials:true` y allowlist; el flujo de refresh sigue funcionando; test: token no accesible vía `document.cookie`/JS |

> **Por qué P0:** hoy un XSS en cualquier dependencia npm roba la sesión (access + refresh) desde `localStorage`. Es par de `E1-01/E1-02`: no sirve blindar el backend si la sesión se roba en el cliente.

### 🔴 Épica E2 — Estabilización & Arquitectura (extensión)

| ID | Historia | Pts | Prior. | Criterios de aceptación |
|---|---|---|---|---|
| **E2-06** | **Capa de validación de entrada (Zod) + DTOs de salida** | 8 | **P0** | Cada endpoint con mutación valida el body con un schema Zod (allowlist de campos); body inválido → **422** con detalle por campo; **sin mass assignment** (`roles`/`activo`/`concesionariaId` no seteables desde el body en `CreateUsuario`); DTOs de salida evitan filtrar campos sensibles (p.ej. `passwordHash`); los schemas Zod alimentan la doc OpenAPI de `E8-01` (fuente única) |

> **Por qué P0:** los controllers de la arquitectura nueva reciben `req.body` crudo. Es a la vez hueco de seguridad (mass assignment, garbage-in) y bloqueante de calidad. `E2-04` ya lleva errores de validación a 400/422; `E2-06` construye los schemas que faltan.

### 🟠 Épica E4 — Datos & Trazabilidad (extensión)

| ID | Historia | Pts | Prior. | Criterios de aceptación |
|---|---|---|---|---|
| **E4-07** | **Fundaciones de BI: fact tables + snapshot + endpoint agregado** | 8 | **P1** | Tablas `VentaFact`/`CuotaFact` (márgenes/gastos precomputados) y `DailySnapshot` (stock, ventas, cobranzas, márgenes por día) alimentadas por hook/job; endpoint `/dashboard/stats` devuelve conteos/agregados **server-side** (elimina los 4 `getAll()` que traen todo); carga <1s con 50k registros; índices `[concesionariaId, fecha]` presentes |

> **Por qué:** es la base sobre la que se apoyan `E6-01` (dashboard real) y `E9` (reportes). Sin esto, los tableros no escalan y el producto no cumple su promesa central.

### 🟠 Épica E5 — Jobs & Performance (extensión)

| ID | Historia | Pts | Prior. | Criterios de aceptación |
|---|---|---|---|---|
| **E5-04** | **Uploads reales de archivos de vehículo** | 5 | **P1** | `multer` con límite de tamaño + validación MIME; compresión/resize con `sharp`; storage externo (S3/MinIO) guardando **URL + metadata** (no el binario en la DB); galería en la ficha; borrado seguro; test de rechazo de archivo inválido |
| **E5-05** | **Infra Redis + colas (BullMQ)** *(habilitador de `E5-01`)* | 5 | P2 | Redis en compose; BullMQ para jobs (vencimientos, emails, limpieza de tokens); cache de catálogos casi estáticos; rate-limit distribuido migra a Redis. **Opcional:** si el volumen inicial es bajo, `E5-01` puede arrancar con `node-cron` y diferir esto |

### 🆕 Épica E11 — Calidad & Testing *(el gap más importante)*

| ID | Historia | Pts | Prior. | Criterios de aceptación |
|---|---|---|---|---|
| **E11-01** | **Inyección de dependencias (DI) en controllers** | 8 | **P0** | Contenedor DI (`awilix` o `tsyringe`); los controllers dejan de hacer `new PrismaXRepository()` y reciben dependencias inyectadas; se puede sustituir un repo por un mock en tests |
| **E11-02** | **Harness de tests + cobertura core ≥30%** | 8 | **P0** | Helpers/factories de test; unit de use-cases core (auth, ventas, financiación, cobranzas); integración de los flujos que mueven plata contra **DB real**; cobertura core ≥30% (subiendo a 60% en R2) |
| **E11-03** | **Gate de cobertura en CI + test IDOR por subentidad** | 5 | P1 | CI falla si la cobertura baja del umbral; `subentity-idor.db.test.ts` extendido a **cada** subentidad de `E1-02`; el test de aislamiento multi-tenant es gate de merge |

> **Por qué épica nueva:** el `PLAN_SCRUM.md` **exige tests en el DoD** pero no tiene ninguna historia que *construya la capacidad* de testear. Con DI hardcodeada, hoy los tests de la arquitectura nueva son imposibles sin DB real. `E11-01/02` son el habilitador que hace cumplible el DoD del resto del plan → por eso arrancan en **Sprint 0**.

---

## 3. Asignación de sprints (revisada)

La regla de oro del plan maestro se mantiene: **en R1, cero features nuevas hasta cerrar los P0.** Las historias nuevas son todas hardening/calidad, así que respetan esa regla.

### Sprint 0 — Fundaciones *(ampliado)*
Al setup de tablero + CI + staging del plan maestro, se suma el **habilitador de calidad**:
- ➕ `E11-01` (DI, 8) — refactor a dependencias inyectables.
- ➕ `E11-02` arranque (harness + factories) — para que **toda historia posterior pueda cumplir el gate de tests del DoD**.

> Esto es lo que hace realista el DoD del plan maestro. Sin Sprint 0 extendido, cada historia "Done" arrastra el problema de no poder testearse.

### Release 1 — Hardening & Estabilización (Sprints 1–3)

| Sprint | Composición (plan maestro + adenda) | Pts | Nota de capacidad |
|---|---|---|---|
| **Sprint 1** · *Cerrar puertas + core* | `E1-01`·`E1-03`·`E1-04`·`E1-05`·`E1-06`·`E2-01` **+ `E1-08`** (5) | ~33 | Cookies entra con el bloque de auth (encaja temáticamente) |
| **Sprint 2** · *Una sola arquitectura* | `E2-02`·`E2-03`·`E1-02`·`E2-04` **+ `E2-06`** (8) **+ `E11-03`** (5) · mover `E2-05` → Sprint 3 | ~35 | Validación + DTOs se construyen junto con la unificación; IDOR-por-subentidad valida `E1-02` |
| **Sprint 3** · *Producción de verdad* → **cierra R1** | `E3-01`·`E3-02`·`E3-03`·`E3-04`·`E3-05`·`E3-06`·`E1-07` **+ `E2-05`** (5) **+ `E11-02` cierre** (cobertura ≥30%) | ~35 | Consolidar cobertura antes de abrir R2 |

> **Honestidad de capacidad:** R1 sube de ~93 a ~118 pts. Con velocity 34, eso es **~3,5 sprints, no 3**. Recomendación: **extender R1 a 3 sprints + medio** (o insertar un Sprint 2.5 corto de estabilización) en vez de comprimir. El testing (`E11`) no es negociable: es lo que evita que R2/R3 se construyan sobre arena.

### Release 2 — MVP vendible (Sprints 4–5)

| Sprint | Composición | Nota |
|---|---|---|
| **Sprint 4** · *Trazabilidad + datos confiables* | Plan maestro (`E4-01..05`, `E5-01`, `E8-02`, `E5-03`) **+ `E4-07`** (BI foundations, 8) **+ `E5-05`** (Redis/BullMQ, 5, si aplica) | `E4-07` habilita el dashboard real de Sprint 5. Ampliar `E4-02` con tabla `EstadoHistorial` |
| **Sprint 5** · *Demo que cierra clientes* → **cierra R2** | Plan maestro (`E6-01..05`, `E7-01`) **+ `E5-04`** (uploads reales, 5) | Fotos reales + dashboard con datos reales = demo creíble |

### Release 3 — Producto profesional (Sprints 6–7)
Sin cambios estructurales respecto del plan maestro (`E7-*` monetización + AFIP, `E8-01` API/OpenAPI desde los schemas Zod de `E2-06`, `E9-*` BI sobre las fundaciones de `E4-07`).
- ➕ **Spike de MercadoLibre** (3 pts, HU-09): validar OAuth + publicación antes de comprometer la integración de R4. Es **paridad competitiva** con deConcesionarias, no puede quedar sólo en el horizonte lejano.

### Release 4 — Top regional (Sprints 8+)
Sin cambios: `E10` (multipublicador full, WhatsApp+IA, F&I, móvil/PWA).

---

## 4. Ajustes de priorización por posicionamiento competitivo

El nuevo análisis confirma la **cuña de diferenciación**: no competir como "otro CRM de captación" (deConcesionarias ya ganó ahí), sino como **el back-office financiero-operativo serio y multi-sucursal**. Eso refuerza —no cambia— la secuencia del plan maestro:

- **Mantener la ventaja (ya en el plan):** financiación propia + cuotas + cobranzas (`E5-01` vencimientos), multi-tenant probado (`E1-02` + `E11-03`), auditoría por diseño (`E4-02`). **Es tu foso; protegerlo con tests es prioridad.**
- **Paridad mínima de captación:** adelantar el **spike de MercadoLibre** a R3 (arriba). Sin al menos un camino a publicación/leads, te comparan como "solo administración".
- **Cerrar el circuito legal:** `E7-06` (AFIP/ARCA) mantiene su lugar en R3 — es la objeción de compra más dura en Argentina.
- **Modelo comercial:** al empaquetar planes (post-R2), copiar el patrón self-serve con pricing transparente por tramos (referencia Dealcar) en vez del "consultá precio" de la competencia local.

---

## 5. Resumen de cambios al backlog

| Cambio | Detalle |
|---|---|
| **+1 épica** | `E11 · Calidad & Testing` (DI + harness + cobertura) |
| **+6 historias** | `E1-08` (cookies), `E2-06` (validación/DTOs), `E4-07` (BI foundations), `E5-04` (uploads), `E5-05` (Redis/colas), `E11-01/02/03` |
| **+~40 pts** | La mayoría P0/P1 de hardening y calidad |
| **Impacto en cronograma** | R1 pasa de ~3 a ~3,5 sprints (el testing es el driver). R2/R3 casi sin cambios de duración |
| **Sprint 0 ampliado** | Suma DI + harness de tests como habilitador del DoD |
| **Primera historia recomendada** | Sin cambios respecto del plan maestro: `E2-01` (arreglar `createVenta` + test) — ahora el test es viable gracias a `E11-01/02` de Sprint 0 |

---

*Adenda derivada de [`ANALISIS_TECNICO_COMPETITIVO.md`](./ANALISIS_TECNICO_COMPETITIVO.md). Documento maestro: [`PLAN_SCRUM.md`](./PLAN_SCRUM.md). Actualizar estimaciones en el próximo Refinement.*
