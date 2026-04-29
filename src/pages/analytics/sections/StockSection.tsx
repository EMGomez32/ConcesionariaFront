import { Car, PiggyBank, Building2, Clock } from 'lucide-react';
import { useAnalyticsStock } from '../../../hooks/useAnalytics';
import KpiCard from '../../../components/ui/KpiCard';
import BarChart from '../../../components/ui/BarChart';
import DonutChart from '../../../components/ui/DonutChart';
import type { AnalyticsParams } from '../../../api/analytics.api';

const fmtMoney = (n: number) => `$${Math.round(n).toLocaleString('es-AR')}`;
const fmtMoneyShort = (n: number) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
    return `$${n.toFixed(0)}`;
};

const ESTADO_COLORS: Record<string, string> = {
    preparacion: 'var(--warning, #f59e0b)',
    publicado: 'var(--accent, #06b6d4)',
    reservado: 'var(--accent-3, #8b5cf6)',
    vendido: 'var(--accent-2, #10b981)',
};
const ESTADO_LABELS: Record<string, string> = {
    preparacion: 'En preparación',
    publicado: 'Publicado',
    reservado: 'Reservado',
    vendido: 'Vendido',
};

interface Props {
    params: AnalyticsParams;
}

const StockSection = ({ params }: Props) => {
    const { data, isLoading } = useAnalyticsStock(params);

    const totalStock = (data?.porEstado ?? [])
        .filter(e => e.estado !== 'vendido')
        .reduce((acc, e) => acc + e.cantidad, 0);

    const PALETTE = ['var(--accent)', 'var(--accent-2, #10b981)', 'var(--accent-3, #8b5cf6)',
        'var(--info, #3b82f6)', 'var(--warning, #f59e0b)', 'var(--danger, #ef4444)',
        '#06b6d4', '#ec4899', '#14b8a6', '#f97316'];

    return (
        <div className="stock-section">
            <div className="kpi-row">
                <KpiCard
                    label="Stock vivo"
                    value={totalStock}
                    icon={Car}
                    color="var(--accent)"
                    subtitle="vehículos no vendidos"
                    loading={isLoading}
                />
                <KpiCard
                    label="Valor inventario"
                    value={fmtMoney(data?.valorTotal ?? 0)}
                    icon={PiggyBank}
                    color="var(--accent-3, #8b5cf6)"
                    subtitle="precio lista total"
                    loading={isLoading}
                />
                <KpiCard
                    label="Sucursales activas"
                    value={data?.porSucursal.length ?? 0}
                    icon={Building2}
                    color="var(--info, #3b82f6)"
                    loading={isLoading}
                />
            </div>

            <div className="charts-grid">
                <div className="card chart-card">
                    <div className="card-header"><h3>Distribución por estado</h3></div>
                    <DonutChart
                        data={(data?.porEstado ?? [])
                            .filter(e => e.cantidad > 0)
                            .map(e => ({
                                label: ESTADO_LABELS[e.estado] ?? e.estado,
                                value: e.cantidad,
                                color: ESTADO_COLORS[e.estado] ?? 'var(--accent)',
                            }))
                        }
                        centerValue={(data?.porEstado ?? []).reduce((a, e) => a + e.cantidad, 0)}
                        centerLabel="vehículos"
                    />
                </div>

                <div className="card chart-card">
                    <div className="card-header"><h3><Clock size={16} /> Antigüedad de stock</h3></div>
                    <BarChart
                        data={(data?.antiguedad ?? []).map((a, i) => ({
                            label: a.rango,
                            value: a.cantidad,
                            valueLabel: `${a.cantidad}u`,
                            color: i < 2 ? 'var(--accent-2, #10b981)'
                                : i < 3 ? 'var(--warning, #f59e0b)'
                                : 'var(--danger, #ef4444)',
                        }))}
                    />
                </div>
            </div>

            <div className="charts-grid">
                <div className="card chart-card">
                    <div className="card-header"><h3>Stock por marca</h3></div>
                    <BarChart
                        data={(data?.porMarca ?? []).map((m, i) => ({
                            label: m.marca,
                            value: m.cantidad,
                            valueLabel: `${m.cantidad}u · ${fmtMoneyShort(m.valor)}`,
                            color: PALETTE[i % PALETTE.length],
                        }))}
                    />
                </div>

                <div className="card chart-card">
                    <div className="card-header"><h3>Stock por sucursal</h3></div>
                    <BarChart
                        data={(data?.porSucursal ?? []).map((s, i) => ({
                            label: s.nombre,
                            value: s.cantidad,
                            valueLabel: `${s.cantidad}u · ${fmtMoneyShort(s.valor)}`,
                            color: PALETTE[(i + 2) % PALETTE.length],
                        }))}
                    />
                </div>
            </div>

            <style>{`
                .stock-section { display: flex; flex-direction: column; gap: 1rem; }
                .kpi-row {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                    gap: 1rem;
                }
                .charts-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
                    gap: 1rem;
                }
                .chart-card { padding: 1.25rem; }
                .card-header {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 1rem;
                }
                .card-header h3 { margin: 0; font-size: var(--text-base); font-weight: 600; }
            `}</style>
        </div>
    );
};

export default StockSection;
