import { PrismaClient } from '@prisma/client';
import { context } from '../security/context';

/**
 * Auditoría TRANSVERSAL (E4-02).
 *
 * Envuelve al cliente Prisma (ya extendido con tenancy) y, después de cada
 * create/update/delete/upsert de negocio, escribe un AuditLog con el actor
 * (usuario), IP, user-agent y un resumen de lo escrito. Es transparente: no hay
 * que llamar a nada desde los use-cases.
 *
 * - El AuditLog se escribe con `auditWriter` (el cliente BASE, sin extensiones)
 *   para NO re-disparar este hook ni la inyección de tenant → sin loops.
 * - Se saltean lecturas, el propio AuditLog, RefreshToken y las operaciones sin
 *   usuario en contexto (seed / pre-tenant / sistema).
 *
 * Limitaciones conocidas (follow-up E4-02b):
 *  - No captura el estado ANTERIOR en updates (solo lo que se escribió). Para el
 *    diff "de qué valor a qué valor" hace falta un pre-read.
 *  - Escritura fuera de la transacción del caller: si un $transaction hace rollback,
 *    el AuditLog queda huérfano (poco frecuente).
 *  - No audita updateMany/deleteMany (entidadId ambiguo).
 */

const WRITE_OPS: Record<string, string> = {
    create: 'create',
    update: 'update',
    upsert: 'update',
    delete: 'delete_soft',
};

const SKIP_MODELS = ['AuditLog', 'RefreshToken'];
const REDACT_KEYS = ['passwordHash', 'password', 'token', 'refreshToken'];

function safeDetalle(operation: string, data: any): string {
    try {
        if (!data || typeof data !== 'object') return operation;
        const clone: Record<string, unknown> = {};
        for (const k of Object.keys(data)) {
            clone[k] = REDACT_KEYS.includes(k) ? '***' : (data as any)[k];
        }
        return JSON.stringify(clone).slice(0, 1000);
    } catch {
        return operation;
    }
}

export const auditExtension = <T extends object>(client: T, auditWriter: PrismaClient): T => {
    // El hook se aplica en runtime; para los consumers preservamos el tipo del
    // cliente de entrada (la extensión no agrega modelos/métodos, solo un hook de query),
    // así no se pierde la inferencia de $transaction(tx), etc.
    return (client as any).$extends({
        query: {
            $allModels: {
                async $allOperations({ model, operation, args, query }: any) {
                    const result = await query(args);

                    const accion = WRITE_OPS[operation];
                    const user = context.getUser();
                    if (!accion || !user || SKIP_MODELS.includes(model)) {
                        return result;
                    }

                    const entidadId =
                        result && typeof result === 'object' && typeof result.id === 'number'
                            ? result.id
                            : null;

                    // Necesitamos un concesionariaId para scopear el log (columna obligatoria).
                    const concesionariaId =
                        (result && typeof result === 'object' && result.concesionariaId) ??
                        context.getTenantId() ??
                        null;
                    if (concesionariaId == null) return result;

                    try {
                        await auditWriter.auditLog.create({
                            data: {
                                concesionariaId,
                                usuarioId: user.userId ?? null,
                                entidad: model,
                                entidadId,
                                accion: accion as any,
                                detalle: safeDetalle(operation, (args as any)?.data),
                                ip: context.getIp() ?? null,
                                userAgent: context.getUserAgent() ?? null,
                            } as any,
                        });
                    } catch {
                        // La auditoría NO debe romper la operación de negocio.
                    }

                    return result;
                },
            },
        },
    }) as T;
};
