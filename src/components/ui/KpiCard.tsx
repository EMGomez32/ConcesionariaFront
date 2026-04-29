import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KpiCardProps {
    label: string;
    value: string | number;
    icon?: LucideIcon;
    color?: string;
    /** Texto de subtitulo (ej: "vs mes anterior"). */
    subtitle?: string;
    /** Si se pasa, dibuja el chip con la variación. >0 verde, <0 rojo. */
    delta?: number;
    /** Cómo formatear el delta (ej: "+15%" o "+$120k"). Si no, "+12%". */
    deltaFormatter?: (delta: number) => string;
    loading?: boolean;
}

const KpiCard = ({
    label,
    value,
    icon: Icon,
    color = 'var(--accent)',
    subtitle,
    delta,
    deltaFormatter,
    loading = false,
}: KpiCardProps) => {
    const fmt = deltaFormatter ?? ((d: number) => `${d > 0 ? '+' : ''}${d.toFixed(1)}%`);
    const trendDir = delta == null ? null : delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
    const TrendIcon = trendDir === 'up' ? TrendingUp : trendDir === 'down' ? TrendingDown : Minus;

    return (
        <div className="card kpi-card shadow-sm border-0">
            <div className="kpi-card-head">
                {Icon && (
                    <div
                        className="kpi-card-icon"
                        style={{ backgroundColor: `${color}14`, color }}
                    >
                        <Icon size={18} />
                    </div>
                )}
                <span className="kpi-card-label">{label}</span>
            </div>
            <div className="kpi-card-value">
                {loading ? (
                    <span className="skeleton skeleton-text-lg" style={{ width: '60%', display: 'inline-block' }} />
                ) : (
                    value
                )}
            </div>
            <div className="kpi-card-foot">
                {delta != null && trendDir && !loading && (
                    <span className={`kpi-card-delta is-${trendDir}`}>
                        <TrendIcon size={12} />
                        {fmt(delta)}
                    </span>
                )}
                {subtitle && <span className="kpi-card-subtitle">{subtitle}</span>}
            </div>

            <style>{`
                .kpi-card {
                    padding: 1.25rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.6rem;
                    min-height: 130px;
                }
                .kpi-card-head {
                    display: flex;
                    align-items: center;
                    gap: 0.6rem;
                }
                .kpi-card-icon {
                    width: 36px;
                    height: 36px;
                    border-radius: var(--radius-sm);
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                .kpi-card-label {
                    font-family: var(--font-sans);
                    font-weight: 600;
                    font-size: 0.7rem;
                    color: var(--text-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                }
                .kpi-card-value {
                    font-family: var(--font-display);
                    font-size: 1.6rem;
                    font-weight: 700;
                    color: var(--text-primary);
                    font-variant-numeric: tabular-nums;
                    line-height: 1.2;
                    word-break: break-word;
                }
                .kpi-card-foot {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    flex-wrap: wrap;
                    margin-top: auto;
                }
                .kpi-card-delta {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.25rem;
                    padding: 0.18rem 0.45rem;
                    border-radius: 999px;
                    font-size: 0.7rem;
                    font-weight: 700;
                    font-variant-numeric: tabular-nums;
                }
                .kpi-card-delta.is-up {
                    background: color-mix(in srgb, var(--accent-2, #10b981) 14%, transparent);
                    color: var(--accent-2, #10b981);
                }
                .kpi-card-delta.is-down {
                    background: color-mix(in srgb, var(--danger, #ef4444) 14%, transparent);
                    color: var(--danger, #ef4444);
                }
                .kpi-card-delta.is-flat {
                    background: var(--bg-secondary);
                    color: var(--text-muted);
                }
                .kpi-card-subtitle {
                    font-size: 0.7rem;
                    color: var(--text-muted);
                }
            `}</style>
        </div>
    );
};

export default KpiCard;
