import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { softDeleteExtension } from './softDelete';
import { parentProtectionExtension } from './parentProtection';
import { tenancyExtension } from './tenancy';
import config from '../config';
import logger from '../utils/logger';

const connectionString = config.prisma.url || '';
const pool = new Pool({ connectionString: connectionString.replace('prisma+postgres://', 'postgres://') });
const adapter = new PrismaPg(pool);

const baseClient = new PrismaClient({ adapter } as any);

const prisma = baseClient
    .$extends(softDeleteExtension)
    .$extends(parentProtectionExtension)
    .$extends(tenancyExtension);

export default prisma;

// Graceful shutdown
process.on('SIGINT', async () => {
    await baseClient.$disconnect();
    await pool.end();
    logger.info('Prisma disconnected and pool closed');
    process.exit(0);
});
