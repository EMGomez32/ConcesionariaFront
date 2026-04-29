import { DollarSign, FileText, Car, Receipt } from 'lucide-react';
import { useAnalyticsGastos } from '../../../hooks/useAnalytics';
import KpiCard from '../../../components/ui/KpiCard';
import BarChart from '../../../components/ui/BarChart';
import LineChart from '../../../components/ui/LineChart';
import type { AnalyticsParams } from '../../../api/analytics.api';

const fmtMoney = (n: number) => `$${Math.round(n).toLocaleString('es-AR')}`;
const fmtMoneyShort = (n: number) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
    return `$${n.toFixed(0)}`;
};

const PALETTE = ['var(--accent)', 'var(--accent-2, #10b981)', 'var(--accent-3, #8b5cf6)',
    'var(--info, #3b82f6)', 'var(--warning, #f59e0b)', 'var(--danger, #ef4444)',
    '#06b6d4', '#ec4899', '#14b8a6', '#f97316'];

interface Props {
    params: AnalyticsParams;
}

const GastosSection = ({ params }: Props) => {
    const { data, isLoading } = useAnalyticsGastos(params);

    const totalRango = (data?.totalUnidadesRango ?? 0) + (data?.totalFijosRango ?? 0);
    const ratio = totalRango > 0
        ? ((data?.totalFijosRango ?? 0) / totalRango) * 100
        : 0;

    return (
        <div className="gastos-section">
            <div className="kpi-row">
                <KpiCard
                    label="Total gastos en rango"
                    value={fmtMoney(totalRango)}
                    icon={Receipt}
                    color="var(--danger, #ef4444)"
                    loading={isLoading}
                />
                <KpiCard
                    label="Gastos por unidad"
                    value={fmtMoney(data?.totalUnidadesRango ?? 0)}
                    icon={Car}
                    color="var(--accent)"
                    subtitle={`${(100 - ratio).toFixed(0)}% del total`}
                    loading={isLoading}
                />
                <KpiCard
                    label="Gastos fijos"
                    value={fmtMoney(data?.totalFijosRango ?? 0)}
                    icon={FileText}
                    color="var(--accent-3, #8b5cf6)"
                    subtitle={`${ratio.toFixed(0)}% del total`}
                    loading={isLoading}
                />
                <KpiCard
                    label="Vehículos con gastos"
                    value={data?.topVehiculos.length ?? 0}
                    icon={DollarSign}
                    color="var(--info, #3b82f6)"
                    subtitle="top 5 mostrado"
                    loading={isLoading}
                />
            </div>

            <div className="card chart-card">
                <div className="card-header"><h3>Evolución de gastos (últimos 6 meses)</h3></div>
                <LineChart
                    series={[
                        {
                            name: 'Por unidad',
                            color: 'var(--accent)',
                            points: (data?.serieMensual ?? []).map(s => ({ x: s.mes, y: s.unidades })),
                        },
                        {
                            name: 'Fijos',
                            color: 'var(--accent-3, #8b5cf6)',
                            points: (data?.serieMensual ?? []).map(s => ({ x: s.mes, y: s.fijos })),
                        },
                    ]}
                    height={220}
                    formatter={fmtMoneyShort}
                    yLabel="ARS"
                />
            </div>

            <div className="charts-grid">
                <div className="card chart-card">
                    <div className="card-header"><h3>Categorías por unidad</h3></div>
                    <BarChart
                        data={(data?.porCategoriaUnidad ?? []).map((c, i) => ({
                            label: c.categoria,
                            value: c.total,
                            valueLabel: `${fmtMoneyShort(c.total)} · ${c.cantidad} items`,
                            color: PALETTE[i % PALETTE.length],
                        }))}
                    />
                </div>

                <div className="card chart-card">
                    <div className="card-header"><h3>Categorías de gastos fijos</h3></div>
                    <BarChart
                        data={(data?.porCategoriaFijo ?? []).map((c, i) => ({
                            label: c.categoria,
                            value: c.total,
                            valueLabel: `${fmtMoneyShort(c.total)} · ${c.cantidad} items`,
                            color: PALETTE[(i + 3) % PALETTE.length],
                        }))}
                    />
                </div>
            </div>

            <div className="card chart-card">
                <div className="card-header"><h3>Top 5 vehículos con más gasto</h3></div>
                <BarChart
                    data={(data?.topVehiculos ?? []).map((v, i) => ({
                        label: v.descripcion,
                        value: v.total,
                        valueLabel: fmtMoney(v.total),
                        color: PALETTE[i],
                    }))}
                />
            </div>

            <style>{`
                .gastos-section { display: flex; flex-direction: column; gap: 1rem; }
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
                .card-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; }
                .card-header h3 { margin: 0; font-size: var(--text-base); font-weight: 600; }
            `}</style>
        </div>
    );
};

export default GastosSection;
