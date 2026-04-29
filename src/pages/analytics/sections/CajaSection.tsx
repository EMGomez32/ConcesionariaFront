import { Wallet, ArrowDownCircle, ArrowUpCircle, Activity } from 'lucide-react';
import { useAnalyticsCaja } from '../../../hooks/useAnalytics';
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

const TIPO_COLORS: Record<string, string> = {
    efectivo: 'var(--accent-2, #10b981)',
    bancaria: 'var(--info, #3b82f6)',
    digital: 'var(--accent-3, #8b5cf6)',
};

const ORIGEN_LABELS: Record<string, string> = {
    manual: 'Manual',
    venta: 'Por venta',
    gasto: 'Por gasto',
};

interface Props {
    params: AnalyticsParams;
}

const CajaSection = ({ params }: Props) => {
    const { data, isLoading } = useAnalyticsCaja(params);

    const totalSaldo = (data?.saldosPorCaja ?? []).reduce((a, c) => a + c.saldo, 0);
    const neto = (data?.totalIngresos ?? 0) - (data?.totalEgresos ?? 0);

    return (
        <div className="caja-section">
            <div className="kpi-row">
                <KpiCard
                    label="Saldo total cajas"
                    value={fmtMoney(totalSaldo)}
                    icon={Wallet}
                    color="var(--accent)"
                    subtitle={`${data?.saldosPorCaja.length ?? 0} cajas activas`}
                    loading={isLoading}
                />
                <KpiCard
                    label="Ingresos rango"
                    value={fmtMoney(data?.totalIngresos ?? 0)}
                    icon={ArrowUpCircle}
                    color="var(--accent-2, #10b981)"
                    loading={isLoading}
                />
                <KpiCard
                    label="Egresos rango"
                    value={fmtMoney(data?.totalEgresos ?? 0)}
                    icon={ArrowDownCircle}
                    color="var(--danger, #ef4444)"
                    loading={isLoading}
                />
                <KpiCard
                    label="Neto rango"
                    value={fmtMoney(neto)}
                    icon={Activity}
                    color={neto >= 0 ? 'var(--accent-2, #10b981)' : 'var(--danger, #ef4444)'}
                    loading={isLoading}
                />
            </div>

            <div className="card chart-card">
                <div className="card-header"><h3>Movimientos diarios</h3></div>
                <LineChart
                    series={[
                        {
                            name: 'Ingresos',
                            color: 'var(--accent-2, #10b981)',
                            points: (data?.serieDiaria ?? []).map(s => ({ x: s.fecha.slice(5), y: s.ingresos })),
                        },
                        {
                            name: 'Egresos',
                            color: 'var(--danger, #ef4444)',
                            points: (data?.serieDiaria ?? []).map(s => ({ x: s.fecha.slice(5), y: s.egresos })),
                        },
                    ]}
                    height={220}
                    formatter={fmtMoneyShort}
                    yLabel="ARS"
                />
            </div>

            <div className="charts-grid">
                <div className="card chart-card">
                    <div className="card-header"><h3>Saldo por caja</h3></div>
                    <BarChart
                        data={(data?.saldosPorCaja ?? []).map(c => ({
                            label: `${c.nombre} (${c.tipo})`,
                            value: c.saldo,
                            valueLabel: fmtMoney(c.saldo),
                            color: TIPO_COLORS[c.tipo] ?? 'var(--accent)',
                        }))}
                    />
                </div>

                <div className="card chart-card">
                    <div className="card-header"><h3>Por origen del movimiento</h3></div>
                    <BarChart
                        data={(data?.porOrigen ?? []).flatMap(o => [
                            {
                                label: `${ORIGEN_LABELS[o.origen] ?? o.origen} (entradas)`,
                                value: o.ingresos,
                                valueLabel: fmtMoneyShort(o.ingresos),
                                color: 'var(--accent-2, #10b981)',
                            },
                            {
                                label: `${ORIGEN_LABELS[o.origen] ?? o.origen} (salidas)`,
                                value: o.egresos,
                                valueLabel: fmtMoneyShort(o.egresos),
                                color: 'var(--danger, #ef4444)',
                            },
                        ])}
                    />
                </div>
            </div>

            <style>{`
                .caja-section { display: flex; flex-direction: column; gap: 1rem; }
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

export default CajaSection;
