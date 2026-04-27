import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    maxWidth?: string;
    footer?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    subtitle,
    children,
    maxWidth = '600px',
    footer,
}) => {
    // Lock del scroll del body mientras el modal está abierto
    useEffect(() => {
        if (!isOpen) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, [isOpen]);

    // Esc para cerrar
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    // Cierre por click outside: usamos mousedown (no click) y verificamos que
    // el evento se origine EN el overlay (no en hijos). Esto evita que el click
    // que abrió el modal lo cierre, porque ese mousedown ya ocurrió en el botón
    // antes de que el overlay existiera en el DOM.
    const handleOverlayMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose();
    };

    const modalContent = (
        <div
            className="modal-overlay is-animated active"
            onMouseDown={handleOverlayMouseDown}
            role="presentation"
        >
            <div
                className="modal-box active"
                style={{ maxWidth }}
                role="dialog"
                aria-modal="true"
                aria-label={title}
            >
                <header className="modal-header">
                    <div>
                        <h2 className="text-xl font-black text-primary uppercase tracking-tight">{title}</h2>
                        {subtitle && <p className="modal-subtitle">{subtitle}</p>}
                    </div>
                    <button
                        className="icon-btn close-modal-btn"
                        onClick={onClose}
                        aria-label="Cerrar"
                        type="button"
                    >
                        <X size={20} />
                    </button>
                </header>

                <div className="modal-body">{children}</div>

                {footer && <footer className="modal-footer">{footer}</footer>}
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default Modal;
