import { AsyncLocalStorage } from 'async_hooks';

export interface UserContext {
    userId: number;
    concesionariaId: number | null;
    sucursalId: number | null;
    roles: string[];
}

export interface AppContext {
    user?: UserContext;
    correlationId?: string;
    ip?: string;
    userAgent?: string;
}

const storage = new AsyncLocalStorage<AppContext>();

export const context = {
    run: <T>(ctx: AppContext, fn: () => T): T => {
        return storage.run(ctx, fn);
    },
    get: (): AppContext | undefined => {
        return storage.getStore();
    },
    getUser: (): UserContext | undefined => {
        return storage.getStore()?.user;
    },
    getTenantId: (): number | undefined => {
        return storage.getStore()?.user?.concesionariaId || undefined;
    },
    isSuperAdmin: (): boolean => {
        return storage.getStore()?.user?.roles?.includes('super_admin') ?? false;
    },
    getIp: (): string | undefined => {
        return storage.getStore()?.ip;
    },
    getUserAgent: (): string | undefined => {
        return storage.getStore()?.userAgent;
    },
    getCorrelationId: (): string | undefined => {
        return storage.getStore()?.correlationId;
    },
};
