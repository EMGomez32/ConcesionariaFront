import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, icon, ...props }, ref) => {
        return (
            <div className="input-group">
                {label && <label className="input-label">{label}</label>}
                <div className={`input-container ${error ? 'error' : ''}`}>
                    {icon && <span className="input-icon">{icon}</span>}
                    <input ref={ref} className={icon ? 'with-icon' : ''} {...props} />
                </div>
                {error && <span className="error-text">{error}</span>}

                <style>{`
          .input-group { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 0.5rem; }
          .input-label { font-size: 0.875rem; font-weight: 600; color: var(--text-primary); margin-left: 0.25rem; }
          .input-container { position: relative; display: flex; align-items: center; }
          .input-container input {
            width: 100%;
            padding: 0.8125rem 1rem;
            background: var(--bg-primary);
            border: 1.5px solid var(--border);
            border-radius: 1rem;
            color: var(--text-primary);
            font-size: 0.9375rem;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: var(--shadow-sm);
          }
          .input-container input.with-icon { padding-left: 2.75rem; }
          .input-container input:focus { 
            border-color: var(--accent); 
            outline: none; 
            box-shadow: 0 0 0 4px var(--accent-light);
            background: var(--bg-card);
          }
          .input-container input:hover { border-color: var(--text-muted); }
          .input-container.error input { border-color: var(--danger); box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1); }
          .input-icon { position: absolute; left: 1rem; color: var(--text-muted); display: flex; transition: color 0.2s; }
          .input-container input:focus + .input-icon,
          .input-container input:not(:placeholder-shown) + .input-icon { color: var(--accent); }
          .error-text { font-size: 0.75rem; color: var(--danger); font-weight: 500; margin-top: 0.25rem; margin-left: 0.25rem; }
        `}</style>
            </div>
        );
    }
);

Input.displayName = 'Input';
export default Input;
