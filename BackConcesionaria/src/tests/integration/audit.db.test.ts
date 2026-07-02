/**
 * Test de INTEGRACIÓN (DB real) de la auditoría transversal (E4-02).
 *
 * Verifica que cada create/update/delete de negocio deje un AuditLog automático
 * con actor (usuario), IP, user-agent y acción — sin llamar a nada en los use-cases.
 * Las lecturas NO se auditan.
 *
 * Requiere Postgres (DATABASE_URL) con el schema aplicado. Ejecutar: npm run test:integration
 */
import prisma, { rawPrisma } from '../../infrastructure/database/prisma';
import { context } from '../../infrastructure/security/context';

let tenantId = 0;
let userId = 0;

function runAsTenant<T>(fn: () => Promise<T>): Promise<T> {
    return context.run(
        {
            user: { userId, concesionariaId: tenantId, sucursalId: null, roles: ['admin'] },
            correlationId: 'test',
            ip: '203.0.113.7',
            userAgent: 'jest-agent',
        },
        async () => await fn()
    );
}

describe('Auditoría transversal (E4-02, DB real)', () => {
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
        const c = await rawPrisma.concesionaria.create({ data: { nombre: `Audit ${Date.now()}` } });
        tenantId = c.id;
        const u = await rawPrisma.usuario.create({
            data: { concesionariaId: c.id, nombre: 'Actor', email: `actor-${Date.now()}@test.com` },
        });
        userId = u.id;
    });

    afterAll(async () => {
        await rawPrisma.auditLog.deleteMany({ where: { concesionariaId: tenantId } });
        await rawPrisma.cliente.deleteMany({ where: { concesionariaId: tenantId } });
        await rawPrisma.usuario.deleteMany({ where: { concesionariaId: tenantId } });
        await rawPrisma.concesionaria.deleteMany({ where: { id: tenantId } });
        await rawPrisma.$disconnect();
    });

    it('audita un CREATE con actor, IP y user-agent', async () => {
        const cliente: any = await runAsTenant(() =>
            prisma.cliente.create({ data: { concesionariaId: tenantId, nombre: 'Cliente Audit' } })
        );
        const logs = await rawPrisma.auditLog.findMany({
            where: { concesionariaId: tenantId, entidad: 'Cliente', entidadId: cliente.id, accion: 'create' },
        });
        expect(logs.length).toBe(1);
        expect(logs[0].usuarioId).toBe(userId);
        expect(logs[0].ip).toBe('203.0.113.7');
        expect(logs[0].userAgent).toBe('jest-agent');
    });

    it('audita un UPDATE', async () => {
        const cliente: any = await runAsTenant(() =>
            prisma.cliente.create({ data: { concesionariaId: tenantId, nombre: 'Antes' } })
        );
        await runAsTenant(() => prisma.cliente.update({ where: { id: cliente.id }, data: { nombre: 'Despues' } }));
        const logs = await rawPrisma.auditLog.findMany({
            where: { entidad: 'Cliente', entidadId: cliente.id, accion: 'update' },
        });
        expect(logs.length).toBeGreaterThan(0);
        expect(logs[0].detalle).toContain('nombre');
    });

    it('audita un DELETE', async () => {
        const cliente: any = await runAsTenant(() =>
            prisma.cliente.create({ data: { concesionariaId: tenantId, nombre: 'Para borrar' } })
        );
        await runAsTenant(() => prisma.cliente.delete({ where: { id: cliente.id } }));
        const logs = await rawPrisma.auditLog.findMany({
            where: { entidad: 'Cliente', entidadId: cliente.id, accion: 'delete_soft' },
        });
        expect(logs.length).toBeGreaterThan(0);
    });

    it('NO audita las lecturas', async () => {
        const before = await rawPrisma.auditLog.count({ where: { concesionariaId: tenantId } });
        await runAsTenant(() => prisma.cliente.findMany());
        const after = await rawPrisma.auditLog.count({ where: { concesionariaId: tenantId } });
        expect(after).toBe(before);
    });
});
