import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { presupuestosApi } from '../../api/presupuestos.api';
import { clientesApi } from '../../api/clientes.api';
import { usuariosApi } from '../../api/usuarios.api';
import { sucursalesApi } from '../../api/sucursales.api';
import { vehiculosApi } from '../../api/vehiculos.api';
import client from '../../api/client';
import type { EstadoPresupuesto } from '../../types/presupuesto.types';
import type { FormaPagoVenta } from '../../types/venta.types';
// Types y utils extraídos a archivos separados (Sprint 4) — antes estaban
// inline acá inflando la page a 1010 LOC.
import type {
    PresupuestoRow,
    PresupuestoItem,
    PresupuestoExtra,
    ClienteRef,
    SucursalRef,
    VehiculoRef,
    VendedorRef,
} from './presupuestos.types';
import {
    FORMA_PAGO_OPTIONS_CONV,
    fmt,
    currencyFmt,
    STATUS,
    emptyItem,
    blankForm,
} from './presupuestos.utils';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useUIStore } from '../../store/uiStore';
import {
    Plus, Search, Eye, Pencil, Trash2, ChevronLeft, ChevronRight,
    SendHorizonal, CheckCircle, XCircle, Clock, FileText, Car,
    ArrowRightLeft, DollarSign, Calendar, User,
    MapPin, Hash, RefreshCw, Briefcase, Calculator, ArrowRight
} from 'lucide-react';

const PresupuestosPage = () => {
    const { addToast } = useUIStore();
    const navigate = useNavigate();

    /* ── convertir en venta ── */
    const [convertirId, setConvertirId] = useState<number | null>(null);
    const [convertirForm, setConvertirForm] = useState({
        formaPago: 'contado' as FormaPagoVenta,
        moneda: 'ARS' as 'ARS' | 'USD',
        fechaVenta: new Date().toISOString().slice(0, 10),
        observaciones: '',
    });
    const [convertirSaving, setConvertirSaving] = useState(false);

    const handleConvertirEnVenta = async () => {
        if (!convertirId) return;
        setConvertirSaving(true);
        try {
            await client.post(`/presupuestos/${convertirId}/convertir-en-venta`, {
                formaPago: convertirForm.formaPago,
                fechaVenta: convertirForm.fechaVenta,
                moneda: convertirForm.moneda,
                ...(convertirForm.observaciones && { observaciones: convertirForm.observaciones }),
            });
            addToast('Venta creada con éxito', 'success');
            setConvertirId(null);
            navigate('/ventas');
        } catch (err: unknown) {
            const e = err as { message?: string; code?: string };
            addToast(e?.message || 'Error al convertir el presupuesto', 'error');
        } finally {
            setConvertirSaving(false);
        }
    };

    /* ── data ── */
    const [presupuestos, setPresupuestos] = useState<PresupuestoRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    /* ── filters ── */
    const [search, setSearch] = useState('');
    const [filterEstado, setFilterEstado] = useState('');

    /* ── catalogs ── */
    const [clientes, setClientes] = useState<ClienteRef[]>([]);
    const [vendedores, setVendedores] = useState<VendedorRef[]>([]);
    const [sucursales, setSucursales] = useState<SucursalRef[]>([]);
    const [vehiculos, setVehiculos] = useState<VehiculoRef[]>([]);

    /* ── modals ── */
    const [createOpen, setCreateOpen] = useState(false);
    const [detailId, setDetailId] = useState<number | null>(null);
    const [detail, setDetail] = useState<PresupuestoRow | null>(null);
    const [, setDetailLoading] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState({ estado: '', observaciones: '' });
    const [deleteId, setDeleteId] = useState<number | null>(null);

    /* ── create form ── */
    const [form, setForm] = useState(blankForm());
    const [saving, setSaving] = useState(false);

    /* ── load catalogs ── */
    useEffect(() => {
        Promise.all([
            clientesApi.getAll({}, { limit: 1000 }),
            usuariosApi.getAll({}, { limit: 1000 }),
            sucursalesApi.getAll({}, { limit: 100 }),
            vehiculosApi.getAll({ estado: 'publicado' }, { limit: 1000 }),
        ]).then(([c, u, s, v]) => {
            setClientes((c.results ?? []) as ClienteRef[]);
            setVendedores(((u as { results?: VendedorRef[] }).results ?? []));
            setSucursales(((s as { results?: SucursalRef[] }).results ?? []));
            setVehiculos((v.results ?? []) as VehiculoRef[]);
        });
    }, []);

    /* ── load list ── */
    const load = useCallback(async (p = 1) => {
        setLoading(true);
        try {
            const params: Record<string, unknown> = { page: p, limit: 15 };
            if (filterEstado) params.estado = filterEstado;
            const res = await presupuestosApi.getAll(params);
            setPresupuestos((res?.results ?? []) as PresupuestoRow[]);
            setTotalPages(res?.totalPages ?? 1);
            setPage(p);
        } catch {
            addToast('Error al sincronizar la matriz de cotizaciones', 'error');
        } finally {
            setLoading(false);
        }
    }, [filterEstado, addToast]);

    useEffect(() => { load(1); }, [load]);

    /* ── load detail ── */
    useEffect(() => {
        if (detailId === null) { setDetail(null); return; }
        setDetailLoading(true);
        presupuestosApi.getById(detailId)
            .then(r => setDetail(((r as { data?: { data?: PresupuestoRow } })?.data?.data ?? null))
            )
            .catch(() => addToast('Fallo en la recuperación del expediente comercial', 'error'))
            .finally(() => setDetailLoading(false));
    }, [detailId, addToast]);

    /* ── client-side search ── */
    const filtered = presupuestos.filter(p => {
        if (!search) return true;
        const s = search.toLowerCase();
        return (
            p.nroPresupuesto?.toLowerCase().includes(s) ||
            p.cliente?.nombre?.toLowerCase().includes(s) ||
            p.vendedor?.nombre?.toLowerCase().includes(s)
        );
    });

    /* ── create ── */
    const handleCreate = async () => {
        if (!form.sucursalId || !form.clienteId || !form.vendedorId) {
            addToast('Complete la estructura mandatoria: sucursal, cliente y oficial', 'error'); return;
        }
        const validItems = form.items.filter(i => i.vehiculoId && i.precioFinal);
        if (validItems.length === 0) {
            addToast('Debe incluir al menos una unidad cotizada', 'error'); return;
        }
        setSaving(true);
        try {
            const body: Parameters<typeof presupuestosApi.create>[0] = {
                nroPresupuesto: form.nroPresupuesto,
                sucursalId: Number(form.sucursalId),
                clienteId: Number(form.clienteId),
                vendedorId: Number(form.vendedorId),
                moneda: form.moneda,
                fechaCreacion: form.fechaCreacion,
                ...(form.validoHasta && { validoHasta: form.validoHasta }),
                ...(form.observaciones && { observaciones: form.observaciones }),
                items: validItems.map(i => ({
                    vehiculoId: Number(i.vehiculoId),
                    precioLista: Number(i.precioLista) || Number(i.precioFinal),
                    descuento: Number(i.descuento) || 0,
                    precioFinal: Number(i.precioFinal),
                })),
                externos: form.extras
                    .filter(e => e.descripcion && e.monto)
                    .map(e => ({ descripcion: e.descripcion, monto: Number(e.monto) })),
            };
            if (form.conCanje && form.canje.valorTomado) {
                body.canjes = {
                    descripcion: form.canje.descripcion || undefined,
                    anio: form.canje.anio ? Number(form.canje.anio) : undefined,
                    km: form.canje.km ? Number(form.canje.km) : undefined,
                    dominio: form.canje.dominio || undefined,
                    valorTomado: Number(form.canje.valorTomado),
                    observaciones: form.canje.observaciones || undefined,
                };
            }
            await presupuestosApi.create(body);
            addToast('Propuesta comercial instrumentada con éxito', 'success');
            setCreateOpen(false);
            setForm(blankForm());
            load(1);
        } catch (e: unknown) {
            const err = e as { response?: { data?: { message?: string } } };
            addToast(err.response?.data?.message ?? 'Fallo en la validación de la cotización', 'error');
        } finally {
            setSaving(false);
        }
    };

    /* ── edit ── */
    const openEdit = (p: PresupuestoRow) => {
        setEditId(Number(p.id));
        setEditForm({ estado: String(p.estado || ''), observaciones: String(p.observaciones || '') });
    };

    const handleEdit = async () => {
        if (!editId) return;
        setSaving(true);
        try {
            await presupuestosApi.update(editId, {
                estado: editForm.estado || undefined,
                observaciones: editForm.observaciones || undefined,
            });
            addToast('Parámetros de presupuesto actualizados', 'success');
            setEditId(null);
            load(page);
        } catch (e: unknown) {
            const err = e as { response?: { data?: { message?: string } } };
            addToast(err.response?.data?.message ?? 'Error al actualizar expediente', 'error');
        } finally {
            setSaving(false);
        }
    };

    /* ── quick estado transitions ── */
    const changeEstado = async (id: number, estado: string) => {
        try {
            await presupuestosApi.update(id, { estado });
            addToast(`Expediente actualizado a: ${STATUS[estado as EstadoPresupuesto]?.label.toUpperCase()}`, 'success');
            load(page);
        } catch (e: unknown) {
            const err = e as { response?: { data?: { message?: string } } };
            addToast(err.response?.data?.message ?? 'Fallo en la transición administrativa', 'error');
        }
    };

    /* ── delete ── */
    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await presupuestosApi.delete(deleteId);
            addToast('Cotización revocada del sistema', 'success');
            setDeleteId(null);
            load(page);
        } catch (e: unknown) {
            const err = e as { response?: { data?: { message?: string } } };
            addToast(err.response?.data?.message ?? 'Error al anular presupuesto', 'error');
        }
    };

    /* ── dynamic row helpers ── */
    const addItem = () => setForm(f => ({ ...f, items: [...f.items, emptyItem()] }));
    const removeItem = (i: number) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
    const updItem = (i: number, k: string, v: string) =>
        setForm(f => ({ ...f, items: f.items.map((it, idx) => idx === i ? { ...it, [k]: v } : it) }));

    /* ── total calc ── */
    const calcTotal = (pres: PresupuestoRow) => {
        const items = (pres.items ?? []).reduce((s: number, i: PresupuestoItem) => s + Number(i.precioFinal ?? 0), 0);
        const extras = (pres.extras ?? []).reduce((s: number, e: PresupuestoExtra) => s + Number(e.monto ?? 0), 0);
        const canje = pres.canje ? Number(pres.canje.valorTomado ?? 0) : 0;
        return items + extras - canje;
    };

    const currentTotal = () => {
        const items = form.items.reduce((s, i) => s + Number(i.precioFinal || 0), 0);
        const extras = form.extras.reduce((s, e) => s + Number(e.monto || 0), 0);
        const canje = form.conCanje ? Number(form.canje.valorTomado || 0) : 0;
        return items + extras - canje;
    };

    /* ── transition map ── */
    const transitions: Record<string, { label: string; next: string; icon: React.ReactNode; clr: string }[]> = {
        borrador: [{ label: 'Emitir', next: 'enviado', icon: <SendHorizonal size={14} />, clr: '#3b82f6' }],
        enviado: [
            { label: 'Aprobar', next: 'aceptado', icon: <CheckCircle size={14} />, clr: '#22c55e' },
            { label: 'Rechazar', next: 'rechazado', icon: <XCircle size={14} />, clr: '#ef4444' },
            { label: 'Vencer', next: 'vencido', icon: <Clock size={14} />, clr: '#f59e0b' },
        ],
        aceptado: [{ label: 'Anular', next: 'cancelado', icon: <XCircle size={14} />, clr: '#6b7280' }],
    };

    return (
        <div className="page-container animate-fade-in">
            {/* Header */}
            <header className="page-header">
                <div className="header-title">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="icon-badge primary shadow-glow">
                            <FileText size={20} />
                        </div>
                        <h1>Cotizaciones y Presupuestos</h1>
                    </div>
                    <p>Administración estratégica de propuestas comerciales, funnel de ventas y auditoría de ofertas.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => load(page)}>
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </Button>
                    <Button variant="primary" onClick={() => { setForm(blankForm()); setCreateOpen(true); }}>
                        <Plus size={18} /> Nueva Cotización Comercial
                    </Button>
                </div>
            </header>

            {/* Quick Metrics Bar */}
            <div className="stats-grid stagger">
                <div className="card stat-card">
                    <div className="flex justify-between items-start mb-4">
                        <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(var(--accent-3-rgb), 0.10)', color: 'var(--accent-3)' }}>
                            <SendHorizonal size={20} />
                        </div>
                    </div>
                    <div className="stat-content">
                        <span className="text-muted font-bold text-xs uppercase tracking-wider mb-1">En Negociación</span>
                        <span className="stat-value">{presupuestos.filter(p => p.estado === 'enviado').length}</span>
                    </div>
                </div>

                <div className="card stat-card">
                    <div className="flex justify-between items-start mb-4">
                        <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(var(--accent-rgb), 0.10)', color: 'var(--accent)' }}>
                            <CheckCircle size={20} />
                        </div>
                    </div>
                    <div className="stat-content">
                        <span className="text-muted font-bold text-xs uppercase tracking-wider mb-1">Convertidos</span>
                        <span className="stat-value">{presupuestos.filter(p => p.estado === 'aceptado').length}</span>
                    </div>
                </div>

                <div className="card stat-card">
                    <div className="flex justify-between items-start mb-4">
                        <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(var(--accent-2-rgb), 0.10)', color: 'var(--accent-2)' }}>
                            <Calculator size={20} />
                        </div>
                        <Badge variant="violet">Pre-venta</Badge>
                    </div>
                    <div className="stat-content">
                        <span className="text-muted font-bold text-xs uppercase tracking-wider mb-1">Volumen Proyectado</span>
                        <span className="stat-value">${presupuestos.reduce((s, p) => s + calcTotal(p), 0).toLocaleString('es-AR')}</span>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="filters-bar glass">
                <div className="filters-search">
                    <Search size={16} />
                    <input
                        type="text"
                        placeholder="Buscar por nro de expediente, cliente o responsable…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="filters-selects">
                    <div className="filter-field">
                        <label className="input-label">Estado</label>
                        <select className="input-control" value={filterEstado} onChange={e => { setFilterEstado(e.target.value); setPage(1); }}>
                            <option value="">Todos los estados</option>
                            {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                    </div>
                    <div className="filter-field" style={{ justifyContent: 'flex-end' }}>
                        <Button variant="secondary" size="sm" onClick={() => { setSearch(''); setFilterEstado(''); setPage(1); }}>
                            <RefreshCw size={14} /> Limpiar
                        </Button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="table-container card">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Identificador</th>
                            <th>Emisión</th>
                            <th>Validez</th>
                            <th>Interesado</th>
                            <th>Oficial de Cuenta</th>
                            <th>Estado Comercial</th>
                            <th style={{ textAlign: 'right' }}>Gestión</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7} style={{ padding: '8rem', textAlign: 'center' }}><RefreshCw className="animate-spin text-accent mx-auto" size={40} /></td></tr>
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={7}>
                                    <div className="flex flex-col items-center py-24 text-muted">
                                        <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mb-4 ring-1 ring-slate-700">
                                            <FileText size={40} className="text-slate-600" />
                                        </div>
                                        <p className="text-xl font-black text-slate-400 italic">No se registran cotizaciones activas</p>
                                        <p className="text-sm font-medium">Inicie una nueva propuesta con el botón superior.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filtered.map(p => (
                                <tr key={p.id} onClick={() => setDetailId(p.id)} className="cursor-pointer group">
                                    <td>
                                        <div className="flex flex-col">
                                            <span className="font-mono text-xs font-bold text-accent-light tracking-widest">{p.nroPresupuesto}</span>
                                            <span className="text-[10px] font-black text-slate-500 uppercase">DOC-COM-{p.id}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Calendar size={14} />
                                            <span className="text-xs font-semibold">{fmt(p.fechaCreacion)}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`text-xs font-black ${p.validoHasta && new Date(p.validoHasta) < new Date() ? 'text-red-400' : 'text-slate-300'}`}>
                                            {fmt(p.validoHasta)}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700">
                                                <User size={14} />
                                            </div>
                                            <span className="font-bold text-white uppercase text-xs truncate max-w-[150px]">{p.cliente?.nombre ?? '-'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <Briefcase size={14} className="text-slate-500" />
                                            <span className="text-[10px] font-black text-slate-500 uppercase">{p.vendedor?.nombre ?? 'NO ASIGN.'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <Badge variant={STATUS[p.estado as EstadoPresupuesto]?.variant ?? 'default'}>
                                            {STATUS[p.estado as EstadoPresupuesto]?.label.toUpperCase()}
                                        </Badge>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all" onClick={e => e.stopPropagation()}>
                                            {(transitions[p.estado] ?? []).map(t => (
                                                <button key={t.next} className="icon-btn" title={t.label}
                                                    style={{ color: t.clr }} onClick={() => changeEstado(p.id, t.next)}>
                                                    {t.icon}
                                                </button>
                                            ))}
                                            {p.estado === 'aceptado' && (
                                                <button className="icon-btn" title="Convertir en venta"
                                                    style={{ color: '#22c55e' }}
                                                    onClick={() => {
                                                        setConvertirId(Number(p.id));
                                                        setConvertirForm({
                                                            formaPago: 'contado',
                                                            moneda: (p.moneda as 'ARS' | 'USD') || 'ARS',
                                                            fechaVenta: new Date().toISOString().slice(0, 10),
                                                            observaciones: '',
                                                        });
                                                    }}>
                                                    <ArrowRight size={16} />
                                                </button>
                                            )}
                                            <button className="icon-btn" title="Ver Expediente" onClick={() => setDetailId(p.id)}><Eye size={16} /></button>
                                            <button className="icon-btn" title="Editar Metadatos" onClick={() => openEdit(p)}><Pencil size={16} /></button>
                                            <button className="icon-btn danger" title="Anular" onClick={() => setDeleteId(p.id)}><Trash2 size={16} /></button>
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
                <div className="flex justify-center items-center gap-6 mt-8">
                    <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => load(page - 1)}>
                        <ChevronLeft size={16} /> Anterior
                    </Button>
                    <div className="flex items-center gap-2">
                        <span className="w-9 h-9 bg-accent text-white rounded-xl flex items-center justify-center font-black text-sm shadow-lg shadow-accent/20">{page}</span>
                    </div>
                    <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => load(page + 1)}>
                        Siguiente <ChevronRight size={16} />
                    </Button>
                </div>
            )}

            {/* CREATE MODAL */}
            <Modal
                isOpen={createOpen}
                onClose={() => setCreateOpen(false)}
                title="Instrumentación de Cotización"
                subtitle="Defina las condiciones comerciales y activos involucrados en la propuesta."
                maxWidth="940px"
                footer={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: 'var(--space-4)' }}>
                        <div>
                            <p style={{
                                fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-muted)',
                                textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px',
                            }}>
                                Impacto final neto
                            </p>
                            <p style={{
                                fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)',
                                fontWeight: 700, color: 'var(--text-primary)',
                                fontVariantNumeric: 'tabular-nums', margin: 0,
                            }}>
                                ${currentTotal().toLocaleString('es-AR')}
                                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '0.4rem' }}>
                                    ({form.moneda})
                                </span>
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancelar</Button>
                            <Button variant="primary" onClick={handleCreate} loading={saving}>
                                Instrumentar Propuesta
                            </Button>
                        </div>
                    </div>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                    {/* Primary Info */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)' }}>
                        <div className="input-group">
                            <label className="input-label">Nro. de control *</label>
                            <div className="input-container has-icon">
                                <span className="input-icon" aria-hidden="true" style={{ color: 'var(--accent)' }}><Hash size={14} /></span>
                                <input className="input-control" value={form.nroPresupuesto} onChange={e => setForm(f => ({ ...f, nroPresupuesto: e.target.value }))} />
                            </div>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Divisa *</label>
                            <select className="input-control" value={form.moneda} onChange={e => setForm(f => ({ ...f, moneda: e.target.value as 'ARS' | 'USD' }))}>
                                <option value="ARS">Peso argentino (ARS)</option>
                                <option value="USD">Dólar estadounidense (USD)</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Sucursal de radicación *</label>
                            <select className="input-control" value={form.sucursalId} onChange={e => setForm(f => ({ ...f, sucursalId: e.target.value }))}>
                                <option value="">Seleccionar punto de venta…</option>
                                {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                            </select>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Cliente potencial *</label>
                            <select className="input-control" value={form.clienteId} onChange={e => setForm(f => ({ ...f, clienteId: e.target.value }))}>
                                <option value="">Seleccionar prospecto…</option>
                                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                            </select>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Vendedor designado *</label>
                            <select className="input-control" value={form.vendedorId} onChange={e => setForm(f => ({ ...f, vendedorId: e.target.value }))}>
                                <option value="">Asignar oficial comercial…</option>
                                {vendedores.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                            </select>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Fecha límite de validez</label>
                            <input type="date" className="input-control" value={form.validoHasta} onChange={e => setForm(f => ({ ...f, validoHasta: e.target.value }))} />
                        </div>
                    </div>

                    {/* Items Section */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-2)',
                        }}>
                            <h3 style={{
                                margin: 0, fontSize: 'var(--text-xs)', fontWeight: 700,
                                textTransform: 'uppercase', color: 'var(--accent)', letterSpacing: '0.08em',
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                            }}>
                                <Car size={14} /> Unidades cotizadas
                            </h3>
                            <Button variant="secondary" size="sm" onClick={addItem}>
                                <Plus size={14} /> Añadir unidad
                            </Button>
                        </div>
                        {form.items.map((item, i) => (
                            <div key={i} style={{
                                display: 'grid', gridTemplateColumns: '5fr 2fr 2fr 2fr auto',
                                gap: 'var(--space-3)', alignItems: 'flex-end',
                                background: 'var(--bg-secondary)', padding: 'var(--space-4)',
                                borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
                            }}>
                                <div className="input-group" style={{ marginBottom: 0 }}>
                                    <label className="input-label">Vehículo / Modelo</label>
                                    <select className="input-control" value={item.vehiculoId} onChange={e => updItem(i, 'vehiculoId', e.target.value)}>
                                        <option value="">Seleccione unidad en stock…</option>
                                        {vehiculos.map(v => <option key={v.id} value={v.id}>{v.marca} {v.modelo} — {v.dominio ?? v.vin ?? `#${v.id}`}</option>)}
                                    </select>
                                </div>
                                <div className="input-group" style={{ marginBottom: 0 }}>
                                    <label className="input-label">P. Lista</label>
                                    <input type="number" className="input-control" placeholder="0.00"
                                        value={item.precioLista} onChange={e => updItem(i, 'precioLista', e.target.value)} />
                                </div>
                                <div className="input-group" style={{ marginBottom: 0 }}>
                                    <label className="input-label">Desc.</label>
                                    <input type="number" className="input-control" placeholder="0"
                                        value={item.descuento} onChange={e => updItem(i, 'descuento', e.target.value)} />
                                </div>
                                <div className="input-group" style={{ marginBottom: 0 }}>
                                    <label className="input-label">Final *</label>
                                    <input type="number" className="input-control" placeholder="0.00"
                                        value={item.precioFinal} onChange={e => updItem(i, 'precioFinal', e.target.value)} />
                                </div>
                                <button
                                    type="button"
                                    className="icon-btn danger"
                                    style={{ marginBottom: 4 }}
                                    aria-label="Quitar unidad"
                                    disabled={form.items.length === 1}
                                    onClick={() => removeItem(i)}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Canje Section */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-2)',
                        }}>
                            <h3 style={{
                                margin: 0, fontSize: 'var(--text-xs)', fontWeight: 700,
                                textTransform: 'uppercase', color: 'var(--accent-2)', letterSpacing: '0.08em',
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                            }}>
                                <ArrowRightLeft size={14} /> Toma de usado (canje)
                            </h3>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', userSelect: 'none' }}>
                                <span style={{
                                    fontSize: 'var(--text-xs)', fontWeight: 600,
                                    color: form.conCanje ? 'var(--accent-2)' : 'var(--text-muted)',
                                    textTransform: 'uppercase', letterSpacing: '0.06em',
                                }}>
                                    {form.conCanje ? 'Incluido' : 'Sin canje'}
                                </span>
                                <input
                                    type="checkbox"
                                    checked={form.conCanje}
                                    onChange={() => setForm(f => ({ ...f, conCanje: !f.conCanje }))}
                                    style={{ width: 16, height: 16, accentColor: 'var(--accent-2)', cursor: 'pointer' }}
                                />
                            </label>
                        </div>
                        {form.conCanje && (
                            <div style={{
                                display: 'grid', gridTemplateColumns: '2fr 1fr 1fr',
                                gap: 'var(--space-4)',
                                background: 'rgba(var(--accent-2-rgb), 0.06)',
                                padding: 'var(--space-4)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid rgba(var(--accent-2-rgb), 0.20)',
                            }}>
                                <div className="input-group" style={{ marginBottom: 0 }}>
                                    <label className="input-label">Descripción / Marca / Modelo</label>
                                    <input className="input-control" value={form.canje.descripcion} onChange={e => setForm(f => ({ ...f, canje: { ...f.canje, descripcion: e.target.value } }))} />
                                </div>
                                <div className="input-group" style={{ marginBottom: 0 }}>
                                    <label className="input-label">Dominio</label>
                                    <input className="input-control" style={{ fontFamily: 'var(--font-mono)' }}
                                        value={form.canje.dominio} onChange={e => setForm(f => ({ ...f, canje: { ...f.canje, dominio: e.target.value } }))} />
                                </div>
                                <div className="input-group" style={{ marginBottom: 0 }}>
                                    <label className="input-label">Valor de toma *</label>
                                    <div className="input-container has-icon">
                                        <span className="input-icon" aria-hidden="true" style={{ color: 'var(--accent-2)' }}><DollarSign size={14} /></span>
                                        <input type="number" className="input-control" placeholder="0.00"
                                            value={form.canje.valorTomado}
                                            onChange={e => setForm(f => ({ ...f, canje: { ...f.canje, valorTomado: e.target.value } }))} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

            {/* DETAIL MODAL */}
            <Modal
                isOpen={detailId !== null}
                onClose={() => setDetailId(null)}
                title={detail?.nroPresupuesto ?? 'Expediente Comercial'}
                subtitle={detail ? `SUCURSAL: ${detail.sucursal?.nombre ?? 'NO ESPECIFICADA'}` : undefined}
                maxWidth="900px"
                footer={detail ? (
                    <div className="flex justify-between items-center w-full">
                        <div>
                            <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Impacto Final de la Operación</p>
                            <p className="text-2xl font-black text-accent">{currencyFmt(calcTotal(detail), detail.moneda)}</p>
                        </div>
                        <div className="flex gap-4">
                            <Button variant="secondary" onClick={() => setDetailId(null)}>Cerrar Expediente</Button>
                            <Button variant="primary" className="px-8 shadow-glow" onClick={() => { setDetailId(null); openEdit(detail); }}>
                                <Pencil size={16} className="mr-2" /> Alterar Parámetros
                            </Button>
                        </div>
                    </div>
                ) : undefined}
            >
                {!detail ? (
                    <div className="p-24 text-center"><RefreshCw className="animate-spin text-accent mx-auto mb-4" size={48} /><p className="text-xs font-black text-muted uppercase tracking-[0.3em]">Consolidando expediente comercial...</p></div>
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
                                                <td className="font-bold text-white uppercase text-xs">{it.vehiculo ? `${it.vehiculo.marca} ${it.vehiculo.modelo} [${it.vehiculo.dominio || 'S/D'}]` : `#${it.vehiculoId}`}</td>
                                                <td style={{ textAlign: 'right' }} className="text-slate-400 font-mono italic">{currencyFmt(it.precioLista, String(detail.moneda))}</td>
                                                <td style={{ textAlign: 'right' }} className="text-red-400 font-mono font-bold">-{currencyFmt(it.descuento ?? 0, String(detail.moneda))}</td>
                                                <td style={{ textAlign: 'right' }} className="font-black text-white text-lg">{currencyFmt(it.precioFinal, String(detail.moneda))}</td>
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
                                        <p className="text-2xl font-black text-white">-{currencyFmt(detail.canje.valorTomado, detail.moneda)}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* EDIT MODAL */}
            <Modal
                isOpen={editId !== null}
                onClose={() => setEditId(null)}
                title="Gestión de Auditoría"
                subtitle="Ajuste el estado legal y administrativo de la cotización."
                maxWidth="500px"
                footer={(
                    <>
                        <Button variant="secondary" onClick={() => setEditId(null)}>Desistir</Button>
                        <Button variant="primary" className="flex-1" onClick={handleEdit} loading={saving}>Acreditar Cambios</Button>
                    </>
                )}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
                    <div className="input-group">
                        <label className="input-label">Estado del expediente</label>
                        <select className="input-control" value={editForm.estado} onChange={e => setEditForm(f => ({ ...f, estado: e.target.value }))}>
                            {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                    </div>
                    <div className="input-group">
                        <label className="input-label">Observaciones de auditoría</label>
                        <textarea className="input-control" rows={4}
                            value={editForm.observaciones}
                            onChange={e => setEditForm(f => ({ ...f, observaciones: e.target.value }))}
                            style={{ resize: 'vertical' }}
                            placeholder="Justificación del cambio de estado o notas para vendedores…" />
                    </div>
                </div>
            </Modal>

            {/* CONVERTIR EN VENTA MODAL */}
            <Modal
                isOpen={convertirId !== null}
                onClose={() => setConvertirId(null)}
                title="Convertir en Venta"
                subtitle="Definí los datos de cierre. El resto los toma del presupuesto."
                maxWidth="520px"
                footer={(
                    <>
                        <Button variant="secondary" onClick={() => setConvertirId(null)}>Cancelar</Button>
                        <Button variant="primary" className="flex-1" onClick={handleConvertirEnVenta} loading={convertirSaving}>
                            <ArrowRight size={16} className="mr-2" /> Crear venta
                        </Button>
                    </>
                )}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                        <div className="input-group">
                            <label className="input-label">Forma de pago</label>
                            <select className="input-control" value={convertirForm.formaPago}
                                onChange={e => setConvertirForm(f => ({ ...f, formaPago: e.target.value as FormaPagoVenta }))}>
                                {FORMA_PAGO_OPTIONS_CONV.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Moneda</label>
                            <select className="input-control" value={convertirForm.moneda}
                                onChange={e => setConvertirForm(f => ({ ...f, moneda: e.target.value as 'ARS' | 'USD' }))}>
                                <option value="ARS">ARS</option>
                                <option value="USD">USD</option>
                            </select>
                        </div>
                    </div>
                    <div className="input-group">
                        <label className="input-label">Fecha de venta</label>
                        <input type="date" className="input-control" value={convertirForm.fechaVenta}
                            onChange={e => setConvertirForm(f => ({ ...f, fechaVenta: e.target.value }))} />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Observaciones</label>
                        <textarea className="input-control" rows={3}
                            value={convertirForm.observaciones}
                            onChange={e => setConvertirForm(f => ({ ...f, observaciones: e.target.value }))}
                            style={{ resize: 'vertical' }} />
                    </div>
                </div>
            </Modal>

            {/* DELETE CONFIRM */}
            <ConfirmDialog
                isOpen={deleteId !== null}
                title="Eliminar presupuesto"
                message="¿Eliminar este presupuesto? Esta acción no se puede deshacer."
                confirmLabel="Eliminar"
                type="danger"
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
            />

        </div>
    );
};

export default PresupuestosPage;
