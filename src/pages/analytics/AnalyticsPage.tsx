import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
    BarChart3, RefreshCw, TrendingUp, Car, Wallet, DollarSign, Wrench, LayoutDashboard,
} from 'lucide-react';
import OverviewSection from './sections/OverviewSection';
import VentasSection from './sections/VentasSection';
import StockSection from './sections/StockSection';
import FinanciacionSection from './sections/FinanciacionSection';
import CajaSection from './sections/CajaSection';
import GastosSection from './sections/GastosSection';
import PostventaSection from './sections/PostventaSection';
import { analyticsKeys } from '../../hooks/useAnalytics';
import type { AnalyticsParams } from '../../api/analytics.api';

type TabId = 'overview' | 'ventas' | 'stock' | 'financiacion' | 'caja' | 'gastos' | 'postventa';

interface Tab {
    id: TabId;
    label: string;
    icon: typeof TrendingUp;
}

const TABS: Tab[] = [
    { id: 'overview', label: 'Resumen', icon: LayoutDashboard },
    { id: 'ventas', label: 'Ventas', icon: TrendingUp },
    { id: 'stock', label: 'Stock', icon: Car },
    { id: 'financiacion', label: 'Financiación', icon: Wallet },
    { id: 'caja', label: 'Caja', icon: BarChart3 },
    { id: 'gastos', label: 'Gastos', icon: DollarSign },
    { id: 'postventa', label: 'Postventa', icon: Wrench },
];

/** YYYY-MM-DD desde un Date local. */
const isoDay = (d: Date): string => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

const AnalyticsPage = () => {
    const qc = useQueryClient();
    const [activeTab, setActiveTab] = useState<TabId>('overview');

    const today = useMemo(() => isoDay(new Date()), []);
    const thirtyDaysAgo = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return isoDay(d);
    }, []);

    const [from, setFrom] = useState(thirtyDaysAgo);
    const [to, setTo] = useState(today);

    const params: AnalyticsParams = { from, to };

    const handleRefresh = () => {
        qc.invalidateQueries({ queryKey: analyticsKeys.all });
    };

    const handlePreset = (days: number) => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - days);
        setFrom(isoDay(start));
        setTo(isoDay(end));
    };

    const handlePresetMonth = () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        setFrom(isoDay(start));
        setTo(isoDay(now));
    };

    const handlePresetYear = () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 1);
        setFrom(isoDay(start));
        setTo(isoDay(now));
    };

    return (
        <div className="page-container">
            <header className="page-header">
                <div className="header-title">
                    <h1>
                        <BarChart3 size={28} style={{ verticalAlign: 'middle', marginRight: 8 }} />
                        Analytics
                    </h1>
                    <p>Indicadores y tendencias de tu concesionaria.</p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-secondary" onClick={handleRefresh}>
                        <RefreshCw size={16} />
                        Actualizar
                    </button>
                </div>
            </header>

            <div className="filter-bar card">
                <div className="filter-fields">
                    <div className="input-group">
                        <label className="input-label" htmlFor="from">Desde</label>
                        <input
                            id="from"
                            type="date"
                            className="input-control"
                            value={from}
                            max={to}
                            onChange={e => setFrom(e.target.value)}
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label" htmlFor="to">Hasta</label>
                        <input
                            id="to"
                            type="date"
                            className="input-control"
                            value={to}
                            min={from}
                            max={today}
                            onChange={e => setTo(e.target.value)}
                        />
                    </div>
                </div>
                <div className="filter-presets">
                    <button className="btn btn-ghost btn-sm" onClick={() => handlePreset(7)}>7 días</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => handlePreset(30)}>30 días</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => handlePreset(90)}>90 días</button>
                    <button className="btn btn-ghost btn-sm" onClick={handlePresetMonth}>Mes actual</button>
                    <button className="btn btn-ghost btn-sm" onClick={handlePresetYear}>Año actual</button>
                </div>
            </div>

            <div className="analytics-tabs" role="tablist" aria-label="Secciones de analytics">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        role="tab"
                        aria-selected={activeTab === tab.id}
                        className={`analytics-tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <tab.icon size={15} />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="analytics-content">
                {activeTab === 'overview' && <OverviewSection params={params} />}
                {activeTab === 'ventas' && <VentasSection params={params} />}
                {activeTab === 'stock' && <StockSection params={params} />}
                {activeTab === 'financiacion' && <FinanciacionSection params={params} />}
                {activeTab === 'caja' && <CajaSection params={params} />}
                {activeTab === 'gastos' && <GastosSection params={params} />}
                {activeTab === 'postventa' && <PostventaSection params={params} />}
            </div>

            <style>{`
                .filter-bar {
                    padding: 1rem 1.25rem;
                    margin-bottom: 1.25rem;
                    display: flex;
                    flex-wrap: wrap;
                    gap: 1.25rem;
                    align-items: end;
                    justify-content: space-between;
                }
                .filter-fields {
                    display: flex;
                    gap: 0.75rem;
                    flex-wrap: wrap;
                }
                .filter-presets {
                    display: flex;
                    gap: 0.4rem;
                    flex-wrap: wrap;
                }
                .btn-sm {
                    padding: 0.4rem 0.75rem;
                    font-size: var(--text-xs);
                }
                .analytics-tabs {
                    display: flex;
                    gap: 0.25rem;
                    overflow-x: auto;
                    border-bottom: 1px solid var(--border);
                    margin-bottom: 1.25rem;
                    padding-bottom: 1px;
                }
                .analytics-tab {
                    background: transparent;
                    border: none;
                    padding: 0.65rem 1rem;
                    font-family: var(--font-sans);
                    font-size: var(--text-sm);
                    color: var(--text-muted);
                    cursor: pointer;
                    border-bottom: 2px solid transparent;
                    margin-bottom: -1px;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.45rem;
                    transition: color 160ms, border-color 160ms;
                    white-space: nowrap;
                }
                .analytics-tab:hover {
                    color: var(--text-primary);
                }
                .analytics-tab.active {
                    color: var(--accent);
                    border-bottom-color: var(--accent);
                    font-weight: 600;
                }
                .analytics-content {
                    min-height: 400px;
                }
            `}</style>
        </div>
    );
};

export default AnalyticsPage;
