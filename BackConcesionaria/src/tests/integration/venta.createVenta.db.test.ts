/**
 * Test de INTEGRACIÓN contra una base de datos PostgreSQL REAL (no mock).
 *
 * Cubre la historia E2-01 del plan de Scrum: "createVenta funciona end-to-end".
 * Regresión que previene: antes, CreateVenta escribía `estado: 'finalizada'`, un
 * campo que NO existe en el modelo Venta, lo que hacía fallar la creación en runtime
 * con PrismaClientValidationError. El mock de Prisma (venta.service.test.ts) tapaba
 * este bug dando verde falso; por eso este test usa la DB real.
 *
 * Requisitos para correrlo:
 *   1. Postgres accesible vía la variable de entorno DATABASE_URL del backend.
 *   2. Schema aplicado (npx prisma db push  ó  npx prisma migrate deploy).
 *   3. Ejecutar con:  npm run test:integration
 *
 * Se corre con jest.integration.config.js (SIN el mock global de src/tests/singleton.ts).
 */
import { CreateVenta } from '../../application/use-cases/ventas/CreateVenta';
import { PrismaVentaRepository } from '../../infrastructure/database/repositories/PrismaVentaRepository';
import { PrismaVehiculoRepository } from '../../infrastructure/database/repositories/PrismaVehiculoRepository';
import { rawPrisma } from '../../infrastructure/database/prisma';
import { context } from '../../infrastructure/security/context';

const createVentaUC = new CreateVenta(new PrismaVentaRepository(), new PrismaVehiculoRepository());

/**
 * Ejecuta un caso de uso dentro del contexto de un tenant (simula un request autenticado).
 * Necesario porque la extensión de Prisma es FAIL-CLOSED: sin tenant en contexto, bloquea.
 */
function runAsTenant<T>(concesionariaId: number, sucursalId: number, userId: number, fn: () => Promise<T>): Promise<T> {
    return context.run(
        { user: { userId, concesionariaId, sucursalId, roles: ['admin'] }, correlationId: 'test' },
        async () => await fn()
    );
}

// IDs de concesionarias creadas por cada test, para limpiar en afterEach.
let concesionariaIdActual: number | null = null;

/** Crea el árbol mínimo de datos para poder registrar una venta. */
async function crearDatosBase() {
    const sufijo = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;

    const concesionaria = await rawPrisma.concesionaria.create({
        data: { nombre: `Test Concesionaria ${sufijo}` },
    });
    concesionariaIdActual = concesionaria.id;

    const sucursal = await rawPrisma.sucursal.create({
        data: { concesionariaId: concesionaria.id, nombre: `Sucursal ${sufijo}` },
    });

    const cliente = await rawPrisma.cliente.create({
        data: { concesionariaId: concesionaria.id, nombre: `Cliente ${sufijo}` },
    });

    const vendedor = await rawPrisma.usuario.create({
        data: {
            concesionariaId: concesionaria.id,
            sucursalId: sucursal.id,
            nombre: `Vendedor ${sufijo}`,
            email: `vendedor-${sufijo}@test.com`,
        },
    });

    const vehiculo = await rawPrisma.vehiculo.create({
        data: {
            concesionariaId: concesionaria.id,
            sucursalId: sucursal.id,
            marca: 'Toyota',
            modelo: 'Corolla',
            fechaIngreso: new Date('2026-01-01'),
        },
    });

    return { concesionaria, sucursal, cliente, vendedor, vehiculo };
}

/** Borra TODO lo creado para una concesionaria, en orden seguro de FKs (hard delete). */
async function limpiarConcesionaria(concesionariaId: number) {
    // La auditoría transversal crea AuditLog en cada write; se borran primero
    // (referencian concesionariaId/usuarioId) para poder limpiar el resto.
    await rawPrisma.auditLog.deleteMany({ where: { concesionariaId } });
    const ventas = await rawPrisma.venta.findMany({ where: { concesionariaId }, select: { id: true } });
    const ventaIds = ventas.map((v) => v.id);

    if (ventaIds.length) {
        await rawPrisma.ventaPago.deleteMany({ where: { ventaId: { in: ventaIds } } });
        await rawPrisma.ventaExtra.deleteMany({ where: { ventaId: { in: ventaIds } } });
        await rawPrisma.ventaCanjeVehiculo.deleteMany({ where: { ventaId: { in: ventaIds } } });
    }
    await rawPrisma.reserva.deleteMany({ where: { concesionariaId } });
    await rawPrisma.venta.deleteMany({ where: { concesionariaId } });
    await rawPrisma.presupuesto.deleteMany({ where: { concesionariaId } });
    await rawPrisma.vehiculo.deleteMany({ where: { concesionariaId } });
    await rawPrisma.usuario.deleteMany({ where: { concesionariaId } });
    await rawPrisma.cliente.deleteMany({ where: { concesionariaId } });
    await rawPrisma.sucursal.deleteMany({ where: { concesionariaId } });
    await rawPrisma.concesionaria.delete({ where: { id: concesionariaId } });
}

describe('CreateVenta (integración, DB real)', () => {
    beforeAll(async () => {
        // Falla temprano y claro si no hay DB accesible.
        try {
            await rawPrisma.$queryRaw`SELECT 1`;
        } catch (e) {
            throw new Error(
                'No se pudo conectar a la base de datos. Levantá Postgres y aplicá el schema ' +
                '(docker compose up -d db && npx prisma db push) antes de correr los tests de integración.\n' +
                `Detalle: ${(e as Error).message}`
            );
        }
    });

    afterEach(async () => {
        if (concesionariaIdActual) {
            await limpiarConcesionaria(concesionariaIdActual);
            concesionariaIdActual = null;
        }
    });

    afterAll(async () => {
        await rawPrisma.$disconnect();
    });

    it('crea una venta con pagos y canje en una transacción y marca el vehículo como vendido', async () => {
        const { sucursal, cliente, vendedor, vehiculo } = await crearDatosBase();

        // Segundo vehículo, que entra como parte de pago (canje).
        const vehiculoCanje = await rawPrisma.vehiculo.create({
            data: {
                concesionariaId: sucursal.concesionariaId,
                sucursalId: sucursal.id,
                marca: 'Fiat',
                modelo: 'Cronos',
                fechaIngreso: new Date('2026-02-01'),
            },
        });

        const venta: any = await runAsTenant(sucursal.concesionariaId, sucursal.id, vendedor.id, () =>
            createVentaUC.execute({
                sucursalId: sucursal.id,
                vehiculoId: vehiculo.id,
                clienteId: cliente.id,
                vendedorId: vendedor.id,
                fechaVenta: new Date('2026-07-01'),
                precioVenta: 15_000_000,
                pagos: [{ monto: 5_000_000, metodo: 'efectivo' }],
                canjes: [{ vehiculoCanjeId: vehiculoCanje.id, valorTomado: 3_000_000 }],
            })
        );

        // La venta se creó
        expect(venta.id).toBeDefined();
        expect(Number(venta.precioVenta)).toBe(15_000_000);
        // El ciclo de la venta se representa con estadoEntrega (default 'pendiente')
        expect(venta.estadoEntrega).toBe('pendiente');
        // REGRESIÓN: el modelo Venta NO tiene campo `estado` (antes rompía en runtime)
        expect(venta).not.toHaveProperty('estado');

        // El pago y el canje se persistieron dentro de la misma transacción
        const pagos = await rawPrisma.ventaPago.count({ where: { ventaId: venta.id } });
        const canjes = await rawPrisma.ventaCanjeVehiculo.count({ where: { ventaId: venta.id } });
        expect(pagos).toBe(1);
        expect(canjes).toBe(1);

        // El vehículo quedó marcado como vendido
        const vehiculoActualizado = await rawPrisma.vehiculo.findUnique({ where: { id: vehiculo.id } });
        expect(vehiculoActualizado?.estado).toBe('vendido');
    });

    it('rechaza vender un vehículo que ya está vendido', async () => {
        const { sucursal, cliente, vendedor, vehiculo } = await crearDatosBase();

        await runAsTenant(sucursal.concesionariaId, sucursal.id, vendedor.id, () =>
            createVentaUC.execute({
                sucursalId: sucursal.id,
                vehiculoId: vehiculo.id,
                clienteId: cliente.id,
                vendedorId: vendedor.id,
                fechaVenta: new Date('2026-07-01'),
                precioVenta: 10_000_000,
            })
        );

        await expect(
            runAsTenant(sucursal.concesionariaId, sucursal.id, vendedor.id, () =>
                createVentaUC.execute({
                    sucursalId: sucursal.id,
                    vehiculoId: vehiculo.id,
                    clienteId: cliente.id,
                    vendedorId: vendedor.id,
                    fechaVenta: new Date('2026-07-02'),
                    precioVenta: 10_000_000,
                })
            )
        ).rejects.toThrow(/ya está vendido/i);
    });

    it('convierte la reserva y acepta el presupuesto asociados al registrar la venta', async () => {
        const { sucursal, cliente, vendedor, vehiculo } = await crearDatosBase();

        const reserva = await rawPrisma.reserva.create({
            data: {
                concesionariaId: sucursal.concesionariaId,
                sucursalId: sucursal.id,
                vehiculoId: vehiculo.id,
                clienteId: cliente.id,
                fecha: new Date('2026-06-01'),
            },
        });

        const presupuesto = await rawPrisma.presupuesto.create({
            data: {
                concesionariaId: sucursal.concesionariaId,
                sucursalId: sucursal.id,
                nroPresupuesto: `P-${Date.now()}`,
                clienteId: cliente.id,
                vendedorId: vendedor.id,
                fechaCreacion: new Date('2026-06-01'),
            },
        });

        await runAsTenant(sucursal.concesionariaId, sucursal.id, vendedor.id, () =>
            createVentaUC.execute({
                sucursalId: sucursal.id,
                vehiculoId: vehiculo.id,
                clienteId: cliente.id,
                vendedorId: vendedor.id,
                fechaVenta: new Date('2026-07-01'),
                precioVenta: 12_000_000,
                reservaId: reserva.id,
                presupuestoId: presupuesto.id,
            })
        );

        const reservaActualizada = await rawPrisma.reserva.findUnique({ where: { id: reserva.id } });
        const presupuestoActualizado = await rawPrisma.presupuesto.findUnique({ where: { id: presupuesto.id } });

        expect(reservaActualizada?.estado).toBe('convertida_en_venta');
        expect(presupuestoActualizado?.estado).toBe('aceptado');
    });
});
