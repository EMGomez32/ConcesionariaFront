import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { extendedPrisma } from './prisma.extension';
import { auditExtension } from './audit.extension';
import { env } from '../../config/env';

const connectionString = env.DATABASE_URL;
const pool = new Pool({ connectionString: connectionString.replace('prisma+postgres://', 'postgres://') });
const adapter = new PrismaPg(pool);
const prismaClient = new PrismaClient({ adapter, log: [{ emit: 'event', level: 'query' }, { emit: 'stdout', level: 'error' }, { emit: 'stdout', level: 'info' }, { emit: 'stdout', level: 'warn' }] });

// tenancy (interno) + auditoría transversal (externo, envuelve al de tenant).
const prisma = auditExtension(extendedPrisma(prismaClient), prismaClient);

export default prisma;
export { prismaClient as rawPrisma };
