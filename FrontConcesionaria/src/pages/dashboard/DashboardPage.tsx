import { Car, TrendingUp, RefreshCw, Clock, Zap, ShieldCheck } from 'lucide-react';
import { useDashboardStats } from '../../hooks/useDashboard';
import { useAuditLogs } from '../../hooks/useAuditLogs';

const DashboardPage = () => {
  const { data: statsData, isLoading: statsLoading, refetch: refetchStats } = useDashboardStats();
  const { data: auditsData, isLoading: auditsLoading } = useAuditLogs({}, { limit: 5 });

  const stats = [
    { label: 'Rentabilidad Total', value: `$${(statsData?.ventas ?? 0) * 1.2}M`, icon: TrendingUp, color: 'var(--accent)', trend: '+15.4%', trendType: 'positive' },
    { label: 'Vehículos en Stock', value: statsData?.vehiculos ?? 0, icon: Car, color: 'var(--primary-navy)', trend: '68 unidades', trendType: 'neutral' },
    { label: 'Ventas del Mes', value: statsData?.ventas ?? 0, icon: Zap, color: 'var(--accent)', trend: '+8.2%', trendType: 'positive' },
    { label: 'Reservas Activas', value: statsData?.reservas ?? 0, icon: Clock, color: 'var(--warning)', trend: 'Alta demanda', trendType: 'neutral' },
  ];

  return (
    <div className="page-container animate-fade-in">
      <header className="page-header">
        <div className="header-title">
          <h1>Resumen Operativo</h1>
          <p>Control de rentabilidad y gestión de unidades en tiempo real.</p>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-secondary flex items-center gap-2"
            onClick={() => refetchStats()}
            disabled={statsLoading}
          >
            <RefreshCw size={16} className={statsLoading ? 'animate-spin' : ''} />
            Sincronizar Datos
          </button>
        </div>
      </header>

      <div className="stats-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="card stat-card shadow-sm border-0">
            <div className="flex justify-between items-start mb-4">
              <div className="stat-icon-wrapper" style={{ backgroundColor: `${stat.color}10`, color: stat.color }}>
                <stat.icon size={20} />
              </div>
              <span className={`badge ${stat.trendType === 'positive' ? 'badge-emerald' : 'badge-navy'}`}>
                {stat.trend}
              </span>
            </div>
            <div className="stat-content">
              <span className="text-muted font-bold text-xs uppercase tracking-wider mb-1">{stat.label}</span>
              <span className="text-2xl font-black text-primary-navy">{statsLoading ? '...' : stat.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-layout">
        <div className="main-content">
          <div className="card performance-card glass">
            <div className="card-header">
              <div>
                <h3>Rendimiento del Negocio</h3>
                <p className="text-muted">Proyección de ingresos y volumen de ventas</p>
              </div>
              <div className="card-actions">
                <div className="badge success">En alza</div>
              </div>
            </div>
            <div className="chart-canvas">
              <div className="premium-viz">
                {/* Visual simulation of a chart */}
                <div className="bars-container">
                  {[40, 60, 45, 90, 65, 80, 50, 75, 95, 60, 85, 40].map((h, i) => (
                    <div key={i} className="bar-wrapper">
                      <div className="bar" style={{ height: `${h}%` }}>
                        <div className="bar-glow"></div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="labels">
                  <span>Ene</span><span>Feb</span><span>Mar</span><span>Abr</span><span>May</span><span>Jun</span>
                </div>
              </div>
            </div>
            <div className="card-footer-stats">
              <div className="footer-stat">
                <span>Venta Promedio</span>
                <strong>$45.2M</strong>
              </div>
              <div className="footer-stat">
                <span>Tiempo de Stock</span>
                <strong>12 Días</strong>
              </div>
              <div className="footer-stat">
                <span>Conversión</span>
                <strong>24%</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="side-content">
          <div className="card activity-card glass">
            <div className="card-header">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-accent" />
                <h3>Actividad en Vivo</h3>
              </div>
              <ShieldCheck size={18} className="text-muted" />
            </div>
            <div className="activity-timeline">
              {auditsLoading ? (
                <p className="text-center p-4">Cargando actividad...</p>
              ) : (auditsData as { results?: any[] })?.results?.map((audit: any) => (
                <div key={audit.id} className="timeline-item">
                  <div className="timeline-dot-wrapper">
                    <div className="timeline-dot"></div>
                  </div>
                  <div className="timeline-info">
                    <div className="timeline-header">
                      <span className="timeline-title">{audit.accion.toUpperCase()} - {audit.modulo}</span>
                      <span className="timeline-time">{new Date(audit.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="timeline-desc">{audit.detalle || `Operación sobre ${audit.modulo}`}</p>
                    <span className="timeline-user">por {audit.usuario?.nombre || 'Sistema'}</span>
                  </div>
                </div>
              ))}
            </div>
            <button className="view-all-btn premium-btn">Explorar Auditoría Completa</button>
          </div>

          <div className="card promo-card accent-gradient">
            <div className="promo-content">
              <h4>Suscripción Pro</h4>
              <p>Tu concesionaria está operando al 85% de su capacidad. Sube de plan para habilitar multi-sucursal ilimitada.</p>
              <button className="promo-btn">Gestionar Plan</button>
            </div>
            <Zap className="promo-float-icon" size={80} />
          </div>
        </div>
      </div>

      <style>{`
        .hover-lift {
            transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s;
        }
        .hover-lift:hover {
            transform: translateY(-5px);
            box-shadow: var(--shadow-xl);
        }
        .hover-scale {
            transition: transform 0.2s;
        }
        .hover-scale:hover {
            transform: scale(1.05);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
        }

        .stat-card {
          padding: 1.75rem;
          border-radius: var(--radius-xl);
          background: var(--bg-card);
          border: 1px solid var(--border);
        }

        .stat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .stat-icon-wrapper {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 16px -4px rgba(0,0,0,0.1);
        }

        .stat-trend-tag {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--success);
          background: rgba(16, 185, 129, 0.1);
          padding: 4px 10px;
          border-radius: 20px;
        }

        .stat-content {
          display: flex;
          flex-direction: column;
        }

        .stat-label {
          font-size: 0.875rem;
          color: var(--text-secondary);
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .stat-value {
          font-size: 2.5rem;
          font-weight: 900;
          letter-spacing: -0.04em;
          line-height: 1;
          margin-bottom: 1rem;
        }

        .stat-progress {
            height: 4px;
            background: var(--bg-secondary);
            border-radius: 2px;
            overflow: hidden;
        }

        .progress-bar {
            height: 100%;
            border-radius: 2px;
        }

        .dashboard-layout {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .performance-card {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
        }

        .badge {
            font-size: 0.75rem;
            font-weight: 800;
            padding: 4px 12px;
            border-radius: 20px;
            text-transform: uppercase;
        }
        .badge.success { background: rgba(16, 185, 129, 0.1); color: var(--success); }

        .chart-canvas {
            height: 300px;
            background: rgba(0,0,0,0.02);
            border-radius: var(--radius-lg);
            padding: 2rem;
            position: relative;
        }

        .premium-viz {
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
        }

        .bars-container {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            height: 100%;
            gap: 12px;
            padding-bottom: 2rem;
        }

        .bar-wrapper {
            flex: 1;
            height: 100%;
            display: flex;
            align-items: flex-end;
        }

        .bar {
            width: 100%;
            border-radius: 8px 8px 0 0;
            background: var(--accent-gradient);
            position: relative;
            transition: height 1s ease;
        }

        .bar-glow {
            position: absolute;
            inset: 0;
            background: inherit;
            filter: blur(8px);
            opacity: 0.2;
            z-index: -1;
        }

        .labels {
            display: flex;
            justify-content: space-between;
            padding-top: 1rem;
            border-top: 1px solid var(--border);
        }

        .labels span {
            font-size: 0.75rem;
            color: var(--text-muted);
            font-weight: 700;
        }

        .card-footer-stats {
            display: flex;
            justify-content: space-around;
            padding-top: 1rem;
            border-top: 1px solid var(--border);
        }

        .footer-stat {
            display: flex;
            flex-direction: column;
            gap: 4px;
            text-align: center;
        }

        .footer-stat span { font-size: 0.75rem; color: var(--text-muted); font-weight: 600; }
        .footer-stat strong { font-size: 1.125rem; font-weight: 800; }

        .activity-timeline { padding: 1rem 0; }
        
        .timeline-item {
          display: flex;
          gap: 1rem;
          padding-bottom: 2rem;
          position: relative;
        }
        .timeline-item:last-child { padding-bottom: 0; }

        .timeline-item::before {
            content: '';
            position: absolute;
            left: 5px;
            top: 10px;
            bottom: 0;
            width: 1px;
            background: var(--border);
        }
        .timeline-item:last-child::before { display: none; }

        .timeline-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            border: 2px solid var(--accent);
            background: var(--bg-card);
            z-index: 10;
        }

        .timeline-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .timeline-title { font-size: 0.85rem; font-weight: 800; color: var(--text-primary); }
        .timeline-time { font-size: 0.7rem; color: var(--text-muted); }
        .timeline-desc { font-size: 0.85rem; color: var(--text-secondary); margin: 4px 0; }
        .timeline-user { font-size: 0.75rem; color: var(--accent); font-weight: 700; }

        .view-all-btn.premium-btn {
            background: var(--bg-secondary);
            color: var(--text-primary);
            border: 1px solid var(--border);
            padding: 10px;
            border-radius: 12px;
            font-weight: 700;
            font-size: 0.85rem;
            margin-top: 1rem;
            transition: all 0.2s;
        }
        .view-all-btn.premium-btn:hover { background: var(--accent); color: white; border-color: var(--accent); }

        .promo-card {
            background: var(--accent-gradient);
            color: white;
            padding: 2rem;
            position: relative;
            overflow: hidden;
            margin-top: 1.5rem;
        }

        .promo-content { position: relative; z-index: 2; width: 70%; }
        .promo-content h4 { font-size: 1.25rem; margin-bottom: 0.5rem; }
        .promo-content p { font-size: 0.85rem; opacity: 0.9; margin-bottom: 1.5rem; }
        
        .promo-btn {
            background: white;
            color: var(--accent);
            padding: 10px 20px;
            border-radius: 10px;
            font-weight: 800;
            font-size: 0.85rem;
        }

        .promo-float-icon {
            position: absolute;
            right: -10px;
            bottom: -10px;
            opacity: 0.1;
            transform: rotate(-15deg);
        }

        .refresh-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          font-weight: 700;
          border-radius: 12px;
        }

        @media (max-width: 1024px) {
          .dashboard-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default DashboardPage;
