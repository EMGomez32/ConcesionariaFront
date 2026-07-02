/**
 * Test de INTEGRACIÓN (DB real) del aislamiento multi-tenant.
 *
 * Cubre las historias E1-01 / E1-02 del plan de Scrum: la extensión de Prisma
 * debe garantizar que un tenant NO acceda a datos de otro, y ser FAIL-CLOSED
 * (sin contexto de tenant → bloquea, en vez de correr sin filtro).
 *
 * Requiere Postgres accesible (DATABASE_URL) con el schema aplicado.
 * Ejecutar:  npm run test:integration
 */
import prisma, { rawPrisma } from '../../infrastructure/database/prisma';
import { context } from '../../infrastructure/security/context';

function runAsTenant<T>(concesionariaId: number | null, roles: string[], fn: () => Promise<T>): Promise<T> {
    return context.run(
        { user: { userId: 1, concesionariaId, sucursalId: null, roles }, correlationId: 'test' },
        // async wrapper: garantiza que la query LAZY de Prisma se EJECUTE dentro del
        // contexto ALS. Si se devolviera la promise sin await, correría fuera del tenant.
        async () => await fn()
    );
}

describe('Aislamiento multi-tenant (extensión Prisma, DB real)', () => {
    let tenantA = 0;
    let tenantB = 0;
    let clienteAId = 0;
    let clienteBId = 0;

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

        const a = await rawPrisma.concesionaria.create({ data: { nombre: `Tenant A ${Date.now()}` } });
        const b = await rawPrisma.concesionaria.create({ data: { nombre: `Tenant B ${Date.now()}` } });
        tenantA = a.id;
        tenantB = b.id;

        const ca = await rawPrisma.cliente.create({ data: { concesionariaId: a.id, nombre: 'Cliente de A' } });
        const cb = await rawPrisma.cliente.create({ data: { concesionariaId: b.id, nombre: 'Cliente de B' } });
        clienteAId = ca.id;
        clienteBId = cb.id;
    });

    afterAll(async () => {
        await rawPrisma.cliente.deleteMany({ where: { concesionariaId: { in: [tenantA, tenantB] } } });
        await rawPrisma.concesionaria.deleteMany({ where: { id: { in: [tenantA, tenantB] } } });
        await rawPrisma.$disconnect();
    });

    it('un tenant solo ve sus propios registros en findMany', async () => {
        const clientes = await runAsTenant(tenantA, ['admin'], () => prisma.cliente.findMany());
        expect(clientes.length).toBeGreaterThan(0);
        expect(clientes.every((c: any) => c.concesionariaId === tenantA)).toBe(true);
        expect(clientes.some((c: any) => c.id === clienteBId)).toBe(false);
    });

    it('un tenant NO puede leer por id un registro de otro tenant (IDOR bloqueado)', async () => {
        const cliente = await runAsTenant(tenantA, ['admin'], () =>
            prisma.cliente.findUnique({ where: { id: clienteBId } })
        );
        expect(cliente).toBeNull();
    });

    it('FAIL-CLOSED: sin contexto de tenant, la query se bloquea', async () => {
        await expect(prisma.cliente.findMany()).rejects.toThrow(/tenant|fail-closed/i);
    });

    it('super_admin puede ver los registros de todos los tenants', async () => {
        const clientes = await runAsTenant(null, ['super_admin'], () => prisma.cliente.findMany());
        const ids = clientes.map((c: any) => c.id);
        expect(ids).toContain(clienteAId);
        expect(ids).toContain(clienteBId);
    });
});
