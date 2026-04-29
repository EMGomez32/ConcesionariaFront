import { Wrench, Clock, Receipt, AlertCircle } from 'lucide-react';
import { useAnalyticsPostventa } from '../../../hooks/useAnalytics';
import KpiCard from '../../../components/ui/KpiCard';
import BarChart from '../../../components/ui/BarChart';
import DonutChart from '../../../components/ui/DonutChart';
import LineChart from '../../../components/ui/LineChart';
import type { AnalyticsParams } from '../../../api/analytics.api';

const fmtMoney = (n: number) => `$${Math.round(n).toLocaleString('es-AR')}`;
const fmtMoneyShort = (n: number) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
    return `$${n.toFixed(0)}`;
};

const ESTADO_COLORS: Record<string, string> = {
    pendiente: 'var(--warning, #f59e0b)',
    en_proceso: 'var(--info, #3b82f6)',
    cerrado: 'var(--accent-2, #10b981)',
    anulado: 'var(--text-muted, #6b7280)',
};
const ESTADO_LABELS: Record<string, string> = {
    pendiente: 'Pendiente',
    en_proceso: 'En proceso',
    cerrado: 'Cerrado',
    anulado: 'Anulado',
};

interface Props {
    params: AnalyticsParams;
}

const PostventaSection = ({ params }: Props) => {
    const { data, isLoading } = useAnalyticsPostventa(params);

    const totalCasos = (data?.porEstado ?? []).reduce((a, e) => a + e.cantidad, 0);
    const abiertos = (data?.porEstado ?? [])
        .filter(e => ['pendiente', 'en_proceso'].includes(e.estado))
        .reduce((a, e) => a + e.cantidad, 0);

    return (
        <div className="postv-section">
            <div className="kpi-row">
                <KpiCard
                    label="Casos abiertos"
                    value={abiertos}
                    icon={AlertCircle}
                    color="var(--warning, #f59e0b)"
                    subtitle={`${totalCasos} casos totales`}
                    loading={isLoading}
                />
                <KpiCard
                    label="Casos del mes"
                    value={data?.casosMes ?? 0}
                    icon={Wrench}
                    color="var(--accent)"
                    subtitle="reclamados este mes"
                    loading={isLoading}
                />
                <KpiCard
                    label="Costo postventa mes"
                    value={fmtMoney(data?.costoTotalMes ?? 0)}
                    icon={Receipt}
                    color="var(--danger, #ef4444)"
                    loading={isLoading}
                />
                <KpiCard
                    label="Días promedio resolución"
                    value={data?.diasPromedioResolucion ?? 0}
                    icon={Clock}
                    color="var(--accent-3, #8b5cf6)"
                    subtitle="reclamo → cierre"
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
                        centerValue={totalCasos}
                        centerLabel="casos"
                    />
                </div>

                <div className="card chart-card">
                    <div className="card-header"><h3>Casos por estado (detalle)</h3></div>
                    <BarChart
                        data={(data?.porEstado ?? []).map(e => ({
                            label: ESTADO_LABELS[e.estado] ?? e.estado,
                            value: e.cantidad,
                            valueLabel: `${e.cantidad}`,
                            color: ESTADO_COLORS[e.estado] ?? 'var(--accent)',
                        }))}
                    />
                </div>
            </div>

            <div className="card chart-card">
                <div className="card-header"><h3>Evolución últimos 6 meses</h3></div>
                <LineChart
                    series={[
                        {
                            name: 'Casos',
                            color: 'var(--accent)',
                            points: (data?.serieMensual ?? []).map(s => ({ x: s.mes, y: s.cantidad })),
                        },
                    ]}
                    height={200}
                />
                <div style={{ marginTop: '1.5rem' }}>
                    <h4 style={{ margin: '0 0 0.75rem', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Costo de postventa por mes</h4>
                    <LineChart
                        series={[
                            {
                                name: 'Costo',
                                color: 'var(--danger, #ef4444)',
                                points: (data?.serieMensual ?? []).map(s => ({ x: s.mes, y: s.costo })),
                            },
                        ]}
                        height={200}
                        formatter={fmtMoneyShort}
                        yLabel="ARS"
                    />
                </div>
            </div>

            <style>{`
                .postv-section { display: flex; flex-direction: column; gap: 1rem; }
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

export default PostventaSection;
