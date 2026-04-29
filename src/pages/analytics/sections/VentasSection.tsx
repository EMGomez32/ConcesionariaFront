import { TrendingUp, Award, Car, Percent, Clock } from 'lucide-react';
import { useAnalyticsVentas } from '../../../hooks/useAnalytics';
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

interface Props {
    params: AnalyticsParams;
}

const VentasSection = ({ params }: Props) => {
    const { data, isLoading } = useAnalyticsVentas(params);

    const totalRango = (data?.serieMensual ?? []).reduce((acc, m) => acc + m.monto, 0);
    const totalCantRango = (data?.serieMensual ?? []).reduce((acc, m) => acc + m.cantidad, 0);

    const PALETTE = ['var(--accent)', 'var(--accent-2, #10b981)', 'var(--accent-3, #8b5cf6)',
        'var(--info, #3b82f6)', 'var(--warning, #f59e0b)', 'var(--danger, #ef4444)',
        '#06b6d4', '#ec4899', '#14b8a6', '#f97316'];

    return (
        <div className="ventas-section">
            <div className="kpi-row">
                <KpiCard
                    label="Ventas en rango"
                    value={fmtMoney(totalRango)}
                    icon={TrendingUp}
                    color="var(--accent-2, #10b981)"
                    subtitle={`${totalCantRango} vehículos`}
                    loading={isLoading}
                />
                <KpiCard
                    label="Tasa conversión"
                    value={`${(data?.conversion.tasa ?? 0).toFixed(1)}%`}
                    icon={Percent}
                    color="var(--accent)"
                    subtitle={`${data?.conversion.ventas ?? 0} de ${data?.conversion.presupuestos ?? 0} presupuestos`}
                    loading={isLoading}
                />
                <KpiCard
                    label="Días promedio en stock"
                    value={`${data?.diasPromedioStock ?? 0}`}
                    icon={Clock}
                    color="var(--accent-3, #8b5cf6)"
                    subtitle="ingreso → venta"
                    loading={isLoading}
                />
            </div>

            <div className="card chart-card">
                <div className="card-header">
                    <h3>Evolución mensual de ventas (últimos 12 meses)</h3>
                </div>
                <LineChart
                    series={[
                        {
                            name: 'Monto',
                            color: 'var(--accent-2, #10b981)',
                            points: (data?.serieMensual ?? []).map(s => ({ x: s.mes, y: s.monto })),
                        },
                    ]}
                    height={220}
                    formatter={fmtMoneyShort}
                    yLabel="ARS"
                />
            </div>

            <div className="charts-grid">
                <div className="card chart-card">
                    <div className="card-header">
                        <Award size={16} className="text-accent" />
                        <h3>Top vendedores (rango actual)</h3>
                    </div>
                    <BarChart
                        data={(data?.porVendedor ?? []).map((v, i) => ({
                            label: v.nombre,
                            value: v.monto,
                            valueLabel: `${fmtMoneyShort(v.monto)} (${v.cantidad}u)`,
                            color: PALETTE[i % PALETTE.length],
                        }))}
                    />
                </div>

                <div className="card chart-card">
                    <div className="card-header">
                        <Car size={16} className="text-accent" />
                        <h3>Modelos más vendidos</h3>
                    </div>
                    <BarChart
                        data={(data?.porModelo ?? []).map((m, i) => ({
                            label: `${m.marca} ${m.modelo}`,
                            value: m.cantidad,
                            valueLabel: `${m.cantidad}u · ${fmtMoneyShort(m.monto)}`,
                            color: PALETTE[(i + 3) % PALETTE.length],
                        }))}
                    />
                </div>
            </div>

            <div className="card chart-card">
                <div className="card-header">
                    <h3>Ventas por forma de pago</h3>
                </div>
                <BarChart
                    data={(data?.porFormaPago ?? []).map((f, i) => ({
                        label: f.formaPago,
                        value: f.monto,
                        valueLabel: `${fmtMoneyShort(f.monto)} · ${f.cantidad} ventas`,
                        color: PALETTE[i],
                    }))}
                />
            </div>

            <style>{`
                .ventas-section {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
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
                .chart-card {
                    padding: 1.25rem;
                }
                .card-header {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 1rem;
                }
                .card-header h3 {
                    margin: 0;
                    font-size: var(--text-base);
                    font-weight: 600;
                }
            `}</style>
        </div>
    );
};

export default VentasSection;
