import {
    LayoutDashboard,
    Car,
    Users,
    FileText,
    BadgeDollarSign,
    Wrench,
    Settings,
    Store,
    Wallet,
    UserPlus,
    Building2,
    Truck,
    LogIn,
    ArrowLeftRight,
    Bookmark,
    DollarSign,
    CreditCard,
    ClipboardList,
    BadgeCheck,
    BookOpen,
    Wallet as WalletIcon,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
    label: string;
    path: string;
    icon: LucideIcon;
    keywords?: string[];
    /** Solo super_admin lo ve (gestión de tenants y billing global). */
    superAdminOnly?: boolean;
    /** Solo admin o super_admin lo ven (gestión interna del tenant). */
    adminOnly?: boolean;
}

export interface NavSection {
    title: string;
    items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
    {
        title: 'General',
        items: [
            { label: 'Dashboard', path: '/', icon: LayoutDashboard, keywords: ['inicio', 'home', 'panel', 'resumen'] },
            { label: 'Concesionarias', path: '/concesionarias', icon: Building2, keywords: ['empresas', 'tenants'], superAdminOnly: true },
        ],
    },
    {
        title: 'Gestión de Stock',
        items: [
            { label: 'Vehículos', path: '/vehiculos', icon: Car, keywords: ['autos', 'unidades', 'stock'] },
            { label: 'Catálogo', path: '/catalogo', icon: BookOpen, keywords: ['marcas', 'modelos', 'versiones'] },
            { label: 'Ingresos', path: '/ingresos', icon: LogIn, keywords: ['compras', 'recepcion'] },
            { label: 'Movimientos', path: '/movimientos', icon: ArrowLeftRight, keywords: ['traslados'] },
            { label: 'Reservas', path: '/reservas', icon: Bookmark, keywords: ['señas', 'reservar'] },
            { label: 'Gastos Unidades', path: '/gastos', icon: DollarSign, keywords: ['gastos vehículos'] },
        ],
    },
    {
        title: 'Operaciones',
        items: [
            { label: 'Clientes', path: '/clientes', icon: Users, keywords: ['compradores', 'leads'] },
            { label: 'Proveedores', path: '/proveedores', icon: Truck, keywords: ['suppliers'] },
            { label: 'Presupuestos', path: '/presupuestos', icon: FileText, keywords: ['cotización', 'quote'] },
            { label: 'Ventas', path: '/ventas', icon: BadgeDollarSign, keywords: ['vender'] },
        ],
    },
    {
        title: 'Finanzas & Postventa',
        items: [
            { label: 'Caja', path: '/caja', icon: WalletIcon, keywords: ['efectivo', 'mercado pago', 'cierre', 'saldo'] },
            { label: 'Financiación', path: '/financiaciones', icon: Wallet, keywords: ['cuotas', 'préstamos'] },
            { label: 'Fin. Externa', path: '/solicitudes', icon: CreditCard, keywords: ['banco', 'solicitudes'] },
            { label: 'Gastos Fijos', path: '/gastos-fijos', icon: FileText, keywords: ['operativos'] },
            { label: 'Postventa', path: '/postventa', icon: Wrench, keywords: ['reclamos', 'service'] },
        ],
    },
    {
        title: 'Configuración',
        items: [
            { label: 'Sucursales', path: '/sucursales', icon: Store, keywords: ['locales'], adminOnly: true },
            { label: 'Usuarios', path: '/usuarios', icon: UserPlus, keywords: ['empleados', 'staff'], adminOnly: true },
            { label: 'Auditoría', path: '/auditoria', icon: ClipboardList, keywords: ['logs', 'historial'], adminOnly: true },
            { label: 'Billing', path: '/billing', icon: BadgeCheck, keywords: ['planes', 'facturación', 'suscripción'] },
            { label: 'Ajustes', path: '/configuracion', icon: Settings, keywords: ['settings', 'preferencias'] },
        ],
    },
];

export const ALL_NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((s) => s.items);

/**
 * Resuelve segmentos de pathname a labels legibles.
 * - segmentos numéricos → "#123"
 * - segmentos conocidos → label del NAV
 * - 'editar' / 'nuevo' → 'Editar' / 'Nuevo'
 */
export function resolveSegmentLabel(segment: string, parentPath: string): string {
    if (/^\d+$/.test(segment)) return `#${segment}`;
    if (segment === 'nuevo') return 'Nuevo';
    if (segment === 'editar') return 'Editar';
    const path = `${parentPath}/${segment}`;
    const item = ALL_NAV_ITEMS.find((i) => i.path === path);
    if (item) return item.label;
    return segment.charAt(0).toUpperCase() + segment.slice(1);
}
