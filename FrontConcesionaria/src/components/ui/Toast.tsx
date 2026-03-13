import { useUIStore } from '../../store/uiStore';
import { CheckCircle, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

const Toast = () => {
  const { toasts, removeToast } = useUIStore();

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type} animate-slide-in`}>
          <div className="toast-icon">
            {toast.type === 'success' && <CheckCircle size={20} />}
            {toast.type === 'error' && <AlertCircle size={20} />}
            {toast.type === 'info' && <Info size={20} />}
            {toast.type === 'warning' && <AlertTriangle size={20} />}
          </div>
          <p className="toast-message">{toast.message}</p>
          <button className="toast-close" onClick={() => removeToast(toast.id)}>
            <X size={16} />
          </button>
          <div className="toast-progress"></div>
        </div>
      ))}

      <style>{`
        .toast-container {
          position: fixed;
          top: 2rem;
          right: 2rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          z-index: 9999;
        }
        .toast {
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
          border-radius: 0.75rem;
          min-width: 300px;
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
          background: var(--bg-card);
          border: 1px solid var(--border);
        }
        .toast-success { border-left: 4px solid var(--success); }
        .toast-error { border-left: 4px solid var(--danger); }
        .toast-info { border-left: 4px solid var(--info); }
        .toast-warning { border-left: 4px solid var(--warning); }
        
        .toast-icon { display: flex; }
        .toast-success .toast-icon { color: var(--success); }
        .toast-error .toast-icon { color: var(--danger); }
        .toast-info .toast-icon { color: var(--info); }
        .toast-warning .toast-icon { color: var(--warning); }
        
        .toast-message { font-size: 0.875rem; font-weight: 500; color: var(--text-primary); flex: 1; }
        .toast-close { color: var(--text-muted); padding: 0.25rem; border-radius: 0.25rem; z-index: 2; }
        .toast-close:hover { background: var(--bg-secondary); color: var(--text-primary); }

        .toast-progress {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 3px;
          background: currentColor;
          opacity: 0.5;
          animation: progress 3s linear forwards;
        }

        .toast-success .toast-progress { color: var(--success); }
        .toast-error .toast-progress { color: var(--danger); }
        .toast-info .toast-progress { color: var(--info); }
        .toast-warning .toast-progress { color: var(--warning); }

        @keyframes progress {
          from { width: 100%; }
          to { width: 0%; }
        }

        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in { animation: slideIn 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default Toast;
