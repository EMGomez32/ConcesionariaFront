import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { proveedoresApi } from '../../api/proveedores.api';
import type { Proveedor } from '../../types/proveedor.types';
import Button from '../../components/ui/Button';
import Badge, { type BadgeVariant } from '../../components/ui/Badge';
import {
    ArrowLeft, Building2, Phone, Mail, MapPin, Tag,
    Car, DollarSign, Wrench, RefreshCw
} from 'lucide-react';

type Tab = 'info' | 'vehiculos' | 'gastos' | 'postventa';

interface VehiculoCompra {
    id: number;
    marca?: string;
    modelo?: string;
    anio?: number;
    patente?: string;
    dominio?: string;
    estado?: string;
    precioCompra?: number | string;
}

interface GastoVehiculo {
    id: number;
    descripcion?: string;
    fecha?: string;
    monto?: number | string;
    vehiculo?: { marca?: string; modelo?: string };
}

interface PostventaItemDet {
    id: number;
    descripcion?: string;
    fecha?: string;
    monto?: number | string;
    caso?: { id: number };
}

const TIPO_BADGE: Record<string, BadgeVariant> = {
    importadora: 'violet',
    taller: 'warning',
    particular: 'success',
    financiera: 'cyan',
    otro: 'default',
};

const ProveedorDetallePage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<Tab>('info');
    const [proveedor, setProveedor] = useState<Proveedor | null>(null);
    const [vehiculos, setVehiculos] = useState<VehiculoCompra[]>([]);
    const [gastos, setGastos] = useState<GastoVehiculo[]>([]);
    const [postventaItems, setPostventaItems] = useState<PostventaItemDet[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            if (!id) return;
            setLoading(true);
            setError(null);
            try {
                const data = await proveedoresApi.getById(Number(id)) as Proveedor & {
                    vehiculosCompra?: VehiculoCompra[];
                    gastosVehiculo?: GastoVehiculo[];
                    postventaItems?: PostventaItemDet[];
                };
                setProveedor(data);
                setVehiculos(data.vehiculosCompra ?? []);
                setGastos(data.gastosVehiculo ?? []);
                setPostventaItems(data.postventaItems ?? []);
            } catch {
                setError('No se pudo cargar el proveedor.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '0.75rem', color: 'var(--text-secondary)' }}>
            <RefreshCw size={20} className="animate-spin" /> Cargando...
        </div>
    );

    if (error || !proveedor) return (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
            <p style={{ marginBottom: '1.5rem' }}>{error || 'Proveedor no encontrado.'}</p>
            <Button variant="secondary" onClick={() => navigate('/proveedores')}>
                <ArrowLeft size={16} /> Volver a Proveedores
            </Button>
        </div>
    );

    const tabs: { key: Tab; label: string; icon: React.ComponentType<{ size?: number }>; count?: number }[] = [
        { key: 'info', label: 'Información', icon: Building2 },
        { key: 'vehiculos', label: 'Vehículos', icon: Car, count: vehiculos.length },
        { key: 'gastos', label: 'Gastos', icon: DollarSign, count: gastos.length },
        { key: 'postventa', label: 'Postventa', icon: Wrench, count: postventaItems.length },
    ];

    return (
        <div className="page-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <header className="page-header">
                <div className="header-title">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-1)' }}>
                        <button className="icon-btn" onClick={() => navigate('/proveedores')} aria-label="Volver">
                            <ArrowLeft size={18} />
                        </button>
                        <div className="icon-badge primary shadow-glow">
                            <Building2 size={22} />
                        </div>
                        <h1>{proveedor.nombre}</h1>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                        {proveedor.tipo && (
                            <Badge variant={TIPO_BADGE[proveedor.tipo || 'otro']}>
                                {proveedor.tipo.charAt(0).toUpperCase() + proveedor.tipo.slice(1)}
                            </Badge>
                        )}
                        <Badge variant={proveedor.activo ? 'success' : 'default'}>
                            {proveedor.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                    </div>
                </div>
            </header>

            <div className="stats-grid stagger">
                <div className="card stat-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
                        <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(var(--accent-2-rgb), 0.10)', color: 'var(--accent-2)' }}>
                            <Car size={20} />
                        </div>
                    </div>
                    <div className="stat-content">
                        <span className="text-muted font-bold text-xs uppercase tracking-wider mb-1">Vehículos comprados</span>
                        <span className="stat-value">{vehiculos.length}</span>
                    </div>
                </div>
                <div className="card stat-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
                        <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(245, 158, 11, 0.10)', color: 'var(--warning)' }}>
                            <DollarSign size={20} />
                        </div>
                    </div>
                    <div className="stat-content">
                        <span className="text-muted font-bold text-xs uppercase tracking-wider mb-1">Gastos registrados</span>
                        <span className="stat-value">{gastos.length}</span>
                    </div>
                </div>
                <div className="card stat-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
                        <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(var(--accent-rgb), 0.10)', color: 'var(--accent)' }}>
                            <Wrench size={20} />
                        </div>
                    </div>
                    <div className="stat-content">
                        <span className="text-muted font-bold text-xs uppercase tracking-wider mb-1">Ítems postventa</span>
                        <span className="stat-value">{postventaItems.length}</span>
                    </div>
                </div>
            </div>

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

            <div className="card" style={{ padding: 'var(--space-6)' }}>
                {activeTab === 'info' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-6)' }}>
                        <div>
                            <h3 style={{ marginBottom: 'var(--space-4)' }}>Datos del proveedor</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                                <InfoRow icon={<Building2 size={14} />} label="Nombre" value={proveedor.nombre} />
                                <InfoRow icon={<Tag size={14} />} label="Tipo" value={proveedor.tipo || '-'} />
                            </div>
                        </div>
                        <div>
                            <h3 style={{ marginBottom: 'var(--space-4)' }}>Contacto</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                                <InfoRow icon={<Phone size={14} />} label="Teléfono" value={proveedor.telefono || '-'} />
                                <InfoRow icon={<Mail size={14} />} label="Email" value={proveedor.email || '-'} />
                                <InfoRow icon={<MapPin size={14} />} label="Dirección" value={proveedor.direccion || '-'} />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'vehiculos' && (
                    vehiculos.length === 0 ? (
                        <div className="dt-empty">
                            <div className="dt-empty-badge"><Car size={36} /></div>
                            <p className="dt-empty-text">No hay vehículos registrados para este proveedor.</p>
                        </div>
                    ) : (
                        <DetailTable
                            head={<tr><th>Vehículo</th><th>Dominio</th><th>Estado</th><th>Precio compra</th></tr>}
                            body={vehiculos.map((v) => (
                                <tr key={v.id}>
                                    <td>
                                        <div style={{ fontWeight: 700 }}>{v.marca} {v.modelo}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{v.anio}</div>
                                    </td>
                                    <td>{v.patente || v.dominio || '-'}</td>
                                    <td><Badge variant="default">{v.estado}</Badge></td>
                                    <td style={{ fontWeight: 700 }}>{v.precioCompra ? `$${Number(v.precioCompra).toLocaleString('es-AR')}` : '-'}</td>
                                </tr>
                            ))}
                        />
                    )
                )}

                {activeTab === 'gastos' && (
                    gastos.length === 0 ? (
                        <div className="dt-empty">
                            <div className="dt-empty-badge"><DollarSign size={36} /></div>
                            <p className="dt-empty-text">No hay gastos registrados para este proveedor.</p>
                        </div>
                    ) : (
                        <DetailTable
                            head={<tr><th>Descripción</th><th>Vehículo</th><th>Fecha</th><th>Monto</th></tr>}
                            body={gastos.map((g) => (
                                <tr key={g.id}>
                                    <td>{g.descripcion || '-'}</td>
                                    <td>{g.vehiculo ? `${g.vehiculo.marca} ${g.vehiculo.modelo}` : '-'}</td>
                                    <td>{g.fecha ? new Date(g.fecha).toLocaleDateString('es-AR') : '-'}</td>
                                    <td style={{ fontWeight: 700 }}>{g.monto ? `$${Number(g.monto).toLocaleString('es-AR')}` : '-'}</td>
                                </tr>
                            ))}
                        />
                    )
                )}

                {activeTab === 'postventa' && (
                    postventaItems.length === 0 ? (
                        <div className="dt-empty">
                            <div className="dt-empty-badge"><Wrench size={36} /></div>
                            <p className="dt-empty-text">No hay ítems de postventa registrados para este proveedor.</p>
                        </div>
                    ) : (
                        <DetailTable
                            head={<tr><th>Descripción</th><th>Caso</th><th>Fecha</th><th>Monto</th></tr>}
                            body={postventaItems.map((item) => (
                                <tr key={item.id}>
                                    <td>{item.descripcion || '-'}</td>
                                    <td>{item.caso ? `#${item.caso.id}` : '-'}</td>
                                    <td>{item.fecha ? new Date(item.fecha).toLocaleDateString('es-AR') : '-'}</td>
                                    <td style={{ fontWeight: 700 }}>{item.monto ? `$${Number(item.monto).toLocaleString('es-AR')}` : '-'}</td>
                                </tr>
                            ))}
                        />
                    )
                )}
            </div>
        </div>
    );
};

const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <span className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {icon} {label}
        </span>
        <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>{value}</span>
    </div>
);

const DetailTable = ({ head, body }: { head: React.ReactNode; body: React.ReactNode }) => (
    <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                {head}
            </thead>
            <tbody>{body}</tbody>
            <style>{`
                table th, table td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid var(--border); }
                table tr:last-child td { border-bottom: none; }
                table tbody tr:hover td { background: var(--bg-secondary); }
            `}</style>
        </table>
    </div>
);

export default ProveedorDetallePage;
