import { useMemo, useState } from 'react';

interface LineSeries {
    name: string;
    color: string;
    points: Array<{ x: string; y: number }>;
}

interface LineChartProps {
    series: LineSeries[];
    height?: number;
    formatter?: (v: number) => string;
    /** Tag axis labels visualmente (ej: "ARS", "u."). */
    yLabel?: string;
}

const LineChart = ({ series, height = 240, formatter, yLabel }: LineChartProps) => {
    const fmt = formatter ?? ((v: number) => v.toLocaleString('es-AR'));
    const [hoveredX, setHoveredX] = useState<string | null>(null);

    const { width, paths, points, axisLabels, yTicks } = useMemo(() => {
        const allXs = Array.from(
            new Set(series.flatMap(s => s.points.map(p => p.x)))
        ).sort();
        const allYs = series.flatMap(s => s.points.map(p => p.y));
        const maxY = Math.max(1, ...allYs);

        const W = Math.max(280, allXs.length * 60);
        const padX = 36;
        const padY = 20;
        const innerW = W - padX * 2;
        const innerH = height - padY * 2;

        const xPos = (x: string) => {
            const idx = allXs.indexOf(x);
            if (allXs.length <= 1) return padX + innerW / 2;
            return padX + (idx / (allXs.length - 1)) * innerW;
        };
        const yPos = (y: number) => padY + innerH - (y / maxY) * innerH;

        const paths = series.map(s => {
            const pts = s.points.map(p => ({ x: xPos(p.x), y: yPos(p.y), raw: p }));
            const d = pts
                .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
                .join(' ');
            return { name: s.name, color: s.color, d, pts };
        });

        const points = paths.flatMap(p =>
            p.pts.map(pt => ({ ...pt, color: p.color, name: p.name }))
        );

        const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => ({
            y: padY + innerH - t * innerH,
            label: fmt(Math.round(maxY * t)),
        }));

        return {
            width: W,
            paths,
            points,
            axisLabels: allXs.map(x => ({ x: xPos(x), label: x })),
            yTicks,
        };
    }, [series, height, fmt]);

    const tooltipPoints = hoveredX
        ? points.filter(p => p.raw.x === hoveredX)
        : [];

    return (
        <div className="line-chart">
            <div className="line-chart-scroll">
                <svg width={width} height={height} role="img">
                    {yTicks.map((t, i) => (
                        <g key={i}>
                            <line
                                x1={28}
                                x2={width - 8}
                                y1={t.y}
                                y2={t.y}
                                stroke="var(--border)"
                                strokeDasharray="2 4"
                                opacity={0.4}
                            />
                            <text
                                x={24}
                                y={t.y + 3}
                                textAnchor="end"
                                fontSize="10"
                                fill="var(--text-muted)"
                                fontFamily="var(--font-mono, monospace)"
                            >
                                {t.label}
                            </text>
                        </g>
                    ))}

                    {paths.map((p, i) => (
                        <path
                            key={i}
                            d={p.d}
                            fill="none"
                            stroke={p.color}
                            strokeWidth={2.5}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ filter: `drop-shadow(0 0 4px ${p.color}33)` }}
                        />
                    ))}

                    {points.map((pt, i) => (
                        <g key={i} onMouseEnter={() => setHoveredX(pt.raw.x)} onMouseLeave={() => setHoveredX(null)}>
                            <circle
                                cx={pt.x}
                                cy={pt.y}
                                r={hoveredX === pt.raw.x ? 5 : 3}
                                fill={pt.color}
                                stroke="var(--bg-primary)"
                                strokeWidth={1.5}
                                style={{ cursor: 'pointer', transition: 'r 120ms' }}
                            />
                        </g>
                    ))}

                    {axisLabels.map((a, i) => (
                        <text
                            key={i}
                            x={a.x}
                            y={height - 4}
                            textAnchor="middle"
                            fontSize="10"
                            fill="var(--text-muted)"
                        >
                            {a.label}
                        </text>
                    ))}
                </svg>
            </div>

            <div className="line-chart-legend">
                {series.map((s, i) => (
                    <div key={i} className="line-chart-legend-item">
                        <span className="line-chart-legend-dot" style={{ background: s.color }} />
                        <span>{s.name}</span>
                    </div>
                ))}
                {yLabel && <span className="line-chart-y-label">{yLabel}</span>}
            </div>

            {tooltipPoints.length > 0 && hoveredX && (
                <div className="line-chart-tooltip">
                    <strong>{hoveredX}</strong>
                    {tooltipPoints.map((p, i) => (
                        <div key={i} className="line-chart-tooltip-row">
                            <span className="line-chart-legend-dot" style={{ background: p.color }} />
                            <span>{p.name}: <strong>{fmt(p.raw.y)}</strong></span>
                        </div>
                    ))}
                </div>
            )}

            <style>{`
                .line-chart {
                    position: relative;
                    width: 100%;
                }
                .line-chart-scroll {
                    overflow-x: auto;
                    overflow-y: hidden;
                    width: 100%;
                }
                .line-chart-legend {
                    display: flex;
                    gap: 1rem;
                    flex-wrap: wrap;
                    padding-top: 0.5rem;
                    align-items: center;
                }
                .line-chart-legend-item {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.4rem;
                    font-size: var(--text-sm);
                    color: var(--text-secondary);
                }
                .line-chart-legend-dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    box-shadow: 0 0 4px currentColor;
                }
                .line-chart-y-label {
                    margin-left: auto;
                    font-size: var(--text-xs);
                    color: var(--text-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                }
                .line-chart-tooltip {
                    position: absolute;
                    top: 6px;
                    right: 6px;
                    background: var(--bg-elevated, var(--bg-primary));
                    border: 1px solid var(--border);
                    border-radius: var(--radius-sm);
                    padding: 0.5rem 0.75rem;
                    font-size: var(--text-xs);
                    box-shadow: var(--shadow-md);
                    z-index: 4;
                    pointer-events: none;
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }
                .line-chart-tooltip-row {
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                }
            `}</style>
        </div>
    );
};

export default LineChart;
