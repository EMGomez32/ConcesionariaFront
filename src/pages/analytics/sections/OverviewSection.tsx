import {
    Car, BadgeDollarSign, TrendingUp, AlertCircle,
    PiggyBank, Wallet, Wrench, FileText, Target,
} from 'lucide-react';
import { useAnalyticsOverview } from '../../../hooks/useAnalytics';
import KpiCard from '../../../components/ui/KpiCard';
import type { AnalyticsParams } from '../../../api/analytics.api';

const fmtMoney = (n: number) =>
    `$${Math.round(n).toLocaleString('es-AR')}`;

interface Props {
    params: AnalyticsParams;
}

const OverviewSection = ({ params }: Props) => {
    const { data, isLoading } = useAnalyticsOverview(params);

    const ventasMontoMes = data?.ventasMes.monto ?? 0;
    const ventasMontoMesAnt = data?.ventasMesAnterior.monto ?? 0;
    const deltaVentas = ventasMontoMesAnt > 0
        ? ((ventasMontoMes - ventasMontoMesAnt) / ventasMontoMesAnt) * 100
        : (ventasMontoMes > 0 ? 100 : 0);

    const cantVentasMes = data?.ventasMes.cantidad ?? 0;
    const cantVentasMesAnt = data?.ventasMesAnterior.cantidad ?? 0;
    const deltaCantVentas = cantVentasMesAnt > 0
        ? ((cantVentasMes - cantVentasMesAnt) / cantVentasMesAnt) * 100
        : (cantVentasMes > 0 ? 100 : 0);

    return (
        <div className="overview-grid">
            <KpiCard
                label="Ventas del mes"
                value={fmtMoney(ventasMontoMes)}
                icon={BadgeDollarSign}
                color="var(--accent-2, #10b981)"
                delta={deltaVentas}
                subtitle="vs mes anterior"
                loading={isLoading}
            />
            <KpiCard
                label="Cantidad de ventas"
                value={cantVentasMes}
                icon={TrendingUp}
                color="var(--accent)"
                delta={deltaCantVentas}
                subtitle="vs mes anterior"
                loading={isLoading}
            />
            <KpiCard
                label="Ticket promedio"
                value={fmtMoney(data?.ticketPromedioMes ?? 0)}
                icon={Target}
                color="var(--info, #3b82f6)"
                subtitle="del mes en curso"
                loading={isLoading}
            />
            <KpiCard
                label="Stock total"
                value={data?.stockTotal ?? 0}
                icon={Car}
                color="var(--primary-navy, #1e3a8a)"
                subtitle={`${data?.stockPublicado ?? 0} publicados`}
                loading={isLoading}
            />
            <KpiCard
                label="Valor inventario"
                value={fmtMoney(data?.valorInventario ?? 0)}
                icon={PiggyBank}
                color="var(--accent-3, #8b5cf6)"
                subtitle="precio lista total"
                loading={isLoading}
            />
            <KpiCard
                label="Caja del mes (neto)"
                value={fmtMoney((data?.ingresosCajaMes ?? 0) - (data?.egresosCajaMes ?? 0))}
                icon={Wallet}
                color="var(--accent-2, #10b981)"
                subtitle={`Ingresos ${fmtMoney(data?.ingresosCajaMes ?? 0)}`}
                loading={isLoading}
            />
            <KpiCard
                label="Cuotas vencidas"
                value={data?.cuotasVencidas.cantidad ?? 0}
                icon={AlertCircle}
                color="var(--danger, #ef4444)"
                subtitle={fmtMoney(data?.cuotasVencidas.monto ?? 0)}
                loading={isLoading}
            />
            <KpiCard
                label="Postventa abierta"
                value={data?.casosPostventaAbiertos ?? 0}
                icon={Wrench}
                color="var(--warning, #f59e0b)"
                subtitle="casos pendientes/en proceso"
                loading={isLoading}
            />
            <KpiCard
                label="Presupuestos activos"
                value={data?.presupuestosActivos ?? 0}
                icon={FileText}
                color="var(--info, #3b82f6)"
                subtitle="borrador o enviados"
                loading={isLoading}
            />

            <style>{`
                .overview-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                    gap: 1rem;
                }
            `}</style>
        </div>
    );
};

export default OverviewSection;
