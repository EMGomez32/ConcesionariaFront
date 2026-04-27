import { useState, useEffect, useCallback } from 'react';
import {
    Plus, Search, ChevronLeft, ChevronRight,
    Building2, FileText, CheckCircle,
    Eye, Trash2, Edit, ArrowRight, ExternalLink, Paperclip, RefreshCw
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import financierasApi from '../../api/financieras.api';
import type { Financiera, CreateFinancieraDto } from '../../api/financieras.api';
import solicitudesFinanciacionApi from '../../api/solicitudesFinanciacion.api';
import type { SolicitudFinanciacion, SolicitudArchivo, CreateSolicitudDto, UpdateSolicitudDto, EstadoSolicitud } from '../../api/solicitudesFinanciacion.api';
import { clientesApi } from '../../api/clientes.api';
import { useUIStore } from '../../store/uiStore';
import { FileUploader } from '../../components/ui/FileUploader';

// ─── Estado mappings ──────────────────────────────────────────────────────────
const ESTADO_SOL_LABELS: Record<EstadoSolicitud, string> = {
    borrador: 'Borrador',
    enviada: 'Enviada',
    pendiente: 'Pendiente',
    aprobada: 'Aprobada',
    rechazada: 'Rechazada',
    cancelada: 'Cancelada',
};

const ESTADO_SOL_COLORS: Record<EstadoSolicitud, string> = {
    borrador: '#94a3b8',
    enviada: '#60a5fa',
    pendiente: '#f59e0b',
    aprobada: '#22c55e',
    rechazada: '#ef4444',
    cancelada: '#6b7280',
};

const ESTADO_SOL_TRANSITIONS: Record<EstadoSolicitud, EstadoSolicitud[]> = {
    borrador: ['enviada', 'cancelada'],
    enviada: ['pendiente', 'cancelada'],
    pendiente: ['aprobada', 'rechazada', 'cancelada'],
    aprobada: [],
    rechazada: [],
    cancelada: [],
};

const TIPO_FINANCIERA_LABELS: Record<string, string> = {
    financiera: 'Financiera',
    banco: 'Banco',
    otra: 'Otra',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (v?: string | number | null) =>
    v != null ? Number(v).toLocaleString('es-AR', { minimumFractionDigits: 0 }) : '-';

const fmtDate = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString('es-AR') : '-';

// ─── Main Component ───────────────────────────────────────────────────────────
export default function FinanciacionExternaPage() {
    const addToast = useUIStore((s) => s.addToast);

    // ─ tabs ─
    const [tab, setTab] = useState<'solicitudes' | 'financieras'>('solicitudes');

    // ─────────────────────────────────────────────────────────────────────────
    // FINANCIERAS STATE
    // ─────────────────────────────────────────────────────────────────────────
    const [financieras, setFinancieras] = useState<Financiera[]>([]);
    const [loadingFin, setLoadingFin] = useState(false);
    const [filterTipo, setFilterTipo] = useState('');
    const [filterActivo, setFilterActivo] = useState('');

    // FINANCIERAS modals
    const [showFinancieraModal, setShowFinancieraModal] = useState(false);
    const [editingFinanciera, setEditingFinanciera] = useState<Financiera | null>(null);
    const [deletingFinanciera, setDeletingFinanciera] = useState<Financiera | null>(null);
    const [finForm, setFinForm] = useState<CreateFinancieraDto>({
        nombre: '', tipo: 'financiera', contacto: '', telefono: '', email: '', activo: true
    });
    const [submittingFin, setSubmittingFin] = useState(false);

    // ─────────────────────────────────────────────────────────────────────────
    // SOLICITUDES STATE
    // ─────────────────────────────────────────────────────────────────────────
    const [solicitudes, setSolicitudes] = useState<SolicitudFinanciacion[]>([]);
    const [loadingSol, setLoadingSol] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchSol, setSearchSol] = useState('');
    const [filterEstado, setFilterEstado] = useState('');
    const [filterFinanciera, setFilterFinanciera] = useState('');

    // Catalogs
    const [clientes, setClientes] = useState<{ id: number; nombre: string }[]>([]);
    const [financierasCatalog, setFinancierasCatalog] = useState<Financiera[]>([]);

    // SOLICITUDES modals
    const [showSolModal, setShowSolModal] = useState(false);
    const [detailSolicitud, setDetailSolicitud] = useState<SolicitudFinanciacion | null>(null);
    const [archivosSol, setArchivosSol] = useState<SolicitudArchivo[]>([]);
    const [loadingArchivosSol, setLoadingArchivosSol] = useState(false);
    const [deletingSol, setDeletingSol] = useState<SolicitudFinanciacion | null>(null);
    const [transicionSol, setTransicionSol] = useState<SolicitudFinanciacion | null>(null);
    const [nuevoEstado, setNuevoEstado] = useState<EstadoSolicitud | ''>('');
    const [extraTransicion, setExtraTransicion] = useState<{
        montoAprobado?: string; tasaFinal?: string; fechaRespuesta?: string; observaciones?: string;
    }>({});
    const [submittingSol, setSubmittingSol] = useState(false);

    const [solForm, setSolForm] = useState<CreateSolicitudDto>({
        clienteId: 0,
        financieraId: 0,
        ventaId: undefined,
        presupuestoId: undefined,
        montoSolicitado: undefined,
        plazoCuotas: undefined,
        tasaEstimada: undefined,
        observaciones: '',
    });

    // ─────────────────────────────────────────────────────────────────────────
    // LOAD FINANCIERAS
    // ─────────────────────────────────────────────────────────────────────────
    const loadFinancieras = useCallback(async () => {
        setLoadingFin(true);
        try {
            const res = await financierasApi.getAll() as { results?: Financiera[] } | Financiera[];
            const raw = Array.isArray(res) ? res : res?.results ?? [];
            const arr: Financiera[] = Array.isArray(raw) ? raw : [];
            setFinancieras(arr);
            setFinancierasCatalog(arr.filter(f => f.activo));
        } catch {
            addToast('Error al cargar financieras', 'error');
        } finally {
            setLoadingFin(false);
        }
    }, [addToast]);

    // ─────────────────────────────────────────────────────────────────────────
    // LOAD SOLICITUDES
    // ─────────────────────────────────────────────────────────────────────────
    const loadSolicitudes = useCallback(async () => {
        setLoadingSol(true);
        try {
            const params: Record<string, unknown> = { page, limit: 20 };
            if (filterEstado) params.estado = filterEstado;
            if (filterFinanciera) params.financieraId = filterFinanciera;
            const res = await solicitudesFinanciacionApi.getAll(params) as { results?: SolicitudFinanciacion[]; totalPages?: number };
            const raw = res?.results ?? [];
            setSolicitudes(Array.isArray(raw) ? raw : []);
            setTotalPages(res?.totalPages ?? 1);
        } catch {
            addToast('Error al cargar solicitudes', 'error');
        } finally {
            setLoadingSol(false);
        }
    }, [page, filterEstado, filterFinanciera, addToast]);

    // ─────────────────────────────────────────────────────────────────────────
    // ARCHIVOS DE SOLICITUD
    // ─────────────────────────────────────────────────────────────────────────
    const loadArchivosSol = useCallback(async (solicitudId: number) => {
        setLoadingArchivosSol(true);
        try {
            const res = await solicitudesFinanciacionApi.listArchivos(solicitudId);
            setArchivosSol(Array.isArray(res) ? res : []);
        } catch {
            addToast('Error al cargar archivos', 'error');
        } finally {
            setLoadingArchivosSol(false);
        }
    }, [addToast]);

    useEffect(() => {
        if (detailSolicitud) loadArchivosSol(detailSolicitud.id);
        else setArchivosSol([]);
    }, [detailSolicitud, loadArchivosSol]);

    const handleDeleteArchivoSol = async (archivo: SolicitudArchivo) => {
        const label = archivo.originalName ?? archivo.descripcion ?? `Archivo ${archivo.id}`;
        if (!detailSolicitud || !window.confirm(`¿Eliminar el archivo "${label}"?`)) return;
        try {
            await solicitudesFinanciacionApi.deleteArchivo(detailSolicitud.id, archivo.id);
            addToast('Archivo eliminado', 'success');
            setArchivosSol(prev => prev.filter(a => a.id !== archivo.id));
        } catch {
            addToast('Error al eliminar archivo', 'error');
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // LOAD CATALOGS
    // ─────────────────────────────────────────────────────────────────────────
    useEffect(() => {
        const loadCatalogs = async () => {
            try {
                const [clRes] = await Promise.all([
                    clientesApi.getAll({}, { limit: 200 }),
                ]);
                const clRaw = clRes?.results ?? [];
                setClientes(Array.isArray(clRaw) ? clRaw : []);
            } catch {
                // silent
            }
        };
        loadCatalogs();
        loadFinancieras();
    }, [loadFinancieras]);

    useEffect(() => {
        loadSolicitudes();
    }, [loadSolicitudes]);

    // ─────────────────────────────────────────────────────────────────────────
    // FINANCIERAS CRUD
    // ─────────────────────────────────────────────────────────────────────────
    const openCreateFinanciera = () => {
        setEditingFinanciera(null);
        setFinForm({ nombre: '', tipo: 'financiera', contacto: '', telefono: '', email: '', activo: true });
        setShowFinancieraModal(true);
    };

    const openEditFinanciera = (f: Financiera) => {
        setEditingFinanciera(f);
        setFinForm({
            nombre: f.nombre, tipo: f.tipo, contacto: f.contacto ?? '',
            telefono: f.telefono ?? '', email: f.email ?? '', activo: f.activo,
        });
        setShowFinancieraModal(true);
    };

    const handleSaveFinanciera = async () => {
        if (!finForm.nombre.trim()) { addToast('Nombre es obligatorio', 'error'); return; }
        setSubmittingFin(true);
        try {
            if (editingFinanciera) {
                await financierasApi.update(editingFinanciera.id, finForm);
                addToast('Financiera actualizada', 'success');
            } else {
                await financierasApi.create(finForm);
                addToast('Financiera creada', 'success');
            }
            setShowFinancieraModal(false);
            loadFinancieras();
        } catch {
            addToast('Error al guardar financiera', 'error');
        } finally {
            setSubmittingFin(false);
        }
    };

    const handleDeleteFinanciera = async () => {
        if (!deletingFinanciera) return;
        try {
            await financierasApi.delete(deletingFinanciera.id);
            addToast('Financiera eliminada', 'success');
            setDeletingFinanciera(null);
            loadFinancieras();
        } catch {
            addToast('Error al eliminar financiera', 'error');
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // SOLICITUDES CRUD
    // ─────────────────────────────────────────────────────────────────────────
    const handleCreateSolicitud = async () => {
        if (!solForm.clienteId || !solForm.financieraId) {
            addToast('Cliente y Financiera son obligatorios', 'error'); return;
        }
        setSubmittingSol(true);
        try {
            const payload: CreateSolicitudDto = {
                clienteId: solForm.clienteId,
                financieraId: solForm.financieraId,
            };
            if (solForm.montoSolicitado) payload.montoSolicitado = solForm.montoSolicitado;
            if (solForm.plazoCuotas) payload.plazoCuotas = solForm.plazoCuotas;
            if (solForm.tasaEstimada) payload.tasaEstimada = solForm.tasaEstimada;
            if (solForm.observaciones) payload.observaciones = solForm.observaciones;
            await solicitudesFinanciacionApi.create(payload);
            addToast('Solicitud creada', 'success');
            setShowSolModal(false);
            setSolForm({ clienteId: 0, financieraId: 0, observaciones: '' });
            setPage(1);
            loadSolicitudes();
        } catch {
            addToast('Error al crear solicitud', 'error');
        } finally {
            setSubmittingSol(false);
        }
    };

    const handleTransicion = async () => {
        if (!transicionSol || !nuevoEstado) return;
        setSubmittingSol(true);
        try {
            const data: UpdateSolicitudDto = { estado: nuevoEstado };
            if (nuevoEstado === 'aprobada') {
                if (extraTransicion.montoAprobado) data.montoAprobado = Number(extraTransicion.montoAprobado);
                if (extraTransicion.tasaFinal) data.tasaFinal = Number(extraTransicion.tasaFinal);
                if (extraTransicion.fechaRespuesta) data.fechaRespuesta = extraTransicion.fechaRespuesta;
            }
            if (nuevoEstado === 'enviada') {
                data.fechaEnvio = new Date().toISOString();
            }
            if (extraTransicion.observaciones) data.observaciones = extraTransicion.observaciones;
            await solicitudesFinanciacionApi.update(transicionSol.id, data);
            addToast('Estado actualizado', 'success');
            setTransicionSol(null);
            setNuevoEstado('');
            setExtraTransicion({});
            loadSolicitudes();
        } catch {
            addToast('Error al actualizar estado', 'error');
        } finally {
            setSubmittingSol(false);
        }
    };

    const handleDeleteSolicitud = async () => {
        if (!deletingSol) return;
        try {
            await solicitudesFinanciacionApi.delete(deletingSol.id);
            addToast('Solicitud eliminada', 'success');
            setDeletingSol(null);
            loadSolicitudes();
        } catch {
            addToast('Error al eliminar solicitud', 'error');
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // FILTERED LISTS
    // ─────────────────────────────────────────────────────────────────────────
    const filteredFinancieras = financieras.filter(f => {
        if (filterTipo && f.tipo !== filterTipo) return false;
        if (filterActivo !== '' && String(f.activo) !== filterActivo) return false;
        return true;
    });

    const filteredSolicitudes = solicitudes.filter(s => {
        if (!searchSol) return true;
        const q = searchSol.toLowerCase();
        return (
            s.cliente?.nombre?.toLowerCase().includes(q) ||
            s.financiera?.nombre?.toLowerCase().includes(q) ||
            String(s.id).includes(q)
        );
    });

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="page-container">
            {/* Header */}
            <header className="page-header">
                <div className="header-title">
                    <h1>Financiación Externa</h1>
                    <p>Gestión de solicitudes a financieras y bancos</p>
                </div>
                <Button
                    variant="primary"
                    onClick={tab === 'solicitudes' ? () => setShowSolModal(true) : openCreateFinanciera}
                >
                    <Plus size={16} />
                    {tab === 'solicitudes' ? 'Nueva Solicitud' : 'Nueva Financiera'}
                </Button>
            </header>

            {/* Tabs */}
            <div className="tab-group" role="tablist">
                {(['solicitudes', 'financieras'] as const).map((t) => (
                    <button
                        key={t}
                        type="button"
                        role="tab"
                        aria-selected={tab === t}
                        onClick={() => setTab(t)}
                        className={`tab-btn ${tab === t ? 'is-active' : ''}`}
                    >
                        {t === 'solicitudes' ? <FileText size={14} /> : <Building2 size={14} />}
                        {t === 'solicitudes' ? 'Solicitudes' : 'Financieras'}
                    </button>
                ))}
            </div>

            {/* ─── TAB: SOLICITUDES ─── */}
            {tab === 'solicitudes' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Filters */}
                    <div className="filters-bar glass">
                        <div className="filters-search">
                            <Search size={16} />
                            <input
                                type="text"
                                placeholder="Buscar por cliente o financiera…"
                                value={searchSol}
                                onChange={e => setSearchSol(e.target.value)}
                            />
                        </div>
                        <div className="filters-selects">
                            <div className="filter-field">
                                <label className="input-label">Estado</label>
                                <select className="input-control" value={filterEstado} onChange={e => { setFilterEstado(e.target.value); setPage(1); }}>
                                    <option value="">Todos los estados</option>
                                    {(Object.keys(ESTADO_SOL_LABELS) as EstadoSolicitud[]).map(e => (
                                        <option key={e} value={e}>{ESTADO_SOL_LABELS[e]}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="filter-field">
                                <label className="input-label">Financiera</label>
                                <select className="input-control" value={filterFinanciera} onChange={e => { setFilterFinanciera(e.target.value); setPage(1); }}>
                                    <option value="">Todas las financieras</option>
                                    {financierasCatalog.map(f => (
                                        <option key={f.id} value={f.id}>{f.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="filter-field" style={{ justifyContent: 'flex-end' }}>
                                <Button variant="secondary" size="sm" onClick={() => { setFilterEstado(''); setFilterFinanciera(''); setSearchSol(''); setPage(1); }}>
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
                                        {['#', 'Cliente', 'Financiera', 'Monto Sol.', 'Plazo', 'Estado', 'Fecha', 'Acciones'].map(h => (
                                            <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {loadingSol ? (
                                        <tr><td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando...</td></tr>
                                    ) : filteredSolicitudes.length === 0 ? (
                                        <tr><td colSpan={8}>
                                            <div className="dt-empty">
                                                <div className="dt-empty-badge"><FileText size={36} /></div>
                                                <p className="dt-empty-text">No hay solicitudes</p>
                                            </div>
                                        </td></tr>
                                    ) : filteredSolicitudes.map(s => (
                                        <tr key={s.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                                            onMouseLeave={e => (e.currentTarget.style.background = '')}
                                        >
                                            <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>#{s.id}</td>
                                            <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{s.cliente?.nombre ?? '-'}</td>
                                            <td style={{ padding: '0.75rem 1rem' }}>{s.financiera?.nombre ?? '-'}</td>
                                            <td style={{ padding: '0.75rem 1rem' }}>{s.montoSolicitado ? `$${fmt(s.montoSolicitado)}` : '-'}</td>
                                            <td style={{ padding: '0.75rem 1rem' }}>{s.plazoCuotas ? `${s.plazoCuotas} cuotas` : '-'}</td>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                <span style={{
                                                    padding: '0.2rem 0.65rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600,
                                                    background: `${ESTADO_SOL_COLORS[s.estado]}22`,
                                                    color: ESTADO_SOL_COLORS[s.estado],
                                                }}>
                                                    {ESTADO_SOL_LABELS[s.estado]}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{fmtDate(s.createdAt)}</td>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                <div style={{ display: 'flex', gap: '0.35rem' }}>
                                                    <button title="Ver detalle" onClick={() => setDetailSolicitud(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '0.25rem' }}>
                                                        <Eye size={15} />
                                                    </button>
                                                    {ESTADO_SOL_TRANSITIONS[s.estado].length > 0 && (
                                                        <button title="Cambiar estado" onClick={() => { setTransicionSol(s); setNuevoEstado(''); setExtraTransicion({}); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#60a5fa', padding: '0.25rem' }}>
                                                            <ArrowRight size={15} />
                                                        </button>
                                                    )}
                                                    <button title="Eliminar" onClick={() => setDeletingSol(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '0.25rem' }}>
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
                </div>
            )}

            {/* ─── TAB: FINANCIERAS ─── */}
            {tab === 'financieras' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Filters */}
                    <div className="filters-bar glass">
                        <div className="filters-selects">
                            <div className="filter-field">
                                <label className="input-label">Tipo</label>
                                <select className="input-control" value={filterTipo} onChange={e => setFilterTipo(e.target.value)}>
                                    <option value="">Todos los tipos</option>
                                    <option value="financiera">Financiera</option>
                                    <option value="banco">Banco</option>
                                    <option value="otra">Otra</option>
                                </select>
                            </div>
                            <div className="filter-field">
                                <label className="input-label">Estado</label>
                                <select className="input-control" value={filterActivo} onChange={e => setFilterActivo(e.target.value)}>
                                    <option value="">Todos</option>
                                    <option value="true">Activos</option>
                                    <option value="false">Inactivos</option>
                                </select>
                            </div>
                            <div className="filter-field" style={{ justifyContent: 'flex-end' }}>
                                <Button variant="secondary" size="sm" onClick={() => { setFilterTipo(''); setFilterActivo(''); }}>
                                    <RefreshCw size={14} /> Limpiar
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Grid */}
                    {loadingFin ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Cargando...</div>
                    ) : filteredFinancieras.length === 0 ? (
                        <div className="dt-empty">
                            <div className="dt-empty-badge"><Building2 size={36} /></div>
                            <p className="dt-empty-text">No hay financieras registradas</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                            {filteredFinancieras.map(f => (
                                <div key={f.id} className="glass" style={{ padding: '1.25rem', borderRadius: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem', background: 'rgba(129,140,248,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Building2 size={20} color="#818cf8" />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{f.nombre}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{TIPO_FINANCIERA_LABELS[f.tipo]}</div>
                                            </div>
                                        </div>
                                        <span style={{
                                            padding: '0.15rem 0.5rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 600,
                                            background: f.activo ? '#22c55e22' : '#6b728022',
                                            color: f.activo ? '#22c55e' : '#6b7280',
                                        }}>
                                            {f.activo ? 'Activa' : 'Inactiva'}
                                        </span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        {f.contacto && <div><span style={{ fontWeight: 500 }}>Contacto:</span> {f.contacto}</div>}
                                        {f.telefono && <div><span style={{ fontWeight: 500 }}>Tel:</span> {f.telefono}</div>}
                                        {f.email && <div style={{ gridColumn: '1 / -1' }}><span style={{ fontWeight: 500 }}>Email:</span> {f.email}</div>}
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                        <button className="btn-secondary" onClick={() => openEditFinanciera(f)} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                                            <Edit size={13} /> Editar
                                        </button>
                                        <button onClick={() => setDeletingFinanciera(f)} style={{ background: 'none', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '0.5rem', cursor: 'pointer', padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                            <Trash2 size={13} /> Eliminar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                MODALS
            ════════════════════════════════════════════════════════════════ */}

            {/* ─── Modal: Crear/Editar Financiera ─── */}
            <Modal
                isOpen={showFinancieraModal}
                onClose={() => setShowFinancieraModal(false)}
                title={editingFinanciera ? 'Editar Financiera' : 'Nueva Financiera'}
                maxWidth="540px"
                footer={(
                    <>
                        <Button variant="secondary" onClick={() => setShowFinancieraModal(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={handleSaveFinanciera} loading={submittingFin}>
                            {editingFinanciera ? 'Actualizar' : 'Crear'}
                        </Button>
                    </>
                )}
            >
                <div style={{ display: 'grid', gap: '1rem' }}>
                    <div className="input-group">
                        <label className="input-label">Nombre *</label>
                        <input className="input-control" value={finForm.nombre} onChange={e => setFinForm(p => ({ ...p, nombre: e.target.value }))} placeholder="Nombre de la entidad" />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Tipo</label>
                        <select className="input-control" value={finForm.tipo} onChange={e => setFinForm(p => ({ ...p, tipo: e.target.value as 'financiera' | 'banco' | 'otra' }))}>
                            <option value="financiera">Financiera</option>
                            <option value="banco">Banco</option>
                            <option value="otra">Otra</option>
                        </select>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="input-group">
                            <label className="input-label">Contacto</label>
                            <input className="input-control" value={finForm.contacto} onChange={e => setFinForm(p => ({ ...p, contacto: e.target.value }))} placeholder="Nombre del contacto" />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Teléfono</label>
                            <input className="input-control" value={finForm.telefono} onChange={e => setFinForm(p => ({ ...p, telefono: e.target.value }))} placeholder="Teléfono" />
                        </div>
                    </div>
                    <div className="input-group">
                        <label className="input-label">Email</label>
                        <input className="input-control" type="email" value={finForm.email} onChange={e => setFinForm(p => ({ ...p, email: e.target.value }))} placeholder="email@financiera.com" />
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input type="checkbox" checked={finForm.activo} onChange={e => setFinForm(p => ({ ...p, activo: e.target.checked }))} />
                        <span>Activa</span>
                    </label>
                </div>
            </Modal>

            {/* ─── Modal: Eliminar Financiera ─── */}
            <ConfirmDialog
                isOpen={!!deletingFinanciera}
                title="Eliminar Financiera"
                message={deletingFinanciera ? `¿Eliminar ${deletingFinanciera.nombre}? Esta acción no se puede deshacer.` : ''}
                confirmLabel="Eliminar"
                cancelLabel="Cancelar"
                type="danger"
                onConfirm={handleDeleteFinanciera}
                onCancel={() => setDeletingFinanciera(null)}
            />

            {/* ─── Modal: Crear Solicitud ─── */}
            <Modal
                isOpen={showSolModal}
                onClose={() => setShowSolModal(false)}
                title="Nueva Solicitud de Financiación"
                maxWidth="540px"
                footer={(
                    <>
                        <Button variant="secondary" onClick={() => setShowSolModal(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={handleCreateSolicitud} loading={submittingSol}>
                            Crear Solicitud
                        </Button>
                    </>
                )}
            >
                <div style={{ display: 'grid', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="input-group">
                            <label className="input-label">Cliente *</label>
                            <select className="input-control" value={solForm.clienteId} onChange={e => setSolForm(p => ({ ...p, clienteId: Number(e.target.value) }))}>
                                <option value={0}>Seleccionar cliente...</option>
                                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                            </select>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Financiera *</label>
                            <select className="input-control" value={solForm.financieraId} onChange={e => setSolForm(p => ({ ...p, financieraId: Number(e.target.value) }))}>
                                <option value={0}>Seleccionar financiera...</option>
                                {financierasCatalog.map(f => <option key={f.id} value={f.id}>{f.nombre}</option>)}
                            </select>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="input-group">
                            <label className="input-label">Monto Solicitado</label>
                            <input className="input-control" type="number" min="0" placeholder="0.00" value={solForm.montoSolicitado ?? ''} onChange={e => setSolForm(p => ({ ...p, montoSolicitado: e.target.value ? Number(e.target.value) : undefined }))} />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Plazo (cuotas)</label>
                            <input className="input-control" type="number" min="1" placeholder="Ej: 24" value={solForm.plazoCuotas ?? ''} onChange={e => setSolForm(p => ({ ...p, plazoCuotas: e.target.value ? Number(e.target.value) : undefined }))} />
                        </div>
                    </div>
                    <div className="input-group">
                        <label className="input-label">Tasa Estimada (% mensual)</label>
                        <input className="input-control" type="number" min="0" step="0.01" placeholder="Ej: 3.5" value={solForm.tasaEstimada ?? ''} onChange={e => setSolForm(p => ({ ...p, tasaEstimada: e.target.value ? Number(e.target.value) : undefined }))} />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Observaciones</label>
                        <textarea className="input-control" rows={3} placeholder="Notas adicionales..." value={solForm.observaciones} onChange={e => setSolForm(p => ({ ...p, observaciones: e.target.value }))} style={{ resize: 'vertical' }} />
                    </div>
                </div>
            </Modal>

            {/* ─── Modal: Detalle Solicitud ─── */}
            <Modal
                isOpen={!!detailSolicitud}
                onClose={() => setDetailSolicitud(null)}
                title={detailSolicitud ? `Solicitud #${detailSolicitud.id}` : ''}
                subtitle={detailSolicitud ? ESTADO_SOL_LABELS[detailSolicitud.estado] : undefined}
                maxWidth="720px"
                footer={(
                    <>
                        <Button variant="secondary" onClick={() => setDetailSolicitud(null)}>Cerrar</Button>
                        {detailSolicitud && ESTADO_SOL_TRANSITIONS[detailSolicitud.estado].length > 0 && (
                            <Button
                                variant="primary"
                                onClick={() => {
                                    setTransicionSol(detailSolicitud);
                                    setNuevoEstado('');
                                    setExtraTransicion({});
                                    setDetailSolicitud(null);
                                }}
                            >
                                <ArrowRight size={15} /> Cambiar Estado
                            </Button>
                        )}
                    </>
                )}
            >
                {detailSolicitud && (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <InfoBlock title="Datos Generales">
                                <InfoRow label="Cliente" value={detailSolicitud.cliente?.nombre ?? '-'} />
                                <InfoRow label="Financiera" value={detailSolicitud.financiera?.nombre ?? '-'} />
                                <InfoRow label="Tipo" value={detailSolicitud.financiera?.tipo ? TIPO_FINANCIERA_LABELS[detailSolicitud.financiera.tipo] : '-'} />
                            </InfoBlock>
                            <InfoBlock title="Condiciones">
                                <InfoRow label="Monto Solicitado" value={detailSolicitud.montoSolicitado ? `$${fmt(detailSolicitud.montoSolicitado)}` : '-'} />
                                <InfoRow label="Plazo" value={detailSolicitud.plazoCuotas ? `${detailSolicitud.plazoCuotas} cuotas` : '-'} />
                                <InfoRow label="Tasa Estimada" value={detailSolicitud.tasaEstimada ? `${detailSolicitud.tasaEstimada}%` : '-'} />
                            </InfoBlock>
                            {(detailSolicitud.estado === 'aprobada') && (
                                <InfoBlock title="Resultado Aprobación">
                                    <InfoRow label="Monto Aprobado" value={detailSolicitud.montoAprobado ? `$${fmt(detailSolicitud.montoAprobado)}` : '-'} />
                                    <InfoRow label="Tasa Final" value={detailSolicitud.tasaFinal ? `${detailSolicitud.tasaFinal}%` : '-'} />
                                    <InfoRow label="Fecha Respuesta" value={fmtDate(detailSolicitud.fechaRespuesta)} />
                                </InfoBlock>
                            )}
                            <InfoBlock title="Fechas">
                                <InfoRow label="Creación" value={fmtDate(detailSolicitud.createdAt)} />
                                <InfoRow label="Envío" value={fmtDate(detailSolicitud.fechaEnvio)} />
                                <InfoRow label="Respuesta" value={fmtDate(detailSolicitud.fechaRespuesta)} />
                            </InfoBlock>
                        </div>

                        {detailSolicitud.observaciones && (
                            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.04)', borderRadius: '0.5rem', fontSize: '0.9rem' }}>
                                <strong>Observaciones:</strong> {detailSolicitud.observaciones}
                            </div>
                        )}

                        {/* ─── Archivos adjuntos ─── */}
                        <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                <Paperclip size={16} style={{ color: 'var(--text-secondary)' }} />
                                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
                                    Archivos adjuntos {archivosSol.length > 0 && `(${archivosSol.length})`}
                                </h3>
                            </div>

                            {loadingArchivosSol ? (
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Cargando...</p>
                            ) : archivosSol.length === 0 ? (
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Sin archivos adjuntos.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                                    {archivosSol.map(a => (
                                        <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.5rem' }}>
                                            <FileText size={16} style={{ color: 'var(--text-secondary)' }} />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 600, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {a.originalName ?? a.descripcion ?? `Archivo ${a.id}`}
                                                </div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                                    {a.tipo && <>{a.tipo} · </>}
                                                    {a.sizeBytes ? `${(a.sizeBytes / 1024).toFixed(1)} KB · ` : ''}
                                                    {fmtDate(a.createdAt)}
                                                </div>
                                            </div>
                                            <a href={a.url} target="_blank" rel="noreferrer" style={{ color: 'var(--text-secondary)', padding: '0.25rem' }} title="Ver">
                                                <ExternalLink size={14} />
                                            </a>
                                            <button onClick={() => handleDeleteArchivoSol(a)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '0.25rem' }} title="Eliminar">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <FileUploader
                                endpoint={solicitudesFinanciacionApi.uploadEndpoint(detailSolicitud.id)}
                                extraFields={{ tipo: 'documento' }}
                                onUploaded={() => {
                                    addToast('Archivo subido', 'success');
                                    loadArchivosSol(detailSolicitud.id);
                                }}
                                accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                                label="Subir nuevo archivo"
                            />
                        </div>
                    </>
                )}
            </Modal>

            {/* ─── Modal: Transición Estado Solicitud ─── */}
            <Modal
                isOpen={!!transicionSol}
                onClose={() => setTransicionSol(null)}
                title={transicionSol ? `Cambiar Estado — Solicitud #${transicionSol.id}` : ''}
                maxWidth="540px"
                footer={(
                    <>
                        <Button variant="secondary" onClick={() => setTransicionSol(null)}>Cancelar</Button>
                        <Button variant="primary" onClick={handleTransicion} loading={submittingSol} disabled={!nuevoEstado}>
                            Confirmar
                        </Button>
                    </>
                )}
            >
                {transicionSol && (
                    <>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                            Estado actual: <strong style={{ color: ESTADO_SOL_COLORS[transicionSol.estado] }}>{ESTADO_SOL_LABELS[transicionSol.estado]}</strong>
                        </p>
                        <div className="input-group">
                            <label className="input-label">Nuevo Estado *</label>
                            <select className="input-control" value={nuevoEstado} onChange={e => { setNuevoEstado(e.target.value as EstadoSolicitud); setExtraTransicion({}); }}>
                                <option value="">Seleccionar...</option>
                                {ESTADO_SOL_TRANSITIONS[transicionSol.estado].map(e => (
                                    <option key={e} value={e}>{ESTADO_SOL_LABELS[e]}</option>
                                ))}
                            </select>
                        </div>

                        {nuevoEstado === 'aprobada' && (
                            <div style={{ marginTop: '1rem', display: 'grid', gap: '0.75rem' }}>
                                <p style={{ color: '#22c55e', fontSize: '0.85rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    <CheckCircle size={14} /> Complete los datos de aprobación
                                </p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                    <div className="input-group">
                                        <label className="input-label">Monto Aprobado</label>
                                        <input className="input-control" type="number" placeholder="0.00" value={extraTransicion.montoAprobado ?? ''} onChange={e => setExtraTransicion(p => ({ ...p, montoAprobado: e.target.value }))} />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Tasa Final (%)</label>
                                        <input className="input-control" type="number" step="0.01" placeholder="0.0" value={extraTransicion.tasaFinal ?? ''} onChange={e => setExtraTransicion(p => ({ ...p, tasaFinal: e.target.value }))} />
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Fecha de Respuesta</label>
                                    <input className="input-control" type="date" value={extraTransicion.fechaRespuesta ?? ''} onChange={e => setExtraTransicion(p => ({ ...p, fechaRespuesta: e.target.value }))} />
                                </div>
                            </div>
                        )}

                        <div style={{ marginTop: '1rem' }}>
                            <div className="input-group">
                                <label className="input-label">Observaciones</label>
                                <textarea className="input-control" rows={2} placeholder="Notas opcionales..." value={extraTransicion.observaciones ?? ''} onChange={e => setExtraTransicion(p => ({ ...p, observaciones: e.target.value }))} style={{ resize: 'vertical' }} />
                            </div>
                        </div>
                    </>
                )}
            </Modal>

            {/* ─── Modal: Eliminar Solicitud ─── */}
            <ConfirmDialog
                isOpen={!!deletingSol}
                title="Eliminar Solicitud"
                message={deletingSol ? `¿Eliminar la solicitud #${deletingSol.id} de ${deletingSol.cliente?.nombre ?? ''}? Esta acción no se puede deshacer.` : ''}
                confirmLabel="Eliminar"
                cancelLabel="Cancelar"
                type="danger"
                onConfirm={handleDeleteSolicitud}
                onCancel={() => setDeletingSol(null)}
            />
        </div>
    );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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
