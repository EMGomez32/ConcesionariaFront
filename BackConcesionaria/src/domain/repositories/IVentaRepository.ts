import { Venta } from '../entities/Venta';
import { PaginatedResponse, QueryOptions } from '../../types/common';

export interface IVentaRepository {
    findAll(filter?: any, options?: QueryOptions): Promise<PaginatedResponse<Venta>>;
    findById(id: number): Promise<Venta | null>;
    create(data: any): Promise<Venta>;
    update(id: number, data: any): Promise<Venta>;
    delete(id: number): Promise<void>;

    // Custom methods for transactions
    createWithTransaction(data: any, tx: any): Promise<Venta>;
}
