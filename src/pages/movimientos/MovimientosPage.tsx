import { useEffect, useState, useCallback } from 'react';
import { vehiculoMovimientosApi, type VehiculoMovimiento } from '../../api/vehiculo-movimientos.api';
import { vehiculosApi } from '../../api/vehiculos.api';
import { sucursalesApi } from '../../api/sucursales.api';
import { useUIStore } from '../../store/uiStore';
import Badge, { type BadgeVariant } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { unwrapList, unwrapPaged } from '../../utils/api';
import {
    Plus, RefreshCw,
    ArrowLeftRight, ChevronLeft, ChevronRight,
    Car, Calendar, FileText,
    ArrowRight, AlertCircle, User, MapPin
} from 'lucide-react';

const TIPO_BADGE: Record<string, string> = {
    traslado: 'info',
    ingreso: 'success',
    egreso: 'danger',
    asignacion_reserva: 'warning',
    liberacion_reserva: 'default',
};

const TIPO_LABEL: Record<string, string> = {
    traslado: 'Traslado Inter-Sucursal',
    ingreso: 'Ingreso al Stock',
    egreso: 'Egreso del Stock',
    asignacion_reserva: 'Asignación de Reserva',
    liberacion_reserva: 'Liberación de Reserva',
};

const EMPTY_FORM = {
    vehiculoId: '',
    hastaSucursalId: '',
    motivo: '',
    fechaMovimiento: new Date().toISOString().slice(0, 10),
};

const MovimientosPage = () => {
    const { addToast } = useUIStore();

    // List state
    const [movimientos, setMovimientos] = useState<VehiculoMovimiento[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Filters
    const [filterVehiculo, setFilterVehiculo] = useState('');
    const [filterDesde, setFilterDesde] = useState('');
    const [filterHasta, setFilterHasta] = useState('');

    // Catalog data
    const [sucursales, setSucursales] = useState<{ id: number; nombre: string }[]>([]);
    const [vehiculos, setVehiculos] = useState<{ id: number; marca: string; modelo: string; version?: string; dominio?: string }[]>([]);

    // Modal
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    // Load catalogs once
    useEffect(() => {
        const loadInitial = async () => {
            try {
                const [sucRes, vehRes] = await Promise.all([
                    sucursalesApi.getAll(),
                    vehiculosApi.getAll({}, { limit: 1000 })
                ]);
                setSucursales(unwrapList<{ id: number; nombre: string }>(sucRes));
                setVehiculos(unwrapList<{ id: number; marca: string; modelo: string; version?: string; dominio?: string }>(vehRes));
            } catch {
                // silencio
            }
        };
        loadInitial();
    }, []);

    const loadMovimientos = useCallback(async (pg = page) => {
        setLoading(true);
        try {
            const params: Record<string, string | number> = { page: pg, limit: 15 };
            if (filterVehiculo) params.vehiculoId = Number(filterVehiculo);
            if (filterDesde) params.desdeSucursalId = Number(filterDesde);
            if (filterHasta) params.hastaSucursalId = Number(filterHasta);

            const paged = unwrapPaged<VehiculoMovimiento>(await vehiculoMovimientosApi.getAll(params));
            setMovimientos(paged.results);
            setTotalPages(paged.totalPages);
        } catch {
            addToast('Error al cargar la trazabilidad de stock', 'error');
        } finally {
            setLoading(false);
        }
    }, [page, filterVehiculo, filterDesde, filterHasta, addToast]);

    useEffect(() => {
        loadMovimientos(page);
    }, [page, loadMovimientos]);

    const handleClear = () => {
        setFilterVehiculo('');
        setFilterDesde('');
        setFilterHasta('');
        setPage(1);
    };

    const openModal = () => {
        setForm({ ...EMPTY_FORM });
        setFormError('');
        setShowModal(true);
    };

    const handleSubmit = async () => {
        if (!form.vehiculoId || !form.hastaSucursalId) {
            setFormError('Debe seleccionar la unidad y la sucursal de destino.');
            return;
        }
        setSaving(true);
        setFormError('');
        try {
            const payload: { vehiculoId: number; hastaSucursalId: number; motivo?: string; fechaMovimiento?: string } = {
                vehiculoId: Number(form.vehiculoId),
                hastaSucursalId: Number(form.hastaSucursalId),
            };
            if (form.motivo) payload.motivo = form.motivo;
            if (form.fechaMovimiento) payload.fechaMovimiento = new Date(form.fechaMovimiento).toISOString();

            await vehiculoMovimientosApi.create(payload);
            addToast('Orden de traslado registrada correctamente', 'success');
            setShowModal(false);
            setPage(1);
            loadMovimientos(1);
        } catch (e: unknown) {
            const msg = (e as { message?: string })?.message ?? 'Error al procesar el traslado';
            setFormError(msg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="page-container animate-fade-in">
            {/* Header */}
            <header className="page-header">
                <div className="header-title">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="icon-badge primary shadow-glow-indigo">
                            <ArrowLeftRight size={20} />
                        </div>
                        <h1>Traceability & Stock Flow</h1>
                    </div>
                    <p>Monitoreo en tiempo real de traslados, asignaciones y cambios de estado físico de las unidades.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => loadMovimientos(page)}>
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </Button>
                    <Button variant="primary" onClick={openModal}>
                        <Plus size={18} /> Iniciar Traslado
                    </Button>
                </div>
            </header>

            {/* Filters Bar */}
            <div className="filters-bar glass">
                <div className="filters-selects">
                    <div className="filter-field">
                        <label className="input-label">Unidad</label>
                        <select className="input-control" value={filterVehiculo} onChange={e => { setFilterVehiculo(e.target.value); setPage(1); }}>
                            <option value="">Todos los vehículos</option>
                            {vehiculos.map(v => <option key={v.id} value={v.id}>{`${v.marca} ${v.modelo} ${v.dominio || ''}`}</option>)}
                        </select>
                    </div>
                    <div className="filter-field">
                        <label className="input-label">Origen de stock</label>
                        <select className="input-control" value={filterDesde} onChange={e => { setFilterDesde(e.target.value); setPage(1); }}>
                            <option value="">Cualquier plaza</option>
                            {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                        </select>
                    </div>
                    <div className="filter-field">
                        <label className="input-label">Destino de stock</label>
                        <select className="input-control" value={filterHasta} onChange={e => { setFilterHasta(e.target.value); setPage(1); }}>
                            <option value="">Cualquier destino</option>
                            {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                        </select>
                    </div>
                    <div className="filter-field" style={{ justifyContent: 'flex-end' }}>
                        <Button variant="secondary" size="sm" onClick={handleClear}>
                            <RefreshCw size={14} /> Limpiar
                        </Button>
                    </div>
                </div>
            </div>

            {/* List Table */}
            <div className="table-container card">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Unidad Vehicular</th>
                            <th>Evento de Stock</th>
                            <th>Flujo de Distribución</th>
                            <th>Fecha Evento</th>
                            <th>Certificación / Motivo</th>
                            <th>Responsable Central</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} style={{ padding: '8rem', textAlign: 'center' }}><RefreshCw className="animate-spin text-accent mx-auto" size={40} /></td></tr>
                        ) : movimientos.length === 0 ? (
                            <tr>
                                <td colSpan={6}>
                                    <div className="dt-empty">
                                        <div className="dt-empty-badge"><ArrowLeftRight size={36} /></div>
                                        <p className="dt-empty-text">No hay movimientos registrados</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            movimientos.map(m => (
                                <tr key={m.id}>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-indigo-400 ring-1 ring-slate-700 shadow-inner">
                                                <Car size={18} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-white leading-tight">
                                                    {m.vehiculo ? `${m.vehiculo.marca} ${m.vehiculo.modelo}` : `Vehículo #${m.vehiculoId}`}
                                                </span>
                                                <span className="text-[10px] font-black text-indigo-500/80 uppercase tracking-widest">{m.vehiculo?.dominio || 'S/PATENTE'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <Badge variant={(TIPO_BADGE[m.tipo] ?? 'default') as BadgeVariant}>
                                            {TIPO_LABEL[m.tipo] ?? m.tipo.toUpperCase()}
                                        </Badge>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] text-muted uppercase font-black tracking-tighter">DESDE</span>
                                                <span className="text-xs font-bold text-slate-300">{m.desdeSucursal?.nombre ?? '-'}</span>
                                            </div>
                                            <ArrowRight size={14} className="text-slate-600 mx-1 shrink-0" />
                                            <div className="flex flex-col text-right">
                                                <span className="text-[9px] text-indigo-400 uppercase font-black tracking-tighter">HASTA</span>
                                                <span className="text-xs font-bold text-white">{m.hastaSucursal?.nombre ?? 'VENTA'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Calendar size={14} />
                                            <span className="text-sm font-bold tabular-nums">
                                                {m.fechaMovimiento ? new Date(m.fechaMovimiento).toLocaleDateString('es-AR') : (m.createdAt ? new Date(m.createdAt).toLocaleDateString('es-AR') : '-')}
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{ maxWidth: '200px' }}>
                                        <div className="flex items-center gap-2">
                                            <FileText size={14} className="text-slate-600 shrink-0" />
                                            <span className="text-xs text-slate-400 italic line-clamp-1">{m.motivo || 'Sin detalles registrados'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 border border-slate-700">
                                                <User size={14} />
                                            </div>
                                            <span className="text-xs font-black text-slate-400 uppercase">{m.registradoPor?.nombre ?? 'SYSTEM'}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-center items-center gap-6 mt-8">
                <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                    <ChevronLeft size={16} /> Anterior
                </Button>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted font-black uppercase tracking-tighter">Página</span>
                    <span className="w-9 h-9 bg-accent text-white rounded-xl flex items-center justify-center font-black text-sm shadow-lg shadow-accent/20">{page}</span>
                    <span className="text-[10px] text-muted font-black uppercase tracking-tighter">de {totalPages}</span>
                </div>
                <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                    Siguiente <ChevronRight size={16} />
                </Button>
            </div>

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Orden de Movimiento Inter-Plaza"
                subtitle="Asegúrese de que la unidad esté físicamente disponible para el traslado programado."
                maxWidth="680px"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={handleSubmit} loading={saving}>
                            <ArrowLeftRight size={16} />
                            Confirmar Orden
                        </Button>
                    </>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    <div className="input-group">
                        <label className="input-label">Unidad Vehicular a Movilizar *</label>
                        <select
                            className="input-control"
                            value={form.vehiculoId}
                            onChange={e => setForm(f => ({ ...f, vehiculoId: e.target.value }))}
                        >
                            <option value="">Selección de unidad por Dominio o Modelo...</option>
                            {vehiculos.map(v => (
                                <option key={v.id} value={v.id}>
                                    {`${v.marca} ${v.modelo} ${v.version ? v.version : ''} (${v.dominio || 'SIN PATENTE'})`.toUpperCase()}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                        <div className="input-group">
                            <label className="input-label">Plaza de Destino *</label>
                            <div className="input-container has-icon">
                                <MapPin size={16} className="input-icon" />
                                <select
                                    className="input-control"
                                    value={form.hastaSucursalId}
                                    onChange={e => setForm(f => ({ ...f, hastaSucursalId: e.target.value }))}
                                >
                                    <option value="">Seleccionar sucursal...</option>
                                    {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Fecha de Ejecución *</label>
                            <input
                                type="date"
                                className="input-control"
                                value={form.fechaMovimiento}
                                onChange={e => setForm(f => ({ ...f, fechaMovimiento: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Justificación Operacional / Notas</label>
                        <textarea
                            className="input-control"
                            rows={3}
                            placeholder="Ej: Cumplimiento de reserva en sucursal Norte, rotación de showroom..."
                            value={form.motivo}
                            onChange={e => setForm(f => ({ ...f, motivo: e.target.value }))}
                            style={{ resize: 'vertical' }}
                        />
                    </div>

                    {formError && (
                        <div className="uploader-alert uploader-alert-error">
                            <AlertCircle size={14} />
                            <span>{formError}</span>
                        </div>
                    )}
                </div>
            </Modal>

            <style>{`
                .icon-badge {
                    width: 44px;
                    height: 44px;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(99, 102, 241, 0.1);
                    color: #6366f1;
                }
                .shadow-glow-indigo { box-shadow: 0 0 20px rgba(99, 102, 241, 0.2); }
                
                .form-label-xs {
                    font-size: 0.7rem;
                    font-weight: 800;
                    color: var(--text-muted);
                    text-transform: uppercase;
                    margin-bottom: 0.5rem;
                    display: block;
                    letter-spacing: 0.1em;
                }
                .form-input-select {
                    padding: 0.75rem 2.5rem 0.75rem 1rem;
                    border-radius: 1rem;
                    border: 1px solid var(--border);
                    background: var(--bg-primary);
                    font-size: 0.85rem;
                    font-weight: 700;
                    color: var(--text-primary);
                    appearance: none;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236366f1' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: right 1rem center;
                    text-transform: uppercase;
                }
                .filters-bar {
                    padding: 1.5rem !important;
                    background: rgba(15, 23, 42, 0.6) !important;
                    border: 1px solid rgba(255,255,255,0.03) !important;
                }
            `}</style>
        </div>
    );
};

export default MovimientosPage;
