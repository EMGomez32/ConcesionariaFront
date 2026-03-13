import { NavLink } from 'react-router-dom';
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
  X
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.roles.includes('super_admin');

  const sections = [
    {
      title: 'General',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        ...(isSuperAdmin ? [{ icon: Building2, label: 'Concesionarias', path: '/concesionarias' }] : []),
      ]
    },
    {
      title: 'Gestión de Stock',
      items: [
        { icon: Car, label: 'Vehículos', path: '/vehiculos' },
        { icon: LogIn, label: 'Ingresos', path: '/ingresos' },
        { icon: ArrowLeftRight, label: 'Movimientos', path: '/movimientos' },
        { icon: Bookmark, label: 'Reservas', path: '/reservas' },
        { icon: DollarSign, label: 'Gastos Unidades', path: '/gastos' },
      ]
    },
    {
      title: 'Operaciones',
      items: [
        { icon: Users, label: 'Clientes', path: '/clientes' },
        { icon: Truck, label: 'Proveedores', path: '/proveedores' },
        { icon: FileText, label: 'Presupuestos', path: '/presupuestos' },
        { icon: BadgeDollarSign, label: 'Ventas', path: '/ventas' },
      ]
    },
    {
      title: 'Finanzas & Postventa',
      items: [
        { icon: Wallet, label: 'Financiación', path: '/financiaciones' },
        { icon: CreditCard, label: 'Fin. Externa', path: '/solicitudes' },
        { icon: FileText, label: 'Gastos Fijos', path: '/gastos-fijos' },
        { icon: Wrench, label: 'Postventa', path: '/postventa' },
      ]
    },
    {
      title: 'Configuración',
      items: [
        { icon: Store, label: 'Sucursales', path: '/sucursales' },
        { icon: UserPlus, label: 'Usuarios', path: '/usuarios' },
        { icon: ClipboardList, label: 'Auditoría', path: '/auditoria' },
        { icon: BadgeCheck, label: 'Billing', path: '/billing' },
        { icon: Settings, label: 'Ajustes', path: '/configuracion' },
      ]
    }
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="logo-container">
          <Car size={28} color="#fff" />
        </div>
        <div className="logo-text-wrapper">
          <span className="logo-text">DriveSoft</span>
          <span className="logo-tag">Concesionaria</span>
        </div>
        <button className="sidebar-close-btn" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {sections.map((section) => (
          <div key={section.title} className="nav-section">
            <h3 className="section-title">{section.title}</h3>
            <div className="section-items">
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <style>{`
        .sidebar {
          width: 280px;
          flex-shrink: 0;
          background: var(--bg-sidebar);
          color: white;
          padding: 1.5rem 1rem;
          display: flex;
          flex-direction: column;
          height: 100vh;
          position: sticky;
          top: 0;
          overflow-y: auto;
        }

        /* Custom Scrollbar for Sidebar */
        .sidebar::-webkit-scrollbar { width: 4px; }
        .sidebar::-webkit-scrollbar-track { background: transparent; }
        .sidebar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }

        .sidebar-header {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          margin-bottom: 2.5rem;
          padding: 0 0.5rem;
        }

        .logo-container {
            width: 42px;
            height: 42px;
            background: var(--accent-gradient);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
        }

        .logo-text-wrapper {
            display: flex;
            flex-direction: column;
        }

        .logo-text {
          font-size: 1.25rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          line-height: 1;
        }

        .logo-tag {
            font-size: 0.7rem;
            color: #94a3b8;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-top: 0.2rem;
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 1.75rem;
        }

        .nav-section {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }

        .section-title {
            font-size: 0.65rem;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            padding-left: 1rem;
        }

        .section-items {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          padding: 0.625rem 1rem;
          border-radius: 0.625rem;
          color: #94a3b8;
          font-size: 0.9rem;
          font-weight: 500;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .nav-item:hover {
          background: rgba(255,255,255,0.04);
          color: #f8fafc;
          transform: translateX(4px);
        }

        .nav-item.active {
          background: var(--accent-gradient);
          color: white;
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
        }

        .nav-item.active svg {
            color: white;
        }

        .sidebar-close-btn {
            display: none;
            background: none;
            border: none;
            color: #94a3b8;
            cursor: pointer;
            padding: 0.5rem;
            margin-left: auto;
        }

        @media (max-width: 1024px) {
            .sidebar {
                position: fixed;
                left: -280px;
                z-index: 1050;
                transition: left 0.3s ease;
            }
            .sidebar.open {
                left: 0;
            }
            .sidebar-close-btn {
                display: block;
            }
        }
      `}</style>
    </aside>
  );
};

export default Sidebar;
