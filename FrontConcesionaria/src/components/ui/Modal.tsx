import React, { useEffect, useState } from 'react';
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
    footer
}) => {
    const [render, setRender] = useState(isOpen);

    useEffect(() => {
        if (isOpen) {
            setRender(true);
            document.body.style.overflow = 'hidden';
        } else {
            const timer = setTimeout(() => {
                setRender(false);
                document.body.style.overflow = 'unset';
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!render) return null;

    const modalContent = (
        <div
            className={`modal-overlay-managed ${isOpen ? 'active' : ''}`}
            onClick={onClose}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100vw',
                height: '100vh',
                margin: 0,
                padding: '2rem',
            }}
        >
            <div
                className={`modal-box glass shadow-glow ${isOpen ? 'active' : ''}`}
                style={{ maxWidth }}
                onClick={e => e.stopPropagation()}
            >
                <header className="modal-header">
                    <div>
                        <h2 className="text-xl font-black text-primary uppercase tracking-tight">{title}</h2>
                        {subtitle && (
                            <p className="modal-subtitle">{subtitle}</p>
                        )}
                    </div>
                    <button className="icon-btn close-modal-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </header>

                <div className="modal-body">
                    {children}
                </div>

                {footer && (
                    <footer className="modal-footer">
                        {footer}
                    </footer>
                )}
            </div>

            <style>{`
                .modal-subtitle {
                    color: var(--text-secondary, #94a3b8);
                    font-size: 0.9375rem;
                    margin-top: 0.5rem;
                    font-weight: 500;
                    letter-spacing: normal;
                    text-transform: none;
                }

                .close-modal-btn {
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .close-modal-btn:hover {
                    transform: rotate(90deg);
                    background: var(--bg-elevated, #e2e8f0);
                }
            `}</style>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default Modal;
