import {
    RefreshCw,
    Pencil,
    FileText,
    MapPin,
    Car,
    ArrowRightLeft,
} from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import { fmt, currencyFmt, STATUS, calcTotal } from '../presupuestos.utils';
import type { EstadoPresupuesto } from '../../../types/presupuesto.types';
import type { PresupuestoItem, PresupuestoRow } from '../presupuestos.types';

interface DetailPresupuestoModalProps {
    isOpen: boolean;
    onClose: () => void;
    detail: PresupuestoRow | null;
    onEdit: (p: PresupuestoRow) => void;
}

/**
 * Modal de detalle de Presupuesto. Vista read-only con todas las unidades,
 * canje (si tiene), totales calculados, y botón para editar.
 *
 * Sprint 4 — extraído de PresupuestosPage.tsx (era el modal más grande
 * después del Create, ~113 LOC).
 */
const DetailPresupuestoModal = ({ isOpen, onClose, detail, onEdit }: DetailPresupuestoModalProps) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={detail?.nroPresupuesto ?? 'Expediente Comercial'}
            subtitle={detail ? `SUCURSAL: ${detail.sucursal?.nombre ?? 'NO ESPECIFICADA'}` : undefined}
            maxWidth="900px"
            footer={detail ? (
                <div className="flex justify-between items-center w-full">
                    <div>
                        <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">
                            Impacto Final de la Operación
                        </p>
                        <p className="text-2xl font-black text-accent">
                            {currencyFmt(calcTotal(detail), detail.moneda)}
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <Button variant="secondary" onClick={onClose}>Cerrar Expediente</Button>
                        <Button
                            variant="primary"
                            className="px-8 shadow-glow"
                            onClick={() => {
                                onClose();
                                onEdit(detail);
                            }}
                        >
                            <Pencil size={16} className="mr-2" /> Alterar Parámetros
                        </Button>
                    </div>
                </div>
            ) : undefined}
        >
            {!detail ? (
                <div className="p-24 text-center">
                    <RefreshCw className="animate-spin text-accent mx-auto mb-4" size={48} />
                    <p className="text-xs font-black text-muted uppercase tracking-[0.3em]">
                        Consolidando expediente comercial...
                    </p>
                </div>
            ) : (
                <div className="space-y-8">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-3xl bg-slate-800 flex items-center justify-center text-accent ring-1 ring-white/10">
                            <FileText size={32} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <Badge variant={STATUS[detail.estado as EstadoPresupuesto]?.variant ?? 'default'}>
                                    {STATUS[detail.estado as EstadoPresupuesto]?.label.toUpperCase()}
                                </Badge>
                            </div>
                            <p className="text-slate-400 font-bold flex items-center gap-2 uppercase text-xs">
                                <MapPin size={14} /> SUCURSAL: {detail.sucursal?.nombre ?? 'NO ESPECIFICADA'}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="bg-slate-900/40 p-5 rounded-3xl border border-white/5">
                            <span className="text-[10px] font-black text-muted uppercase block tracking-widest mb-1">Fecha Emisión</span>
                            <p className="text-lg font-bold text-white">{fmt(detail.fechaCreacion)}</p>
                        </div>
                        <div className="bg-slate-900/40 p-5 rounded-3xl border border-white/5">
                            <span className="text-[10px] font-black text-muted uppercase block tracking-widest mb-1">Validez Hasta</span>
                            <p className="text-lg font-bold text-white">{fmt(detail.validoHasta)}</p>
                        </div>
                        <div className="bg-slate-900/40 p-5 rounded-3xl border border-white/5">
                            <span className="text-[10px] font-black text-muted uppercase block tracking-widest mb-1">Interesado</span>
                            <p className="text-lg font-bold text-white truncate">{detail.cliente?.nombre ?? '-'}</p>
                        </div>
                        <div className="bg-slate-900/40 p-5 rounded-3xl border border-white/5">
                            <span className="text-[10px] font-black text-muted uppercase block tracking-widest mb-1">Oficial Responsable</span>
                            <p className="text-lg font-bold text-white truncate">{detail.vendedor?.nombre ?? '-'}</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-2 border-b border-white/5 pb-2">
                            <Car size={16} className="text-accent" /> Matriz de Unidades Cotizadas
                        </h3>
                        <div className="table-container border-white/5 overflow-hidden">
                            <table className="data-table">
                                <thead className="bg-slate-900/60">
                                    <tr>
                                        <th>Activo / Unidad</th>
                                        <th style={{ textAlign: 'right' }}>Precio Lista</th>
                                        <th style={{ textAlign: 'right' }}>Descuento Aplicado</th>
                                        <th style={{ textAlign: 'right' }}>Neto Final</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {detail.items?.map((it: PresupuestoItem) => (
                                        <tr key={it.id}>
                                            <td className="font-bold text-white uppercase text-xs">
                                                {it.vehiculo
                                                    ? `${it.vehiculo.marca} ${it.vehiculo.modelo} [${it.vehiculo.dominio || 'S/D'}]`
                                                    : `#${it.vehiculoId}`}
                                            </td>
                                            <td style={{ textAlign: 'right' }} className="text-slate-400 font-mono italic">
                                                {currencyFmt(it.precioLista, String(detail.moneda))}
                                            </td>
                                            <td style={{ textAlign: 'right' }} className="text-red-400 font-mono font-bold">
                                                -{currencyFmt(it.descuento ?? 0, String(detail.moneda))}
                                            </td>
                                            <td style={{ textAlign: 'right' }} className="font-black text-white text-lg">
                                                {currencyFmt(it.precioFinal, String(detail.moneda))}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {detail.canje && (
                        <div className="p-8 bg-indigo-500/5 border border-indigo-500/10 rounded-3xl">
                            <h3 className="text-xs font-black uppercase text-indigo-400 tracking-widest mb-6 flex items-center gap-2">
                                <ArrowRightLeft size={14} /> Gestión de Toma de Usado
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                <div className="md:col-span-2">
                                    <span className="text-[10px] font-black text-muted block mb-1 uppercase">Descripción del Activo</span>
                                    <p className="font-bold text-white uppercase">{detail.canje.descripcion}</p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-black text-muted block mb-1 uppercase">Dominio</span>
                                    <p className="font-mono text-white text-lg tracking-widest">{detail.canje.dominio || 'S/D'}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-black text-indigo-400 block mb-1 uppercase">Acreditación Canje</span>
                                    <p className="text-2xl font-black text-white">
                                        -{currencyFmt(detail.canje.valorTomado, detail.moneda)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </Modal>
    );
};

export default DetailPresupuestoModal;
