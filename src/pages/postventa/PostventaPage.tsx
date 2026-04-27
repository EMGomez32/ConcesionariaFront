import { useState, useEffect, useCallback } from 'react';
import {
    Plus, Search, ChevronLeft, ChevronRight,
    Eye, Trash2, ArrowRight, CheckCircle, Package, RefreshCw
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { postventaApi } from '../../api/postventa.api';
import type { PostventaCaso, PostventaItem, CreateCasoDto, CreateItemDto, EstadoPostventa } from '../../api/postventa.api';
import { clientesApi } from '../../api/clientes.api';
import { vehiculosApi } from '../../api/vehiculos.api';
import { ventasApi } from '../../api/ventas.api';
import { sucursalesApi } from '../../api/sucursales.api';
import { proveedoresApi } from '../../api/proveedores.api';
import { useUIStore } from '../../store/uiStore';

// ─── Estado mappings ──────────────────────────────────────────────────────────
const ESTADO_LABELS: Record<EstadoPostventa, string> = {
    pendiente: 'Pendiente',
    en_curso: 'En Curso',
    resuelto: 'Resuelto',
};

const ESTADO_COLORS: Record<EstadoPostventa, string> = {
    pendiente: '#f59e0b',
    en_curso: '#60a5fa',
    resuelto: '#22c55e',
};

const ESTADO_TRANSITIONS: Record<EstadoPostventa, EstadoPostventa[]> = {
    pendiente: ['en_curso'],
    en_curso: ['resuelto'],
    resuelto: [],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (v?: string | number | null) =>
    v != null ? Number(v).toLocaleString('es-AR', { minimumFractionDigits: 2 }) : '-';

const fmtDate = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString('es-AR') : '-';

const today = () => new Date().toISOString().split('T')[0];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PostventaPage() {
    const addToast = useUIStore((s) => s.addToast);

    // ─ List state ─
    const [casos, setCasos] = useState<PostventaCaso[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [filterEstado, setFilterEstado] = useState('');
    const [filterSucursal, setFilterSucursal] = useState('');
    const [filterTipo, setFilterTipo] = useState('');

    // ─ Catalogs ─
    const [clientes, setClientes] = useState<{ id: number; nombre: string }[]>([]);
    const [vehiculos, setVehiculos] = useState<{ id: number; marca: string; modelo: string; dominio?: string }[]>([]);
    const [ventas, setVentas] = useState<{ id: number; montoTotal?: number; cliente?: { nombre: string }; vehiculo?: { marca: string; modelo: string } }[]>([]);
    const [sucursales, setSucursales] = useState<{ id: number; nombre: string }[]>([]);
    const [proveedores, setProveedores] = useState<{ id: number; nombre: string }[]>([]);

    // ─ Modals ─
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [detailCaso, setDetailCaso] = useState<PostventaCaso | null>(null);
    const [deletingCaso, setDeletingCaso] = useState<PostventaCaso | null>(null);
    const [transicionCaso, setTransicionCaso] = useState<PostventaCaso | null>(null);
    const [showAddItem, setShowAddItem] = useState(false);
    const [deletingItem, setDeletingItem] = useState<PostventaItem | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // ─ Create Caso form ─
    const [casoForm, setCasoForm] = useState<CreateCasoDto & { sucursalId: number; ventaId: number }>({
        clienteId: 0, vehiculoId: 0, sucursalId: 0, ventaId: 0,
        fechaReclamo: today(), tipo: '', descripcion: '',
    });

    // ─ Create Item form ─
    const [itemForm, setItemForm] = useState<CreateItemDto>({
        casoId: 0, fecha: today(), descripcion: '', monto: 0, proveedorId: undefined, comprobanteUrl: '',
    });

    // ─ Transition state ─
    const [fechaCierre, setFechaCierre] = useState(today());
    const [transicionEstado, setTransicionEstado] = useState<EstadoPostventa | ''>('');

    // Tipos únicos detectados para filtro
    const tiposUnicos = Array.from(new Set(casos.map(c => c.tipo).filter(Boolean))) as string[];

    // ─────────────────────────────────────────────────────────────────────────
    // LOAD DATA
    // ─────────────────────────────────────────────────────────────────────────
    const loadCasos = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, unknown> = { page, limit: 20 };
            if (filterEstado) params.estado = filterEstado;
            if (filterSucursal) params.sucursalId = filterSucursal;
            const res = await postventaApi.getCasos(params) as { results?: PostventaCaso[]; totalPages?: number };
            const raw = res?.results ?? [];
            setCasos(Array.isArray(raw) ? raw : []);
            setTotalPages(res?.totalPages ?? 1);
        } catch {
            addToast('Error al cargar casos', 'error');
        } finally {
            setLoading(false);
        }
    }, [page, filterEstado, filterSucursal, addToast]);

    useEffect(() => {
        const loadCatalogs = async () => {
            try {
                const [clRes, vhRes, vtRes, suRes, prRes] = await Promise.all([
                    clientesApi.getAll({}, { limit: 200 }),
                    vehiculosApi.getAll({}, { limit: 200 }),
                    ventasApi.getAll({}, { limit: 200 }),
                    sucursalesApi.getAll({}, { limit: 200 }),
                    proveedoresApi.getAll({ activo: true } as Record<string, unknown>),
                ]);
                const raw = (r: unknown): unknown[] => {
                    const d = r as { results?: unknown[] } | unknown[];
                    if (Array.isArray(d)) return d;
                    return Array.isArray(d?.results) ? d.results : [];
                };
                setClientes(raw(clRes) as { id: number; nombre: string }[]);
                setVehiculos(raw(vhRes) as { id: number; marca: string; modelo: string; dominio?: string }[]);
                setVentas(raw(vtRes) as { id: number; montoTotal?: number; cliente?: { nombre: string }; vehiculo?: { marca: string; modelo: string } }[]);
                setSucursales(raw(suRes) as { id: number; nombre: string }[]);
                setProveedores(raw(prRes) as { id: number; nombre: string }[]);
            } catch {
                // silent
            }
        };
        loadCatalogs();
    }, []);

    useEffect(() => { loadCasos(); }, [loadCasos]);

    // ─────────────────────────────────────────────────────────────────────────
    // CASO CRUD
    // ─────────────────────────────────────────────────────────────────────────
    const handleCreateCaso = async () => {
        if (!casoForm.clienteId || !casoForm.vehiculoId || !casoForm.sucursalId) {
            addToast('Cliente, vehículo y sucursal son obligatorios', 'error'); return;
        }
        if (!casoForm.descripcion.trim()) {
            addToast('La descripción es obligatoria', 'error'); return;
        }
        setSubmitting(true);
        try {
            const payload: CreateCasoDto = {
                clienteId: casoForm.clienteId,
                vehiculoId: casoForm.vehiculoId,
                sucursalId: casoForm.sucursalId,
                ventaId: casoForm.ventaId,
                fechaReclamo: casoForm.fechaReclamo,
                tipo: casoForm.tipo || undefined,
                descripcion: casoForm.descripcion,
            };
            await postventaApi.createCaso(payload);
            addToast('Caso creado', 'success');
            setShowCreateModal(false);
            setCasoForm({ clienteId: 0, vehiculoId: 0, sucursalId: 0, ventaId: 0, fechaReclamo: today(), tipo: '', descripcion: '' });
            setPage(1);
            loadCasos();
        } catch {
            addToast('Error al crear caso', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleTransicion = async () => {
        if (!transicionCaso || !transicionEstado) return;
        setSubmitting(true);
        try {
            const data: { estado: EstadoPostventa; fechaCierre?: string } = { estado: transicionEstado };
            if (transicionEstado === 'resuelto') data.fechaCierre = fechaCierre;
            await postventaApi.updateCaso(transicionCaso.id, data);
            addToast('Estado actualizado', 'success');
            setTransicionCaso(null);
            setTransicionEstado('');
            // refresh detail if open
            if (detailCaso?.id === transicionCaso.id) {
                const res = await postventaApi.getCasoById(transicionCaso.id);
                setDetailCaso(res as PostventaCaso);
            }
            loadCasos();
        } catch {
            addToast('Error al actualizar estado', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteCaso = async () => {
        if (!deletingCaso) return;
        try {
            await postventaApi.deleteCaso(deletingCaso.id);
            addToast('Caso eliminado', 'success');
            setDeletingCaso(null);
            loadCasos();
        } catch {
            addToast('Error al eliminar caso', 'error');
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // ITEM CRUD
    // ─────────────────────────────────────────────────────────────────────────
    const handleOpenAddItem = (caso: PostventaCaso) => {
        setItemForm({ casoId: caso.id, fecha: today(), descripcion: '', monto: 0, proveedorId: undefined, comprobanteUrl: '' });
        setShowAddItem(true);
    };

    const handleCreateItem = async () => {
        if (!itemForm.descripcion.trim()) { addToast('La descripción es obligatoria', 'error'); return; }
        if (!itemForm.monto || itemForm.monto <= 0) { addToast('El monto debe ser mayor a 0', 'error'); return; }
        setSubmitting(true);
        try {
            const payload: CreateItemDto = {
                casoId: itemForm.casoId,
                fecha: itemForm.fecha,
                descripcion: itemForm.descripcion,
                monto: itemForm.monto,
                proveedorId: itemForm.proveedorId || undefined,
                comprobanteUrl: itemForm.comprobanteUrl || undefined,
            };
            await postventaApi.createItem(payload);
            addToast('Ítem registrado', 'success');
            setShowAddItem(false);
            // Refresh detail
            if (detailCaso) {
                const res = await postventaApi.getCasoById(detailCaso.id);
                setDetailCaso(res as PostventaCaso);
            }
        } catch {
            addToast('Error al registrar ítem', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteItem = async () => {
        if (!deletingItem) return;
        try {
            await postventaApi.deleteItem(deletingItem.id);
            addToast('Ítem eliminado', 'success');
            setDeletingItem(null);
            if (detailCaso) {
                const res = await postventaApi.getCasoById(detailCaso.id);
                setDetailCaso(res as PostventaCaso);
            }
        } catch {
            addToast('Error al eliminar ítem', 'error');
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // VIEW DETAIL
    // ─────────────────────────────────────────────────────────────────────────
    const handleViewDetail = async (caso: PostventaCaso) => {
        try {
            const res = await postventaApi.getCasoById(caso.id);
            setDetailCaso(res as PostventaCaso);
        } catch {
            setDetailCaso(caso);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // FILTERED
    // ─────────────────────────────────────────────────────────────────────────
    const filteredCasos = casos.filter(c => {
        if (filterTipo && c.tipo !== filterTipo) return false;
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            c.cliente?.nombre?.toLowerCase().includes(q) ||
            c.vehiculo?.marca?.toLowerCase().includes(q) ||
            c.vehiculo?.modelo?.toLowerCase().includes(q) ||
            c.vehiculo?.dominio?.toLowerCase().includes(q) ||
            c.descripcion?.toLowerCase().includes(q) ||
            String(c.id).includes(q)
        );
    });

    // Total items del caso en detalle
    const totalItems = (detailCaso?.items ?? [])
        .reduce((acc, it) => acc + Number(it.monto ?? 0), 0);

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="page-container">
            {/* Header */}
            <header className="page-header">
                <div className="header-title">
                    <h1>Postventa</h1>
                    <p>Gestión de reclamos y garantías</p>
                </div>
                <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                    <Plus size={16} /> Nuevo Caso
                </Button>
            </header>

            {/* Filters */}
            <div className="filters-bar glass">
                <div className="filters-search">
                    <Search size={16} />
                    <input
                        type="text"
                        placeholder="Buscar por cliente, vehículo o descripción…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="filters-selects">
                    <div className="filter-field">
                        <label className="input-label">Estado</label>
                        <select className="input-control" value={filterEstado} onChange={e => { setFilterEstado(e.target.value); setPage(1); }}>
                            <option value="">Todos los estados</option>
                            <option value="pendiente">Pendiente</option>
                            <option value="en_curso">En Curso</option>
                            <option value="resuelto">Resuelto</option>
                        </select>
                    </div>
                    <div className="filter-field">
                        <label className="input-label">Sucursal</label>
                        <select className="input-control" value={filterSucursal} onChange={e => { setFilterSucursal(e.target.value); setPage(1); }}>
                            <option value="">Todas las sucursales</option>
                            {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                        </select>
                    </div>
                    <div className="filter-field">
                        <label className="input-label">Tipo</label>
                        <select className="input-control" value={filterTipo} onChange={e => setFilterTipo(e.target.value)}>
                            <option value="">Todos los tipos</option>
                            {tiposUnicos.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div className="filter-field" style={{ justifyContent: 'flex-end' }}>
                        <Button variant="secondary" size="sm" onClick={() => { setFilterEstado(''); setFilterSucursal(''); setFilterTipo(''); setSearch(''); setPage(1); }}>
                            <RefreshCw size={14} /> Limpiar
                        </Button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="glass" style={{ borderRadius: '0.75rem', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                {['#', 'Cliente', 'Vehículo', 'Tipo', 'Descripción', 'Estado', 'Reclamo', 'Cierre', 'Acciones'].map(h => (
                                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={9} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando...</td></tr>
                            ) : filteredCasos.length === 0 ? (
                                <tr><td colSpan={9}>
                                    <div className="dt-empty">
                                        <div className="dt-empty-badge"><Package size={36} /></div>
                                        <p className="dt-empty-text">No hay casos de postventa</p>
                                    </div>
                                </td></tr>
                            ) : filteredCasos.map(caso => (
                                <tr key={caso.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = '')}
                                >
                                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>#{caso.id}</td>
                                    <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{caso.cliente?.nombre ?? '-'}</td>
                                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}>
                                        {caso.vehiculo ? `${caso.vehiculo.marca} ${caso.vehiculo.modelo}${caso.vehiculo.dominio ? ` (${caso.vehiculo.dominio})` : ''}` : '-'}
                                    </td>
                                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}>{caso.tipo || '-'}</td>
                                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={caso.descripcion}>
                                        {caso.descripcion}
                                    </td>
                                    <td style={{ padding: '0.75rem 1rem' }}>
                                        <span style={{
                                            padding: '0.2rem 0.65rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600,
                                            background: `${ESTADO_COLORS[caso.estado]}22`,
                                            color: ESTADO_COLORS[caso.estado],
                                        }}>
                                            {ESTADO_LABELS[caso.estado]}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{fmtDate(caso.fechaReclamo)}</td>
                                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{fmtDate(caso.fechaCierre)}</td>
                                    <td style={{ padding: '0.75rem 1rem' }}>
                                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                                            <button className="icon-btn" title="Ver detalle" aria-label="Ver detalle" onClick={() => handleViewDetail(caso)}>
                                                <Eye size={14} />
                                            </button>
                                            {ESTADO_TRANSITIONS[caso.estado].length > 0 && (
                                                <button className="icon-btn" title="Avanzar estado" aria-label="Avanzar estado" onClick={() => { setTransicionCaso(caso); setTransicionEstado(ESTADO_TRANSITIONS[caso.estado][0]); setFechaCierre(today()); }}>
                                                    <ArrowRight size={14} />
                                                </button>
                                            )}
                                            <button className="icon-btn danger" title="Eliminar" aria-label="Eliminar" onClick={() => setDeletingCaso(caso)}>
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <nav className="pager" aria-label="Paginación">
                        <button type="button" className="pager-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                            <ChevronLeft size={14} /> <span>Anterior</span>
                        </button>
                        <div className="pager-status">
                            <span className="pager-current">{page}</span>
                            <span className="pager-divider">/</span>
                            <span className="pager-total">{totalPages}</span>
                        </div>
                        <button type="button" className="pager-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                            <span>Siguiente</span> <ChevronRight size={14} />
                        </button>
                    </nav>
                )}
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                MODALS
            ════════════════════════════════════════════════════════════════ */}

            {/* ─── Modal: Crear Caso ─── */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Nuevo Caso de Postventa"
                maxWidth="800px"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={handleCreateCaso} loading={submitting}>
                            Crear Caso
                        </Button>
                    </>
                }
            >
                <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                        <div className="input-group">
                            <label className="input-label">Cliente *</label>
                            <select className="input-control" value={casoForm.clienteId} onChange={e => setCasoForm(p => ({ ...p, clienteId: Number(e.target.value) }))}>
                                <option value={0}>Seleccionar cliente…</option>
                                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                            </select>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Vehículo *</label>
                            <select className="input-control" value={casoForm.vehiculoId} onChange={e => setCasoForm(p => ({ ...p, vehiculoId: Number(e.target.value) }))}>
                                <option value={0}>Seleccionar vehículo…</option>
                                {vehiculos.map(v => <option key={v.id} value={v.id}>{v.marca} {v.modelo}{v.dominio ? ` (${v.dominio})` : ''}</option>)}
                            </select>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                        <div className="input-group">
                            <label className="input-label">Sucursal *</label>
                            <select className="input-control" value={casoForm.sucursalId} onChange={e => setCasoForm(p => ({ ...p, sucursalId: Number(e.target.value) }))}>
                                <option value={0}>Seleccionar sucursal…</option>
                                {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                            </select>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Venta vinculada</label>
                            <select className="input-control" value={casoForm.ventaId} onChange={e => setCasoForm(p => ({ ...p, ventaId: Number(e.target.value) }))}>
                                <option value={0}>Sin venta…</option>
                                {ventas.map(v => <option key={v.id} value={v.id}>Venta #{v.id} — {v.cliente?.nombre ?? ''} {v.vehiculo ? `${v.vehiculo.marca} ${v.vehiculo.modelo}` : ''}</option>)}
                            </select>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                        <div className="input-group">
                            <label className="input-label">Fecha de reclamo *</label>
                            <input className="input-control" type="date" value={casoForm.fechaReclamo} onChange={e => setCasoForm(p => ({ ...p, fechaReclamo: e.target.value }))} />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Tipo</label>
                            <input className="input-control" placeholder="Ej: garantía, reclamo, revisión…" value={casoForm.tipo} onChange={e => setCasoForm(p => ({ ...p, tipo: e.target.value }))} />
                        </div>
                    </div>
                    <div className="input-group">
                        <label className="input-label">Descripción *</label>
                        <textarea className="input-control" rows={3} placeholder="Describa el problema o reclamo…" value={casoForm.descripcion} onChange={e => setCasoForm(p => ({ ...p, descripcion: e.target.value }))} style={{ resize: 'vertical' }} />
                    </div>
                </div>
            </Modal>

            {/* ─── Modal: Detalle Caso ─── */}
            <Modal
                isOpen={detailCaso !== null && !showAddItem && !deletingItem}
                onClose={() => setDetailCaso(null)}
                title={detailCaso ? `Caso #${detailCaso.id}` : ''}
                maxWidth="820px"
                footer={
                    detailCaso && ESTADO_TRANSITIONS[detailCaso.estado].length > 0 ? (
                        <>
                            <Button variant="secondary" onClick={() => setDetailCaso(null)}>Cerrar</Button>
                            {ESTADO_TRANSITIONS[detailCaso.estado].map(nextEstado => (
                                <Button key={nextEstado} variant="primary" onClick={() => {
                                    setTransicionCaso(detailCaso);
                                    setTransicionEstado(nextEstado);
                                    setFechaCierre(today());
                                    setDetailCaso(null);
                                }}>
                                    {nextEstado === 'resuelto' ? <CheckCircle size={14} /> : <ArrowRight size={14} />}
                                    {nextEstado === 'en_curso' ? 'Iniciar Trabajo' : 'Marcar como Resuelto'}
                                </Button>
                            ))}
                        </>
                    ) : (
                        <Button variant="secondary" onClick={() => setDetailCaso(null)}>Cerrar</Button>
                    )
                }
            >
                {detailCaso && (
                    <>
                        {/* Estado + tipo badges en el body (Modal ya tiene el title arriba) */}
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
                            <span style={{
                                padding: '0.25rem 0.65rem', borderRadius: 'var(--radius-pill)',
                                fontSize: 'var(--text-xs)', fontWeight: 600,
                                textTransform: 'uppercase', letterSpacing: '0.06em',
                                background: `${ESTADO_COLORS[detailCaso.estado]}22`,
                                color: ESTADO_COLORS[detailCaso.estado],
                                border: `1px solid ${ESTADO_COLORS[detailCaso.estado]}44`,
                            }}>
                                {ESTADO_LABELS[detailCaso.estado]}
                            </span>
                            {detailCaso.tipo && (
                                <span style={{
                                    padding: '0.25rem 0.65rem', borderRadius: 'var(--radius-pill)',
                                    fontSize: 'var(--text-xs)', fontWeight: 600,
                                    textTransform: 'uppercase', letterSpacing: '0.06em',
                                    background: 'var(--bg-secondary)', color: 'var(--text-secondary)',
                                    border: '1px solid var(--border)',
                                }}>
                                    {detailCaso.tipo}
                                </span>
                            )}
                        </div>

                        {/* Info grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
                            <InfoBlock title="Partes">
                                <InfoRow label="Cliente" value={detailCaso.cliente?.nombre ?? '-'} />
                                <InfoRow label="Vehículo" value={detailCaso.vehiculo ? `${detailCaso.vehiculo.marca} ${detailCaso.vehiculo.modelo}` : '-'} />
                                <InfoRow label="Dominio" value={detailCaso.vehiculo?.dominio ?? '-'} />
                                <InfoRow label="Sucursal" value={detailCaso.sucursal?.nombre ?? '-'} />
                            </InfoBlock>
                            <InfoBlock title="Fechas">
                                <InfoRow label="Reclamo" value={fmtDate(detailCaso.fechaReclamo)} />
                                <InfoRow label="Cierre" value={fmtDate(detailCaso.fechaCierre)} />
                                <InfoRow label="Creado" value={fmtDate(detailCaso.createdAt)} />
                            </InfoBlock>
                        </div>

                        {/* Descripción */}
                        <div style={{
                            marginBottom: 'var(--space-5)',
                            padding: 'var(--space-4)',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: 'var(--text-sm)',
                        }}>
                            <div style={{
                                fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-muted)',
                                textTransform: 'uppercase', letterSpacing: '0.08em',
                                marginBottom: 'var(--space-2)',
                            }}>
                                Descripción
                            </div>
                            <div style={{ color: 'var(--text-primary)' }}>{detailCaso.descripcion}</div>
                        </div>

                        {/* Items section */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                                <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                                    <Package size={16} /> Ítems de Trabajo ({(detailCaso.items ?? []).length})
                                </div>
                                <Button variant="primary" size="sm" onClick={() => handleOpenAddItem(detailCaso)}>
                                    <Plus size={14} /> Agregar Ítem
                                </Button>
                            </div>

                            {(detailCaso.items ?? []).length === 0 ? (
                                <div className="dt-empty">
                                    <div className="dt-empty-badge"><Package size={28} /></div>
                                    <p className="dt-empty-text">Sin ítems registrados</p>
                                </div>
                            ) : (
                                <div className="table-container">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Fecha</th>
                                                <th>Descripción</th>
                                                <th>Proveedor</th>
                                                <th style={{ textAlign: 'right' }}>Monto</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(detailCaso.items ?? []).map(item => (
                                                <tr key={item.id}>
                                                    <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(item.fecha)}</td>
                                                    <td>
                                                        {item.descripcion}
                                                        {item.comprobanteUrl && (
                                                            <a href={item.comprobanteUrl} target="_blank" rel="noreferrer" style={{ marginLeft: '0.5rem', fontSize: 'var(--text-xs)', color: 'var(--accent)' }}>
                                                                Ver comprobante
                                                            </a>
                                                        )}
                                                    </td>
                                                    <td style={{ color: 'var(--text-secondary)' }}>{item.proveedor?.nombre ?? '-'}</td>
                                                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-display)', fontWeight: 600, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                                                        ${fmt(item.monto)}
                                                    </td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        <button className="icon-btn danger" onClick={() => setDeletingItem(item)} aria-label="Eliminar ítem">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Total */}
                            {(detailCaso.items ?? []).length > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-3)' }}>
                                    <div style={{
                                        background: 'rgba(var(--accent-rgb), 0.10)',
                                        border: '1px solid rgba(var(--accent-rgb), 0.20)',
                                        padding: '0.5rem 1rem',
                                        borderRadius: 'var(--radius-md)',
                                        display: 'flex', gap: '1rem', alignItems: 'baseline',
                                    }}>
                                        <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>Total costos:</span>
                                        <span style={{ fontWeight: 700, fontSize: 'var(--text-lg)', color: 'var(--accent)', fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums' }}>
                                            ${fmt(totalItems)}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </Modal>

            {/* ─── Sub-Modal: Agregar Ítem ─── */}
            <Modal
                isOpen={showAddItem && detailCaso !== null}
                onClose={() => setShowAddItem(false)}
                title={detailCaso ? `Agregar Ítem — Caso #${detailCaso.id}` : ''}
                maxWidth="540px"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowAddItem(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={handleCreateItem} loading={submitting}>
                            Agregar Ítem
                        </Button>
                    </>
                }
            >
                <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                        <div className="input-group">
                            <label className="input-label">Fecha *</label>
                            <input className="input-control" type="date" value={itemForm.fecha} onChange={e => setItemForm(p => ({ ...p, fecha: e.target.value }))} />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Monto *</label>
                            <input className="input-control" type="number" min="0" step="0.01" placeholder="0.00" value={itemForm.monto || ''} onChange={e => setItemForm(p => ({ ...p, monto: Number(e.target.value) }))} />
                        </div>
                    </div>
                    <div className="input-group">
                        <label className="input-label">Descripción *</label>
                        <input className="input-control" placeholder="Descripción del trabajo o gasto…" value={itemForm.descripcion} onChange={e => setItemForm(p => ({ ...p, descripcion: e.target.value }))} />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Proveedor</label>
                        <select className="input-control" value={itemForm.proveedorId ?? ''} onChange={e => setItemForm(p => ({ ...p, proveedorId: e.target.value ? Number(e.target.value) : undefined }))}>
                            <option value="">Sin proveedor…</option>
                            {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                        </select>
                    </div>
                    <div className="input-group">
                        <label className="input-label">URL del comprobante</label>
                        <input className="input-control" placeholder="https://…" value={itemForm.comprobanteUrl} onChange={e => setItemForm(p => ({ ...p, comprobanteUrl: e.target.value }))} />
                    </div>
                </div>
            </Modal>

            {/* ─── Modal: Transición Estado ─── */}
            <Modal
                isOpen={transicionCaso !== null}
                onClose={() => setTransicionCaso(null)}
                title={transicionCaso
                    ? `${transicionEstado === 'en_curso' ? 'Iniciar Trabajo' : 'Marcar como Resuelto'} — Caso #${transicionCaso.id}`
                    : ''}
                maxWidth="480px"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setTransicionCaso(null)}>Cancelar</Button>
                        <Button variant="primary" onClick={handleTransicion} loading={submitting}>
                            Confirmar
                        </Button>
                    </>
                }
            >
                {transicionCaso && (
                    <>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)' }}>
                            Estado: <strong style={{ color: ESTADO_COLORS[transicionCaso.estado] }}>{ESTADO_LABELS[transicionCaso.estado]}</strong>
                            {' → '}
                            <strong style={{ color: transicionEstado ? ESTADO_COLORS[transicionEstado as EstadoPostventa] : undefined }}>
                                {transicionEstado ? ESTADO_LABELS[transicionEstado as EstadoPostventa] : ''}
                            </strong>
                        </p>
                        {transicionEstado === 'resuelto' && (
                            <div className="input-group">
                                <label className="input-label">Fecha de cierre *</label>
                                <input className="input-control" type="date" value={fechaCierre} onChange={e => setFechaCierre(e.target.value)} />
                            </div>
                        )}
                    </>
                )}
            </Modal>

            {/* ─── Confirm: Eliminar Caso ─── */}
            <ConfirmDialog
                isOpen={deletingCaso !== null}
                title="Eliminar caso"
                message={deletingCaso
                    ? `¿Eliminar el caso #${deletingCaso.id} de "${deletingCaso.cliente?.nombre ?? '—'}"? Esta acción no se puede deshacer.`
                    : ''}
                confirmLabel="Eliminar caso"
                cancelLabel="Cancelar"
                type="danger"
                onConfirm={handleDeleteCaso}
                onCancel={() => setDeletingCaso(null)}
            />

            {/* ─── Confirm: Eliminar Ítem ─── */}
            <ConfirmDialog
                isOpen={deletingItem !== null}
                title="Eliminar ítem"
                message={deletingItem
                    ? `¿Eliminar el ítem "${deletingItem.descripcion}"?`
                    : ''}
                confirmLabel="Eliminar ítem"
                cancelLabel="Cancelar"
                type="danger"
                onConfirm={handleDeleteItem}
                onCancel={() => setDeletingItem(null)}
            />
        </div>
    );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function InfoBlock({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-4)',
        }}>
            <div style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 'var(--space-3)',
            }}>
                {title}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>{children}</div>
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', gap: 'var(--space-3)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
            <span style={{ fontWeight: 600, textAlign: 'right', maxWidth: '60%', color: 'var(--text-primary)' }}>{value}</span>
        </div>
    );
}
