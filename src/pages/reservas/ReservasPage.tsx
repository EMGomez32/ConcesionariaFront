import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { reservasApi, type Reserva, type EstadoReserva } from '../../api/reservas.api';
import type { BadgeVariant } from '../../components/ui/Badge';
import { vehiculosApi } from '../../api/vehiculos.api';
import { sucursalesApi } from '../../api/sucursales.api';
import { clientesApi } from '../../api/clientes.api';
import { usuariosApi } from '../../api/usuarios.api';
import { useUIStore } from '../../store/uiStore';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { unwrapList, unwrapPaged } from '../../utils/api';
import {
    Plus, RefreshCw,
    Bookmark, X, ChevronLeft, ChevronRight,
    Eye, XCircle
} from 'lucide-react';

const ESTADO_OPTS: { value: EstadoReserva; label: string }[] = [
    { value: 'activa', label: 'Activa' },
    { value: 'completada', label: 'Completada' },
    { value: 'cancelada', label: 'Cancelada' },
    { value: 'vencida', label: 'Vencida' },
];

const ESTADO_BADGE: Record<EstadoReserva, BadgeVariant> = {
    activa: 'success',
    completada: 'info',
    cancelada: 'default',
    vencida: 'danger',
};

const EMPTY_FORM = {
    vehiculoId: '',
    clienteId: '',
    vendedorId: '',
    sucursalId: '',
    monto: '',
    moneda: 'ARS' as 'ARS' | 'USD',
    fechaVencimiento: '',
    observaciones: '',
};

const isVencimientoProximo = (fecha: string) => {
    const diff = new Date(fecha).getTime() - Date.now();
    return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000; // < 3 days
};

const ReservasPage = () => {
    const navigate = useNavigate();
    const { addToast } = useUIStore();

    // List state
    const [reservas, setReservas] = useState<Reserva[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    // Filters
    const [filterEstado, setFilterEstado] = useState('');
    const [filterSucursal, setFilterSucursal] = useState('');
    const [filterCliente, setFilterCliente] = useState('');

    // Catalog data
    const [sucursales, setSucursales] = useState<{ id: number; nombre: string }[]>([]);
    const [vehiculos, setVehiculos] = useState<{ id: number; marca: string; modelo: string; version?: string; dominio?: string }[]>([]);
    const [clientes, setClientes] = useState<{ id: number; nombre: string }[]>([]);
    const [usuarios, setUsuarios] = useState<{ id: number; nombre: string }[]>([]);

    // Modal
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    // Cancel confirm
    const [cancelingId, setCancelingId] = useState<number | null>(null);
    const [cancelLoading, setCancelLoading] = useState(false);

    // Load catalogs
    useEffect(() => {
        sucursalesApi.getAll()
            .then(res => setSucursales(unwrapList<{ id: number; nombre: string }>(res)))
            .catch(() => { });
        vehiculosApi.getAll({ estado: 'publicado' })
            .then(res => setVehiculos(unwrapList<{ id: number; marca: string; modelo: string; version?: string; dominio?: string }>(res)))
            .catch(() => { });
        clientesApi.getAll({})
            .then(res => setClientes(unwrapList<{ id: number; nombre: string }>(res)))
            .catch(() => { });
        usuariosApi.getAll({})
            .then(res => setUsuarios(unwrapList<{ id: number; nombre: string }>(res)))
            .catch(() => { });
    }, []);

    const loadReservas = useCallback(async (pg = page) => {
        setLoading(true);
        try {
            const params: Record<string, string | number> = { page: pg, limit: 15 };
            if (filterEstado) params.estado = filterEstado;
            if (filterSucursal) params.sucursalId = filterSucursal;
            if (filterCliente) params.clienteId = filterCliente;

            const paged = unwrapPaged<Reserva>(await reservasApi.getAll(params));
            setReservas(paged.results);
            setTotalPages(paged.totalPages);
            setTotal(paged.totalResults);
        } catch {
            addToast('Error al cargar reservas', 'error');
        } finally {
            setLoading(false);
        }
    }, [page, filterEstado, filterSucursal, filterCliente, addToast]);

    useEffect(() => {
        loadReservas(page);
    }, [page, loadReservas]);

    const handleClear = () => {
        setFilterEstado('');
        setFilterSucursal('');
        setFilterCliente('');
        setPage(1);
    };

    const openModal = () => {
        setForm({ ...EMPTY_FORM });
        setFormError('');
        setShowModal(true);
    };

    const handleSubmit = async () => {
        const { vehiculoId, clienteId, vendedorId, sucursalId, monto, moneda, fechaVencimiento } = form;
        if (!vehiculoId || !clienteId || !vendedorId || !sucursalId || !monto || !fechaVencimiento) {
            setFormError('Todos los campos obligatorios deben completarse.');
            return;
        }
        setSaving(true);
        setFormError('');
        try {
            await reservasApi.create({
                vehiculoId: Number(vehiculoId),
                clienteId: Number(clienteId),
                vendedorId: Number(vendedorId),
                sucursalId: Number(sucursalId),
                monto: Number(monto),
                moneda,
                fechaVencimiento: new Date(fechaVencimiento).toISOString(),
                observaciones: form.observaciones || undefined,
            });
            addToast('Reserva creada correctamente', 'success');
            setShowModal(false);
            setPage(1);
            loadReservas(1);
        } catch (e: unknown) {
            setFormError((e as { message?: string })?.message ?? 'Error al crear reserva');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = async () => {
        if (!cancelingId) return;
        setCancelLoading(true);
        try {
            await reservasApi.update(cancelingId, { estado: 'cancelada' });
            addToast('Reserva cancelada', 'success');
            setCancelingId(null);
            loadReservas(page);
        } catch {
            addToast('Error al cancelar reserva', 'error');
        } finally {
            setCancelLoading(false);
        }
    };

    return (
        <div className="page-container">
            {/* Header */}
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Bookmark size={28} style={{ color: 'var(--accent)' }} />
                    <div>
                        <h1 className="page-title">Reservas</h1>
                        <p className="page-subtitle">{total} reserva{total !== 1 ? 's' : ''} en total</p>
                    </div>
                </div>
                <Button variant="primary" onClick={openModal}>
                    <Plus size={16} style={{ marginRight: '0.5rem' }} /> Nueva Reserva
                </Button>
            </div>

            {/* Filters */}
            <div className="filters-bar glass">
                <div className="filters-selects">
                    <div className="filter-field">
                        <label className="input-label">Estado</label>
                        <select className="input-control" value={filterEstado} onChange={e => { setFilterEstado(e.target.value); setPage(1); }}>
                            <option value="">Todos los estados</option>
                            {ESTADO_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
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
                        <label className="input-label">Cliente</label>
                        <select className="input-control" value={filterCliente} onChange={e => { setFilterCliente(e.target.value); setPage(1); }}>
                            <option value="">Todos los clientes</option>
                            {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                        </select>
                    </div>
                    <div className="filter-field" style={{ justifyContent: 'flex-end' }}>
                        <Button variant="secondary" size="sm" onClick={handleClear}>
                            <X size={14} /> Limpiar
                        </Button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="glass table-container">
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        <RefreshCw size={24} className="spin" />
                    </div>
                ) : reservas.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        <Bookmark size={32} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                        <p>No hay reservas registradas.</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Vehículo</th>
                                <th>Cliente</th>
                                <th>Sucursal</th>
                                <th>Seña</th>
                                <th>Vencimiento</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reservas.map(r => {
                                const proximo = r.estado === 'activa' && r.fechaVencimiento && isVencimientoProximo(r.fechaVencimiento);
                                return (
                                    <tr key={r.id}>
                                        <td className="fw-bold text-muted">#{r.id}</td>
                                        <td>
                                            <span className="fw-bold">
                                                {r.vehiculo ? `${r.vehiculo.marca} ${r.vehiculo.modelo}` : `ID ${r.vehiculoId}`}
                                            </span>
                                            {r.vehiculo?.dominio && (
                                                <span className="dominio-tag" style={{ marginLeft: '0.5rem', fontSize: '0.72rem' }}>
                                                    {r.vehiculo.dominio}
                                                </span>
                                            )}
                                        </td>
                                        <td>{r.cliente?.nombre ?? '-'}</td>
                                        <td>{r.sucursal?.nombre ?? '-'}</td>
                                        <td className="fw-bold">
                                            {r.moneda} ${Number(r.monto).toLocaleString('es-AR')}
                                        </td>
                                        <td>
                                            <span style={{ color: proximo ? '#f59e0b' : 'inherit', fontWeight: proximo ? 700 : undefined }}>
                                                {r.fechaVencimiento ? new Date(r.fechaVencimiento).toLocaleDateString('es-AR') : '-'}
                                                {proximo && ' ⚠️'}
                                            </span>
                                        </td>
                                        <td>
                                            <Badge variant={ESTADO_BADGE[r.estado]}>
                                                {ESTADO_OPTS.find(o => o.value === r.estado)?.label ?? r.estado}
                                            </Badge>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                <button
                                                    className="icon-btn"
                                                    title="Ver detalle"
                                                    onClick={() => navigate(`/reservas/${r.id}`)}
                                                >
                                                    <Eye size={15} />
                                                </button>
                                                {r.estado === 'activa' && (
                                                    <button
                                                        className="icon-btn danger"
                                                        title="Cancelar reserva"
                                                        onClick={() => setCancelingId(r.id)}
                                                    >
                                                        <XCircle size={15} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'flex-end', marginTop: '1rem' }}>
                    <Button variant="ghost" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                        <ChevronLeft size={16} />
                    </Button>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Página {page} de {totalPages}</span>
                    <Button variant="ghost" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                        <ChevronRight size={16} />
                    </Button>
                </div>
            )}

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Nueva Reserva"
                maxWidth="620px"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={handleSubmit} loading={saving}>
                            <Plus size={14} />
                            Crear Reserva
                        </Button>
                    </>
                }
            >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                    <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                        <label className="input-label">
                            Vehículo * <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(solo publicados)</span>
                        </label>
                        <select className="input-control" value={form.vehiculoId} onChange={e => setForm(f => ({ ...f, vehiculoId: e.target.value }))}>
                            <option value="">Seleccionar vehículo...</option>
                            {vehiculos.map(v => (
                                <option key={v.id} value={v.id}>
                                    {v.marca} {v.modelo} {v.version ? `${v.version} ` : ''}{v.dominio ? `(${v.dominio})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Cliente *</label>
                        <select className="input-control" value={form.clienteId} onChange={e => setForm(f => ({ ...f, clienteId: e.target.value }))}>
                            <option value="">Seleccionar cliente...</option>
                            {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                        </select>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Vendedor *</label>
                        <select className="input-control" value={form.vendedorId} onChange={e => setForm(f => ({ ...f, vendedorId: e.target.value }))}>
                            <option value="">Seleccionar vendedor...</option>
                            {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                        </select>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Sucursal *</label>
                        <select className="input-control" value={form.sucursalId} onChange={e => setForm(f => ({ ...f, sucursalId: e.target.value }))}>
                            <option value="">Seleccionar sucursal...</option>
                            {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                        </select>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Fecha de vencimiento *</label>
                        <input
                            type="date"
                            className="input-control"
                            value={form.fechaVencimiento}
                            onChange={e => setForm(f => ({ ...f, fechaVencimiento: e.target.value }))}
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">Monto de seña *</label>
                        <input
                            type="number"
                            className="input-control"
                            placeholder="0"
                            value={form.monto}
                            onChange={e => setForm(f => ({ ...f, monto: e.target.value }))}
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">Moneda *</label>
                        <select className="input-control" value={form.moneda} onChange={e => setForm(f => ({ ...f, moneda: e.target.value as 'ARS' | 'USD' }))}>
                            <option value="ARS">ARS</option>
                            <option value="USD">USD</option>
                        </select>
                    </div>

                    <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                        <label className="input-label">Observaciones</label>
                        <textarea
                            className="input-control"
                            rows={3}
                            placeholder="Observaciones opcionales..."
                            value={form.observaciones}
                            onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
                            style={{ resize: 'vertical' }}
                        />
                    </div>

                    {formError && (
                        <div className="uploader-alert uploader-alert-error" style={{ gridColumn: '1 / -1' }}>
                            <span>{formError}</span>
                        </div>
                    )}
                </div>
            </Modal>

            <ConfirmDialog
                isOpen={cancelingId !== null}
                title="Cancelar reserva"
                message={`¿Confirmar cancelación de la reserva #${cancelingId}? El vehículo volverá a estado "Publicado".`}
                confirmLabel="Confirmar cancelación"
                cancelLabel="Volver"
                type="danger"
                onConfirm={handleCancel}
                onCancel={() => setCancelingId(null)}
                loading={cancelLoading}
            />

            <style>{`
                .filter-group { display: flex; flex-direction: column; gap: 0.3rem; }
                .filter-label { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); display: flex; align-items: center; gap: 0.3rem; }
                .modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; padding: 1rem 1.5rem; border-top: 1px solid var(--border); }
                @keyframes spin { to { transform: rotate(360deg); } }
                .spin { animation: spin 0.8s linear infinite; }
            `}</style>
        </div>
    );
};

export default ReservasPage;
