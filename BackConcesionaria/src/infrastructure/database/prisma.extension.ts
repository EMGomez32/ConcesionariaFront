import { PrismaClient } from '@prisma/client';
import { context } from '../security/context';

export const extendedPrisma = (prisma: PrismaClient) => {
    return prisma.$extends({
        query: {
            $allModels: {
                async $allOperations({ model, operation, args, query }) {
                    const tenantId = context.getTenantId();
                    const userContext = context.getUser();
                    const castArgs = args as any;

                    // Check if user is super_admin
                    const isSuperAdmin = userContext?.roles?.includes('super_admin') || false;

                    // 1. Models that DO NOT have concesionariaId
                    const globalModels = ['Concesionaria', 'Rol', 'Plan', 'AuditLog', 'RefreshToken'];
                    const isGlobal = globalModels.some(m => m.toLowerCase() === model.toLowerCase());

                    // Modelos hijos SIN concesionariaId propio: se aíslan por su relación PADRE
                    // en la capa de repositorio (findFirst/deleteMany con filtro de relación).
                    // La extensión NO les inyecta concesionariaId (rompería: "Unknown argument
                    // concesionariaId"). Solo se listan acá los que YA tienen el repo scopeado.
                    const parentScopedModels = ['PostventaItem', 'VehiculoArchivo'];
                    const isParentScoped = parentScopedModels.some(m => m.toLowerCase() === model.toLowerCase());

                    // 2. Automate Soft Delete filtering (deletedAt: null)
                    const softDeleteModels = ['Concesionaria', 'Sucursal', 'Usuario', 'Cliente', 'Proveedor', 'Vehiculo', 'Venta', 'Presupuesto', 'Reserva'];
                    if (softDeleteModels.some(m => m.toLowerCase() === model.toLowerCase())) {
                        if (['findFirst', 'findMany', 'findUnique', 'findUniqueOrThrow', 'count', 'aggregate', 'groupBy'].includes(operation)) {
                            castArgs.where = castArgs.where || {};
                            if (castArgs.where.deletedAt === undefined) {
                                castArgs.where.deletedAt = null;
                            }
                        }
                    }

                    // 3. Tenant isolation — FAIL-CLOSED.
                    // super_admin accede a todo (skip). Los modelos globales no llevan tenant.
                    // Para el resto: si NO hay tenant en contexto, se BLOQUEA (en lugar de correr
                    // sin filtro y exponer datos de otros clientes). Las operaciones pre-tenant
                    // (login / refresh) deben usar el cliente crudo (rawPrisma), no este.
                    if (!isGlobal && !isSuperAdmin) {
                        if (!tenantId) {
                            throw new Error(
                                `[tenant-guard] Operación '${operation}' sobre '${model}' bloqueada: ` +
                                `no hay contexto de tenant (fail-closed). Las operaciones pre-tenant deben usar rawPrisma.`
                            );
                        }

                        // Los modelos con concesionariaId propio se filtran acá. Los parent-scoped
                        // se filtran en su repositorio (por la relación padre), así que se saltean.
                        if (!isParentScoped) {
                            if (['findFirst', 'findMany', 'findUnique', 'findUniqueOrThrow', 'count', 'aggregate', 'groupBy'].includes(operation)) {
                                castArgs.where = { ...castArgs.where, concesionariaId: tenantId };
                            }

                            if (operation === 'create') {
                                castArgs.data = { ...castArgs.data, concesionariaId: tenantId };
                            }

                            if (['update', 'updateMany', 'delete', 'deleteMany', 'upsert'].includes(operation)) {
                                castArgs.where = { ...castArgs.where, concesionariaId: tenantId };
                                if (operation === 'upsert') {
                                    castArgs.create = { ...castArgs.create, concesionariaId: tenantId };
                                }
                            }
                        }
                    }

                    return query(castArgs);
                },
            },
        },
    });
};
