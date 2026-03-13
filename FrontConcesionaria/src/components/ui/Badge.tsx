import React from 'react';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'default';

interface BadgeProps {
    children: React.ReactNode;
    variant?: BadgeVariant;
    className?: string;
}

const Badge = ({ children, variant = 'default', className = '' }: BadgeProps) => {
    const colors: Record<BadgeVariant, string> = {
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
        info: 'var(--info)',
        default: 'var(--text-secondary)',
    };

    return (
        <span className={`badge ${className}`} style={{
            backgroundColor: `${colors[variant]}15`,
            color: colors[variant],
            border: `1px solid ${colors[variant]}30`
        }}>
            {children}
            <style>{`
        .badge {
          padding: 2px 10px;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          display: inline-flex;
          align-items: center;
        }
      `}</style>
        </span>
    );
};

export default Badge;
