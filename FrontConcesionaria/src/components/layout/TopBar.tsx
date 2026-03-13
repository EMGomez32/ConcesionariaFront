import { useAuthStore } from '../../store/authStore';
import { LogOut, Sun, Moon, User, Bell, Menu } from 'lucide-react';
import { useState, useEffect } from 'react';

const TopBar = ({ onMenuClick }: { onMenuClick?: () => void }) => {
  const { user, logout } = useAuthStore();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      setIsDark(true);
      document.body.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark ? 'dark' : 'light';
    setIsDark(!isDark);
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <header className="top-bar">
      <div className="search-placeholder">
        <button className="mobile-menu-btn" onClick={onMenuClick}>
          <Menu size={24} />
        </button>
        <span className="breadcrumb">Panel / Dashboard</span>
      </div>

      <div className="top-bar-actions">
        <div className="action-buttons-group">
          <button className="icon-button" onClick={toggleTheme} title="Cambiar tema">
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button className="icon-button" title="Notificaciones">
            <Bell size={18} />
            <span className="notification-dot"></span>
          </button>
        </div>

        <div className="user-profile">
          <div className="user-info">
            <span className="user-name">{user?.nombre || 'Usuario'}</span>
            <span className="user-role">{user?.roles?.[0]?.replace('_', ' ') || 'Vendedor'}</span>
          </div>
          <div className="avatar-wrapper">
            <div className="avatar">
              <User size={18} />
            </div>
            <div className="status-indicator"></div>
          </div>
          <button className="logout-button" onClick={logout} title="Cerrar Sesión">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      <style>{`
        .top-bar {
          height: 72px;
          background: rgba(var(--bg-card), 0.8);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 2rem;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .search-placeholder {
            display: flex;
            align-items: center;
        }
        
        .breadcrumb {
            font-size: 0.85rem;
            color: var(--text-secondary);
            font-weight: 500;
        }

        .top-bar-actions {
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }

        .action-buttons-group {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding-right: 1.25rem;
            border-right: 1px solid var(--border);
        }

        .icon-button {
          position: relative;
          color: var(--text-secondary);
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          transition: all 0.2s;
        }

        .icon-button:hover {
          background: var(--bg-secondary);
          color: var(--accent);
        }

        .notification-dot {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 6px;
          height: 6px;
          background: var(--danger);
          border-radius: 50%;
          border: 1.5px solid var(--bg-card);
        }

        .user-profile {
          display: flex;
          align-items: center;
          gap: 0.875rem;
        }

        .user-info {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          line-height: 1.2;
        }

        .user-name {
          font-weight: 700;
          font-size: 0.875rem;
          color: var(--text-primary);
        }

        .user-role {
          font-size: 0.7rem;
          color: var(--text-muted);
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.025em;
        }

        .avatar-wrapper {
            position: relative;
        }

        .avatar {
          width: 40px;
          height: 40px;
          background: var(--accent-light);
          border: 1px solid var(--accent);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent);
        }

        .status-indicator {
            position: absolute;
            bottom: -2px;
            right: -2px;
            width: 10px;
            height: 10px;
            background: var(--success);
            border: 2px solid var(--bg-card);
            border-radius: 50%;
        }

        .logout-button {
          color: var(--text-muted);
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          margin-left: 0.25rem;
        }

        .logout-button:hover {
          background: #fee2e2;
          color: var(--danger);
        }

        .mobile-menu-btn {
            display: none;
            color: var(--text-primary);
            margin-right: 1rem;
            background: transparent;
            border: none;
            padding: 4px;
        }

        @media (max-width: 1024px) {
            .mobile-menu-btn {
                display: block;
            }
            .top-bar {
                padding: 0 1rem;
            }
            .user-info {
                display: none;
            }
        }
      `}</style>
    </header>
  );
};

export default TopBar;
