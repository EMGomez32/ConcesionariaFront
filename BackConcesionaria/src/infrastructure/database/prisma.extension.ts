import { PrismaClient } from '@prisma/client';
import { context } from '../security/context';

// Models that have a `deletedAt` column. Reads filter `deletedAt: null`,
// and `delete`/`deleteMany` are intercepted and turned into soft deletes.
const SOFT_DELETE_MODELS = [
    'Concesionaria',
    'Sucursal',
    'Usuario',
    'Cliente',
    'Proveedor',
    'Vehiculo',
    'VehiculoArchivo',
    'IngresoVehiculo',
    'VehiculoMovimiento',
    'Reserva',
    'Presupuesto',
    'PresupuestoItem',
    'PresupuestoExtra',
    'PresupuestoCanjeVehiculo',
    'Venta',
    'VentaPago',
    'VentaExtra',
    'VentaCanjeVehiculo',
    'Financiacion',
    'Cuota',
    'PagoCuota',
    'GastoVehiculo',
    'CategoriaGastoVehiculo',
    'GastoFijo',
    'CategoriaGastoFijo',
    'Financiera',
    'SolicitudFinanciacion',
    'PostventaCaso',
    'PostventaItem',
];

const isSoftDeleteModel = (model: string) =>
    SOFT_DELETE_MODELS.some((m) => m.toLowerCase() === model.toLowerCase());

const accessor = (model: string) =>
    model.charAt(0).toLowerCase() + model.slice(1);

export const extendedPrisma = (prisma: PrismaClient) => {
    return prisma.$extends({
        query: {
            $allModels: {
                async $allOperations({ model, operation, args, query }) {
                    const tenantId = context.getTenantId();
                    const userContext = context.getUser();
                    const castArgs = args as any;

                    const isSuperAdmin = userContext?.roles?.includes('super_admin') || false;

                    // Models that DO NOT have concesionariaId
                    const globalModels = ['Concesionaria', 'Rol', 'Plan', 'AuditLog', 'RefreshToken'];
                    const isGlobal = globalModels.some((m) => m.toLowerCase() === model.toLowerCase());

                    // Soft-delete read filter
                    if (isSoftDeleteModel(model)) {
                        if (['findFirst', 'findMany', 'findUnique', 'findUniqueOrThrow', 'count', 'aggregate', 'groupBy'].includes(operation)) {
                            castArgs.where = castArgs.where || {};
                            if (castArgs.where.deletedAt === undefined) {
                                castArgs.where.deletedAt = null;
                            }
                        }
                    }

                    // Tenant injection (skip for super_admin)
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

                    // Soft-delete interception: rewrite delete/deleteMany as updates
                    // setting `deletedAt`. Uses the raw `prisma` client (closure)
                    // to avoid re-entering this extension.
                    if (isSoftDeleteModel(model)) {
                        if (operation === 'delete') {
                            return (prisma as any)[accessor(model)].update({
                                where: castArgs.where,
                                data: { deletedAt: new Date() },
                            });
                        }
                        if (operation === 'deleteMany') {
                            return (prisma as any)[accessor(model)].updateMany({
                                where: castArgs.where,
                                data: { deletedAt: new Date() },
                            });
                        }
                    }

                    return query(castArgs);
                },
            },
        },
    });
};
