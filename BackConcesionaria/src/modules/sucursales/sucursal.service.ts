import { Prisma, Sucursal } from '@prisma/client';
import prisma from '../../prisma';
import ApiError from '../../utils/ApiError';
import { QueryOptions, PaginatedResponse } from '../../types/common';

export const getSucursales = async (
    filter: Prisma.SucursalWhereInput,
    options: QueryOptions
): Promise<PaginatedResponse<Sucursal>> => {
    const { limit = 20, page = 1, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    const limitNum = parseInt(limit as string, 10);
    const pageNum = parseInt(page as string, 10);

    const results = await prisma.sucursal.findMany({
        where: filter,
        take: limitNum,
        skip: (pageNum - 1) * limitNum,
        orderBy: { [sortBy as string]: sortOrder },
        include: {
            concesionaria: {
                select: {
                    id: true,
                    nombre: true,
                },
            },
        },
    });

    const total = await prisma.sucursal.count({ where: filter });

    return {
        results,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        totalResults: total,
    };
};

export const getSucursalById = async (id: number) => {
    const sucursal = await prisma.sucursal.findUnique({
        where: { id },
    });
    if (!sucursal) {
        throw new ApiError(404, 'Sucursal no encontrada', 'NOT_FOUND');
    }
    return sucursal;
};

export const createSucursal = async (data: Prisma.SucursalUncheckedCreateInput) => {
    return prisma.sucursal.create({ data });
};

export const updateSucursal = async (id: number, data: Prisma.SucursalUpdateInput) => {
    await getSucursalById(id);
    return prisma.sucursal.update({
        where: { id },
        data,
    });
};

export const deleteSucursal = async (id: number) => {
    await getSucursalById(id);
    return prisma.sucursal.delete({
        where: { id },
    });
};
