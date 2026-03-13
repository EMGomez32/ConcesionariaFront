import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// En Prisma 7, usamos el adapter para conectar si el schema no tiene URL definida
// IMPORTANTE: DATABASE_URL debe ser una URL de postgres estándar (postgres://...)
// Si usas prisma+postgres://, debes usar la URL que te da el comando 'prisma dev'.
const connectionString = process.env.DATABASE_URL || '';
const pool = new Pool({ connectionString: connectionString.replace('prisma+postgres://', 'postgres://') });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
    console.log('Iniciando seed con Adapter...');

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
    const concesionaria = await prisma.concesionaria.create({
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
    console.log('Concesionaria Demo creada.');

    // 4. Usuario Admin para la Demo
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminRole = await prisma.rol.findUnique({ where: { nombre: 'admin' } });

    if (adminRole) {
        await prisma.usuario.create({
            data: {
                nombre: 'Admin Demo',
                email: 'admin@demo.com',
                passwordHash: hashedPassword,
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
