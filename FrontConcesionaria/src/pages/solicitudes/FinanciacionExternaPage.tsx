import { useState, useEffect, useCallback } from 'react';
import {
    Plus, Search, X, ChevronLeft, ChevronRight,
    Building2, FileText, CheckCircle,
    Eye, Trash2, Edit, ArrowRight, ExternalLink, Paperclip
} from 'lucide-react';
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
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Financiación Externa</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        Gestión de solicitudes a financieras y bancos
                    </p>
                </div>
                <button
                    className="btn-primary"
                    onClick={tab === 'solicitudes' ? () => setShowSolModal(true) : openCreateFinanciera}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Plus size={18} />
                    {tab === 'solicitudes' ? 'Nueva Solicitud' : 'Nueva Financiera'}
                </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)' }}>
                {(['solicitudes', 'financieras'] as const).map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: 'none',
                            border: 'none',
                            borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
                            color: tab === t ? 'var(--accent)' : 'var(--text-secondary)',
                            fontWeight: tab === t ? 600 : 400,
                            cursor: 'pointer',
                            fontSize: '0.95rem',
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                        }}
                    >
                        {t === 'solicitudes' ? <FileText size={16} /> : <Building2 size={16} />}
                        {t === 'solicitudes' ? 'Solicitudes' : 'Financieras'}
                    </button>
                ))}
            </div>

            {/* ─── TAB: SOLICITUDES ─── */}
            {tab === 'solicitudes' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Filters */}
                    <div className="glass" style={{ padding: '1rem', borderRadius: '0.75rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                            <input
                                className="input"
                                placeholder="Buscar cliente / financiera..."
                                value={searchSol}
                                onChange={e => setSearchSol(e.target.value)}
                                style={{ paddingLeft: '2.25rem', width: '100%' }}
                            />
                        </div>
                        <select className="input" value={filterEstado} onChange={e => { setFilterEstado(e.target.value); setPage(1); }} style={{ minWidth: '150px' }}>
                            <option value="">Todos los estados</option>
                            {(Object.keys(ESTADO_SOL_LABELS) as EstadoSolicitud[]).map(e => (
                                <option key={e} value={e}>{ESTADO_SOL_LABELS[e]}</option>
                            ))}
                        </select>
                        <select className="input" value={filterFinanciera} onChange={e => { setFilterFinanciera(e.target.value); setPage(1); }} style={{ minWidth: '150px' }}>
                            <option value="">Todas las financieras</option>
                            {financierasCatalog.map(f => (
                                <option key={f.id} value={f.id}>{f.nombre}</option>
                            ))}
                        </select>
                        {(filterEstado || filterFinanciera || searchSol) && (
                            <button className="btn-secondary" onClick={() => { setFilterEstado(''); setFilterFinanciera(''); setSearchSol(''); setPage(1); }} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
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
                                        {['#', 'Cliente', 'Financiera', 'Monto Sol.', 'Plazo', 'Estado', 'Fecha', 'Acciones'].map(h => (
                                            <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {loadingSol ? (
                                        <tr><td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando...</td></tr>
                                    ) : filteredSolicitudes.length === 0 ? (
                                        <tr><td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No hay solicitudes</td></tr>
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
                    <div className="glass" style={{ padding: '1rem', borderRadius: '0.75rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <select className="input" value={filterTipo} onChange={e => setFilterTipo(e.target.value)} style={{ minWidth: '150px' }}>
                            <option value="">Todos los tipos</option>
                            <option value="financiera">Financiera</option>
                            <option value="banco">Banco</option>
                            <option value="otra">Otra</option>
                        </select>
                        <select className="input" value={filterActivo} onChange={e => setFilterActivo(e.target.value)} style={{ minWidth: '130px' }}>
                            <option value="">Todos</option>
                            <option value="true">Activos</option>
                            <option value="false">Inactivos</option>
                        </select>
                        {(filterTipo || filterActivo) && (
                            <button className="btn-secondary" onClick={() => { setFilterTipo(''); setFilterActivo(''); }} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <X size={14} /> Limpiar
                            </button>
                        )}
                    </div>

                    {/* Grid */}
                    {loadingFin ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Cargando...</div>
                    ) : filteredFinancieras.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>No hay financieras registradas</div>
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
            {showFinancieraModal && (
                <ModalOverlay onClose={() => setShowFinancieraModal(false)}>
                    <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.25rem', fontWeight: 700 }}>
                        {editingFinanciera ? 'Editar Financiera' : 'Nueva Financiera'}
                    </h2>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <FormField label="Nombre *">
                            <input className="input" value={finForm.nombre} onChange={e => setFinForm(p => ({ ...p, nombre: e.target.value }))} placeholder="Nombre de la entidad" />
                        </FormField>
                        <FormField label="Tipo">
                            <select className="input" value={finForm.tipo} onChange={e => setFinForm(p => ({ ...p, tipo: e.target.value as any }))}>
                                <option value="financiera">Financiera</option>
                                <option value="banco">Banco</option>
                                <option value="otra">Otra</option>
                            </select>
                        </FormField>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <FormField label="Contacto">
                                <input className="input" value={finForm.contacto} onChange={e => setFinForm(p => ({ ...p, contacto: e.target.value }))} placeholder="Nombre del contacto" />
                            </FormField>
                            <FormField label="Teléfono">
                                <input className="input" value={finForm.telefono} onChange={e => setFinForm(p => ({ ...p, telefono: e.target.value }))} placeholder="Teléfono" />
                            </FormField>
                        </div>
                        <FormField label="Email">
                            <input className="input" type="email" value={finForm.email} onChange={e => setFinForm(p => ({ ...p, email: e.target.value }))} placeholder="email@financiera.com" />
                        </FormField>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input type="checkbox" checked={finForm.activo} onChange={e => setFinForm(p => ({ ...p, activo: e.target.checked }))} />
                            <span>Activa</span>
                        </label>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                        <button className="btn-secondary" onClick={() => setShowFinancieraModal(false)}>Cancelar</button>
                        <button className="btn-primary" onClick={handleSaveFinanciera} disabled={submittingFin}>
                            {submittingFin ? 'Guardando...' : editingFinanciera ? 'Actualizar' : 'Crear'}
                        </button>
                    </div>
                </ModalOverlay>
            )}

            {/* ─── Modal: Eliminar Financiera ─── */}
            {deletingFinanciera && (
                <ModalOverlay onClose={() => setDeletingFinanciera(null)}>
                    <h2 style={{ margin: '0 0 1rem', fontSize: '1.2rem', fontWeight: 700, color: '#ef4444' }}>Eliminar Financiera</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                        ¿Eliminar <strong>{deletingFinanciera.nombre}</strong>? Esta acción no se puede deshacer.
                    </p>
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                        <button className="btn-secondary" onClick={() => setDeletingFinanciera(null)}>Cancelar</button>
                        <button className="btn-danger" onClick={handleDeleteFinanciera}>Eliminar</button>
                    </div>
                </ModalOverlay>
            )}

            {/* ─── Modal: Crear Solicitud ─── */}
            {showSolModal && (
                <ModalOverlay onClose={() => setShowSolModal(false)}>
                    <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.25rem', fontWeight: 700 }}>Nueva Solicitud de Financiación</h2>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <FormField label="Cliente *">
                                <select className="input" value={solForm.clienteId} onChange={e => setSolForm(p => ({ ...p, clienteId: Number(e.target.value) }))}>
                                    <option value={0}>Seleccionar cliente...</option>
                                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                </select>
                            </FormField>
                            <FormField label="Financiera *">
                                <select className="input" value={solForm.financieraId} onChange={e => setSolForm(p => ({ ...p, financieraId: Number(e.target.value) }))}>
                                    <option value={0}>Seleccionar financiera...</option>
                                    {financierasCatalog.map(f => <option key={f.id} value={f.id}>{f.nombre}</option>)}
                                </select>
                            </FormField>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <FormField label="Monto Solicitado">
                                <input className="input" type="number" min="0" placeholder="0.00" value={solForm.montoSolicitado ?? ''} onChange={e => setSolForm(p => ({ ...p, montoSolicitado: e.target.value ? Number(e.target.value) : undefined }))} />
                            </FormField>
                            <FormField label="Plazo (cuotas)">
                                <input className="input" type="number" min="1" placeholder="Ej: 24" value={solForm.plazoCuotas ?? ''} onChange={e => setSolForm(p => ({ ...p, plazoCuotas: e.target.value ? Number(e.target.value) : undefined }))} />
                            </FormField>
                        </div>
                        <FormField label="Tasa Estimada (% mensual)">
                            <input className="input" type="number" min="0" step="0.01" placeholder="Ej: 3.5" value={solForm.tasaEstimada ?? ''} onChange={e => setSolForm(p => ({ ...p, tasaEstimada: e.target.value ? Number(e.target.value) : undefined }))} />
                        </FormField>
                        <FormField label="Observaciones">
                            <textarea className="input" rows={3} placeholder="Notas adicionales..." value={solForm.observaciones} onChange={e => setSolForm(p => ({ ...p, observaciones: e.target.value }))} style={{ resize: 'vertical' }} />
                        </FormField>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                        <button className="btn-secondary" onClick={() => setShowSolModal(false)}>Cancelar</button>
                        <button className="btn-primary" onClick={handleCreateSolicitud} disabled={submittingSol}>
                            {submittingSol ? 'Creando...' : 'Crear Solicitud'}
                        </button>
                    </div>
                </ModalOverlay>
            )}

            {/* ─── Modal: Detalle Solicitud ─── */}
            {detailSolicitud && (
                <ModalOverlay onClose={() => setDetailSolicitud(null)} wide>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700 }}>
                                Solicitud #{detailSolicitud.id}
                            </h2>
                            <span style={{
                                display: 'inline-block', marginTop: '0.4rem',
                                padding: '0.2rem 0.65rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 600,
                                background: `${ESTADO_SOL_COLORS[detailSolicitud.estado]}22`,
                                color: ESTADO_SOL_COLORS[detailSolicitud.estado],
                            }}>
                                {ESTADO_SOL_LABELS[detailSolicitud.estado]}
                            </span>
                        </div>
                        <button onClick={() => setDetailSolicitud(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
                    </div>

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

                    {ESTADO_SOL_TRANSITIONS[detailSolicitud.estado].length > 0 && (
                        <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button className="btn-primary" onClick={() => {
                                setTransicionSol(detailSolicitud);
                                setNuevoEstado('');
                                setExtraTransicion({});
                                setDetailSolicitud(null);
                            }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <ArrowRight size={15} /> Cambiar Estado
                            </button>
                        </div>
                    )}
                </ModalOverlay>
            )}

            {/* ─── Modal: Transición Estado Solicitud ─── */}
            {transicionSol && (
                <ModalOverlay onClose={() => setTransicionSol(null)}>
                    <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.2rem', fontWeight: 700 }}>
                        Cambiar Estado — Solicitud #{transicionSol.id}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                        Estado actual: <strong style={{ color: ESTADO_SOL_COLORS[transicionSol.estado] }}>{ESTADO_SOL_LABELS[transicionSol.estado]}</strong>
                    </p>
                    <FormField label="Nuevo Estado *">
                        <select className="input" value={nuevoEstado} onChange={e => { setNuevoEstado(e.target.value as EstadoSolicitud); setExtraTransicion({}); }}>
                            <option value="">Seleccionar...</option>
                            {ESTADO_SOL_TRANSITIONS[transicionSol.estado].map(e => (
                                <option key={e} value={e}>{ESTADO_SOL_LABELS[e]}</option>
                            ))}
                        </select>
                    </FormField>

                    {nuevoEstado === 'aprobada' && (
                        <div style={{ marginTop: '1rem', display: 'grid', gap: '0.75rem' }}>
                            <p style={{ color: '#22c55e', fontSize: '0.85rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <CheckCircle size={14} /> Complete los datos de aprobación
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <FormField label="Monto Aprobado">
                                    <input className="input" type="number" placeholder="0.00" value={extraTransicion.montoAprobado ?? ''} onChange={e => setExtraTransicion(p => ({ ...p, montoAprobado: e.target.value }))} />
                                </FormField>
                                <FormField label="Tasa Final (%)">
                                    <input className="input" type="number" step="0.01" placeholder="0.0" value={extraTransicion.tasaFinal ?? ''} onChange={e => setExtraTransicion(p => ({ ...p, tasaFinal: e.target.value }))} />
                                </FormField>
                            </div>
                            <FormField label="Fecha de Respuesta">
                                <input className="input" type="date" value={extraTransicion.fechaRespuesta ?? ''} onChange={e => setExtraTransicion(p => ({ ...p, fechaRespuesta: e.target.value }))} />
                            </FormField>
                        </div>
                    )}

                    <div style={{ marginTop: '1rem' }}>
                        <FormField label="Observaciones">
                            <textarea className="input" rows={2} placeholder="Notas opcionales..." value={extraTransicion.observaciones ?? ''} onChange={e => setExtraTransicion(p => ({ ...p, observaciones: e.target.value }))} style={{ resize: 'vertical' }} />
                        </FormField>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                        <button className="btn-secondary" onClick={() => setTransicionSol(null)}>Cancelar</button>
                        <button className="btn-primary" onClick={handleTransicion} disabled={!nuevoEstado || submittingSol}>
                            {submittingSol ? 'Actualizando...' : 'Confirmar'}
                        </button>
                    </div>
                </ModalOverlay>
            )}

            {/* ─── Modal: Eliminar Solicitud ─── */}
            {deletingSol && (
                <ModalOverlay onClose={() => setDeletingSol(null)}>
                    <h2 style={{ margin: '0 0 1rem', fontSize: '1.2rem', fontWeight: 700, color: '#ef4444' }}>Eliminar Solicitud</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                        ¿Eliminar la solicitud <strong>#{deletingSol.id}</strong> de <strong>{deletingSol.cliente?.nombre}</strong>? Esta acción no se puede deshacer.
                    </p>
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                        <button className="btn-secondary" onClick={() => setDeletingSol(null)}>Cancelar</button>
                        <button className="btn-danger" onClick={handleDeleteSolicitud}>Eliminar</button>
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
            <div className="glass" style={{ borderRadius: '1rem', padding: '2rem', width: '100%', maxWidth: wide ? '800px' : '520px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
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
