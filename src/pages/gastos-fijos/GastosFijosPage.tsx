import { useEffect, useState, useCallback } from 'react';
import { gastosFijosApi, type GastoFijo } from '../../api/gastos-fijos.api';
import { gastosFijosCategoriaApi, type GastoFijoCategoria } from '../../api/gastos-fijos-categorias.api';
import { sucursalesApi } from '../../api/sucursales.api';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { unwrapList, unwrapPaged } from '../../utils/api';
import { useUIStore } from '../../store/uiStore';
import Badge from '../../components/ui/Badge';
import {
    FileText, Plus, Trash2, Edit, RefreshCw,
    Tag, DollarSign, AlertCircle,
    Calendar, Building2, ExternalLink, ChevronLeft, ChevronRight
} from 'lucide-react';

type PageTab = 'gastos' | 'categorias';

const MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - i);

const EMPTY_FORM = {
    categoriaId: '',
    sucursalId: '',
    proveedorId: '',
    anio: String(CURRENT_YEAR),
    mes: String(new Date().getMonth() + 1),
    monto: '',
    descripcion: '',
    comprobanteUrl: '',
};

const EMPTY_CAT_FORM = { nombre: '', activo: true };

const GastosFijosPage = () => {
    const { addToast } = useUIStore();

    /* ── Tabs ────────────────────────────────────────── */
    const [activeTab, setActiveTab] = useState<PageTab>('gastos');

    /* ── Select data ─────────────────────────────────── */
    const [sucursales, setSucursales] = useState<{ id: number; nombre: string }[]>([]);
    const [categorias, setCategorias] = useState<GastoFijoCategoria[]>([]);

    /* ── Filters ─────────────────────────────────────── */
    const [filterAnio, setFilterAnio] = useState(String(CURRENT_YEAR));
    const [filterMes, setFilterMes] = useState('');
    const [filterCategoria, setFilterCategoria] = useState('');
    const [filterSucursal, setFilterSucursal] = useState('');

    /* ── List ────────────────────────────────────────── */
    const [gastos, setGastos] = useState<GastoFijo[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    /* ── Create modal ────────────────────────────────── */
    const [showCreate, setShowCreate] = useState(false);
    const [createForm, setCreateForm] = useState({ ...EMPTY_FORM });
    const [createError, setCreateError] = useState('');
    const [saving, setSaving] = useState(false);

    /* ── Edit modal ──────────────────────────────────── */
    const [editTarget, setEditTarget] = useState<GastoFijo | null>(null);
    const [editForm, setEditForm] = useState({ ...EMPTY_FORM });
    const [savingEdit, setSavingEdit] = useState(false);
    const [editError, setEditError] = useState('');

    /* ── Delete ──────────────────────────────────────── */
    const [deleteTarget, setDeleteTarget] = useState<GastoFijo | null>(null);
    const [deleting, setDeleting] = useState(false);

    /* ── Categories ──────────────────────────────────── */
    const [showCatCreate, setShowCatCreate] = useState(false);
    const [catForm, setCatForm] = useState({ ...EMPTY_CAT_FORM });
    const [savingCat, setSavingCat] = useState(false);
    const [editCat, setEditCat] = useState<GastoFijoCategoria | null>(null);
    const [editCatForm, setEditCatForm] = useState({ nombre: '', activo: true });
    const [deleteCatTarget, setDeleteCatTarget] = useState<GastoFijoCategoria | null>(null);
    const [deletingCat, setDeletingCat] = useState(false);

    const loadCategorias = useCallback(async () => {
        try {
            const res = await gastosFijosCategoriaApi.getAll();
            const raw = res as unknown as { data?: GastoFijoCategoria[] | { results?: GastoFijoCategoria[] } };
            const d = raw?.data;
            setCategorias(Array.isArray(d) ? d : (d && 'results' in d ? d.results ?? [] : []));
        } catch {
            addToast('Error al cargar categorías', 'error');
        }
    }, [addToast]);

    /* ── Bootstrap ───────────────────────────────────── */
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const res = await sucursalesApi.getAll();
                setSucursales(unwrapList<{ id: number; nombre: string }>(res));
                loadCategorias();
            } catch { /* silencio */ }
        };
        loadInitialData();
    }, [loadCategorias]);

    /* ── Gastos fijos ────────────────────────────────── */
    const loadGastos = useCallback(async (pg = 1) => {
        setLoading(true);
        try {
            const params: Record<string, string | number> = { page: pg, limit: 20 };
            if (filterAnio) params.anio = Number(filterAnio);
            if (filterMes) params.mes = Number(filterMes);
            if (filterCategoria) params.categoriaId = Number(filterCategoria);
            if (filterSucursal) params.sucursalId = Number(filterSucursal);
            const paged = unwrapPaged<GastoFijo>(await gastosFijosApi.getAll(params));
            setGastos(paged.results);
            setTotalPages(paged.totalPages);
            setPage(pg);
        } catch {
            addToast('Error al cargar gastos fijos', 'error');
        } finally {
            setLoading(false);
        }
    }, [filterAnio, filterMes, filterCategoria, filterSucursal, addToast]);

    useEffect(() => { loadGastos(1); }, [loadGastos]);

    const totalMonto = gastos.reduce((s, g) => s + (Number(g.monto) || 0), 0);

    /* ── Create ──────────────────────────────────────── */
    const handleCreate = async () => {
        if (!createForm.categoriaId || !createForm.anio || !createForm.mes || !createForm.monto || !createForm.descripcion.trim()) {
            setCreateError('Los campos marcados con * son mandatorios.');
            return;
        }
        setSaving(true);
        setCreateError('');
        try {
            const payload: Record<string, string | number | null> = {
                categoriaId: Number(createForm.categoriaId),
                anio: Number(createForm.anio),
                mes: Number(createForm.mes),
                monto: parseFloat(createForm.monto),
                descripcion: createForm.descripcion.trim(),
            };
            if (createForm.sucursalId) payload.sucursalId = Number(createForm.sucursalId);
            if (createForm.proveedorId) payload.proveedorId = Number(createForm.proveedorId);
            if (createForm.comprobanteUrl) payload.comprobanteUrl = createForm.comprobanteUrl.trim();
            await gastosFijosApi.create(payload);
            addToast('Egreso operativo registrado con éxito', 'success');
            setShowCreate(false);
            setCreateForm({ ...EMPTY_FORM });
            loadGastos(1);
        } catch (err: unknown) {
            setCreateError((err as { message?: string })?.message ?? 'Error estructural al guardar');
        } finally {
            setSaving(false);
        }
    };

    /* ── Edit ────────────────────────────────────────── */
    const openEdit = (g: GastoFijo) => {
        setEditTarget(g);
        setEditError('');
        setEditForm({
            categoriaId: String(g.categoriaId),
            sucursalId: g.sucursalId ? String(g.sucursalId) : '',
            proveedorId: g.proveedorId ? String(g.proveedorId) : '',
            anio: String(g.anio),
            mes: String(g.mes),
            monto: String(g.monto),
            descripcion: g.descripcion,
            comprobanteUrl: g.comprobanteUrl ?? '',
        });
    };

    const handleEdit = async () => {
        if (!editTarget) return;
        if (!editForm.categoriaId || !editForm.anio || !editForm.mes || !editForm.monto || !editForm.descripcion.trim()) {
            setEditError('Todos los campos son requeridos para la actualización.');
            return;
        }
        setSavingEdit(true);
        setEditError('');
        try {
            const payload: Record<string, string | number | null> = {
                categoriaId: Number(editForm.categoriaId),
                anio: Number(editForm.anio),
                mes: Number(editForm.mes),
                monto: parseFloat(editForm.monto),
                descripcion: editForm.descripcion.trim(),
                sucursalId: editForm.sucursalId ? Number(editForm.sucursalId) : null,
                proveedorId: editForm.proveedorId ? Number(editForm.proveedorId) : null,
                comprobanteUrl: editForm.comprobanteUrl || null,
            };
            await gastosFijosApi.update(editTarget.id, payload);
            addToast('Registro actualizado correctamente', 'success');
            setEditTarget(null);
            loadGastos(page);
        } catch (err: unknown) {
            setEditError((err as { message?: string })?.message ?? 'Error en la actualización de datos');
        } finally {
            setSavingEdit(false);
        }
    };

    /* ── Delete ──────────────────────────────────────── */
    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await gastosFijosApi.delete(deleteTarget.id);
            addToast('Registro eliminado definitivamente', 'success');
            setDeleteTarget(null);
            loadGastos(page);
        } catch {
            addToast('Error al ejecutar la baja del registro', 'error');
        } finally {
            setDeleting(false);
        }
    };

    /* ── Cat create ──────────────────────────────────── */
    const handleCatCreate = async () => {
        if (!catForm.nombre.trim()) { addToast('Defina un nombre para el rubro', 'error'); return; }
        setSavingCat(true);
        try {
            await gastosFijosCategoriaApi.create({ nombre: catForm.nombre.trim(), activo: catForm.activo });
            addToast('Nuevo rubro operativo creado', 'success');
            setShowCatCreate(false);
            setCatForm({ ...EMPTY_CAT_FORM });
            loadCategorias();
        } catch (err: unknown) {
            addToast((err as { message?: string })?.message ?? 'Fallo en la creación del rubro', 'error');
        } finally {
            setSavingCat(false);
        }
    };

    /* ── Cat edit ────────────────────────────────────── */
    const openEditCat = (c: GastoFijoCategoria) => {
        setEditCat(c);
        setEditCatForm({ nombre: c.nombre, activo: c.activo ?? true });
    };

    const handleCatEdit = async () => {
        if (!editCat) return;
        setSavingCat(true);
        try {
            await gastosFijosCategoriaApi.update(editCat.id, { nombre: editCatForm.nombre || undefined, activo: editCatForm.activo });
            addToast('Rubro actualizado con éxito', 'success');
            setEditCat(null);
            loadCategorias();
        } catch (err: unknown) {
            addToast((err as { message?: string })?.message ?? 'Error al modificar rubro', 'error');
        } finally {
            setSavingCat(false);
        }
    };

    /* ── Cat delete ──────────────────────────────────── */
    const handleCatDelete = async () => {
        if (!deleteCatTarget) return;
        setDeletingCat(true);
        try {
            await gastosFijosCategoriaApi.delete(deleteCatTarget.id);
            addToast('Categoría de egreso eliminada', 'success');
            setDeleteCatTarget(null);
            loadCategorias();
        } catch {
            addToast('Error al eliminar categoría. Podría tener registros vinculados.', 'error');
        } finally {
            setDeletingCat(false);
        }
    };

    return (
        <div className="page-container animate-fade-in">
            {/* Header */}
            <header className="page-header">
                <div className="header-title">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: '0.25rem' }}>
                        <div className="icon-badge accent">
                            <DollarSign size={20} />
                        </div>
                        <h1 style={{ margin: 0 }}>Egresos Corporativos</h1>
                    </div>
                    <p>Administración de costos fijos, alquileres, suministros y servicios recurrentes.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => loadGastos(page)}>
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </Button>
                    <Button variant="primary" onClick={() => { setShowCreate(true); setCreateError(''); }}>
                        <Plus size={18} /> Nuevo Registro
                    </Button>
                </div>
            </header>

            {/* Tabs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                <div className="tab-group" role="tablist">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={activeTab === 'gastos'}
                        onClick={() => setActiveTab('gastos')}
                        className={`tab-btn ${activeTab === 'gastos' ? 'is-active' : ''}`}
                    >
                        <Calendar size={14} />
                        Vista por Período
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={activeTab === 'categorias'}
                        onClick={() => setActiveTab('categorias')}
                        className={`tab-btn ${activeTab === 'categorias' ? 'is-active' : ''}`}
                    >
                        <Tag size={14} />
                        Rubros de Gasto
                    </button>
                </div>

                {activeTab === 'gastos' ? (
                    <>
                        {/* Stats */}
                        <div className="stats-grid stagger">
                            <div className="card stat-card">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(var(--accent-rgb), 0.10)', color: 'var(--accent)' }}>
                                        <DollarSign size={20} />
                                    </div>
                                    <Badge variant="success">ARS</Badge>
                                </div>
                                <div className="stat-content">
                                    <span className="text-muted font-bold text-xs uppercase tracking-wider mb-1">Liquidación consolidada</span>
                                    <span className="stat-value">${totalMonto.toLocaleString('es-AR')}</span>
                                </div>
                            </div>
                            <div className="card stat-card">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(var(--accent-3-rgb), 0.10)', color: 'var(--accent-3)' }}>
                                        <Calendar size={20} />
                                    </div>
                                </div>
                                <div className="stat-content">
                                    <span className="text-muted font-bold text-xs uppercase tracking-wider mb-1">Período seleccionado</span>
                                    <span className="stat-value">{filterMes ? MESES[Number(filterMes) - 1] : 'Todos'} {filterAnio}</span>
                                </div>
                            </div>
                            <div className="card stat-card">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(var(--accent-2-rgb), 0.10)', color: 'var(--accent-2)' }}>
                                        <FileText size={20} />
                                    </div>
                                </div>
                                <div className="stat-content">
                                    <span className="text-muted font-bold text-xs uppercase tracking-wider mb-1">Registros en vista</span>
                                    <span className="stat-value">{gastos.length}</span>
                                </div>
                            </div>
                        </div>

                        {/* Filters Bar */}
                        <div className="filters-bar glass">
                            <div className="filters-selects">
                                <div className="filter-field">
                                    <label className="input-label">Año fiscal</label>
                                    <select className="input-control" value={filterAnio} onChange={e => setFilterAnio(e.target.value)}>
                                        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                </div>
                                <div className="filter-field">
                                    <label className="input-label">Mes contable</label>
                                    <select className="input-control" value={filterMes} onChange={e => setFilterMes(e.target.value)}>
                                        <option value="">Todos los meses</option>
                                        {MESES.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                                    </select>
                                </div>
                                <div className="filter-field">
                                    <label className="input-label">Tipo de rubro</label>
                                    <select className="input-control" value={filterCategoria} onChange={e => setFilterCategoria(e.target.value)}>
                                        <option value="">Todas las categorías</option>
                                        {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                    </select>
                                </div>
                                <div className="filter-field">
                                    <label className="input-label">Sucursal asignada</label>
                                    <select className="input-control" value={filterSucursal} onChange={e => setFilterSucursal(e.target.value)}>
                                        <option value="">Corporativo global</option>
                                        {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                                    </select>
                                </div>
                                <div className="filter-field" style={{ justifyContent: 'flex-end' }}>
                                    <Button variant="secondary" size="sm" onClick={() => { setFilterMes(''); setFilterCategoria(''); setFilterSucursal(''); }}>
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
                                        <th>Categoría</th>
                                        <th>Mes / Período</th>
                                        <th>Descripción del Concepto</th>
                                        <th>Monto Ejecutado</th>
                                        <th>Ubicación / Plaza</th>
                                        <th style={{ textAlign: 'center' }}>Documentación</th>
                                        <th style={{ textAlign: 'right' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan={7} style={{ padding: '8rem', textAlign: 'center' }}><RefreshCw className="animate-spin text-accent mx-auto" size={40} /></td></tr>
                                    ) : gastos.length === 0 ? (
                                        <tr>
                                            <td colSpan={7}>
                                                <div className="dt-empty">
                                                    <div className="dt-empty-badge"><FileText size={36} /></div>
                                                    <p className="dt-empty-text">No hay gastos fijos registrados para el período</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        gastos.map(g => (
                                            <tr key={g.id}>
                                                <td><Badge variant="cyan">{g.categoria?.nombre ?? 'General'}</Badge></td>
                                                <td>
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{MESES[g.mes - 1]}</span>
                                                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{g.anio}</span>
                                                    </div>
                                                </td>
                                                <td style={{ maxWidth: '280px' }}>
                                                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }} title={g.descripcion}>{g.descripcion}</span>
                                                </td>
                                                <td>
                                                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                                                        ${Number(g.monto).toLocaleString('es-AR')}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                                                        <Building2 size={14} style={{ color: 'var(--text-muted)' }} />
                                                        <span>{g.sucursal?.nombre ?? 'Corporativo'}</span>
                                                    </div>
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    {g.comprobanteUrl ? (
                                                        <a href={g.comprobanteUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                                                            <ExternalLink size={12} /> Ver
                                                        </a>
                                                    ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                                                        <button className="icon-btn" onClick={() => openEdit(g)} title="Editar" aria-label="Editar"><Edit size={14} /></button>
                                                        <button className="icon-btn danger" onClick={() => setDeleteTarget(g)} title="Eliminar" aria-label="Eliminar"><Trash2 size={14} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <nav className="pager" aria-label="Paginación">
                                <button type="button" className="pager-btn" disabled={page === 1} onClick={() => loadGastos(page - 1)}>
                                    <ChevronLeft size={16} /> <span>Anterior</span>
                                </button>
                                <div className="pager-status">
                                    <span className="pager-current">{page}</span>
                                    <span className="pager-divider">/</span>
                                    <span className="pager-total">{totalPages}</span>
                                </div>
                                <button type="button" className="pager-btn" disabled={page === totalPages} onClick={() => loadGastos(page + 1)}>
                                    <span>Siguiente</span> <ChevronRight size={16} />
                                </button>
                            </nav>
                        )}
                    </>
                ) : (
                    /* Categorias View */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-4)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                                <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(var(--accent-rgb), 0.10)', color: 'var(--accent)' }}>
                                    <Tag size={20} />
                                </div>
                                <div>
                                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>Gestión de Rubros</h2>
                                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: '2px 0 0' }}>Parámetros de clasificación para gastos mensuales recurrentes.</p>
                                </div>
                            </div>
                            {!showCatCreate && (
                                <Button variant="primary" onClick={() => setShowCatCreate(true)}>
                                    <Plus size={16} /> Nuevo Rubro
                                </Button>
                            )}
                        </div>

                        {showCatCreate && (
                            <div className="card animate-fade-in">
                                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Plus size={18} style={{ color: 'var(--accent)' }} /> Definir nueva categoría
                                </h3>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)', alignItems: 'flex-end' }}>
                                    <div className="input-group" style={{ flex: 1, minWidth: '240px', marginBottom: 0 }}>
                                        <label className="input-label">Nombre del concepto *</label>
                                        <input className="input-control" placeholder="Ej: Servicios públicos, impuestos…" value={catForm.nombre} onChange={e => setCatForm(f => ({ ...f, nombre: e.target.value }))} autoFocus />
                                    </div>
                                    <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                                        <Button variant="secondary" onClick={() => setShowCatCreate(false)}>Cancelar</Button>
                                        <Button variant="primary" onClick={handleCatCreate} loading={savingCat}>Guardar</Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Identificador del rubro</th>
                                        <th>Estado operativo</th>
                                        <th style={{ textAlign: 'right' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {categorias.length === 0 ? (
                                        <tr>
                                            <td colSpan={3}>
                                                <div className="dt-empty">
                                                    <div className="dt-empty-badge"><Tag size={36} /></div>
                                                    <p className="dt-empty-text">No hay rubros definidos todavía</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        categorias.map(c => (
                                            <tr key={c.id}>
                                                <td>
                                                    {editCat?.id === c.id ? (
                                                        <input className="input-control" value={editCatForm.nombre} onChange={e => setEditCatForm(f => ({ ...f, nombre: e.target.value }))} />
                                                    ) : (
                                                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--text-primary)' }}>
                                                            {c.nombre}
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    <Badge variant={c.activo !== false ? 'success' : 'default'}>
                                                        {c.activo !== false ? 'Visible en carga' : 'Archivado'}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    {editCat?.id === c.id ? (
                                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                                                            <Button variant="primary" size="sm" onClick={handleCatEdit} loading={savingCat}>Guardar</Button>
                                                            <Button variant="secondary" size="sm" onClick={() => setEditCat(null)}>Cancelar</Button>
                                                        </div>
                                                    ) : (
                                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                                                            <button className="icon-btn" onClick={() => openEditCat(c)} aria-label="Editar"><Edit size={14} /></button>
                                                            <button className="icon-btn danger" onClick={() => setDeleteCatTarget(c)} aria-label="Eliminar"><Trash2 size={14} /></button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            <Modal
                isOpen={showCreate || editTarget !== null}
                onClose={() => { setShowCreate(false); setEditTarget(null); }}
                title={editTarget ? 'Actualización de Carga' : 'Certificación de Egreso'}
                subtitle="Asegúrese de adjuntar digitalmente el comprobante de respaldo."
                maxWidth="720px"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => { setShowCreate(false); setEditTarget(null); }}>Abortar</Button>
                        <Button variant="primary" onClick={editTarget ? handleEdit : handleCreate} loading={saving || savingEdit}>
                            {editTarget ? 'Confirmar Cambios' : 'Registrar'}
                        </Button>
                    </>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                        <div className="input-group">
                            <label className="input-label">Rubro del gasto *</label>
                            <select className="input-control"
                                value={editTarget ? editForm.categoriaId : createForm.categoriaId}
                                onChange={e => editTarget ? setEditForm(f => ({ ...f, categoriaId: e.target.value })) : setCreateForm(f => ({ ...f, categoriaId: e.target.value }))}>
                                <option value="">Seleccioná una cuenta…</option>
                                {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                            </select>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Período fiscal *</label>
                            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                                <select className="input-control" style={{ flex: 1 }}
                                    value={editTarget ? editForm.mes : createForm.mes}
                                    onChange={e => editTarget ? setEditForm(f => ({ ...f, mes: e.target.value })) : setCreateForm(f => ({ ...f, mes: e.target.value }))}>
                                    {MESES.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                                </select>
                                <select className="input-control" style={{ flex: '0 0 100px' }}
                                    value={editTarget ? editForm.anio : createForm.anio}
                                    onChange={e => editTarget ? setEditForm(f => ({ ...f, anio: e.target.value })) : setCreateForm(f => ({ ...f, anio: e.target.value }))}>
                                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Descripción detallada *</label>
                        <textarea className="input-control" rows={3}
                            value={editTarget ? editForm.descripcion : createForm.descripcion}
                            onChange={e => editTarget ? setEditForm(f => ({ ...f, descripcion: e.target.value })) : setCreateForm(f => ({ ...f, descripcion: e.target.value }))}
                            placeholder="Justificación y desglose del egreso…"
                            style={{ resize: 'vertical' }} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                        <div className="input-group">
                            <label className="input-label">Importe (ARS) *</label>
                            <div className="input-container has-icon">
                                <span className="input-icon" aria-hidden="true" style={{ fontWeight: 700, color: 'var(--accent)' }}>$</span>
                                <input type="number" className="input-control" placeholder="0.00"
                                    value={editTarget ? editForm.monto : createForm.monto}
                                    onChange={e => editTarget ? setEditForm(f => ({ ...f, monto: e.target.value })) : setCreateForm(f => ({ ...f, monto: e.target.value }))} />
                            </div>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Plaza / Sucursal</label>
                            <select className="input-control"
                                value={editTarget ? editForm.sucursalId : createForm.sucursalId}
                                onChange={e => editTarget ? setEditForm(f => ({ ...f, sucursalId: e.target.value })) : setCreateForm(f => ({ ...f, sucursalId: e.target.value }))}>
                                <option value="">Centralizado (corporativo)</option>
                                {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Link de comprobante digital (PDF/IMG)</label>
                        <div className="input-container has-icon">
                            <span className="input-icon" aria-hidden="true"><ExternalLink size={14} /></span>
                            <input className="input-control"
                                value={editTarget ? editForm.comprobanteUrl : createForm.comprobanteUrl}
                                onChange={e => editTarget ? setEditForm(f => ({ ...f, comprobanteUrl: e.target.value })) : setCreateForm(f => ({ ...f, comprobanteUrl: e.target.value }))}
                                placeholder="https://bucket-almacenamiento.com/factura-123.pdf" />
                        </div>
                    </div>

                    {(createError || editError) && (
                        <div className="uploader-alert uploader-alert-error">
                            <AlertCircle size={14} />
                            <span>{createError || editError}</span>
                        </div>
                    )}
                </div>
            </Modal>

            <ConfirmDialog
                isOpen={deleteTarget !== null || deleteCatTarget !== null}
                title="¿Ejecutar baja?"
                message={`Esta operación eliminará irremediablemente ${deleteTarget
                    ? 'el registro por $' + Number(deleteTarget.monto).toLocaleString('es-AR')
                    : 'la categoría "' + deleteCatTarget?.nombre + '"'}.`}
                confirmLabel="Eliminar"
                cancelLabel="Cerrar"
                type="danger"
                onConfirm={deleteTarget ? handleDelete : handleCatDelete}
                onCancel={() => { setDeleteTarget(null); setDeleteCatTarget(null); }}
                loading={deleting || deletingCat}
            />

        </div>
    );
};

export default GastosFijosPage;
