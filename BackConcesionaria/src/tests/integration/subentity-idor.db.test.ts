/**
 * Test de INTEGRACIÓN (DB real) del aislamiento de SUB-ENTIDADES (historia E1-02b).
 *
 * Las entidades hijas SIN concesionariaId propio (ej. VehiculoArchivo) deben aislarse
 * por su relación padre. Un tenant NO puede leer archivos de otro tenant iterando IDs.
 *
 * Requiere Postgres (DATABASE_URL) con el schema aplicado. Ejecutar: npm run test:integration
 */
import { PrismaVehiculoArchivoRepository } from '../../infrastructure/database/repositories/PrismaVehiculoArchivoRepository';
import { rawPrisma } from '../../infrastructure/database/prisma';
import { context } from '../../infrastructure/security/context';

const repo = new PrismaVehiculoArchivoRepository();

function runAsTenant<T>(concesionariaId: number | null, roles: string[], fn: () => Promise<T>): Promise<T> {
    return context.run(
        { user: { userId: 1, concesionariaId, sucursalId: null, roles }, correlationId: 'test' },
        async () => await fn()
    );
}

describe('Aislamiento de sub-entidades por padre (E1-02b, DB real)', () => {
    let tenantA = 0;
    let tenantB = 0;
    let vehiculoBId = 0;
    let archivoAId = 0;
    let archivoBId = 0;

    beforeAll(async () => {
        try {
            await rawPrisma.$queryRaw`SELECT 1`;
        } catch (e) {
            throw new Error(
                'No se pudo conectar a la base de datos. Levantá Postgres y aplicá el schema ' +
                '(docker compose up -d db && npx prisma db push) antes de correr los tests de integración.\n' +
                `Detalle: ${(e as Error).message}`
            );
        }

        const a = await rawPrisma.concesionaria.create({ data: { nombre: `Sub A ${Date.now()}` } });
        const b = await rawPrisma.concesionaria.create({ data: { nombre: `Sub B ${Date.now()}` } });
        tenantA = a.id;
        tenantB = b.id;

        const sa = await rawPrisma.sucursal.create({ data: { concesionariaId: a.id, nombre: `Suc A ${Date.now()}` } });
        const sb = await rawPrisma.sucursal.create({ data: { concesionariaId: b.id, nombre: `Suc B ${Date.now()}` } });

        const va = await rawPrisma.vehiculo.create({
            data: { concesionariaId: a.id, sucursalId: sa.id, marca: 'VW', modelo: 'Gol', fechaIngreso: new Date('2026-01-01') },
        });
        const vb = await rawPrisma.vehiculo.create({
            data: { concesionariaId: b.id, sucursalId: sb.id, marca: 'VW', modelo: 'Gol', fechaIngreso: new Date('2026-01-01') },
        });
        vehiculoBId = vb.id;

        const aa = await rawPrisma.vehiculoArchivo.create({ data: { vehiculoId: va.id, url: 'http://x/a.jpg' } });
        const ab = await rawPrisma.vehiculoArchivo.create({ data: { vehiculoId: vb.id, url: 'http://x/b.jpg' } });
        archivoAId = aa.id;
        archivoBId = ab.id;
    });

    afterAll(async () => {
        await rawPrisma.vehiculoArchivo.deleteMany({ where: { vehiculo: { concesionariaId: { in: [tenantA, tenantB] } } } });
        await rawPrisma.vehiculo.deleteMany({ where: { concesionariaId: { in: [tenantA, tenantB] } } });
        await rawPrisma.sucursal.deleteMany({ where: { concesionariaId: { in: [tenantA, tenantB] } } });
        await rawPrisma.concesionaria.deleteMany({ where: { id: { in: [tenantA, tenantB] } } });
        await rawPrisma.$disconnect();
    });

    it('un tenant NO puede leer por id un archivo de otro tenant (IDOR bloqueado)', async () => {
        const archivo = await runAsTenant(tenantA, ['admin'], () => repo.findById(archivoBId));
        expect(archivo).toBeNull();
    });

    it('un tenant NO ve los archivos de un vehículo de otro tenant', async () => {
        const archivos = await runAsTenant(tenantA, ['admin'], () => repo.findByVehiculo(vehiculoBId));
        expect(archivos.length).toBe(0);
    });

    it('un tenant SÍ ve sus propios archivos', async () => {
        const archivo = await runAsTenant(tenantA, ['admin'], () => repo.findById(archivoAId));
        expect(archivo).not.toBeNull();
    });

    it('super_admin puede ver archivos de cualquier tenant', async () => {
        const archivo = await runAsTenant(null, ['super_admin'], () => repo.findById(archivoBId));
        expect(archivo).not.toBeNull();
    });
});
