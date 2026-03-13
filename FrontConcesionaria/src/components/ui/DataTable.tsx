import React, { type ReactNode } from 'react';
import { ShoppingBag } from 'lucide-react';
import Pagination from './Pagination';

export interface Column<T> {
    header: string;
    accessor?: keyof T | ((item: T) => ReactNode);
    className?: string;
    style?: React.CSSProperties;
    align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    isLoading?: boolean;
    onRowClick?: (item: T) => void;
    currentPage?: number;
    totalPages?: number;
    onPageChange?: (page: number) => void;
    emptyMessage?: string;
    emptyIcon?: ReactNode;
    onClearFilters?: () => void;
}

const DataTable = <T extends { id: string | number }>({
    columns,
    data,
    isLoading,
    onRowClick,
    currentPage,
    totalPages,
    onPageChange,
    emptyMessage = "No se encontraron registros",
    emptyIcon = <ShoppingBag size={40} className="text-slate-600" />,
    onClearFilters
}: DataTableProps<T>) => {
    return (
        <div className="space-y-4">
            <div className="table-container card overflow-hidden">
                <table className="data-table">
                    <thead>
                        <tr>
                            {columns.map((col, idx) => (
                                <th
                                    key={idx}
                                    className={col.className}
                                    style={{ textAlign: col.align || 'left', ...col.style }}
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={`skeleton-${i}`}>
                                    {columns.map((_, idx) => (
                                        <td key={`skeleton-col-${idx}`} style={{ padding: '1.25rem 1rem' }}>
                                            <div
                                                className="h-5 bg-slate-800/60 rounded animate-pulse"
                                                style={{ width: idx === 0 ? '60%' : idx === columns.length - 1 ? '40%' : '100%' }}
                                            />
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length}>
                                    <div className="flex flex-col items-center py-20 text-muted">
                                        <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mb-4 ring-1 ring-slate-700">
                                            {emptyIcon}
                                        </div>
                                        <p className="text-xl font-black text-slate-400 mb-4">{emptyMessage}</p>
                                        {onClearFilters && (
                                            <button
                                                onClick={onClearFilters}
                                                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-sm tracking-widest text-slate-300 rounded-xl font-bold uppercase transition-all hover:scale-105 border border-slate-700"
                                            >
                                                Limpiar Filtros
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            data.map((item) => (
                                <tr
                                    key={item.id}
                                    onClick={() => onRowClick?.(item)}
                                    className={onRowClick ? 'cursor-pointer group' : ''}
                                >
                                    {columns.map((col, idx) => (
                                        <td
                                            key={idx}
                                            className={col.className}
                                            style={{ textAlign: col.align || 'left', ...col.style }}
                                        >
                                            {typeof col.accessor === 'function'
                                                ? col.accessor(item)
                                                : col.accessor
                                                    ? (item[col.accessor] as ReactNode)
                                                    : null}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {onPageChange && totalPages && totalPages > 1 && (
                <Pagination
                    currentPage={currentPage || 1}
                    totalPages={totalPages}
                    onPageChange={onPageChange}
                />
            )}
        </div>
    );
};

export default DataTable;
