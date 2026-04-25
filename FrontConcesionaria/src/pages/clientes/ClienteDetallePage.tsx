import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clientesApi } from '../../api/clientes.api';
import { ventasApi } from '../../api/ventas.api';
import { presupuestosApi } from '../../api/presupuestos.api';
import type { Cliente } from '../../types/cliente.types';
import Button from '../../components/ui/Button';
import {
    ArrowLeft, User, Phone, Mail, MapPin, FileText,
    ShoppingCart, FileBarChart, Calendar, DollarSign,
    CreditCard, RefreshCw
} from 'lucide-react';

type Tab = 'info' | 'ventas' | 'presupuestos';

const ClienteDetallePage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<Tab>('info');
    const [cliente, setCliente] = useState<Cliente | null>(null);
    const [ventas, setVentas] = useState<any[]>([]);
    const [presupuestos, setPresupuestos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            if (!id) return;
            setLoading(true);
            setError(null);
            try {
                const [clienteRes, ventasRes, presupuestosRes] = await Promise.all([
                    clientesApi.getById(Number(id)),
                    ventasApi.getAll({ clienteId: Number(id) }),
                    presupuestosApi.getAll({ clienteId: Number(id) }),
                ]);
                setCliente(clienteRes);
                setVentas(ventasRes.results);
                setPresupuestos(presupuestosRes.results);
            } catch {
                setError('No se pudo cargar el cliente.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '0.75rem', color: 'var(--text-secondary)' }}>
            <RefreshCw size={20} className="spin" /> Cargando...
        </div>
    );

    if (error || !cliente) return (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
            <p style={{ marginBottom: '1.5rem' }}>{error || 'Cliente no encontrado.'}</p>
            <Button variant="secondary" onClick={() => navigate('/clientes')}>
                <ArrowLeft size={16} style={{ marginRight: '0.5rem' }} /> Volver a Clientes
            </Button>
        </div>
    );

    const tabs: { key: Tab; label: string; icon: any; count?: number }[] = [
        { key: 'info', label: 'Información', icon: User },
        { key: 'ventas', label: 'Ventas', icon: ShoppingCart, count: ventas.length },
        { key: 'presupuestos', label: 'Presupuestos', icon: FileBarChart, count: presupuestos.length },
    ];

    return (
        <div className="detalle-container">
            {/* Back + header */}
            <div className="detalle-header">
                <button className="back-btn" onClick={() => navigate('/clientes')}>
                    <ArrowLeft size={20} />
                </button>
                <div className="cliente-hero">
                    <div className="cliente-avatar-lg">
                        <User size={32} />
                    </div>
                    <div>
                        <h1>{cliente.nombre}</h1>
                        <p className="text-muted">
                            {[cliente.dni && `CUIT/CUIL: ${cliente.dni}`, cliente.email, cliente.telefono].filter(Boolean).join(' · ')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats bar */}
            <div className="stats-bar">
                <div className="stat-card glass">
                    <ShoppingCart size={20} style={{ color: '#6366f1' }} />
                    <div>
                        <div className="stat-value">{ventas.length}</div>
                        <div className="stat-label">Ventas realizadas</div>
                    </div>
                </div>
                <div className="stat-card glass">
                    <FileBarChart size={20} style={{ color: '#f59e0b' }} />
                    <div>
                        <div className="stat-value">{presupuestos.length}</div>
                        <div className="stat-label">Presupuestos</div>
                    </div>
                </div>
                <div className="stat-card glass">
                    <DollarSign size={20} style={{ color: '#10b981' }} />
                    <div>
                        <div className="stat-value">
                            {ventas.length > 0
                                ? `$${ventas.reduce((sum: number, v: any) => sum + (Number(v.precioFinal) || 0), 0).toLocaleString('es-AR')}`
                                : '$0'}
                        </div>
                        <div className="stat-label">Total facturado</div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs-bar glass">
                {tabs.map(t => (
                    <button
                        key={t.key}
                        className={`tab-btn ${activeTab === t.key ? 'active' : ''}`}
                        onClick={() => setActiveTab(t.key)}
                    >
                        <t.icon size={16} />
                        <span>{t.label}</span>
                        {t.count !== undefined && <span className="tab-badge">{t.count}</span>}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            <div className="tab-content glass">
                {/* INFO */}
                {activeTab === 'info' && (
                    <div className="info-grid">
                        <div className="info-section">
                            <h3>Datos personales</h3>
                            <div className="info-rows">
                                <div className="info-row">
                                    <User size={16} />
                                    <span className="info-label">Nombre completo</span>
                                    <span className="info-value">{cliente.nombre}</span>
                                </div>
                                <div className="info-row">
                                    <FileText size={16} />
                                    <span className="info-label">CUIT/CUIL</span>
                                    <span className="info-value">{cliente.dni || '-'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="info-section">
                            <h3>Contacto</h3>
                            <div className="info-rows">
                                <div className="info-row">
                                    <Phone size={16} />
                                    <span className="info-label">Teléfono</span>
                                    <span className="info-value">{cliente.telefono || '-'}</span>
                                </div>
                                <div className="info-row">
                                    <Mail size={16} />
                                    <span className="info-label">Email</span>
                                    <span className="info-value">{cliente.email || '-'}</span>
                                </div>
                                <div className="info-row">
                                    <MapPin size={16} />
                                    <span className="info-label">Dirección</span>
                                    <span className="info-value">{cliente.direccion || '-'}</span>
                                </div>
                            </div>
                        </div>
                        {cliente.observaciones && (
                            <div className="info-section full-width">
                                <h3>Observaciones</h3>
                                <p className="observaciones-text">{cliente.observaciones}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* VENTAS */}
                {activeTab === 'ventas' && (
                    <div>
                        {ventas.length === 0 ? (
                            <div className="empty-state">
                                <ShoppingCart size={48} style={{ opacity: 0.2 }} />
                                <p>Este cliente no tiene ventas registradas.</p>
                            </div>
                        ) : (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Vehículo</th>
                                        <th>Fecha</th>
                                        <th>Precio final</th>
                                        <th>Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ventas.map((v: any) => (
                                        <tr key={v.id}>
                                            <td>
                                                <div>
                                                    <div className="fw-bold">{v.vehiculo?.marca} {v.vehiculo?.modelo}</div>
                                                    <div className="text-muted-sm">{v.vehiculo?.anio} · {v.vehiculo?.patente}</div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex-cell">
                                                    <Calendar size={14} />
                                                    {v.fechaVenta ? new Date(v.fechaVenta).toLocaleDateString('es-AR') : '-'}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex-cell">
                                                    <DollarSign size={14} />
                                                    {v.precioFinal
                                                        ? `$${Number(v.precioFinal).toLocaleString('es-AR')}`
                                                        : '-'}
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`badge badge-${v.estado === 'completada' ? 'success' : 'warning'}`}>
                                                    {v.estado}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* PRESUPUESTOS */}
                {activeTab === 'presupuestos' && (
                    <div>
                        {presupuestos.length === 0 ? (
                            <div className="empty-state">
                                <FileBarChart size={48} style={{ opacity: 0.2 }} />
                                <p>Este cliente no tiene presupuestos registrados.</p>
                            </div>
                        ) : (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Vehículo</th>
                                        <th>Fecha</th>
                                        <th>Monto</th>
                                        <th>Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {presupuestos.map((p: any) => (
                                        <tr key={p.id}>
                                            <td>
                                                <div>
                                                    <div className="fw-bold">{p.vehiculo?.marca} {p.vehiculo?.modelo}</div>
                                                    <div className="text-muted-sm">{p.vehiculo?.anio}</div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex-cell">
                                                    <Calendar size={14} />
                                                    {p.fechaEmision ? new Date(p.fechaEmision).toLocaleDateString('es-AR') : '-'}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex-cell">
                                                    <CreditCard size={14} />
                                                    {p.montoTotal
                                                        ? `$${Number(p.montoTotal).toLocaleString('es-AR')}`
                                                        : '-'}
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`badge badge-${p.estado === 'aprobado' ? 'success' : p.estado === 'rechazado' ? 'danger' : 'warning'}`}>
                                                    {p.estado}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>

            <style>{`
                .detalle-container { display: flex; flex-direction: column; gap: 1.75rem; animation: fadeIn 0.4s ease-out; }

                .detalle-header { display: flex; align-items: center; gap: 1.5rem; }
                .back-btn { padding: 0.625rem; border-radius: 0.75rem; background: var(--bg-card); border: 1px solid var(--border); color: var(--text-secondary); transition: all 0.15s; }
                .back-btn:hover { background: var(--bg-secondary); color: var(--text-primary); transform: translateX(-2px); }

                .cliente-hero { display: flex; align-items: center; gap: 1.25rem; }
                .cliente-avatar-lg { width: 64px; height: 64px; border-radius: 1rem; background: linear-gradient(135deg, #6366f1, #818cf8); color: white; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
                .cliente-hero h1 { font-size: 1.875rem; font-weight: 800; letter-spacing: -0.03em; }
                .text-muted { color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.25rem; }

                .stats-bar { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
                .stat-card { display: flex; align-items: center; gap: 1rem; padding: 1.25rem 1.5rem; border-radius: 1rem; border: 1px solid var(--border); }
                .stat-value { font-size: 1.375rem; font-weight: 800; letter-spacing: -0.02em; }
                .stat-label { font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.2rem; }

                .tabs-bar { display: flex; gap: 0.5rem; padding: 0.5rem; border-radius: 1rem; border: 1px solid var(--border); width: fit-content; }
                .tab-btn { display: flex; align-items: center; gap: 0.625rem; padding: 0.625rem 1.25rem; border-radius: 0.625rem; font-weight: 600; font-size: 0.875rem; color: var(--text-secondary); transition: all 0.15s; }
                .tab-btn:hover { color: var(--text-primary); background: var(--bg-secondary); }
                .tab-btn.active { background: var(--accent); color: white; }
                .tab-badge { background: rgba(255,255,255,0.25); padding: 0.125rem 0.5rem; border-radius: 999px; font-size: 0.7rem; font-weight: 700; }
                .tab-btn:not(.active) .tab-badge { background: var(--bg-secondary); color: var(--text-muted); }

                .tab-content { padding: 2rem; border-radius: 1.25rem; border: 1px solid var(--border); }

                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
                .info-section h3 { font-size: 0.875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary); margin-bottom: 1.25rem; }
                .info-rows { display: flex; flex-direction: column; gap: 0.875rem; }
                .info-row { display: flex; align-items: center; gap: 0.875rem; }
                .info-row svg { color: var(--text-muted); flex-shrink: 0; }
                .info-label { font-size: 0.8125rem; color: var(--text-secondary); width: 130px; flex-shrink: 0; }
                .info-value { font-weight: 600; font-size: 0.9375rem; color: var(--text-primary); }
                .full-width { grid-column: span 2; }
                .observaciones-text { color: var(--text-secondary); line-height: 1.6; background: var(--bg-secondary); padding: 1rem; border-radius: 0.75rem; border: 1px solid var(--border); }

                .data-table { width: 100%; border-collapse: collapse; }
                .data-table th { padding: 0.75rem 1rem; background: var(--bg-secondary); color: var(--text-secondary); font-weight: 700; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--border); text-align: left; }
                .data-table td { padding: 1rem; border-bottom: 1px solid var(--border); }
                .data-table tr:last-child td { border-bottom: none; }
                .data-table tr:hover td { background: var(--bg-secondary); }
                .fw-bold { font-weight: 700; }
                .text-muted-sm { font-size: 0.75rem; color: var(--text-muted); margin-top: 0.15rem; }
                .flex-cell { display: flex; align-items: center; gap: 0.5rem; color: var(--text-secondary); font-size: 0.8125rem; }

                .badge { padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
                .badge-success { background: #d1fae5; color: #065f46; }
                .badge-warning { background: #fef3c7; color: #92400e; }
                .badge-danger { background: #fee2e2; color: #991b1b; }

                .empty-state { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 3rem; color: var(--text-muted); text-align: center; }

                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};

export default ClienteDetallePage;
