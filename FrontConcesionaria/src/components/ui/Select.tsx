import React, { forwardRef } from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: { value: string | number; label: string }[];
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ label, error, options, ...props }, ref) => {
        return (
            <div className="input-group">
                {label && <label className="input-label">{label}</label>}
                <select ref={ref} className={`custom-select ${error ? 'error' : ''}`} {...props}>
                    <option value="">Seleccione una opción...</option>
                    {options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                {error && <span className="error-text">{error}</span>}

                <style>{`
          .input-group { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 0.5rem; }
          .input-label { font-size: 0.875rem; font-weight: 600; color: var(--text-primary); margin-left: 0.25rem; }
          .custom-select {
            width: 100%;
            padding: 0.8125rem 1rem;
            background: var(--bg-primary);
            border: 1.5px solid var(--border);
            border-radius: 1rem;
            color: var(--text-primary);
            font-size: 0.9375rem;
            appearance: none;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 1rem center;
            background-size: 1rem;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: var(--shadow-sm);
          }
          .custom-select:focus { 
            border-color: var(--accent); 
            outline: none; 
            box-shadow: 0 0 0 4px var(--accent-light);
            background: var(--bg-card);
          }
          .custom-select:hover { border-color: var(--text-muted); }
          .custom-select.error { border-color: var(--danger); box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1); }
          .error-text { font-size: 0.75rem; color: var(--danger); font-weight: 500; margin-top: 0.25rem; margin-left: 0.25rem; }
        `}</style>
            </div>
        );
    }
);

Select.displayName = 'Select';
export default Select;
