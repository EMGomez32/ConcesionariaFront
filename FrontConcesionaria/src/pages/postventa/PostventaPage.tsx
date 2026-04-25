import { useState, useEffect, useCallback } from 'react';
import {
    Plus, Search, X, ChevronLeft, ChevronRight,
    Eye, Trash2, ArrowRight, CheckCircle, Package
} from 'lucide-react';
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
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Postventa</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        Gestión de reclamos y garantías
                    </p>
                </div>
                <button
                    className="btn-primary"
                    onClick={() => setShowCreateModal(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Plus size={18} /> Nuevo Caso
                </button>
            </div>

            {/* Filters */}
            <div className="glass" style={{ padding: '1rem', borderRadius: '0.75rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input
                        className="input"
                        placeholder="Buscar cliente, vehículo, descripción..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ paddingLeft: '2.25rem', width: '100%' }}
                    />
                </div>
                <select className="input" value={filterEstado} onChange={e => { setFilterEstado(e.target.value); setPage(1); }} style={{ minWidth: '140px' }}>
                    <option value="">Todos los estados</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="en_curso">En Curso</option>
                    <option value="resuelto">Resuelto</option>
                </select>
                <select className="input" value={filterSucursal} onChange={e => { setFilterSucursal(e.target.value); setPage(1); }} style={{ minWidth: '140px' }}>
                    <option value="">Todas las sucursales</option>
                    {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
                <select className="input" value={filterTipo} onChange={e => setFilterTipo(e.target.value)} style={{ minWidth: '130px' }}>
                    <option value="">Todos los tipos</option>
                    {tiposUnicos.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                {(filterEstado || filterSucursal || filterTipo || search) && (
                    <button className="btn-secondary" onClick={() => { setFilterEstado(''); setFilterSucursal(''); setFilterTipo(''); setSearch(''); setPage(1); }} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <X size={14} /> Limpiar
                    </button>
                )}
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
                                <tr><td colSpan={9} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No hay casos de postventa</td></tr>
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
                                            <button title="Ver detalle" onClick={() => handleViewDetail(caso)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '0.25rem' }}>
                                                <Eye size={15} />
                                            </button>
                                            {ESTADO_TRANSITIONS[caso.estado].length > 0 && (
                                                <button title="Avanzar estado" onClick={() => { setTransicionCaso(caso); setTransicionEstado(ESTADO_TRANSITIONS[caso.estado][0]); setFechaCierre(today()); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#60a5fa', padding: '0.25rem' }}>
                                                    <ArrowRight size={15} />
                                                </button>
                                            )}
                                            <button title="Eliminar" onClick={() => setDeletingCaso(caso)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '0.25rem' }}>
                                                <Trash2 size={15} />
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderTop: '1px solid var(--border)', justifyContent: 'center' }}>
                        <button className="btn-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.35rem 0.75rem' }}>
                            <ChevronLeft size={14} /> Anterior
                        </button>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Página {page} de {totalPages}</span>
                        <button className="btn-secondary" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.35rem 0.75rem' }}>
                            Siguiente <ChevronRight size={14} />
                        </button>
                    </div>
                )}
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                MODALS
            ════════════════════════════════════════════════════════════════ */}

            {/* ─── Modal: Crear Caso ─── */}
            {showCreateModal && (
                <ModalOverlay onClose={() => setShowCreateModal(false)} wide>
                    <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.25rem', fontWeight: 700 }}>Nuevo Caso de Postventa</h2>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <FormField label="Cliente *">
                                <select className="input" value={casoForm.clienteId} onChange={e => setCasoForm(p => ({ ...p, clienteId: Number(e.target.value) }))}>
                                    <option value={0}>Seleccionar cliente...</option>
                                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                </select>
                            </FormField>
                            <FormField label="Vehículo *">
                                <select className="input" value={casoForm.vehiculoId} onChange={e => setCasoForm(p => ({ ...p, vehiculoId: Number(e.target.value) }))}>
                                    <option value={0}>Seleccionar vehículo...</option>
                                    {vehiculos.map(v => <option key={v.id} value={v.id}>{v.marca} {v.modelo}{v.dominio ? ` (${v.dominio})` : ''}</option>)}
                                </select>
                            </FormField>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <FormField label="Sucursal *">
                                <select className="input" value={casoForm.sucursalId} onChange={e => setCasoForm(p => ({ ...p, sucursalId: Number(e.target.value) }))}>
                                    <option value={0}>Seleccionar sucursal...</option>
                                    {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                                </select>
                            </FormField>
                            <FormField label="Venta vinculada">
                                <select className="input" value={casoForm.ventaId} onChange={e => setCasoForm(p => ({ ...p, ventaId: Number(e.target.value) }))}>
                                    <option value={0}>Sin venta...</option>
                                    {ventas.map(v => <option key={v.id} value={v.id}>Venta #{v.id} — {v.cliente?.nombre ?? ''} {v.vehiculo ? `${v.vehiculo.marca} ${v.vehiculo.modelo}` : ''}</option>)}
                                </select>
                            </FormField>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <FormField label="Fecha de Reclamo *">
                                <input className="input" type="date" value={casoForm.fechaReclamo} onChange={e => setCasoForm(p => ({ ...p, fechaReclamo: e.target.value }))} />
                            </FormField>
                            <FormField label="Tipo">
                                <input className="input" placeholder="Ej: garantía, reclamo, revisión..." value={casoForm.tipo} onChange={e => setCasoForm(p => ({ ...p, tipo: e.target.value }))} />
                            </FormField>
                        </div>
                        <FormField label="Descripción *">
                            <textarea className="input" rows={3} placeholder="Describa el problema o reclamo..." value={casoForm.descripcion} onChange={e => setCasoForm(p => ({ ...p, descripcion: e.target.value }))} style={{ resize: 'vertical' }} />
                        </FormField>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                        <button className="btn-secondary" onClick={() => setShowCreateModal(false)}>Cancelar</button>
                        <button className="btn-primary" onClick={handleCreateCaso} disabled={submitting}>
                            {submitting ? 'Creando...' : 'Crear Caso'}
                        </button>
                    </div>
                </ModalOverlay>
            )}

            {/* ─── Modal: Detalle Caso ─── */}
            {detailCaso && !showAddItem && !deletingItem && (
                <ModalOverlay onClose={() => setDetailCaso(null)} wide>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700 }}>
                                Caso #{detailCaso.id}
                            </h2>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.4rem' }}>
                                <span style={{
                                    padding: '0.2rem 0.65rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 600,
                                    background: `${ESTADO_COLORS[detailCaso.estado]}22`,
                                    color: ESTADO_COLORS[detailCaso.estado],
                                }}>
                                    {ESTADO_LABELS[detailCaso.estado]}
                                </span>
                                {detailCaso.tipo && (
                                    <span style={{ padding: '0.2rem 0.65rem', borderRadius: '9999px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.08)', color: 'var(--text-secondary)' }}>
                                        {detailCaso.tipo}
                                    </span>
                                )}
                            </div>
                        </div>
                        <button onClick={() => setDetailCaso(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
                    </div>

                    {/* Info grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
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
                    <div style={{ marginBottom: '1.5rem', padding: '0.75rem', background: 'rgba(255,255,255,0.04)', borderRadius: '0.5rem', fontSize: '0.9rem' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Descripción</div>
                        {detailCaso.descripcion}
                    </div>

                    {/* Items section */}
                    <div style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Package size={16} /> Ítems de Trabajo ({(detailCaso.items ?? []).length})
                            </div>
                            <button className="btn-primary" onClick={() => handleOpenAddItem(detailCaso)} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.85rem', fontSize: '0.85rem' }}>
                                <Plus size={14} /> Agregar Ítem
                            </button>
                        </div>

                        {(detailCaso.items ?? []).length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', fontSize: '0.9rem', background: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem' }}>
                                Sin ítems registrados
                            </div>
                        ) : (
                            <div style={{ border: '1px solid var(--border)', borderRadius: '0.5rem', overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.03)' }}>
                                            {['Fecha', 'Descripción', 'Proveedor', 'Monto', ''].map(h => (
                                                <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(detailCaso.items ?? []).map(item => (
                                            <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                                <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{fmtDate(item.fecha)}</td>
                                                <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}>
                                                    {item.descripcion}
                                                    {item.comprobanteUrl && (
                                                        <a href={item.comprobanteUrl} target="_blank" rel="noreferrer" style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#818cf8' }}>
                                                            Ver comprobante
                                                        </a>
                                                    )}
                                                </td>
                                                <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{item.proveedor?.nombre ?? '-'}</td>
                                                <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem', fontWeight: 600, textAlign: 'right', whiteSpace: 'nowrap' }}>${fmt(item.monto)}</td>
                                                <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>
                                                    <button onClick={() => setDeletingItem(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '0.2rem' }}>
                                                        <Trash2 size={13} />
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
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
                                <div style={{ background: 'rgba(129,140,248,0.12)', padding: '0.5rem 1rem', borderRadius: '0.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Total costos:</span>
                                    <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#818cf8' }}>${fmt(totalItems)}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    {ESTADO_TRANSITIONS[detailCaso.estado].length > 0 && (
                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            {ESTADO_TRANSITIONS[detailCaso.estado].map(nextEstado => (
                                <button key={nextEstado} className="btn-primary" onClick={() => {
                                    setTransicionCaso(detailCaso);
                                    setTransicionEstado(nextEstado);
                                    setFechaCierre(today());
                                    setDetailCaso(null);
                                }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {nextEstado === 'resuelto' ? <CheckCircle size={15} /> : <ArrowRight size={15} />}
                                    {nextEstado === 'en_curso' ? 'Iniciar Trabajo' : 'Marcar como Resuelto'}
                                </button>
                            ))}
                        </div>
                    )}
                </ModalOverlay>
            )}

            {/* ─── Sub-Modal: Agregar Ítem ─── */}
            {showAddItem && detailCaso && (
                <ModalOverlay onClose={() => setShowAddItem(false)}>
                    <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.2rem', fontWeight: 700 }}>Agregar Ítem — Caso #{detailCaso.id}</h2>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <FormField label="Fecha *">
                                <input className="input" type="date" value={itemForm.fecha} onChange={e => setItemForm(p => ({ ...p, fecha: e.target.value }))} />
                            </FormField>
                            <FormField label="Monto *">
                                <input className="input" type="number" min="0" step="0.01" placeholder="0.00" value={itemForm.monto || ''} onChange={e => setItemForm(p => ({ ...p, monto: Number(e.target.value) }))} />
                            </FormField>
                        </div>
                        <FormField label="Descripción *">
                            <input className="input" placeholder="Descripción del trabajo o gasto..." value={itemForm.descripcion} onChange={e => setItemForm(p => ({ ...p, descripcion: e.target.value }))} />
                        </FormField>
                        <FormField label="Proveedor">
                            <select className="input" value={itemForm.proveedorId ?? ''} onChange={e => setItemForm(p => ({ ...p, proveedorId: e.target.value ? Number(e.target.value) : undefined }))}>
                                <option value="">Sin proveedor...</option>
                                {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                            </select>
                        </FormField>
                        <FormField label="URL Comprobante">
                            <input className="input" placeholder="https://..." value={itemForm.comprobanteUrl} onChange={e => setItemForm(p => ({ ...p, comprobanteUrl: e.target.value }))} />
                        </FormField>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                        <button className="btn-secondary" onClick={() => setShowAddItem(false)}>Cancelar</button>
                        <button className="btn-primary" onClick={handleCreateItem} disabled={submitting}>
                            {submitting ? 'Guardando...' : 'Agregar Ítem'}
                        </button>
                    </div>
                </ModalOverlay>
            )}

            {/* ─── Modal: Transición Estado ─── */}
            {transicionCaso && (
                <ModalOverlay onClose={() => setTransicionCaso(null)}>
                    <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.2rem', fontWeight: 700 }}>
                        {transicionEstado === 'en_curso' ? 'Iniciar Trabajo' : 'Marcar como Resuelto'} — Caso #{transicionCaso.id}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                        Estado: <strong style={{ color: ESTADO_COLORS[transicionCaso.estado] }}>{ESTADO_LABELS[transicionCaso.estado]}</strong>
                        {' → '}
                        <strong style={{ color: transicionEstado ? ESTADO_COLORS[transicionEstado as EstadoPostventa] : undefined }}>
                            {transicionEstado ? ESTADO_LABELS[transicionEstado as EstadoPostventa] : ''}
                        </strong>
                    </p>
                    {transicionEstado === 'resuelto' && (
                        <FormField label="Fecha de Cierre *">
                            <input className="input" type="date" value={fechaCierre} onChange={e => setFechaCierre(e.target.value)} />
                        </FormField>
                    )}
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                        <button className="btn-secondary" onClick={() => setTransicionCaso(null)}>Cancelar</button>
                        <button className="btn-primary" onClick={handleTransicion} disabled={submitting}>
                            {submitting ? 'Actualizando...' : 'Confirmar'}
                        </button>
                    </div>
                </ModalOverlay>
            )}

            {/* ─── Modal: Eliminar Caso ─── */}
            {deletingCaso && (
                <ModalOverlay onClose={() => setDeletingCaso(null)}>
                    <h2 style={{ margin: '0 0 1rem', fontSize: '1.2rem', fontWeight: 700, color: '#ef4444' }}>Eliminar Caso</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                        ¿Eliminar el caso <strong>#{deletingCaso.id}</strong> de <strong>{deletingCaso.cliente?.nombre}</strong>? Esta acción no se puede deshacer.
                    </p>
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                        <button className="btn-secondary" onClick={() => setDeletingCaso(null)}>Cancelar</button>
                        <button className="btn-danger" onClick={handleDeleteCaso}>Eliminar</button>
                    </div>
                </ModalOverlay>
            )}

            {/* ─── Modal: Eliminar Ítem ─── */}
            {deletingItem && (
                <ModalOverlay onClose={() => setDeletingItem(null)}>
                    <h2 style={{ margin: '0 0 1rem', fontSize: '1.2rem', fontWeight: 700, color: '#ef4444' }}>Eliminar Ítem</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                        ¿Eliminar el ítem <strong>"{deletingItem.descripcion}"</strong>?
                    </p>
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                        <button className="btn-secondary" onClick={() => setDeletingItem(null)}>Cancelar</button>
                        <button className="btn-danger" onClick={handleDeleteItem}>Eliminar</button>
                    </div>
                </ModalOverlay>
            )}
        </div>
    );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function ModalOverlay({ children, onClose, wide }: { children: React.ReactNode; onClose: () => void; wide?: boolean }) {
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="glass" style={{ borderRadius: '1rem', padding: '2rem', width: '100%', maxWidth: wide ? '800px' : '520px', maxHeight: '90vh', overflowY: 'auto' }}>
                {children}
            </div>
        </div>
    );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</label>
            {children}
        </div>
    );
}

function InfoBlock({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '0.5rem', padding: '1rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>{title}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>{children}</div>
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
            <span style={{ fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>{value}</span>
        </div>
    );
}
