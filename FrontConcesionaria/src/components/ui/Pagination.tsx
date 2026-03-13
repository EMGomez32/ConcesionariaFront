import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    return (
        <div className="pagination-container flex items-center justify-center gap-6 mt-8">
            <Button
                variant="secondary"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => onPageChange(currentPage - 1)}
                className="rounded-xl border-white/5 bg-slate-900"
            >
                <ChevronLeft size={16} className="mr-1" /> Anterior
            </Button>

            <div className="flex items-center gap-2">
                <span className="page-indicator w-10 h-10 bg-accent text-white rounded-xl flex items-center justify-center font-black text-sm shadow-lg shadow-accent/20">
                    {currentPage}
                </span>
                <span className="text-muted text-xs font-bold uppercase tracking-widest px-2">
                    de {totalPages}
                </span>
            </div>

            <Button
                variant="secondary"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => onPageChange(currentPage + 1)}
                className="rounded-xl border-white/5 bg-slate-900"
            >
                Siguiente <ChevronRight size={16} className="ml-1" />
            </Button>

            <style>{`
                .pagination-container {
                    animation: fadeIn 0.5s ease-out;
                }
                .page-indicator {
                    transition: transform 0.2s;
                }
                .page-indicator:hover {
                    transform: scale(1.1);
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default Pagination;
