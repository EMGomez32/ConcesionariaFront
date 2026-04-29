import client from './client';

export interface AnalyticsParams {
    from?: string;          // YYYY-MM-DD
    to?: string;
    sucursalId?: number;
    concesionariaId?: number;  // solo super_admin
}

export interface OverviewKpis {
    stockTotal: number;
    stockPublicado: number;
    valorInventario: number;
    ventasMes: { cantidad: number; monto: number };
    ventasMesAnterior: { cantidad: number; monto: number };
    ticketPromedioMes: number;
    ingresosCajaMes: number;
    egresosCajaMes: number;
    casosPostventaAbiertos: number;
    cuotasVencidas: { cantidad: number; monto: number };
    presupuestosActivos: number;
}

export interface VentasAnalytics {
    serieMensual: Array<{ mes: string; cantidad: number; monto: number }>;
    porVendedor: Array<{ vendedorId: number; nombre: string; cantidad: number; monto: number }>;
    porModelo: Array<{ marca: string; modelo: string; cantidad: number; monto: number }>;
    porFormaPago: Array<{ formaPago: string; cantidad: number; monto: number }>;
    conversion: { presupuestos: number; ventas: number; tasa: number };
    diasPromedioStock: number;
}

export interface StockAnalytics {
    porEstado: Array<{ estado: string; cantidad: number; valor: number }>;
    porMarca: Array<{ marca: string; cantidad: number; valor: number }>;
    porSucursal: Array<{ sucursalId: number; nombre: string; cantidad: number; valor: number }>;
    antiguedad: Array<{ rango: string; cantidad: number }>;
    valorTotal: number;
}

export interface FinanciacionAnalytics {
    activas: number;
    montoFinanciadoTotal: number;
    saldoPendiente: number;
    cuotasPorEstado: Array<{ estado: string; cantidad: number; monto: number }>;
    moraSegmentada: Array<{ rango: string; cantidad: number; monto: number }>;
    proximasVencer: Array<{ rango: string; cantidad: number; monto: number }>;
}

export interface CajaAnalytics {
    saldosPorCaja: Array<{ cajaId: number; nombre: string; tipo: string; saldo: number }>;
    serieDiaria: Array<{ fecha: string; ingresos: number; egresos: number }>;
    porOrigen: Array<{ origen: string; ingresos: number; egresos: number }>;
    totalIngresos: number;
    totalEgresos: number;
}

export interface GastosAnalytics {
    porCategoriaUnidad: Array<{ categoria: string; total: number; cantidad: number }>;
    porCategoriaFijo: Array<{ categoria: string; total: number; cantidad: number }>;
    serieMensual: Array<{ mes: string; unidades: number; fijos: number }>;
    topVehiculos: Array<{ vehiculoId: number; descripcion: string; total: number }>;
    totalUnidadesRango: number;
    totalFijosRango: number;
}

export interface PostventaAnalytics {
    porEstado: Array<{ estado: string; cantidad: number }>;
    diasPromedioResolucion: number;
    costoTotalMes: number;
    casosMes: number;
    serieMensual: Array<{ mes: string; cantidad: number; costo: number }>;
}

interface ApiOk<T> { success: true; data: T }

const get = async <T>(path: string, params: AnalyticsParams): Promise<T> => {
    const res = await client.get<ApiOk<T>>(path, { params });
    return res.data;
};

export const analyticsApi = {
    overview: (p: AnalyticsParams = {}) => get<OverviewKpis>('/analytics/overview', p),
    ventas: (p: AnalyticsParams = {}) => get<VentasAnalytics>('/analytics/ventas', p),
    stock: (p: AnalyticsParams = {}) => get<StockAnalytics>('/analytics/stock', p),
    financiacion: (p: AnalyticsParams = {}) => get<FinanciacionAnalytics>('/analytics/financiacion', p),
    caja: (p: AnalyticsParams = {}) => get<CajaAnalytics>('/analytics/caja', p),
    gastos: (p: AnalyticsParams = {}) => get<GastosAnalytics>('/analytics/gastos', p),
    postventa: (p: AnalyticsParams = {}) => get<PostventaAnalytics>('/analytics/postventa', p),
};
