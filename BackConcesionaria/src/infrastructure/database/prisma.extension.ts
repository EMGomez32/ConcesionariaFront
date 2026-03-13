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

                    // 3. Inject Tenant ID for tenant-specific models
                    // IMPORTANT: super_admin can access ALL data, so we skip tenant filtering for them
                    if (tenantId && !isGlobal && !isSuperAdmin) {
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

                    return query(castArgs);
                },
            },
        },
    });
};
