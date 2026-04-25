import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// En Prisma 7, usamos el adapter para conectar si el schema no tiene URL definida
// IMPORTANTE: DATABASE_URL debe ser una URL de postgres estándar (postgres://...)
// Si usas prisma+postgres://, debes usar la URL que te da el comando 'prisma dev'.
const connectionString = process.env.DATABASE_URL || '';
// Pool size 1 so the `set_config` below sticks for every query of this seed.
const pool = new Pool({ connectionString: connectionString.replace('prisma+postgres://', 'postgres://'), max: 1 });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
    console.log('Iniciando seed con Adapter...');

    // Bypass RLS for the seed: set the session var the policies look at.
    // false = session-scoped (stays until the connection closes); the pool
    // above is capped at 1 conn so this value applies to every query.
    await prisma.$executeRawUnsafe(`SELECT set_config('app.is_super_admin', 'true', false)`);

    // 1. Roles
    const roles = [
        { nombre: 'admin' },
        { nombre: 'vendedor' },
        { nombre: 'cobrador' },
        { nombre: 'postventa' },
        { nombre: 'lectura' },
        { nombre: 'super_admin' },
    ];

    for (const rol of roles) {
        await prisma.rol.upsert({
            where: { nombre: rol.nombre as any },
            update: {},
            create: rol as any,
        });
    }
    console.log('Roles creados.');

    // 2. Plan por defecto
    const planFree = await prisma.plan.upsert({
        where: { nombre: 'Free' },
        update: {},
        create: {
            nombre: 'Free',
            precio: 0,
            moneda: 'ARS',
            maxUsuarios: 5,
            maxSucursales: 1,
            maxVehiculos: 50,
        },
    });
    console.log('Plan Free creado.');

    // 3. Concesionaria Demo
    const existingDemo = await prisma.concesionaria.findFirst({
        where: { nombre: 'Concesionaria Demo' },
        include: { sucursales: true },
    });

    const concesionaria = existingDemo ?? await prisma.concesionaria.create({
        data: {
            nombre: 'Concesionaria Demo',
            cuit: '20-12345678-9',
            email: 'demo@concesionaria.com',
            subscription: {
                create: {
                    planId: planFree.id,
                    status: 'active',
                },
            },
            sucursales: {
                create: {
                    nombre: 'Sucursal Central',
                    direccion: 'Av. Libertador 1234',
                },
            },
        },
        include: {
            sucursales: true,
        },
    });
    console.log(existingDemo ? 'Concesionaria Demo ya existía.' : 'Concesionaria Demo creada.');

    // 4. Usuario Admin para la Demo
    const hashedAdminPassword = await bcrypt.hash('admin123', 10);
    const adminRole = await prisma.rol.findUnique({ where: { nombre: 'admin' } });

    if (adminRole) {
        await prisma.usuario.upsert({
            where: { concesionariaId_email: { concesionariaId: concesionaria.id, email: 'admin@demo.com' } },
            update: {},
            create: {
                nombre: 'Admin Demo',
                email: 'admin@demo.com',
                passwordHash: hashedAdminPassword,
                concesionariaId: concesionaria.id,
                sucursalId: concesionaria.sucursales[0].id,
                roles: {
                    create: {
                        rolId: adminRole.id,
                    },
                },
            },
        });
        console.log('Usuario Admin creado (user: admin@demo.com, pass: admin123).');
    }

    // 5. Usuario Super Admin (sin tenant — acceso a toda la plataforma)
    const hashedSuperPassword = await bcrypt.hash('super123', 10);
    const superAdminRole = await prisma.rol.findUnique({ where: { nombre: 'super_admin' } });

    if (superAdminRole) {
        await prisma.usuario.upsert({
            where: { concesionariaId_email: { concesionariaId: concesionaria.id, email: 'superadmin@demo.com' } },
            update: {},
            create: {
                nombre: 'Super Admin',
                email: 'superadmin@demo.com',
                passwordHash: hashedSuperPassword,
                concesionariaId: concesionaria.id,
                roles: {
                    create: {
                        rolId: superAdminRole.id,
                    },
                },
            },
        });
        console.log('Usuario Super Admin creado (user: superadmin@demo.com, pass: super123).');
    }

    console.log('Seed finalizado con éxito.');
}

main()
    .catch((e) => {
        console.error('Error en seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
