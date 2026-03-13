import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
}

const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    loading,
    style,
    ...props
}: ButtonProps) => {
    return (
        <button
            className={`btn btn-${variant} ${size} ${loading ? 'loading' : ''}`}
            disabled={loading || props.disabled}
            style={style}
            {...props}
        >
            {loading ? (
                <div className="loader-container">
                    <span className="loader"></span>
                    <span>Cargando...</span>
                </div>
            ) : children}

            <style>{`
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 1rem;
          font-weight: 700;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          white-space: nowrap;
          border: none;
          gap: 0.5rem;
          box-shadow: var(--shadow-sm);
        }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none !important; }
        .btn:active:not(:disabled) { transform: translateY(1px); }
        
        .sm { padding: 0.5rem 1rem; font-size: 0.8125rem; }
        .md { padding: 0.75rem 1.5rem; font-size: 0.9375rem; }
        .lg { padding: 1.125rem 2rem; font-size: 1.0625rem; }

        .btn-primary { 
            background: linear-gradient(135deg, var(--accent), #4f46e5); 
            color: white; 
            box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.3), 0 2px 4px -1px rgba(99, 102, 241, 0.2);
        }
        .btn-primary:hover:not(:disabled) { box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.4); transform: translateY(-1px); }
        
        .btn-secondary { background: var(--bg-card); color: var(--text-primary); border: 1.5px solid var(--border); }
        .btn-secondary:hover:not(:disabled) { border-color: var(--text-muted); background: var(--bg-secondary); }
        
        .btn-outline { border: 1.5px solid var(--border); background: transparent; color: var(--text-primary); }
        .btn-outline:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); background: var(--accent-light); }

        .btn-danger { background: #ef4444; color: white; }
        .btn-danger:hover:not(:disabled) { background: #dc2626; box-shadow: 0 10px 15px -3px rgba(239, 68, 68, 0.2); }

        .btn-ghost { background: transparent; color: var(--text-secondary); box-shadow: none; }
        .btn-ghost:hover:not(:disabled) { background: var(--bg-secondary); color: var(--text-primary); }

        .loader-container { display: flex; align-items: center; gap: 0.5rem; }
        .loader {
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            border-top-color: white;
            animation: spin 0.8s linear infinite;
        }
        .btn-secondary .loader { border-color: rgba(0,0,0,0.1); border-top-color: var(--accent); }
        
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
        </button>
    );
};

export default Button;
