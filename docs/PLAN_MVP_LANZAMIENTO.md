# 🚀 Plan de lanzamiento del MVP (piloto)

> **Objetivo:** poner el sistema **en producción, seguro y estable, en manos de 2-3 concesionarias reales en Mendoza** (design partners), para validar el producto, conseguir los primeros testimonios y la primera señal de pago — antes de invertir en escalar.
> **Documentos relacionados:** [`ANALISIS_TECNICO_COMPETITIVO.md`](./ANALISIS_TECNICO_COMPETITIVO.md) · [`PLAN_SCRUM.md`](./PLAN_SCRUM.md) · [`PLAN_SCRUM_ADENDA.md`](./PLAN_SCRUM_ADENDA.md).
> Este plan **selecciona un subconjunto** de ese backlog (el mínimo para lanzar) y le agrega el **runbook de go-live** y el **plan de piloto**.

## Decisiones de encuadre (asunciones — revisables)

| Decisión | Elección | Por qué |
|---|---|---|
| Tipo de MVP | **Piloto con design partners**, no self-serve público | Validar con clientes reales antes de automatizar cobro/escala |
| Público | 2-3 agencias/concesionarias chicas-medianas de Mendoza con **financiación propia** | Es donde tu diferencial (back-office financiero) pega más fuerte |
| Cobro en el piloto | **Manual** (transferencia + factura manual) | Saca MercadoPago/AFIP del camino crítico del MVP |
| Facturación fiscal, multipublicador, WhatsApp, BI avanzado, PWA | **Fuera del MVP** (fase GA) | No bloquean la validación; agregan meses |
| Infra | **VPS pequeño dedicado al piloto** (recomendado) o Raspberry Pi endurecida | Datos de clientes que pagan no pueden vivir en un único punto de falla sin backups off-site probados |

> **Si tu MVP es otra cosa:** (a) *solo demo para prospectos* → salteás la §7-8 y el requisito de datos reales/legal; (b) *self-serve público* → eso es **GA, no MVP**: primero este piloto, después automatizás billing (Épica E7) y onboarding. El plan de abajo es la base en ambos casos.

---

## 1. La línea de corte del MVP (scope IN / OUT)

Lo más importante del plan: **qué construimos y qué NO**. Regla: si no es imprescindible para que una concesionaria opere su día a día de forma segura, **queda afuera**.

### ✅ DENTRO del MVP (el bucle operativo completo)

| Módulo | Alcance MVP | Historias backlog |
|---|---|---|
| **Multi-tenant seguro** | Aislamiento total entre concesionarias, probado con tests | `E1-01`, `E1-02`, `E11-03` |
| **Auth + roles** | Login, roles (admin/vendedor/cobrador/lectura), forgot/reset password, sesión segura | `E1-05`, `E1-06`, `E1-08` |
| **Vehículos / stock** | CRUD, estados, **fotos reales** (upload), filtros por sucursal | `E5-04` |
| **Clientes / proveedores** | CRUD, DNI/CUIT únicos | `E4-06` |
| **Presupuestos → Ventas** | Flujo completo, canje, `createVenta` funcionando | `E2-01` |
| **Financiación propia** ⭐ | Cuotas + cobranzas + vencimientos (tu diferencial) | `E5-01` |
| **Gastos** | Por vehículo + fijos | (ya existe) |
| **Dashboard real** | KPIs con datos reales (nunca inventados), carga rápida | `E4-07`, `E6-01` |
| **Auditoría básica** | Quién hizo qué (login, ventas, cobros, bajas) | `E4-02`, `E4-03` |
| **Importador CSV** | Carga inicial de vehículos y clientes desde Excel/CSV | **nuevo — ver §3** |
| **Deploy productivo** | HTTPS, backups off-site probados, DB no expuesta | `E3-*` |

### ❌ FUERA del MVP (diferido a GA / post-piloto)

- Facturación electrónica AFIP/ARCA (`E7-06`).
- Cobro automático MercadoPago + límites de plan por software (`E7-02/03/04/05`) → **en el piloto se cobra a mano**.
- Multipublicador MercadoLibre / portales, WhatsApp + IA (`E10`).
- BI avanzado / vistas materializadas / analítica predictiva (`E9-02`, `E10`).
- API pública versionada + OpenAPI pulido (`E8`) → interna alcanza para el MVP.
- Posventa/taller completo, app móvil/PWA, roles UI finos.

> **Criterio de corte:** todo lo "afuera" o **no bloquea operar** o **no bloquea validar**. Meterlo ahora es *gold-plating* que retrasa el aprendizaje.

---

## 2. Los 3 gates innegociables antes de tocar datos de un cliente real

Nada sale a producción con datos reales hasta que estos tres estén en verde. Son los bloqueantes 🔴 del análisis:

1. **Aislamiento de datos** — `E1-01` (auth global fail-closed) + `E1-02` (IDOR en subentidades: `concesionariaId` en las ~10 tablas hoja + `concesionarias/:id` con authz) + test "tenant A ≠ tenant B" en verde.
2. **Sesión y secretos** — `E1-08` (tokens en cookies `httpOnly`, fuera de `localStorage`) + secretos rotados y fuera del repo (`E1-03`) + `/debug` apagado (`E1-04`) + rate-limit de login (`E1-05`).
3. **Core y datos confiables** — `E2-01` (`createVenta` funciona, con test contra DB real) + backups off-site **probados** (`E3-04`) + soft-delete que no contamina reportes (`E4-01`).

**Habilitador transversal:** DI + harness de tests (`E11-01/02`) — sin esto no podés verificar los gates con confianza.

---

## 3. Trabajo mínimo pre-lanzamiento (milestones)

Reagrupo el backlog seleccionado en **milestones de lanzamiento** (no en sprints), ordenados por dependencia. Cada uno con su estimación en puntos.

| # | Milestone | Contenido (historias) | Pts | Resultado |
|:--:|---|---|:--:|---|
| **M0** | Fundaciones | Sprint 0 ampliado: tablero, CI, staging, **DI (`E11-01`) + harness (`E11-02`)** | ~16 | Se puede testear y desplegar sin fricción |
| **M1** | Cerrar las puertas | `E1-01`·`E1-02`·`E1-03`·`E1-04`·`E1-05`·`E1-06`·`E1-08` + `E11-03` | ~37 | Nadie accede sin login; sin fugas cross-tenant; sesión segura |
| **M2** | Core estable + 1 arquitectura | `E2-01`·`E2-02`·`E2-03`·`E2-04`·`E2-06` | ~34 | Se registra una venta; un solo árbol de código; entrada validada |
| **M3** | Producción de verdad | `E3-01..06` (Docker seguro, HTTPS, backups probados, CI/CD, DB no expuesta) | ~22 | Desplegable, reproducible, con rollback |
| **M4** | Datos confiables + demo | `E4-01·02·03·04·06`·`E4-07`·`E5-01`·`E5-04`·`E6-01·02·03` + **importador CSV** | ~45 | Trazabilidad, dashboard real, fotos, cobranzas, carga inicial |
| **M5** | Endurecimiento de lanzamiento | Smoke tests, restore drill, monitoreo, legal, onboarding tenant | ~12 | Checklist de "MVP-ready" en verde |

**Total ≈ 165-170 pts** para el MVP-piloto.

### Traducción a tiempo (sé realista con tu capacidad)
El `PLAN_SCRUM.md` asume 2 devs + QA (~34 pts/sprint de 2 semanas). Tiempo = puntos ÷ velocity:

| Escenario | Velocity | MVP-piloto (~170 pts) |
|---|---|---|
| 2 devs + QA | ~34 pts/sprint | **~5 sprints (~10 semanas)** |
| 1 dev full-time | ~15-18 pts/sprint | **~9-11 sprints (~18-22 semanas)** |
| 1 dev part-time | ~8-10 pts/sprint | **~4-5 meses** |

> Si sos vos solo, la palanca #1 no es trabajar más rápido: es **cortar más scope** (¿de verdad necesitás gastos fijos + movimientos + reservas en el piloto, o alcanza stock→venta→cobranza?). Cada historia que sacás adelanta el aprendizaje.

### Nueva historia para el MVP: importador CSV
| ID | Historia | Pts | Prior. | Criterios |
|---|---|:--:|:--:|---|
| **E6-06** | Importador CSV de vehículos y clientes | 5 | P1 (MVP) | Subir CSV → mapear columnas → validar → crear en lote dentro del tenant; reporte de filas OK/error; sin esto ninguna concesionaria carga 100 autos a mano |

---

## 4. Runbook de go-live (subir el MVP a producción)

Pasos concretos para "subir" el sistema. Ejecutar una vez para dejar producción lista, y automatizar lo repetible.

### 4.1 Infraestructura
1. **Elegir server.** Recomendado para piloto con clientes que pagan: **VPS pequeño** (2 vCPU / 4 GB, ~USD 10-20/mes) en un proveedor con snapshots. Alternativa: Raspberry Pi actual **solo si** agregás backups off-site probados y asumís el riesgo de single-point-of-failure.
2. **OS + Docker + docker-compose** instalados; firewall (solo 80/443 al exterior; **nunca** 5432/3000).
3. **DNS + HTTPS.** Cloudflare Tunnel (`cloudflared`, ya lo usás) enrutando el subdominio → servicio interno. TLS termina en Cloudflare. Documentar la config en [`DEPLOY.md`](./DEPLOY.md).

### 4.2 Configuración y secretos
4. Generar secretos **fuertes y nuevos**: `JWT_SECRET`, `JWT_REFRESH_SECRET` (≥32 bytes aleatorios), password Postgres fuerte. **Rotar** los que estaban en el repo.
5. `.env.prod` fuera del repo (secrets manager o, mínimo, archivo con permisos restringidos en el server). Validado por Zod al boot (ya existe).
6. `CORS_ALLOWED_ORIGINS` = dominio real del frontend.

### 4.3 Build y despliegue
7. Imágenes **multi-stage** (backend ya corregido en `E3-02`), **tagueadas por commit** (`app:<git-sha>`) para poder rollback.
8. `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d` con `command: sh -c "npx prisma migrate deploy && npm start"` (migraciones versionadas, no `db push`).
9. **Seed inicial productivo:** crear `super_admin`, planes base, roles. (Script idempotente; NO seed de datos demo en prod.)

### 4.4 Datos y resiliencia
10. **Backups:** `pg_dump` diario a almacenamiento **off-site** (S3/Backblaze/rclone), con retención (7d/4s/6m). **Probar un restore completo** en staging (drill) — un backup no probado no es un backup.
11. **Healthchecks** de db + backend + frontend; `depends_on: service_healthy`.

### 4.5 Verificación (smoke test de producción)
12. Correr el **smoke test**: login, crear tenant, alta de vehículo con foto, presupuesto → venta → cuota → registrar cobro, ver dashboard, logout. Todo en verde.
13. Ejecutar el **test de aislamiento multi-tenant** contra el entorno desplegado.

### 4.6 Observabilidad mínima
14. Ping de uptime externo (UptimeRobot/BetterStack) al `/health` + alerta por caída.
15. Alerta si **falla un backup** (webhook/email).
16. Logs persistentes (volumen o agregación básica).

### 4.7 Rollback (tenerlo probado, no improvisado)
17. Backup **antes** de cada migración. Rollback = desplegar la imagen del commit anterior + restaurar backup si la migración fue destructiva. Documentar los comandos exactos.

---

## 5. Checklist "MVP-ready" (Definition of Launchable)

Gate duro: **no se onboarda un cliente real** hasta que todo esté ✅.

**Seguridad y datos**
- [ ] Test de aislamiento multi-tenant en verde (gate)
- [ ] IDOR cerrado en subentidades (`concesionariaId` + test por tabla)
- [ ] Tokens en cookies `httpOnly`; nada sensible en `localStorage`
- [ ] Secretos rotados y fuera del repo; `/debug` inexistente en prod
- [ ] Rate-limit + lockout en login
- [ ] DB no expuesta al exterior; todo bajo HTTPS

**Estabilidad**
- [ ] `createVenta` end-to-end con test contra DB real
- [ ] Validación de entrada → 422 (no 500) en toda mutación
- [ ] Backups off-site automáticos **+ restore probado**
- [ ] Rollback documentado y probado una vez
- [ ] Smoke test de producción en verde

**Producto mínimo usable**
- [ ] Dashboard con datos reales (cero datos inventados)
- [ ] Alta de vehículo con fotos reales
- [ ] Flujo venta → cuota → cobranza completo
- [ ] Importador CSV para carga inicial
- [ ] Onboarding de un tenant nuevo funciona de punta a punta

**Legal / operativo (piloto con datos de terceros)**
- [ ] Términos de uso + política de privacidad publicados
- [ ] Nota mínima de tratamiento de datos personales (clientes tienen DNI/teléfono → Ley 25.326 Arg.)
- [ ] Canal de soporte definido (WhatsApp/email) y horario de respuesta
- [ ] Acuerdo de piloto firmado (alcance, gratuidad/precio, feedback, confidencialidad)

---

## 6. Onboarding del primer cliente (design partner)

1. **Crear el tenant:** concesionaria + sucursal(es) + usuario admin del cliente.
2. **Carga inicial:** importar su stock y clientes por CSV (E6-06). Si tiene financiaciones vigentes, cargar las principales a mano o por CSV.
3. **Capacitación:** 1-2 sesiones (1 h c/u) con el equipo del cliente sobre el flujo diario (stock, presupuesto, venta, cobranza).
4. **Datos de prueba fuera:** que operen con datos reales desde el día 1 (es lo que valida el producto).
5. **Soporte cercano:** canal directo las primeras 2-3 semanas; iterar sobre lo que rompe/molesta.

---

## 7. Go-to-market mínimo del piloto

**Perfil del design partner ideal:** agencia/concesionaria de Mendoza, 30-150 autos, hoy con **Excel + WhatsApp + cuaderno**, que hace **financiación propia** (ahí tu back-office brilla) y sufre el seguimiento de cobranzas.

**La oferta del piloto:**
- **60-90 días gratis** (o descuento fuerte) a cambio de: uso real diario + feedback + un **testimonio/caso de éxito** + permiso para usarlo comercialmente.
- Meta: **2-3 pilotos**, esperando que **1-2 conviertan a pago**.

**El pitch (una frase):** *"El back-office financiero serio que tu CRM no te da: stock, ventas y —sobre todo— tus cuotas y cobranzas bajo control, sin Excel."* Diferenciate de deConcesionarias (que es captación/CRM), no compitas en su cancha.

**Demo que cierra:** mostrar el flujo **venta → plan de cuotas → registro de cobro → alerta de mora** con datos realistas, y el dashboard con la plata que entra vs. la que falta cobrar.

**Cobro:** manual (transferencia + factura). La automatización (MercadoPago) llega en GA, cuando ya haya willingness-to-pay validada.

---

## 8. Criterios de éxito del MVP (salir del piloto → GA)

El piloto fue exitoso —y podés invertir en escalar— si a las ~8-12 semanas:

| Señal | Meta MVP |
|---|---|
| Uso real | ≥1 concesionaria cargando ventas/cobros **a diario** |
| Flujo crítico | venta→cobranza ejecutado con datos reales **sin bug bloqueante** |
| Seguridad | **0 incidentes** de aislamiento/fuga |
| Retención | Siguen usándolo tras 30 días (no lo abandonan por el Excel) |
| Willingness to pay | ≥1 piloto acepta **pagar** al terminar |
| Prueba social | ≥1 **testimonio/caso** documentado |

**Si se cumplen → GA:** automatizar cobro (Épica E7 + MercadoPago), facturación AFIP (E7-06), self-serve onboarding, escalar infra, y recién ahí multipublicador/WhatsApp (E10) para captación.
**Si no → pivotar:** el feedback dice qué falta o si el segmento no es el correcto — mejor descubrirlo con 2 pilotos que con 20 clientes pagos.

---

## 9. Riesgos del lanzamiento y mitigación

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Datos de clientes en un solo punto de falla (Pi) | Pérdida de datos = fin de la confianza | VPS con snapshots **o** Pi + backups off-site probados |
| Sos 1 dev y el scope es grande | El MVP nunca sale | **Cortar scope** agresivo; los 3 gates de §2 primero, features después |
| Fuga cross-tenant en producción | Legal + reputacional grave | Gate de test de aislamiento; nada sale sin verde |
| El cliente no puede cargar su stock | Abandona en la semana 1 | Importador CSV (E6-06) en el MVP |
| Falta de circuito fiscal (AFIP) | Objeción "no me sirve del todo" | Encuadrar el piloto como **complemento operativo**; AFIP en GA con fecha comprometida |
| Gold-plating (pulir de más) | Retrasa el aprendizaje | DoD estricto; si no está en §1-IN, no se hace |

---

## 10. Arranque inmediato (esta semana)

1. **Confirmá el encuadre** (piloto + cobro manual) o corregímelo.
2. **M0 ya:** montar DI + harness de tests (`E11-01/02`) y el pipeline CI + staging. Es el habilitador de todo.
3. **Primera historia de código:** `E2-01` (arreglar `createVenta` + test) — desbloquea el core y estrena el harness.
4. **En paralelo (no-código):** empezar a identificar 3-4 concesionarias candidatas en Mendoza para el piloto; el desarrollo y la búsqueda de design partners corren juntos.

> Cuando quieras, dejamos de planificar y **arranco por M0 + `E2-01`**. Decime "dale" y empiezo a implementar.

---

*Plan de lanzamiento derivado del backlog de [`PLAN_SCRUM.md`](./PLAN_SCRUM.md) + [`PLAN_SCRUM_ADENDA.md`](./PLAN_SCRUM_ADENDA.md). El MVP es un subconjunto deliberado: operar seguro y validar con clientes reales, antes de automatizar y escalar.*
