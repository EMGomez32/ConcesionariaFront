import React, { useState, useMemo } from 'react';
import type { CreateVentaDto } from '../../api/ventas.api';
import { useUIStore } from '../../store/uiStore';
import { useConfirm } from '../../hooks/useConfirm';
import { useVentas, useVenta, useCreateVenta, useUpdateVenta, useDeleteVenta } from '../../hooks/useVentas';
import { useClientes } from '../../hooks/useClientes';
import { useUsuarios } from '../../hooks/useUsuarios';
import { useSucursales } from '../../hooks/useSucursales';
import { useVehiculos } from '../../hooks/useVehiculos';
import { useDebounce } from '../../hooks/useDebounce';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import DataTable, { type Column } from '../../components/ui/DataTable';
import {
    Plus, Search, Eye, Trash2, X, RefreshCw, DollarSign,
    ArrowRightLeft, User, ShoppingBag, Car, MapPin,
    CheckCircle2, TrendingUp, Printer, Package
} from 'lucide-react';
import type { FormaPagoVenta, EstadoEntrega, Venta } from '../../types/venta.types';
import type { ApiError } from '../../types/api.types';
import VentaSubResources from '../../components/ventas/VentaSubResources';

// Types y utils extraídos a archivos separados (Sprint 4) — antes estaban
// inline acá inflando la page a 799 LOC.
import type { VentaForm } from './ventas.types';
import {
    entregaStatusMap,
    entregaTransitions,
    formaPagoLabels,
    metodoLabels,
    emptyForm,
    emptyPago,
    emptyCanjeRow,
} from './ventas.utils';

const addPago = (setForm: React.Dispatch<React.SetStateAction<VentaForm>>) => {
    setForm(f => ({ ...f, pagos: [...f.pagos, emptyPago()] }));
};

const addCanje = (setForm: React.Dispatch<React.SetStateAction<VentaForm>>) => {
    setForm(f => ({ ...f, canjes: [...f.canjes, emptyCanjeRow()] }));
};

// ─── Componente principal ────────────────────────────────────────────────────
const VentasPage = () => {
    const { addToast } = useUIStore();
    const confirm = useConfirm();

    // Filters & Pagination State
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 500);
    const [filterFormaPago, setFilterFormaPago] = useState('');
    const [filterEstadoEntrega, setFilterEstadoEntrega] = useState('');

    // Modals & Detail State
    const [createOpen, setCreateOpen] = useState(false);
    const [form, setForm] = useState<VentaForm>(emptyForm());
    const [selectedDetailId, setSelectedDetailId] = useState<number | null>(null);

    // Queries
    const { data: ventasData, isLoading: loadingVentas, refetch: refetchVentas } = useVentas(
        {
            formaPago: filterFormaPago || undefined,
            estadoEntrega: filterEstadoEntrega || undefined,
        },
        { page, limit: 15 }
    );

    const { data: detail, isLoading: loadingDetail } = useVenta(selectedDetailId);

    // Catalog Queries
    const { data: clientesData } = useClientes({}, { limit: 1000 });
    const { data: vendedoresData } = useUsuarios({}, { limit: 1000 });
    const { data: sucursalesData } = useSucursales();
    const { data: vehiculosPublicados } = useVehiculos({ estado: 'publicado' }, { limit: 1000 });
    const { data: todosVehiculosData } = useVehiculos({}, { limit: 2000 });

    const clientes = clientesData?.results || [];
    const vendedores = vendedoresData?.results || [];
    const vehiculos = vehiculosPublicados?.results || [];
    const todosVehiculos = todosVehiculosData?.results || [];

    // Mutations
    const createMutation = useCreateVenta();
    const updateMutation = useUpdateVenta();
    const deleteMutation = useDeleteVenta();

    const handleCreate = async () => {
        if (!form.vehiculoId || !form.clienteId || !form.vendedorId || !form.sucursalId) {
            addToast('Complete la estructura mandatoria para registrar la venta', 'error'); return;
        }
        if (form.precioVenta <= 0) {
            addToast('El precio de transacción debe ser un valor positivo', 'error'); return;
        }

        try {
            const dto: CreateVentaDto = {
                sucursalId: form.sucursalId, clienteId: form.clienteId,
                vendedorId: form.vendedorId, vehiculoId: form.vehiculoId,
                fechaVenta: form.fechaVenta, precioVenta: form.precioVenta,
                moneda: form.moneda, formaPago: form.formaPago,
                observaciones: form.observaciones || undefined,
                pagos: form.pagos.filter(p => p.monto > 0),
                externos: form.externos.filter(e => e.descripcion && e.monto > 0),
                canjes: form.canjes.filter(c => c.vehiculoCanjeId && c.valorTomado > 0),
            };
            await createMutation.mutateAsync(dto);
            addToast('Venta perfeccionada y asientos contables generados', 'success');
            setCreateOpen(false);
            setForm(emptyForm());
        } catch (err: unknown) {
            const apiError = err as ApiError;
            addToast(apiError?.message ?? 'Fallo en la validación fiscal de la venta', 'error');
        }
    };

    const handleAddPago = () => addPago(setForm);
    const handleAddCanje = () => addCanje(setForm);

    const handleDelete = async (id: number) => {
        await confirm({
            title: 'Revocar Acto Comercial',
            message: `¿Desea anular la venta #${id}? Esta acción revierte el stock, anula los cobros y purga los asientos contables relacionados.`,
            type: 'danger',
            onConfirm: async () => {
                try {
                    await deleteMutation.mutateAsync(id);
                    addToast('Operación revocada con éxito', 'success');
                } catch (err: unknown) {
                    const apiError = err as ApiError;
                    addToast(apiError?.message ?? 'Error al desestimar la venta', 'error');
                }
            }
        });
    };

    const handleEstadoEntrega = async (id: number, estadoEntrega: EstadoEntrega) => {
        try {
            await updateMutation.mutateAsync({ id, data: { estadoEntrega } });
            addToast(`Estado de logística actualizado a: ${entregaStatusMap[estadoEntrega].label.toUpperCase()} `, 'success');
        } catch {
            addToast('Error al procesar la transición de logística', 'error');
        }
    };

    // Client-side search filtration
    const ventasFiltradas = useMemo(() => {
        const results = ventasData?.results || [];
        if (!debouncedSearch) return results;
        const term = debouncedSearch.toLowerCase();
        return results.filter(v =>
            v.cliente?.nombre?.toLowerCase().includes(term) ||
            v.vehiculo?.marca?.toLowerCase().includes(term) ||
            v.vehiculo?.modelo?.toLowerCase().includes(term) ||
            v.vehiculo?.dominio?.toLowerCase().includes(term) ||
            v.vendedor?.nombre?.toLowerCase().includes(term)
        );
    }, [ventasData, debouncedSearch]);

    const columns: Column<Venta>[] = [
        {
            header: 'Identificador',
            accessor: (v) => (
                <div className="flex flex-col">
                    <span className="text-[11px] font-black text-blue-500 tracking-tighter uppercase italic">Operación</span>
                    <span className="font-mono text-xs font-bold text-white">#{String(v.id).padStart(6, '0')}</span>
                </div>
            )
        },
        {
            header: 'Unidad / Activo',
            accessor: (v) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-accent border border-slate-700 shadow-glow-sm">
                        <Car size={18} />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-white text-xs uppercase">{v.vehiculo?.marca} {v.vehiculo?.modelo}</span>
                        <span className="text-[10px] font-black text-slate-500 tracking-widest">{v.vehiculo?.dominio || 'S/DOMINIO'}</span>
                    </div>
                </div>
            )
        },
        {
            header: 'Titular Cliente',
            accessor: (v) => (
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 border border-slate-700">
                        <User size={12} />
                    </div>
                    <span className="text-xs font-bold text-slate-300 uppercase truncate max-w-[120px]">{v.cliente?.nombre || 'CLIENTE N/A'}</span>
                </div>
            )
        },
        {
            header: 'Oficial Designado',
            accessor: (v) => (
                <span className="text-[10px] font-black text-slate-500 uppercase">{v.vendedor?.nombre || 'SIN OFICIAL'}</span>
            )
        },
        {
            header: 'Aforo de Venta',
            accessor: (v) => (
                <div className="flex flex-col">
                    <span className="font-black text-white text-base tabular-nums">
                        ${Number(v.precioVenta).toLocaleString('es-AR')}
                    </span>
                    <span className="text-[9px] font-bold text-accent-light uppercase tracking-tighter">
                        {formaPagoLabels[v.formaPago] || v.formaPago}
                    </span>
                </div>
            )
        },
        {
            header: 'Estado Entrega',
            accessor: (v) => (
                <Badge variant={entregaStatusMap[v.estadoEntrega]?.variant ?? 'default'}>
                    {entregaStatusMap[v.estadoEntrega]?.label.toUpperCase()}
                </Badge>
            )
        },
        {
            header: 'Análisis',
            align: 'right',
            accessor: (v) => (
                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button className="icon-btn" title="Auditar Operación" onClick={(e) => { e.stopPropagation(); setSelectedDetailId(v.id); }}><Eye size={16} /></button>
                    <button className="icon-btn danger" onClick={e => { e.stopPropagation(); handleDelete(v.id); }} title="Anular Venta"><Trash2 size={16} /></button>
                </div>
            )
        }
    ];

    return (
        <div className="page-container animate-fade-in">
            {/* Header */}
            <header className="page-header">
                <div className="header-title">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="icon-badge primary shadow-glow">
                            <ShoppingBag size={20} />
                        </div>
                        <h1>Libro de Ventas y Entregas</h1>
                    </div>
                    <p>Centralización de operaciones comerciales, auditoría de ingresos y trazabilidad de activos entregados.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => refetchVentas()}>
                        <RefreshCw size={18} className={loadingVentas ? 'animate-spin' : ''} />
                    </Button>
                    <Button variant="primary" onClick={() => { setForm(emptyForm()); setCreateOpen(true); }}>
                        <Plus size={18} /> Registrar Nueva Transacción
                    </Button>
                </div>
            </header>

            {/* Metrics Row */}
            <div className="stats-grid stagger">
                <div className="card stat-card">
                    <div className="flex justify-between items-start mb-4">
                        <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(var(--accent-3-rgb), 0.10)', color: 'var(--accent-3)' }}>
                            <TrendingUp size={20} />
                        </div>
                    </div>
                    <div className="stat-content">
                        <span className="text-muted font-bold text-xs uppercase tracking-wider mb-1">Ventas del Mes</span>
                        <span className="stat-value">{ventasFiltradas.length}</span>
                    </div>
                </div>

                <div className="card stat-card">
                    <div className="flex justify-between items-start mb-4">
                        <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(245, 158, 11, 0.10)', color: 'var(--warning)' }}>
                            <Package size={20} />
                        </div>
                    </div>
                    <div className="stat-content">
                        <span className="text-muted font-bold text-xs uppercase tracking-wider mb-1">Pendientes Entrega</span>
                        <span className="stat-value">{ventasFiltradas.filter(v => v.estadoEntrega === 'pendiente' || v.estadoEntrega === 'autorizada').length}</span>
                    </div>
                </div>

                <div className="card stat-card">
                    <div className="flex justify-between items-start mb-4">
                        <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(var(--accent-rgb), 0.10)', color: 'var(--accent)' }}>
                            <DollarSign size={20} />
                        </div>
                        <Badge variant="success">ARS</Badge>
                    </div>
                    <div className="stat-content">
                        <span className="text-muted font-bold text-xs uppercase tracking-wider mb-1">Volumen Facturado</span>
                        <span className="stat-value">${ventasFiltradas.reduce((s, v) => s + Number(v.precioVenta), 0).toLocaleString('es-AR')}</span>
                        <span className="text-muted text-xs" style={{ marginTop: 4 }}>
                            Promedio: ${ventasFiltradas.length > 0 ? (ventasFiltradas.reduce((s, v) => s + Number(v.precioVenta), 0) / ventasFiltradas.length).toLocaleString('es-AR', { maximumFractionDigits: 0 }) : '0'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="filters-bar glass">
                <div className="filters-search">
                    <Search size={16} />
                    <input
                        type="text"
                        placeholder="Buscar por cliente, marca, modelo, dominio o responsable…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="filters-selects">
                    <div className="filter-field">
                        <label className="input-label">Logística</label>
                        <select className="input-control" value={filterEstadoEntrega} onChange={e => { setFilterEstadoEntrega(e.target.value); setPage(1); }}>
                            <option value="">Todas las entregas</option>
                            {Object.entries(entregaStatusMap).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                    </div>
                    <div className="filter-field">
                        <label className="input-label">Modalidad</label>
                        <select className="input-control" value={filterFormaPago} onChange={e => { setFilterFormaPago(e.target.value); setPage(1); }}>
                            <option value="">Todos los pagos</option>
                            {Object.entries(formaPagoLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                    </div>
                    <div className="filter-field" style={{ justifyContent: 'flex-end' }}>
                        <Button variant="secondary" size="sm" onClick={() => { setSearch(''); setFilterEstadoEntrega(''); setFilterFormaPago(''); setPage(1); }}>
                            <RefreshCw size={14} /> Limpiar
                        </Button>
                    </div>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={ventasFiltradas}
                isLoading={loadingVentas}
                onRowClick={(v) => setSelectedDetailId(v.id)}
                currentPage={page}
                totalPages={ventasData?.totalPages || 1}
                onPageChange={setPage}
                emptyMessage="Sin operaciones en este registro"
            />

            {/* CREATE MODAL */}
            <Modal
                isOpen={createOpen}
                onClose={() => setCreateOpen(false)}
                title="Certificación de Venta Automotriz"
                maxWidth="960px"
                footer={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: 'var(--space-4)' }}>
                        <div>
                            <p style={{
                                fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-muted)',
                                textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px',
                            }}>
                                Impacto de caja final
                            </p>
                            <p style={{
                                fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)',
                                fontWeight: 700, color: 'var(--text-primary)',
                                fontVariantNumeric: 'tabular-nums', margin: 0,
                            }}>
                                ${Number(form.precioVenta || 0).toLocaleString('es-AR')}
                                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '0.4rem' }}>
                                    ({form.moneda})
                                </span>
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Abortar</Button>
                            <Button variant="primary" onClick={handleCreate} loading={createMutation.isPending}>
                                Acreditar y Cerrar Venta
                            </Button>
                        </div>
                    </div>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                    {/* Primary IDs */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)' }}>
                        <div className="input-group">
                            <label className="input-label">Unidad transaccionada *</label>
                            <select className="input-control" value={form.vehiculoId || ''} onChange={e => setForm(f => ({ ...f, vehiculoId: +e.target.value }))}>
                                <option value="">Seleccionar unidad en stock…</option>
                                {vehiculos.map(v => (
                                    <option key={v.id} value={v.id}>{v.marca} {v.modelo} [{v.dominio || `#${v.id}`}]</option>
                                ))}
                            </select>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Titular adquirente *</label>
                            <select className="input-control" value={form.clienteId || ''} onChange={e => setForm(f => ({ ...f, clienteId: +e.target.value }))}>
                                <option value="">Cliente receptor…</option>
                                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                            </select>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Oficial de venta *</label>
                            <select className="input-control" value={form.vendedorId || ''} onChange={e => setForm(f => ({ ...f, vendedorId: +e.target.value }))}>
                                <option value="">Gestionado por…</option>
                                {vendedores.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Financial Details */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)' }}>
                        <div className="input-group">
                            <label className="input-label">Sucursal *</label>
                            <select className="input-control" value={form.sucursalId || ''} onChange={e => setForm(f => ({ ...f, sucursalId: +e.target.value }))}>
                                <option value="">Seleccionar sucursal…</option>
                                {sucursalesData?.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                            </select>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Fecha contable</label>
                            <input type="date" className="input-control" value={form.fechaVenta} onChange={e => setForm(f => ({ ...f, fechaVenta: e.target.value }))} />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Precio de cierre *</label>
                            <div className="input-container has-icon">
                                <span className="input-icon" aria-hidden="true" style={{ color: 'var(--accent)' }}><DollarSign size={14} /></span>
                                <input type="number" className="input-control" placeholder="0.00"
                                    value={form.precioVenta || ''}
                                    onChange={e => setForm(f => ({ ...f, precioVenta: +e.target.value }))} />
                            </div>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Divisa</label>
                            <select className="input-control" value={form.moneda} onChange={e => setForm(f => ({ ...f, moneda: e.target.value as 'ARS' | 'USD' }))}>
                                <option value="ARS">Pesos (ARS)</option>
                                <option value="USD">Dólares (USD)</option>
                            </select>
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Modalidad de liquidación</label>
                        <select className="input-control" value={form.formaPago} onChange={e => setForm(f => ({ ...f, formaPago: e.target.value as FormaPagoVenta }))}>
                            {Object.entries(formaPagoLabels).map(([k, lbl]) => <option key={k} value={k}>{lbl}</option>)}
                        </select>
                    </div>

                    {/* Payment Breakdown */}
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
                                <DollarSign size={14} /> Desglose de cobros y entregas
                            </h3>
                            <Button variant="secondary" size="sm" onClick={handleAddPago}>
                                <Plus size={14} /> Añadir pago
                            </Button>
                        </div>
                        {form.pagos.map((p, i) => (
                            <div key={i} style={{
                                display: 'grid', gridTemplateColumns: '3fr 3fr 5fr auto',
                                gap: 'var(--space-3)', alignItems: 'flex-end',
                                background: 'var(--bg-secondary)', padding: 'var(--space-4)',
                                borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
                            }}>
                                <div className="input-group" style={{ marginBottom: 0 }}>
                                    <label className="input-label">Importe recibido</label>
                                    <input type="number" className="input-control" placeholder="0.00"
                                        value={p.monto || ''}
                                        onChange={e => {
                                            const newPagos = [...form.pagos];
                                            newPagos[i].monto = +e.target.value;
                                            setForm(f => ({ ...f, pagos: newPagos }));
                                        }} />
                                </div>
                                <div className="input-group" style={{ marginBottom: 0 }}>
                                    <label className="input-label">Vía / Canal</label>
                                    <select className="input-control" value={p.metodo} onChange={e => {
                                        const newPagos = [...form.pagos];
                                        newPagos[i].metodo = e.target.value as 'efectivo' | 'transferencia' | 'tarjeta' | 'cheque' | 'otro';
                                        setForm(f => ({ ...f, pagos: newPagos }));
                                    }}>
                                        {Object.entries(metodoLabels).map(([k, lbl]) => <option key={k} value={k}>{lbl}</option>)}
                                    </select>
                                </div>
                                <div className="input-group" style={{ marginBottom: 0 }}>
                                    <label className="input-label">Certificación / Tracking</label>
                                    <input type="text" className="input-control"
                                        value={p.referencia}
                                        onChange={e => {
                                            const newPagos = [...form.pagos];
                                            newPagos[i].referencia = e.target.value;
                                            setForm(f => ({ ...f, pagos: newPagos }));
                                        }}
                                        placeholder="Nro de recibo, CBU, cheque…" />
                                </div>
                                <button
                                    type="button"
                                    className="icon-btn danger"
                                    style={{ marginBottom: 4 }}
                                    aria-label="Quitar pago"
                                    onClick={() => setForm(f => ({ ...f, pagos: f.pagos.filter((_, j) => j !== i) }))}
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Canjes Section */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-2)',
                        }}>
                            <h3 style={{
                                margin: 0, fontSize: 'var(--text-xs)', fontWeight: 700,
                                textTransform: 'uppercase', color: 'var(--warning)', letterSpacing: '0.08em',
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                            }}>
                                <ArrowRightLeft size={14} /> Permuta / Toma de activos
                            </h3>
                            <Button variant="secondary" size="sm" onClick={handleAddCanje}>
                                <Plus size={14} /> Incorporar unidad
                            </Button>
                        </div>
                        {form.canjes.map((c, i) => (
                            <div key={i} style={{
                                display: 'grid', gridTemplateColumns: '8fr 3fr auto',
                                gap: 'var(--space-3)', alignItems: 'flex-end',
                                background: 'var(--bg-secondary)', padding: 'var(--space-4)',
                                borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
                            }}>
                                <div className="input-group" style={{ marginBottom: 0 }}>
                                    <label className="input-label">Vehículo para incorporar al stock</label>
                                    <select className="input-control" value={c.vehiculoCanjeId || ''} onChange={e => {
                                        const newCanjes = [...form.canjes];
                                        newCanjes[i].vehiculoCanjeId = +e.target.value;
                                        setForm(f => ({ ...f, canjes: newCanjes }));
                                    }}>
                                        <option value="">Reconocimiento de unidad existente…</option>
                                        {todosVehiculos.map(v => (
                                            <option key={v.id} value={v.id}>{v.marca} {v.modelo} [{v.dominio || `#${v.id}`}]</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="input-group" style={{ marginBottom: 0 }}>
                                    <label className="input-label">Acreditación</label>
                                    <input type="number" className="input-control"
                                        value={c.valorTomado || ''}
                                        onChange={e => {
                                            const newCanjes = [...form.canjes];
                                            newCanjes[i].valorTomado = +e.target.value;
                                            setForm(f => ({ ...f, canjes: newCanjes }));
                                        }}
                                        placeholder="0.00" />
                                </div>
                                <button
                                    type="button"
                                    className="icon-btn danger"
                                    style={{ marginBottom: 4 }}
                                    aria-label="Quitar canje"
                                    onClick={() => setForm(f => ({ ...f, canjes: f.canjes.filter((_, j) => j !== i) }))}
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="input-group">
                        <label className="input-label">Notas adicionales (protocolo de venta)</label>
                        <textarea className="input-control" rows={2}
                            value={form.observaciones}
                            onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
                            placeholder="Detalles de gestoría, documentación pendiente…"
                            style={{ resize: 'vertical' }} />
                    </div>
                </div>
            </Modal>

            {/* DETAIL MODAL (AUDITORÍA) */}
            <Modal
                isOpen={!!selectedDetailId}
                onClose={() => { setSelectedDetailId(null); }}
                title={detail ? `CONTRATO #${String(detail.id).padStart(5, '0')} ` : 'Cargando...'}
                maxWidth="900px"
            >
                {loadingDetail || !detail ? (
                    <div className="p-24 text-center"><RefreshCw className="animate-spin text-accent mx-auto mb-4" size={48} /><p className="text-xs font-black text-slate-500 uppercase tracking-[0.3em]">Consolidando expediente de venta...</p></div>
                ) : (
                    <div className="space-y-8">
                        <header className="flex justify-between items-start border-b border-white/5 pb-8">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-3xl bg-accent flex items-center justify-center text-white shadow-xl shadow-accent/40 ring-4 ring-accent/10">
                                    <ShoppingBag size={32} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <Badge variant={entregaStatusMap[detail.estadoEntrega]?.variant ?? 'default'}>
                                            LOGÍSTICA: {entregaStatusMap[detail.estadoEntrega]?.label.toUpperCase()}
                                        </Badge>
                                    </div>
                                    <p className="text-accent-light font-bold flex items-center gap-2 text-sm">
                                        <Car size={16} /> {detail.vehiculo?.marca?.toUpperCase()} {detail.vehiculo?.modelo?.toUpperCase()} [{detail.vehiculo?.dominio || 'S/DOMINIO'}]
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button className="p-3 bg-slate-800 rounded-2xl hover:bg-slate-700 transition-all text-slate-400" title="Imprimir Recibo">
                                    <Printer size={20} />
                                </button>
                            </div>
                        </header>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div className="bg-slate-900/40 p-5 rounded-3xl border border-white/5">
                                <span className="text-[10px] font-black text-slate-500 uppercase block tracking-widest mb-1">Fecha Operación</span>
                                <p className="text-lg font-bold text-white">{new Date(detail.fechaVenta).toLocaleDateString()}</p>
                            </div>
                            <div className="bg-slate-900/40 p-5 rounded-3xl border border-white/5">
                                <span className="text-[10px] font-black text-slate-500 uppercase block tracking-widest mb-1">Sucursal Radicación</span>
                                <p className="text-lg font-bold text-white truncate">{detail.sucursal?.nombre || 'CENTRAL'}</p>
                            </div>
                            <div className="bg-slate-900/40 p-5 rounded-3xl border border-white/5">
                                <span className="text-[10px] font-black text-slate-500 uppercase block tracking-widest mb-1">Aforo Venta</span>
                                <p className="text-xl font-black text-accent">${Number(detail.precioVenta).toLocaleString('es-AR')}</p>
                            </div>
                            <div className="bg-slate-900/40 p-5 rounded-3xl border border-white/5">
                                <span className="text-[10px] font-black text-slate-500 uppercase block tracking-widest mb-1">Modalidad</span>
                                <p className="text-xs font-black text-white uppercase italic">{formaPagoLabels[detail.formaPago] || detail.formaPago}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <User size={14} className="text-accent" /> Partes Involucradas
                                </h3>
                                <div className="bg-slate-900/60 p-6 rounded-3xl border border-white/5 space-y-4">
                                    <div>
                                        <span className="text-[10px] font-black text-slate-500 block mb-1 uppercase">Comprador</span>
                                        <p className="font-bold text-white">{detail.cliente?.nombre?.toUpperCase() || 'N/A'}</p>
                                        <p className="text-xs text-slate-500">{detail.cliente?.email || 'SIN EMAIL'}</p>
                                    </div>
                                    <div className="pt-4 border-t border-white/5">
                                        <span className="text-[10px] font-black text-slate-500 block mb-1 uppercase">Responsable Comercial</span>
                                        <p className="font-bold text-white italic">{detail.vendedor?.nombre?.toUpperCase() || 'NO ASIGNADO'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <MapPin size={14} className="text-amber-500" /> Trazabilidad Logística
                                </h3>
                                <div className="bg-slate-900/60 p-6 rounded-3xl border border-white/5 space-y-4">
                                    {entregaTransitions[detail.estadoEntrega]?.length > 0 ? (
                                        <div className="space-y-3">
                                            <p className="text-xs text-slate-500 italic mb-4">Acciones de auditoría requeridas para el flujo de entrega:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {entregaTransitions[detail.estadoEntrega].map(t => (
                                                    <Button
                                                        key={t.next}
                                                        variant={t.next === 'cancelada' ? 'danger' : t.next === 'entregada' ? 'primary' : 'secondary'}
                                                        size="sm"
                                                        className="flex-1"
                                                        onClick={() => handleEstadoEntrega(detail.id, t.next)}
                                                    >
                                                        {t.label.toUpperCase()}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center p-4 text-center">
                                            <CheckCircle2 size={32} className="text-emerald-500 mb-2" />
                                            <p className="text-xs font-bold text-white uppercase italic">Ciclo operativo concluido</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <DollarSign size={14} className="text-emerald-500" /> Detalle de Ingresos Conciliados
                            </h3>
                            <div className="table-container border-white/5 overflow-hidden">
                                <table className="data-table">
                                    <thead className="bg-slate-900/60">
                                        <tr>
                                            <th>Identificador</th>
                                            <th>Canal / Vía</th>
                                            <th>Referencia Auditoría</th>
                                            <th style={{ textAlign: 'right' }}>Importe Efectivo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {detail.pagos && detail.pagos.length > 0 ? detail.pagos.map((p) => (
                                            <tr key={p.id}>
                                                <td className="font-mono text-[10px] text-slate-500">PAG-{p.id}</td>
                                                <td><Badge variant="default">{metodoLabels[p.metodo]?.toUpperCase() || p.metodo.toUpperCase()}</Badge></td>
                                                <td className="text-xs italic text-slate-300">{p.referencia || '-'}</td>
                                                <td style={{ textAlign: 'right' }} className="font-black text-white">${Number(p.monto).toLocaleString('es-AR')}</td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan={4} className="text-center py-4 text-xs italic text-slate-500">No se registran pagos individuales (Ingreso Contado Total)</td></tr>
                                        )}
                                        {detail.canjes?.map((c) => (
                                            <tr key={c.id} className="bg-amber-500/5">
                                                <td className="font-mono text-[10px] text-amber-500">CAN-{c.id}</td>
                                                <td><Badge variant="warning">TOMA UNIDAD</Badge></td>
                                                <td className="text-xs italic text-amber-200/60 font-bold uppercase">ID-VEHÍCULO: {c.vehiculoCanjeId}</td>
                                                <td style={{ textAlign: 'right' }} className="font-black text-amber-500">-${Number(c.valorTomado).toLocaleString('es-AR')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {detail.observaciones && (
                            <div className="p-6 bg-slate-900/40 border border-white/5 rounded-3xl italic text-xs text-slate-500">
                                <span className="font-black text-slate-500 block mb-2 not-italic uppercase tracking-widest">Anotaciones de Auditoría:</span>
                                "{detail.observaciones}"
                            </div>
                        )}

                        {/* Sub-recursos: Pagos, Extras, Canjes */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <DollarSign size={14} className="text-accent" /> Gestión de Sub-recursos
                            </h3>
                            <VentaSubResources ventaId={detail.id} />
                        </div>
                    </div>
                )}
            </Modal>

        </div>
    );
};

export default VentasPage;
