/**
 * Test UNIT (sin DB) del middleware authorize (RBAC).
 * Cubre la historia E1-07: se eliminó el bypass implícito de 'admin' y
 * super_admin es el único bypass global explícito.
 */
import { authorize } from '../interface/middlewares/authorize.middleware';
import { context } from '../infrastructure/security/context';
import { ForbiddenException } from '../domain/exceptions/BaseException';

function tryAuthorize(userRoles: string[], required: string[]): { passed: boolean; error?: any } {
    return context.run(
        { user: { userId: 1, concesionariaId: 1, sucursalId: null, roles: userRoles }, correlationId: 't' },
        () => {
            let passed = false;
            let error: any;
            try {
                authorize(...required)({} as any, {} as any, (() => { passed = true; }) as any);
            } catch (e) {
                error = e;
            }
            return { passed, error };
        }
    );
}

describe('authorize middleware (RBAC)', () => {
    it('deja pasar a super_admin en cualquier chequeo (bypass explícito)', () => {
        const { passed } = tryAuthorize(['super_admin'], ['admin']);
        expect(passed).toBe(true);
    });

    it('NO deja pasar a un admin en un chequeo super_admin-only (bypass de admin eliminado)', () => {
        const { passed, error } = tryAuthorize(['admin'], ['super_admin']);
        expect(passed).toBe(false);
        expect(error).toBeInstanceOf(ForbiddenException);
    });

    it('deja pasar cuando el usuario tiene uno de los roles requeridos', () => {
        const { passed } = tryAuthorize(['admin'], ['admin', 'super_admin']);
        expect(passed).toBe(true);
    });

    it('NO deja pasar a un vendedor en un chequeo de admin', () => {
        const { passed, error } = tryAuthorize(['vendedor'], ['admin']);
        expect(passed).toBe(false);
        expect(error).toBeInstanceOf(ForbiddenException);
    });
});
