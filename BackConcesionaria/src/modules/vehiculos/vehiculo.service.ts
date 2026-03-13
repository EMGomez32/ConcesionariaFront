import { Prisma, Vehiculo } from '@prisma/client';
import prisma from '../../prisma';
import ApiError from '../../utils/ApiError';
import { QueryOptions, PaginatedResponse } from '../../types/common';

export const getVehiculos = async (
    filter: Prisma.VehiculoWhereInput,
    options: QueryOptions
): Promise<PaginatedResponse<Vehiculo>> => {
    const { limit = 20, page = 1, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    const limitNum = parseInt(limit as string, 10);
    const pageNum = parseInt(page as string, 10);

    const results = await prisma.vehiculo.findMany({
        where: filter,
        take: limitNum,
        skip: (pageNum - 1) * limitNum,
        orderBy: { [sortBy as string]: sortOrder },
        include: {
            sucursal: true,
            archivos: true
        }
    });

    const total = await prisma.vehiculo.count({ where: filter });

    return {
        results,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        totalResults: total,
    };
};

export const getVehiculoById = async (id: number) => {
    const vehiculo = await prisma.vehiculo.findUnique({
        where: { id },
        include: {
            sucursal: true,
            archivos: true,
            movimientos: {
                include: {
                    desdeSucursal: true,
                    hastaSucursal: true
                }
            }
        }
    });
    if (!vehiculo) {
        throw new ApiError(404, 'Vehículo no encontrado', 'NOT_FOUND');
    }
    return vehiculo;
};

export const createVehiculo = async (data: Prisma.VehiculoCreateInput) => {
    return prisma.vehiculo.create({ data });
};

export const updateVehiculo = async (id: number, data: Prisma.VehiculoUpdateInput) => {
    await getVehiculoById(id);
    return prisma.vehiculo.update({
        where: { id },
        data,
    });
};

export const deleteVehiculo = async (id: number) => {
    await getVehiculoById(id);

    // No permitir borrar si tiene ventas asociadas
    const hasVentas = await prisma.venta.count({ where: { vehiculoId: id } });
    if (hasVentas > 0) {
        throw new ApiError(400, 'No se puede eliminar el vehículo porque tiene ventas asociadas', 'HAS_RELATIONS');
    }

    // No permitir borrar si tiene reservas activas
    const hasReservas = await prisma.reserva.count({ where: { vehiculoId: id, estado: 'activa' } });
    if (hasReservas > 0) {
        throw new ApiError(400, 'No se puede eliminar el vehículo porque tiene una reserva activa', 'HAS_RELATIONS');
    }

    return prisma.vehiculo.delete({
        where: { id },
    });
};
