import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clientesApi } from '../../api/clientes.api';
import { ventasApi } from '../../api/ventas.api';
import { presupuestosApi } from '../../api/presupuestos.api';
import { reservasApi } from '../../api/reservas.api';
import { financiacionesApi } from '../../api/financiaciones.api';
import solicitudesFinanciacionApi from '../../api/solicitudesFinanciacion.api';
import { postventaApi } from '../../api/postventa.api';
import type { Cliente } from '../../types/cliente.types';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import {
    ArrowLeft, User, Phone, Mail, MapPin, FileText,
    ShoppingCart, FileBarChart, Calendar, DollarSign,
    CreditCard, RefreshCw, BookmarkCheck, Wrench, Banknote, FileSignature
} from 'lucide-react';

type Tab = 'info' | 'ventas' | 'presupuestos' | 'reservas' | 'financiaciones' | 'solicitudes' | 'postventa';

type AnyRow = Record<string, unknown>;

const fmtMoney = (v: unknown) =>
    v != null && Number(v) ? `$${Number(v).toLocaleString('es-AR')}` : '-';

const fmtDate = (v: unknown) =>
    v ? new Date(String(v)).toLocaleDateString('es-AR') : '-';

const extractList = <T,>(res: unknown): T[] => {
    if (Array.isArray(res)) return res as T[];
    const r = res as { results?: T[] };
    return r?.results ?? [];
};

const ClienteDetallePage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<Tab>('info');
    const [cliente, setCliente] = useState<Cliente | null>(null);
    const [ventas, setVentas] = useState<AnyRow[]>([]);
    const [presupuestos, setPresupuestos] = useState<AnyRow[]>([]);
    const [reservas, setReservas] = useState<AnyRow[]>([]);
    const [financiaciones, setFinanciaciones] = useState<AnyRow[]>([]);
    const [solicitudes, setSolicitudes] = useState<AnyRow[]>([]);
    const [postventaCasos, setPostventaCasos] = useState<AnyRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            if (!id) return;
            const cid = Number(id);
            setLoading(true);
            setError(null);
            try {
                const [clienteRes, ventasRes, presupuestosRes, reservasRes, financiacionesRes, solicitudesRes, postventaRes] = await Promise.all([
                    clientesApi.getById(cid),
                    ventasApi.getAll({ clienteId: cid }),
                    presupuestosApi.getAll({ clienteId: cid }),
                    reservasApi.getAll({ clienteId: cid }),
                    financiacionesApi.getAll({ clienteId: cid }),
                    solicitudesFinanciacionApi.getAll({ clienteId: cid }),
                    postventaApi.getCasos({ clienteId: cid }),
                ]);
                setCliente(clienteRes);
                setVentas(extractList(ventasRes));
                setPresupuestos(extractList(presupuestosRes));
                setReservas(extractList(reservasRes));
                setFinanciaciones(extractList(financiacionesRes));
                setSolicitudes(extractList(solicitudesRes));
                setPostventaCasos(extractList(postventaRes));
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
            <RefreshCw size={20} className="animate-spin" /> Cargando...
        </div>
    );

    if (error || !cliente) return (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
            <p style={{ marginBottom: '1.5rem' }}>{error || 'Cliente no encontrado.'}</p>
            <Button variant="secondary" onClick={() => navigate('/clientes')}>
                <ArrowLeft size={16} /> Volver a Clientes
            </Button>
        </div>
    );

    const tabs: { key: Tab; label: string; icon: typeof User; count?: number }[] = [
        { key: 'info', label: 'Información', icon: User },
        { key: 'ventas', label: 'Ventas', icon: ShoppingCart, count: ventas.length },
        { key: 'reservas', label: 'Reservas', icon: BookmarkCheck, count: reservas.length },
        { key: 'presupuestos', label: 'Presupuestos', icon: FileBarChart, count: presupuestos.length },
        { key: 'financiaciones', label: 'Financiaciones', icon: Banknote, count: financiaciones.length },
        { key: 'solicitudes', label: 'Solicitudes', icon: FileSignature, count: solicitudes.length },
        { key: 'postventa', label: 'Postventa', icon: Wrench, count: postventaCasos.length },
    ];

    const totalFacturado = ventas.length > 0
        ? `$${ventas.reduce((sum: number, v) => sum + (Number((v as AnyRow).precioVenta ?? (v as AnyRow).precioFinal) || 0), 0).toLocaleString('es-AR')}`
        : '$0';

    return (
        <div className="page-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <header className="page-header">
                <div className="header-title">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-1)' }}>
                        <button className="icon-btn" onClick={() => navigate('/clientes')} aria-label="Volver">
                            <ArrowLeft size={18} />
                        </button>
                        <div className="icon-badge primary shadow-glow">
                            <User size={22} />
                        </div>
                        <h1>{cliente.nombre}</h1>
                    </div>
                    <p>
                        {[cliente.dni && `CUIT/CUIL: ${cliente.dni}`, cliente.email, cliente.telefono].filter(Boolean).join(' · ') || 'Sin datos de contacto registrados.'}
                    </p>
                </div>
            </header>

            <div className="stats-grid stagger">
                <div className="card stat-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
                        <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(var(--accent-2-rgb), 0.10)', color: 'var(--accent-2)' }}>
                            <ShoppingCart size={20} />
                        </div>
                    </div>
                    <div className="stat-content">
                        <span className="text-muted font-bold text-xs uppercase tracking-wider mb-1">Ventas realizadas</span>
                        <span className="stat-value">{ventas.length}</span>
                    </div>
                </div>
                <div className="card stat-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
                        <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(245, 158, 11, 0.10)', color: 'var(--warning)' }}>
                            <FileBarChart size={20} />
                        </div>
                    </div>
                    <div className="stat-content">
                        <span className="text-muted font-bold text-xs uppercase tracking-wider mb-1">Presupuestos</span>
                        <span className="stat-value">{presupuestos.length}</span>
                    </div>
                </div>
                <div className="card stat-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
                        <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(var(--accent-rgb), 0.10)', color: 'var(--accent)' }}>
                            <DollarSign size={20} />
                        </div>
                    </div>
                    <div className="stat-content">
                        <span className="text-muted font-bold text-xs uppercase tracking-wider mb-1">Total facturado</span>
                        <span className="stat-value">{totalFacturado}</span>
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
                            <h3 style={{ marginBottom: 'var(--space-4)' }}>Datos personales</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <span className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <User size={12} /> Nombre completo
                                    </span>
                                    <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>{cliente.nombre}</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <span className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <FileText size={12} /> CUIT/CUIL
                                    </span>
                                    <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>{cliente.dni || '-'}</span>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h3 style={{ marginBottom: 'var(--space-4)' }}>Contacto</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <span className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <Phone size={12} /> Teléfono
                                    </span>
                                    <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>{cliente.telefono || '-'}</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <span className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <Mail size={12} /> Email
                                    </span>
                                    <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>{cliente.email || '-'}</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <span className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <MapPin size={12} /> Dirección
                                    </span>
                                    <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>{cliente.direccion || '-'}</span>
                                </div>
                            </div>
                        </div>
                        {cliente.observaciones && (
                            <div style={{ gridColumn: '1 / -1' }}>
                                <h3 style={{ marginBottom: 'var(--space-4)' }}>Observaciones</h3>
                                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, background: 'var(--bg-secondary)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                                    {cliente.observaciones}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'ventas' && (
                    ventas.length === 0 ? (
                        <div className="dt-empty">
                            <div className="dt-empty-badge"><ShoppingCart size={36} /></div>
                            <p className="dt-empty-text">Este cliente no tiene ventas registradas.</p>
                        </div>
                    ) : (
                        <DetailTable
                            head={<tr><th>Vehículo</th><th>Fecha</th><th>Precio</th><th>Estado entrega</th></tr>}
                            body={ventas.map((v) => {
                                const r = v as AnyRow;
                                const veh = r.vehiculo as AnyRow | undefined;
                                return (
                                    <tr key={String(r.id)}>
                                        <td>
                                            <div style={{ fontWeight: 700 }}>{String(veh?.marca ?? '')} {String(veh?.modelo ?? '')}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                                {String(veh?.anio ?? '')} {veh?.dominio ? `· ${String(veh.dominio)}` : ''}
                                            </div>
                                        </td>
                                        <td><CellIcon icon={<Calendar size={14} />}>{fmtDate(r.fechaVenta)}</CellIcon></td>
                                        <td><CellIcon icon={<DollarSign size={14} />}>{fmtMoney(r.precioVenta ?? r.precioFinal)}</CellIcon></td>
                                        <td><Badge variant="warning">{String(r.estadoEntrega ?? '-')}</Badge></td>
                                    </tr>
                                );
                            })}
                        />
                    )
                )}

                {activeTab === 'reservas' && (
                    reservas.length === 0 ? (
                        <div className="dt-empty">
                            <div className="dt-empty-badge"><BookmarkCheck size={36} /></div>
                            <p className="dt-empty-text">Sin reservas.</p>
                        </div>
                    ) : (
                        <DetailTable
                            head={<tr><th>Vehículo</th><th>Vencimiento</th><th>Seña</th><th>Estado</th></tr>}
                            body={reservas.map((row) => {
                                const r = row as AnyRow;
                                const veh = r.vehiculo as AnyRow | undefined;
                                return (
                                    <tr key={String(r.id)}>
                                        <td>
                                            <div style={{ fontWeight: 700 }}>{String(veh?.marca ?? '')} {String(veh?.modelo ?? '')}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{veh?.dominio ? String(veh.dominio) : ''}</div>
                                        </td>
                                        <td><CellIcon icon={<Calendar size={14} />}>{fmtDate(r.fechaVencimiento)}</CellIcon></td>
                                        <td><CellIcon icon={<DollarSign size={14} />}>{fmtMoney(r.montoSena)}</CellIcon></td>
                                        <td><Badge variant="warning">{String(r.estado ?? '-')}</Badge></td>
                                    </tr>
                                );
                            })}
                        />
                    )
                )}

                {activeTab === 'presupuestos' && (
                    presupuestos.length === 0 ? (
                        <div className="dt-empty">
                            <div className="dt-empty-badge"><FileBarChart size={36} /></div>
                            <p className="dt-empty-text">Sin presupuestos.</p>
                        </div>
                    ) : (
                        <DetailTable
                            head={<tr><th>Nro</th><th>Fecha</th><th>Monto</th><th>Estado</th></tr>}
                            body={presupuestos.map((row) => {
                                const p = row as AnyRow;
                                const variant: 'success' | 'danger' | 'warning' =
                                    p.estado === 'aceptado' ? 'success' : p.estado === 'rechazado' ? 'danger' : 'warning';
                                return (
                                    <tr key={String(p.id)}>
                                        <td><span style={{ fontWeight: 700 }}>#{String(p.nroPresupuesto ?? p.id)}</span></td>
                                        <td><CellIcon icon={<Calendar size={14} />}>{fmtDate(p.fechaCreacion ?? p.fechaEmision)}</CellIcon></td>
                                        <td><CellIcon icon={<CreditCard size={14} />}>{fmtMoney(p.montoTotal ?? p.precioTotal)}</CellIcon></td>
                                        <td><Badge variant={variant}>{String(p.estado ?? '-')}</Badge></td>
                                    </tr>
                                );
                            })}
                        />
                    )
                )}

                {activeTab === 'financiaciones' && (
                    financiaciones.length === 0 ? (
                        <div className="dt-empty">
                            <div className="dt-empty-badge"><Banknote size={36} /></div>
                            <p className="dt-empty-text">Sin financiaciones.</p>
                        </div>
                    ) : (
                        <DetailTable
                            head={<tr><th>ID</th><th>Inicio</th><th>Monto</th><th>Cuotas</th><th>Estado</th></tr>}
                            body={financiaciones.map((row) => {
                                const f = row as AnyRow;
                                const variant: 'success' | 'warning' = f.estado === 'activa' ? 'success' : 'warning';
                                return (
                                    <tr key={String(f.id)}>
                                        <td><span style={{ fontWeight: 700 }}>#{String(f.id)}</span></td>
                                        <td><CellIcon icon={<Calendar size={14} />}>{fmtDate(f.fechaInicio)}</CellIcon></td>
                                        <td><CellIcon icon={<DollarSign size={14} />}>{fmtMoney(f.montoFinanciado)}</CellIcon></td>
                                        <td>{String(f.cuotas ?? '-')}</td>
                                        <td><Badge variant={variant}>{String(f.estado ?? '-')}</Badge></td>
                                    </tr>
                                );
                            })}
                        />
                    )
                )}

                {activeTab === 'solicitudes' && (
                    solicitudes.length === 0 ? (
                        <div className="dt-empty">
                            <div className="dt-empty-badge"><FileSignature size={36} /></div>
                            <p className="dt-empty-text">Sin solicitudes de financiación externa.</p>
                        </div>
                    ) : (
                        <DetailTable
                            head={<tr><th>Financiera</th><th>Monto</th><th>Plazo</th><th>Estado</th><th>Fecha</th></tr>}
                            body={solicitudes.map((row) => {
                                const s = row as AnyRow;
                                const fin = s.financiera as AnyRow | undefined;
                                return (
                                    <tr key={String(s.id)}>
                                        <td style={{ fontWeight: 700 }}>{String(fin?.nombre ?? '-')}</td>
                                        <td><CellIcon icon={<DollarSign size={14} />}>{fmtMoney(s.montoSolicitado)}</CellIcon></td>
                                        <td>{s.plazoCuotas ? `${String(s.plazoCuotas)} cuotas` : '-'}</td>
                                        <td><Badge variant="warning">{String(s.estado ?? '-')}</Badge></td>
                                        <td><CellIcon icon={<Calendar size={14} />}>{fmtDate(s.createdAt)}</CellIcon></td>
                                    </tr>
                                );
                            })}
                        />
                    )
                )}

                {activeTab === 'postventa' && (
                    postventaCasos.length === 0 ? (
                        <div className="dt-empty">
                            <div className="dt-empty-badge"><Wrench size={36} /></div>
                            <p className="dt-empty-text">Sin casos de postventa.</p>
                        </div>
                    ) : (
                        <DetailTable
                            head={<tr><th>Tipo</th><th>Reclamo</th><th>Fecha reclamo</th><th>Estado</th><th>Fecha cierre</th></tr>}
                            body={postventaCasos.map((row) => {
                                const c = row as AnyRow;
                                const variant: 'success' | 'warning' = c.estado === 'resuelto' ? 'success' : 'warning';
                                return (
                                    <tr key={String(c.id)}>
                                        <td style={{ fontWeight: 700 }}>{String(c.tipo ?? '-')}</td>
                                        <td style={{ maxWidth: 300, color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{String(c.descripcion ?? '-')}</td>
                                        <td><CellIcon icon={<Calendar size={14} />}>{fmtDate(c.fechaReclamo)}</CellIcon></td>
                                        <td><Badge variant={variant}>{String(c.estado ?? '-')}</Badge></td>
                                        <td><CellIcon icon={<Calendar size={14} />}>{fmtDate(c.fechaCierre)}</CellIcon></td>
                                    </tr>
                                );
                            })}
                        />
                    )
                )}
            </div>
        </div>
    );
};

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

const CellIcon = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
        {icon}{children}
    </div>
);

export default ClienteDetallePage;
