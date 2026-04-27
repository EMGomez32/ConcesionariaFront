import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { vehiculosApi } from '../../api/vehiculos.api';
import { vehiculoArchivosApi, type VehiculoArchivo } from '../../api/vehiculo-archivos.api';
import { vehiculoMovimientosApi, type VehiculoMovimiento } from '../../api/vehiculo-movimientos.api';
import { gastosApi, type GastoVehiculo } from '../../api/gastos.api';
import { gastosCategoriaApi, type GastoCategoria } from '../../api/gastos-categorias.api';
import { sucursalesApi } from '../../api/sucursales.api';
import type { Vehiculo, EstadoVehiculo } from '../../types/vehiculo.types';
import type { Sucursal } from '../../types/sucursal.types';
import DataTable, { type Column } from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { FileUploader } from '../../components/ui/FileUploader';
import { useUIStore } from '../../store/uiStore';
import {
    ArrowLeft, Car, Calendar, DollarSign, MapPin,
    FileImage, Wrench, ArrowLeftRight, FileText,
    ShoppingCart, Bookmark, RefreshCw, Hash,
    Plus, Trash2, ExternalLink, Upload, X, Image, FileText as FileIcon, Edit
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { PaginatedResponse, ApiError } from '../../types/api.types';

type Tab = 'info' | 'archivos' | 'gastos' | 'movimientos' | 'presupuestos' | 'reservas' | 'ventas';

const STATUS_MAP: Record<EstadoVehiculo, { label: string; variant: 'warning' | 'success' | 'info' | 'default' | 'danger' }> = {
    preparacion: { label: 'En Preparación', variant: 'warning' },
    publicado: { label: 'Publicado', variant: 'success' },
    reservado: { label: 'Reservado', variant: 'info' },
    vendido: { label: 'Vendido', variant: 'default' },
    devuelto: { label: 'Devuelto', variant: 'danger' },
};

interface VehiculoFull extends Vehiculo {
    archivos?: VehiculoArchivo[];
    gastos?: GastoVehiculo[];
    movimientos?: VehiculoMovimiento[];
    presupuestos?: { id: number; nroPresupuesto?: string; cliente?: { nombre: string }; fechaEmision?: string; estado?: string; precioFinal?: number }[];
    reservas?: { id: number; cliente?: { nombre: string }; montoSena?: number; fechaVencimiento?: string; estado?: string }[];
    ventas?: { id: number; cliente?: { nombre: string }; fechaVenta?: string; precioFinal?: number; formaPago?: string; estadoEntrega?: string }[];
    proveedorCompra?: { id: number; nombre: string };
}

const TIPO_ARCHIVO_OPTS = ['foto', 'documento', 'comprobante', 'plano', 'otro'];

const TIPO_ARCHIVO_ICONS: Record<string, LucideIcon> = {
    foto: Image,
    documento: FileIcon,
    comprobante: FileIcon,
    plano: FileIcon,
    otro: FileImage,
};

const VehiculoDetallePage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { addToast } = useUIStore();

    const [activeTab, setActiveTab] = useState<Tab>('info');
    const [vehiculo, setVehiculo] = useState<VehiculoFull | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Archivos state
    const [archivos, setArchivos] = useState<VehiculoArchivo[]>([]);
    const [loadingArchivos, setLoadingArchivos] = useState(false);

    // Movimientos state
    const [movList, setMovList] = useState<VehiculoMovimiento[]>([]);
    const [loadingMov, setLoadingMov] = useState(false);

    // Gastos state
    const [gastosList, setGastosList] = useState<GastoVehiculo[]>([]);
    const [loadingGastos, setLoadingGastos] = useState(false);
    const [gastosCat, setGastosCat] = useState<GastoCategoria[]>([]);
    const [gastosSucursales, setGastosSucursales] = useState<Sucursal[]>([]);
    const [showGastoForm, setShowGastoForm] = useState(false);
    const [gastoForm, setGastoForm] = useState({ categoriaId: '', sucursalId: '', monto: '', moneda: 'ARS', fechaGasto: '', descripcion: '' });
    const [gastoFormError, setGastoFormError] = useState('');
    const [savingGasto, setSavingGasto] = useState(false);
    const [editGasto, setEditGasto] = useState<GastoVehiculo | null>(null);
    const [editGastoForm, setEditGastoForm] = useState({ monto: '', descripcion: '', fechaGasto: '' });
    const [deletingGastoId, setDeletingGastoId] = useState<number | null>(null);

    const [showArchivoForm, setShowArchivoForm] = useState(false);
    const [archivoTipo, setArchivoTipo] = useState('foto');
    const [archivoDescripcion, setArchivoDescripcion] = useState('');

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        vehiculosApi.getById(Number(id))
            .then(res => {
                setVehiculo(res as VehiculoFull);
            })
            .catch(() => setError('No se pudo cargar el vehículo.'))
            .finally(() => setLoading(false));
    }, [id]);

    const loadArchivos = useCallback(async () => {
        if (!id) return;
        setLoadingArchivos(true);
        try {
            const res = await vehiculoArchivosApi.getByVehiculo(Number(id));
            setArchivos((res as VehiculoArchivo[]) || []);
        } catch {
            addToast('Error al cargar archivos', 'error');
        } finally {
            setLoadingArchivos(false);
        }
    }, [id, addToast]);

    useEffect(() => {
        if (activeTab === 'archivos') loadArchivos();
    }, [activeTab, loadArchivos]);

    const loadMovimientos = useCallback(async () => {
        if (!id) return;
        setLoadingMov(true);
        try {
            const res = await vehiculoMovimientosApi.getAll({ vehiculoId: Number(id) }) as PaginatedResponse<VehiculoMovimiento>;
            setMovList(res?.results || []);
        } catch {
            addToast('Error al cargar movimientos', 'error');
        } finally {
            setLoadingMov(false);
        }
    }, [id, addToast]);

    useEffect(() => {
        if (activeTab === 'movimientos') loadMovimientos();
    }, [activeTab, loadMovimientos]);

    const loadGastos = useCallback(async () => {
        if (!id) return;
        setLoadingGastos(true);
        try {
            const res = await gastosApi.getAll({ vehiculoId: Number(id), tipo: 'VEHICULO' });
            setGastosList(res?.results || []);
        } catch {
            addToast('Error al cargar gastos', 'error');
        } finally {
            setLoadingGastos(false);
        }
    }, [id, addToast]);

    useEffect(() => {
        if (activeTab === 'gastos') {
            loadGastos();
            gastosCategoriaApi.getAll().then(res => {
                if (Array.isArray(res)) setGastosCat(res);
                else setGastosCat(res?.results ?? []);
            }).catch(() => { });
            sucursalesApi.getAll().then(res => {
                if (Array.isArray(res)) setGastosSucursales(res as Sucursal[]);
                else setGastosSucursales((res as { results?: Sucursal[] })?.results || []);
            }).catch(() => { });
        }
    }, [activeTab, loadGastos]);

    const handleAddGasto = async () => {
        if (!gastoForm.categoriaId || !gastoForm.sucursalId || !gastoForm.monto || !gastoForm.fechaGasto) {
            setGastoFormError('Categoría, sucursal, monto y fecha son requeridos.');
            return;
        }
        setSavingGasto(true);
        setGastoFormError('');
        try {
            await gastosApi.create({
                vehiculoId: Number(id),
                categoriaId: Number(gastoForm.categoriaId),
                sucursalId: Number(gastoForm.sucursalId),
                monto: parseFloat(gastoForm.monto),
                moneda: gastoForm.moneda as 'ARS' | 'USD',
                fechaGasto: new Date(gastoForm.fechaGasto).toISOString(),
                tipo: 'VEHICULO',
                descripcion: gastoForm.descripcion || undefined,
            });
            addToast('Gasto registrado', 'success');
            setShowGastoForm(false);
            setGastoForm({ categoriaId: '', sucursalId: '', monto: '', moneda: 'ARS', fechaGasto: '', descripcion: '' });
            loadGastos();
        } catch (err: unknown) {
            const apiError = err as ApiError;
            setGastoFormError(apiError?.message ?? 'Error al guardar');
        } finally {
            setSavingGasto(false);
        }
    };

    const openEditGasto = (g: GastoVehiculo) => {
        setEditGasto(g);
        setEditGastoForm({
            monto: String(g.monto),
            descripcion: g.descripcion ?? '',
            fechaGasto: g.fechaGasto ? g.fechaGasto.substring(0, 10) : '',
        });
    };

    const handleUpdateGasto = async () => {
        if (!editGasto) return;
        try {
            const payload: { monto?: number; descripcion?: string; fechaGasto?: string } = {};
            if (editGastoForm.monto) payload.monto = parseFloat(editGastoForm.monto);
            if (editGastoForm.descripcion !== undefined) payload.descripcion = editGastoForm.descripcion;
            if (editGastoForm.fechaGasto) payload.fechaGasto = new Date(editGastoForm.fechaGasto).toISOString();
            await gastosApi.update(editGasto.id, payload);
            addToast('Gasto actualizado', 'success');
            setEditGasto(null);
            loadGastos();
        } catch {
            addToast('Error al actualizar gasto', 'error');
        }
    };

    const handleDeleteGasto = async (gastoId: number) => {
        if (!window.confirm('¿Eliminar este gasto? Esta acción no se puede deshacer.')) return;
        setDeletingGastoId(gastoId);
        try {
            await gastosApi.delete(gastoId);
            addToast('Gasto eliminado', 'success');
            loadGastos();
        } catch {
            addToast('Error al eliminar gasto', 'error');
        } finally {
            setDeletingGastoId(null);
        }
    };

    const handleArchivoUploaded = () => {
        addToast('Archivo subido correctamente', 'success');
        setArchivoTipo('foto');
        setArchivoDescripcion('');
        setShowArchivoForm(false);
        loadArchivos();
    };

    const handleDeleteArchivo = async (archivo: VehiculoArchivo) => {
        const label = archivo.originalName ?? archivo.descripcion ?? `Archivo ${archivo.id}`;
        if (!window.confirm(`¿Eliminar el archivo "${label}"?`)) return;
        try {
            await vehiculoArchivosApi.delete(archivo.id);
            addToast('Archivo eliminado', 'success');
            setArchivos(prev => prev.filter(a => a.id !== archivo.id));
        } catch (err: unknown) {
            const apiError = err as ApiError;
            addToast(apiError?.message || 'Error al eliminar archivo', 'error');
        }
    };

    const gastoColumns: Column<GastoVehiculo>[] = [
        {
            header: 'Categoría',
            accessor: (g) => g.categoria?.nombre || '-'
        },
        {
            header: 'Fecha',
            accessor: (g) => g.fechaGasto ? new Date(g.fechaGasto).toLocaleDateString('es-AR') : '-'
        },
        {
            header: 'Monto',
            accessor: (g) => (
                <span style={{ fontWeight: 700 }}>${Number(g.monto).toLocaleString('es-AR')}</span>
            )
        },
        {
            header: 'Moneda',
            accessor: 'moneda' as keyof GastoVehiculo
        },
        {
            header: 'Descripción',
            accessor: 'descripcion' as keyof GastoVehiculo
        },
        {
            header: '',
            align: 'right',
            accessor: (g) => (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="icon-btn small" onClick={(e) => { e.stopPropagation(); openEditGasto(g); }} title="Editar"><Edit size={14} /></button>
                    <button className="icon-btn small danger" onClick={(e) => { e.stopPropagation(); handleDeleteGasto(g.id); }} disabled={deletingGastoId === g.id} title="Eliminar"><Trash2 size={14} /></button>
                </div>
            )
        }
    ];

    const movColumns: Column<VehiculoMovimiento>[] = [
        {
            header: 'Tipo',
            accessor: (m) => <Badge variant="default">{m.tipo}</Badge>
        },
        {
            header: 'Fecha',
            accessor: (m) => m.fechaMovimiento ? new Date(m.fechaMovimiento).toLocaleDateString('es-AR') : m.createdAt ? new Date(m.createdAt).toLocaleDateString('es-AR') : '-'
        },
        {
            header: 'Origen',
            accessor: (m) => m.desdeSucursal?.nombre || '-'
        },
        {
            header: 'Destino',
            accessor: (m) => m.hastaSucursal?.nombre || '-'
        },
        {
            header: 'Motivo',
            accessor: 'motivo' as keyof VehiculoMovimiento
        },
        {
            header: 'Registrado por',
            accessor: (m) => <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{m.registradoPor?.nombre || '-'}</span>
        }
    ];

    const presupuestoColumns: Column<{ id: number; nroPresupuesto?: string; cliente?: { nombre: string }; fechaEmision?: string; estado?: string; precioFinal?: number }>[] = [
        {
            header: 'Nro',
            accessor: (p) => <span style={{ fontWeight: 700 }}>#{p.nroPresupuesto || p.id}</span>
        },
        {
            header: 'Cliente',
            accessor: (p) => p.cliente?.nombre || '-'
        },
        {
            header: 'Fecha',
            accessor: (p) => p.fechaEmision ? new Date(p.fechaEmision).toLocaleDateString('es-AR') : '-'
        },
        {
            header: 'Estado',
            accessor: (p) => <Badge variant="default">{p.estado || '-'}</Badge>
        },
        {
            header: 'Total',
            accessor: (p) => <span style={{ fontWeight: 700 }}>{p.precioFinal ? `$${Number(p.precioFinal).toLocaleString('es-AR')}` : '-'}</span>
        }
    ];

    const reservaColumns: Column<{ id: number; cliente?: { nombre: string }; montoSena?: number; fechaVencimiento?: string; estado?: string }>[] = [
        {
            header: 'Cliente',
            accessor: (r) => r.cliente?.nombre || '-'
        },
        {
            header: 'Seña',
            accessor: (r) => <span style={{ fontWeight: 700 }}>{r.montoSena ? `$${Number(r.montoSena).toLocaleString('es-AR')}` : '-'}</span>
        },
        {
            header: 'Vencimiento',
            accessor: (r) => r.fechaVencimiento ? new Date(r.fechaVencimiento).toLocaleDateString('es-AR') : '-'
        },
        {
            header: 'Estado',
            accessor: (r) => <Badge variant="default">{r.estado}</Badge>
        }
    ];

    const ventaColumns: Column<{ id: number; cliente?: { nombre: string }; fechaVenta?: string; precioFinal?: number; formaPago?: string; estadoEntrega?: string }>[] = [
        {
            header: 'Cliente',
            accessor: (v) => v.cliente?.nombre || '-'
        },
        {
            header: 'Fecha',
            accessor: (v) => v.fechaVenta ? new Date(v.fechaVenta).toLocaleDateString('es-AR') : '-'
        },
        {
            header: 'Precio final',
            accessor: (v) => <span style={{ fontWeight: 700 }}>{v.precioFinal ? `$${Number(v.precioFinal).toLocaleString('es-AR')}` : '-'}</span>
        },
        {
            header: 'Forma de pago',
            accessor: (v) => v.formaPago || '-'
        },
        {
            header: 'Entrega',
            accessor: (v) => <Badge variant="default">{v.estadoEntrega || '-'}</Badge>
        }
    ];

    const presupuestos = useMemo(() => vehiculo?.presupuestos ?? [], [vehiculo]);
    const reservas = useMemo(() => vehiculo?.reservas ?? [], [vehiculo]);
    const ventas = useMemo(() => vehiculo?.ventas ?? [], [vehiculo]);
    const totalGastos = useMemo(() => gastosList.reduce((s: number, g: GastoVehiculo) => s + (Number(g.monto) || 0), 0), [gastosList]);

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '0.75rem', color: 'var(--text-secondary)' }}>
            <RefreshCw size={20} className="animate-spin" /> Cargando...
        </div>
    );

    if (error || !vehiculo) return (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{error || 'Vehículo no encontrado.'}</p>
            <Button variant="secondary" onClick={() => navigate('/vehiculos')}>
                <ArrowLeft size={16} /> Volver
            </Button>
        </div>
    );

    const tabs: { key: Tab; label: string; icon: LucideIcon; count?: number }[] = [
        { key: 'info', label: 'Información', icon: Car },
        { key: 'archivos', label: 'Archivos', icon: FileImage, count: archivos.length },
        { key: 'gastos', label: 'Gastos', icon: Wrench, count: gastosList.length },
        { key: 'movimientos', label: 'Movimientos', icon: ArrowLeftRight, count: movList.length },
        { key: 'presupuestos', label: 'Presupuestos', icon: FileText, count: presupuestos.length },
        { key: 'reservas', label: 'Reservas', icon: Bookmark, count: reservas.length },
        { key: 'ventas', label: 'Ventas', icon: ShoppingCart, count: ventas.length },
    ];

    return (
        <div className="page-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            {/* Header */}
            <header className="page-header">
                <div className="header-title">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-1)' }}>
                        <button className="icon-btn" onClick={() => navigate('/vehiculos')} aria-label="Volver">
                            <ArrowLeft size={18} />
                        </button>
                        <div className="icon-badge primary shadow-glow">
                            <Car size={22} />
                        </div>
                        <h1>{vehiculo.marca} {vehiculo.modelo} {vehiculo.version && `· ${vehiculo.version}`}</h1>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'monospace', background: 'var(--bg-secondary)', color: 'var(--text-primary)', padding: '3px 10px', borderRadius: 6, fontWeight: 700, fontSize: '0.875rem', border: '1px solid var(--border)' }}>
                            {vehiculo.dominio || 'S/D'}
                        </span>
                        <Badge variant={STATUS_MAP[vehiculo.estado].variant}>{STATUS_MAP[vehiculo.estado].label}</Badge>
                        <Badge variant="default">{vehiculo.tipo === 'CERO_KM' ? '0 km' : 'Usado'}</Badge>
                        {vehiculo.sucursal?.nombre && (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{vehiculo.sucursal.nombre}</span>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                    <Button variant="secondary" size="sm" onClick={() => navigate(`/vehiculos/${id}/editar`)}>
                        <Edit size={14} /> Editar vehículo
                    </Button>
                </div>
            </header>

            {/* Stats */}
            <div className="stats-grid stagger">
                <div className="card stat-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
                        <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(var(--accent-rgb), 0.10)', color: 'var(--accent)' }}>
                            <DollarSign size={20} />
                        </div>
                    </div>
                    <div className="stat-content">
                        <span className="text-muted font-bold text-xs uppercase tracking-wider mb-1">Precio lista</span>
                        <span className="stat-value">{vehiculo.precioLista ? `$${Number(vehiculo.precioLista).toLocaleString('es-AR')}` : '-'}</span>
                    </div>
                </div>
                <div className="card stat-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
                        <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(245, 158, 11, 0.10)', color: 'var(--warning)' }}>
                            <DollarSign size={20} />
                        </div>
                    </div>
                    <div className="stat-content">
                        <span className="text-muted font-bold text-xs uppercase tracking-wider mb-1">Precio compra</span>
                        <span className="stat-value">{vehiculo.precioCompra ? `$${Number(vehiculo.precioCompra).toLocaleString('es-AR')}` : '-'}</span>
                    </div>
                </div>
                <div className="card stat-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
                        <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(239, 68, 68, 0.10)', color: 'var(--danger)' }}>
                            <Wrench size={20} />
                        </div>
                    </div>
                    <div className="stat-content">
                        <span className="text-muted font-bold text-xs uppercase tracking-wider mb-1">Total gastos</span>
                        <span className="stat-value">{totalGastos > 0 ? `$${totalGastos.toLocaleString('es-AR')}` : '$0'}</span>
                    </div>
                </div>
                <div className="card stat-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
                        <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(var(--accent-2-rgb), 0.10)', color: 'var(--accent-2)' }}>
                            <Hash size={20} />
                        </div>
                    </div>
                    <div className="stat-content">
                        <span className="text-muted font-bold text-xs uppercase tracking-wider mb-1">Kilómetros</span>
                        <span className="stat-value">{vehiculo.kmIngreso ? `${vehiculo.kmIngreso.toLocaleString('es-AR')} km` : '-'}</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="tab-group" role="tablist">
                {tabs.map(t => (
                    <button
                        key={t.key}
                        type="button"
                        role="tab"
                        aria-selected={activeTab === t.key}
                        onClick={() => setActiveTab(t.key)}
                        className={`tab-btn ${activeTab === t.key ? 'is-active' : ''}`}
                    >
                        <t.icon size={14} />
                        <span>{t.label}</span>
                        {t.count !== undefined && (
                            <span style={{ marginLeft: '0.35rem', padding: '0.05rem 0.45rem', borderRadius: 999, background: 'rgba(255,255,255,0.1)', fontSize: '0.68rem', fontWeight: 700 }}>
                                {t.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="card" style={{ padding: 'var(--space-6)' }}>

                {/* INFO */}
                {activeTab === 'info' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-6)' }}>
                        <InfoSection title="Datos del vehículo" rows={[
                            { icon: Car, label: 'Marca', value: vehiculo.marca },
                            { icon: Car, label: 'Modelo', value: vehiculo.modelo },
                            { icon: Car, label: 'Versión', value: vehiculo.version },
                            { icon: Calendar, label: 'Año', value: String(vehiculo.anio) },
                            { icon: Hash, label: 'Dominio', value: vehiculo.dominio },
                            { icon: Hash, label: 'VIN', value: vehiculo.vin },
                            { icon: Hash, label: 'Color', value: vehiculo.color },
                            { icon: Hash, label: 'Km ingreso', value: vehiculo.kmIngreso ? `${vehiculo.kmIngreso.toLocaleString()} km` : undefined },
                        ]} />
                        <InfoSection title="Datos de compra" rows={[
                            { icon: MapPin, label: 'Sucursal', value: vehiculo.sucursal?.nombre },
                            { icon: Calendar, label: 'Fecha ingreso', value: vehiculo.fechaIngreso ? new Date(vehiculo.fechaIngreso).toLocaleDateString('es-AR') : undefined },
                            { icon: Calendar, label: 'Fecha compra', value: vehiculo.fechaCompra ? new Date(vehiculo.fechaCompra).toLocaleDateString('es-AR') : undefined },
                            { icon: DollarSign, label: 'Precio compra', value: vehiculo.precioCompra ? `$${Number(vehiculo.precioCompra).toLocaleString('es-AR')}` : undefined },
                            { icon: DollarSign, label: 'Precio lista', value: vehiculo.precioLista ? `$${Number(vehiculo.precioLista).toLocaleString('es-AR')}` : undefined },
                            { icon: Car, label: 'Proveedor', value: vehiculo.proveedorCompra?.nombre },
                        ]} />
                        {vehiculo.observaciones && (
                            <div style={{ gridColumn: '1 / -1' }}>
                                <h3 style={{ marginBottom: 'var(--space-4)' }}>Observaciones</h3>
                                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, background: 'var(--bg-secondary)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                                    {vehiculo.observaciones}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* ARCHIVOS — HU-33, HU-34, HU-35 */}
                {activeTab === 'archivos' && (
                    <div>
                        {/* Header actions */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
                            <h3 style={{ margin: 0 }}>
                                {archivos.length > 0 ? `${archivos.length} archivo${archivos.length !== 1 ? 's' : ''}` : 'Sin archivos'}
                            </h3>
                            <Button variant="primary" size="sm" onClick={() => setShowArchivoForm(v => !v)}>
                                {showArchivoForm ? <><X size={14} />Cancelar</> : <><Upload size={14} />Agregar archivo</>}
                            </Button>
                        </div>

                        {/* Upload form */}
                        {showArchivoForm && (
                            <div className="card" style={{ padding: 'var(--space-5)', marginBottom: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                                <h4 style={{ fontWeight: 700, fontSize: '0.9rem', margin: 0 }}>Nuevo archivo</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
                                    <div>
                                        <label className="input-label">Tipo</label>
                                        <select
                                            className="input-control"
                                            value={archivoTipo}
                                            onChange={e => setArchivoTipo(e.target.value)}
                                        >
                                            {TIPO_ARCHIVO_OPTS.map(t => (
                                                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="input-label">Descripción</label>
                                        <input
                                            type="text"
                                            className="input-control"
                                            placeholder="Descripción opcional"
                                            value={archivoDescripcion}
                                            onChange={e => setArchivoDescripcion(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <FileUploader
                                    endpoint={vehiculoArchivosApi.uploadEndpoint}
                                    extraFields={{
                                        vehiculoId: Number(id),
                                        tipo: archivoTipo,
                                        descripcion: archivoDescripcion.trim() || undefined,
                                    }}
                                    onUploaded={handleArchivoUploaded}
                                    accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                                    label="Seleccionar archivo a subir"
                                />
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button variant="secondary" size="sm" onClick={() => setShowArchivoForm(false)}>Cerrar</Button>
                                </div>
                            </div>
                        )}

                        {/* Files list */}
                        {loadingArchivos ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}><RefreshCw size={18} className="animate-spin" /></div>
                        ) : archivos.length === 0 ? (
                            <div className="dt-empty">
                                <div className="dt-empty-badge"><FileImage size={36} /></div>
                                <p className="dt-empty-text">No hay archivos cargados para este vehículo. Agrega el primero con el botón de arriba.</p>
                            </div>
                        ) : (
                            (() => {
                                const grupos = TIPO_ARCHIVO_OPTS.filter(t => archivos.some(a => (a.tipo || 'otro') === t));
                                const sinTipo = archivos.filter(a => !a.tipo || !TIPO_ARCHIVO_OPTS.includes(a.tipo));
                                const allGrupos = [...grupos, ...(sinTipo.length ? ['otro'] : [])]
                                    .filter((g, i, arr) => arr.indexOf(g) === i);

                                return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                                        {allGrupos.map(grupo => {
                                            const items = archivos.filter(a => (a.tipo || 'otro') === grupo);
                                            if (!items.length) return null;
                                            const IconComp = TIPO_ARCHIVO_ICONS[grupo] ?? FileImage;
                                            return (
                                                <div key={grupo}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 'var(--space-4)', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
                                                        <IconComp size={15} style={{ color: 'var(--text-muted)' }} />
                                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                                                            {grupo.charAt(0).toUpperCase() + grupo.slice(1)} ({items.length})
                                                        </span>
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                                                        {items.map((a) => (
                                                            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-4) var(--space-5)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)' }}>
                                                                <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--accent)' }}>
                                                                    <IconComp size={22} />
                                                                </div>
                                                                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                                                    <span style={{ fontWeight: 700, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                        {a.originalName ?? a.descripcion ?? `Archivo ${a.id}`}
                                                                    </span>
                                                                    {a.descripcion && a.originalName && (
                                                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.descripcion}</span>
                                                                    )}
                                                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                                                        {a.createdAt ? new Date(a.createdAt).toLocaleDateString('es-AR') : ''}
                                                                        {a.sizeBytes ? ` · ${(a.sizeBytes / 1024).toFixed(1)} KB` : ''}
                                                                    </span>
                                                                </div>
                                                                <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                                                                    <a href={a.url} target="_blank" rel="noreferrer" className="icon-btn" title="Ver archivo">
                                                                        <ExternalLink size={15} />
                                                                    </a>
                                                                    <button className="icon-btn danger" title="Eliminar" onClick={() => handleDeleteArchivo(a)}>
                                                                        <Trash2 size={15} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()
                        )}
                    </div>
                )}

                {/* GASTOS */}
                {activeTab === 'gastos' && (
                    <div>
                        {/* Add gasto button */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-4)' }}>
                            <Button variant="primary" size="sm" onClick={() => { setShowGastoForm(v => !v); setGastoFormError(''); }}>
                                {showGastoForm ? <><X size={14} />Cancelar</> : <><Plus size={14} />Registrar gasto</>}
                            </Button>
                        </div>

                        {/* Create gasto inline form */}
                        {showGastoForm && (
                            <div className="card" style={{ padding: 'var(--space-5)', marginBottom: 'var(--space-4)' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                                    <div>
                                        <label className="input-label">Categoría*</label>
                                        <select className="input-control" value={gastoForm.categoriaId} onChange={e => setGastoForm(f => ({ ...f, categoriaId: e.target.value }))}>
                                            <option value="">Seleccionar...</option>
                                            {gastosCat.map((c: GastoCategoria) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="input-label">Sucursal*</label>
                                        <select className="input-control" value={gastoForm.sucursalId} onChange={e => setGastoForm(f => ({ ...f, sucursalId: e.target.value }))}>
                                            <option value="">Seleccionar...</option>
                                            {gastosSucursales.map((s: Sucursal) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="input-label">Monto*</label>
                                        <input type="number" className="input-control" value={gastoForm.monto} onChange={e => setGastoForm(f => ({ ...f, monto: e.target.value }))} placeholder="0.00" min="0" step="0.01" />
                                    </div>
                                    <div>
                                        <label className="input-label">Moneda*</label>
                                        <select className="input-control" value={gastoForm.moneda} onChange={e => setGastoForm(f => ({ ...f, moneda: e.target.value }))}>
                                            <option value="ARS">ARS</option>
                                            <option value="USD">USD</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="input-label">Fecha*</label>
                                        <input type="date" className="input-control" value={gastoForm.fechaGasto} onChange={e => setGastoForm(f => ({ ...f, fechaGasto: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="input-label">Descripción</label>
                                        <input className="input-control" value={gastoForm.descripcion} onChange={e => setGastoForm(f => ({ ...f, descripcion: e.target.value }))} placeholder="Opcional" />
                                    </div>
                                </div>
                                {gastoFormError && <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>{gastoFormError}</p>}
                                <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
                                    <Button variant="secondary" size="sm" onClick={() => { setShowGastoForm(false); setGastoFormError(''); }}>Cancelar</Button>
                                    <Button variant="primary" size="sm" onClick={handleAddGasto} disabled={savingGasto}>
                                        {savingGasto ? 'Guardando...' : <><Plus size={14} />Guardar gasto</>}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Total bar */}
                        {gastosList.length > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3) var(--space-4)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', border: '1px solid var(--border)' }}>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total gastos</span>
                                <strong style={{ fontSize: '1.1rem', color: 'var(--accent)' }}>${totalGastos.toLocaleString('es-AR')}</strong>
                            </div>
                        )}

                        <DataTable
                            columns={gastoColumns}
                            data={gastosList}
                            isLoading={loadingGastos}
                            emptyMessage="No hay gastos registrados para este vehículo."
                            emptyIcon={<Wrench size={40} style={{ color: 'var(--text-muted)' }} />}
                        />

                        {editGasto && (
                            <div className="card" style={{ marginTop: 'var(--space-4)', padding: 'var(--space-5)', border: '1px solid var(--accent)' }}>
                                <h4 style={{ marginBottom: 'var(--space-4)', fontWeight: 700 }}>Editar Gasto: {editGasto.categoria?.nombre}</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                                    <div>
                                        <label className="input-label">Monto</label>
                                        <input type="number" className="input-control" value={editGastoForm.monto} onChange={e => setEditGastoForm(f => ({ ...f, monto: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="input-label">Fecha</label>
                                        <input type="date" className="input-control" value={editGastoForm.fechaGasto} onChange={e => setEditGastoForm(f => ({ ...f, fechaGasto: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="input-label">Descripción</label>
                                        <input className="input-control" value={editGastoForm.descripcion} onChange={e => setEditGastoForm(f => ({ ...f, descripcion: e.target.value }))} />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                                    <Button variant="secondary" size="sm" onClick={() => setEditGasto(null)}>Cancelar</Button>
                                    <Button variant="primary" size="sm" onClick={handleUpdateGasto}>Guardar Cambios</Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* MOVIMIENTOS */}
                {activeTab === 'movimientos' && (
                    <DataTable
                        columns={movColumns}
                        data={movList}
                        isLoading={loadingMov}
                        emptyMessage="No hay movimientos registrados para este vehículo."
                        emptyIcon={<ArrowLeftRight size={40} style={{ color: 'var(--text-muted)' }} />}
                    />
                )}

                {/* PRESUPUESTOS */}
                {activeTab === 'presupuestos' && (
                    <DataTable
                        columns={presupuestoColumns}
                        data={presupuestos}
                        emptyMessage="No hay presupuestos para este vehículo."
                        emptyIcon={<FileText size={40} style={{ color: 'var(--text-muted)' }} />}
                    />
                )}

                {/* RESERVAS */}
                {activeTab === 'reservas' && (
                    <DataTable
                        columns={reservaColumns}
                        data={reservas}
                        emptyMessage="No hay reservas para este vehículo."
                        emptyIcon={<Bookmark size={40} style={{ color: 'var(--text-muted)' }} />}
                    />
                )}

                {/* VENTAS */}
                {activeTab === 'ventas' && (
                    <DataTable
                        columns={ventaColumns}
                        data={ventas}
                        emptyMessage="Este vehículo no ha sido vendido aún."
                        emptyIcon={<ShoppingCart size={40} style={{ color: 'var(--text-muted)' }} />}
                    />
                )}
            </div>
        </div>
    );
};

const InfoSection = ({ title, rows }: { title: string; rows: { icon: LucideIcon; label: string; value?: string }[] }) => {
    const filtered = rows.filter(r => r.value !== undefined && r.value !== null && r.value !== '');
    return (
        <div>
            <h3 style={{ marginBottom: 'var(--space-4)', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>{title}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {filtered.map(r => (
                    <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <r.icon size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                        <span className="input-label" style={{ width: 110, flexShrink: 0, marginBottom: 0 }}>{r.label}</span>
                        <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>{r.value}</span>
                    </div>
                ))}
                {filtered.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Sin datos disponibles.</p>}
            </div>
        </div>
    );
};

export default VehiculoDetallePage;
