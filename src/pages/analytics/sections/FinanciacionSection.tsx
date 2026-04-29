import { Wallet, AlertCircle, Clock, FileText } from 'lucide-react';
import { useAnalyticsFinanciacion } from '../../../hooks/useAnalytics';
import KpiCard from '../../../components/ui/KpiCard';
import BarChart from '../../../components/ui/BarChart';
import type { AnalyticsParams } from '../../../api/analytics.api';

const fmtMoney = (n: number) => `$${Math.round(n).toLocaleString('es-AR')}`;
const fmtMoneyShort = (n: number) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
    return `$${n.toFixed(0)}`;
};

const ESTADO_COLORS: Record<string, string> = {
    pendiente: 'var(--warning, #f59e0b)',
    parcial: 'var(--accent, #06b6d4)',
    pagada: 'var(--accent-2, #10b981)',
    vencida: 'var(--danger, #ef4444)',
};

interface Props {
    params: AnalyticsParams;
}

const FinanciacionSection = ({ params }: Props) => {
    const { data, isLoading } = useAnalyticsFinanciacion(params);

    const moraTotal = (data?.moraSegmentada ?? []).reduce((a, m) => a + m.monto, 0);
    const moraCantidad = (data?.moraSegmentada ?? []).reduce((a, m) => a + m.cantidad, 0);
    const proxTotal = (data?.proximasVencer ?? []).reduce((a, p) => a + p.monto, 0);
    const proxCantidad = (data?.proximasVencer ?? []).reduce((a, p) => a + p.cantidad, 0);

    return (
        <div className="fin-section">
            <div className="kpi-row">
                <KpiCard
                    label="Financiaciones activas"
                    value={data?.activas ?? 0}
                    icon={FileText}
                    color="var(--accent)"
                    subtitle={fmtMoney(data?.montoFinanciadoTotal ?? 0)}
                    loading={isLoading}
                />
                <KpiCard
                    label="Saldo pendiente total"
                    value={fmtMoney(data?.saldoPendiente ?? 0)}
                    icon={Wallet}
                    color="var(--info, #3b82f6)"
                    subtitle="cuotas no cobradas"
                    loading={isLoading}
                />
                <KpiCard
                    label="Mora total"
                    value={moraCantidad}
                    icon={AlertCircle}
                    color="var(--danger, #ef4444)"
                    subtitle={fmtMoney(moraTotal)}
                    loading={isLoading}
                />
                <KpiCard
                    label="Próximas 30 días"
                    value={proxCantidad}
                    icon={Clock}
                    color="var(--warning, #f59e0b)"
                    subtitle={fmtMoney(proxTotal)}
                    loading={isLoading}
                />
            </div>

            <div className="charts-grid">
                <div className="card chart-card">
                    <div className="card-header"><h3>Cuotas por estado</h3></div>
                    <BarChart
                        data={(data?.cuotasPorEstado ?? []).map(c => ({
                            label: c.estado.charAt(0).toUpperCase() + c.estado.slice(1),
                            value: c.cantidad,
                            valueLabel: `${c.cantidad} · ${fmtMoneyShort(c.monto)}`,
                            color: ESTADO_COLORS[c.estado] ?? 'var(--accent)',
                        }))}
                    />
                </div>

                <div className="card chart-card">
                    <div className="card-header"><h3>Distribución de mora</h3></div>
                    <BarChart
                        data={(data?.moraSegmentada ?? []).map((m, i) => ({
                            label: m.rango,
                            value: m.monto,
                            valueLabel: `${m.cantidad} cuotas · ${fmtMoneyShort(m.monto)}`,
                            color: i === 0 ? 'var(--warning, #f59e0b)'
                                : i < 2 ? '#f97316'
                                : 'var(--danger, #ef4444)',
                        }))}
                    />
                </div>
            </div>

            <div className="card chart-card">
                <div className="card-header"><h3>Próximas a vencer (30 días)</h3></div>
                <BarChart
                    data={(data?.proximasVencer ?? []).map(p => ({
                        label: p.rango,
                        value: p.monto,
                        valueLabel: `${p.cantidad} cuotas · ${fmtMoneyShort(p.monto)}`,
                        color: 'var(--info, #3b82f6)',
                    }))}
                />
            </div>

            <style>{`
                .fin-section { display: flex; flex-direction: column; gap: 1rem; }
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

export default FinanciacionSection;
