interface BarItem {
    label: string;
    value: number;
    valueLabel?: string;
    color?: string;
}

interface BarChartProps {
    data: BarItem[];
    /** Si se pasa, se usa como max para todas las barras (útil para comparar). */
    maxValue?: number;
    /** Color por defecto si el item no trae uno. */
    defaultColor?: string;
    /** Mostrar el valor a la derecha de cada barra. Default: true. */
    showValue?: boolean;
    /** Formatter personalizado del valor (sólo si no se pasa valueLabel). */
    formatter?: (v: number) => string;
}

const BarChart = ({
    data,
    maxValue,
    defaultColor = 'var(--accent)',
    showValue = true,
    formatter,
}: BarChartProps) => {
    const max = maxValue ?? Math.max(1, ...data.map(d => d.value));
    const fmt = formatter ?? ((v: number) => v.toLocaleString('es-AR'));

    return (
        <div className="bar-chart-list">
            {data.length === 0 && (
                <div className="bar-chart-empty">Sin datos en el rango seleccionado.</div>
            )}
            {data.map((item, idx) => {
                const pct = max > 0 ? Math.max((item.value / max) * 100, item.value > 0 ? 2 : 0) : 0;
                return (
                    <div key={idx} className="bar-row" title={item.label}>
                        <span className="bar-row-label">{item.label}</span>
                        <div className="bar-row-track">
                            <div
                                className="bar-row-fill"
                                style={{
                                    width: `${pct}%`,
                                    background: item.color ?? defaultColor,
                                }}
                            />
                        </div>
                        {showValue && (
                            <span className="bar-row-value">
                                {item.valueLabel ?? fmt(item.value)}
                            </span>
                        )}
                    </div>
                );
            })}

            <style>{`
                .bar-chart-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.55rem;
                    width: 100%;
                }
                .bar-chart-empty {
                    color: var(--text-muted);
                    font-size: var(--text-sm);
                    text-align: center;
                    padding: 1.5rem 0.5rem;
                }
                .bar-row {
                    display: grid;
                    grid-template-columns: minmax(120px, 200px) 1fr auto;
                    gap: 0.75rem;
                    align-items: center;
                }
                .bar-row-label {
                    font-size: var(--text-sm);
                    color: var(--text-secondary);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .bar-row-track {
                    position: relative;
                    height: 10px;
                    background: var(--bg-secondary);
                    border-radius: 6px;
                    overflow: hidden;
                }
                .bar-row-fill {
                    height: 100%;
                    border-radius: 6px;
                    transition: width 480ms var(--easing-soft);
                }
                .bar-row-value {
                    font-family: var(--font-display);
                    font-weight: 600;
                    font-size: var(--text-sm);
                    color: var(--text-primary);
                    font-variant-numeric: tabular-nums;
                    min-width: 70px;
                    text-align: right;
                }
                @media (max-width: 640px) {
                    .bar-row {
                        grid-template-columns: 1fr auto;
                        grid-template-rows: auto auto;
                    }
                    .bar-row-label {
                        grid-column: 1 / -1;
                        font-weight: 600;
                    }
                    .bar-row-track {
                        grid-column: 1 / 2;
                    }
                }
            `}</style>
        </div>
    );
};

export default BarChart;
