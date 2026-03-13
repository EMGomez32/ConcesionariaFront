import Modal from './Modal';
import Button from './Button';
import { AlertTriangle, HelpCircle, Info, Trash2 } from 'lucide-react';

export type ConfirmType = 'default' | 'danger' | 'warning' | 'info' | 'success' | 'question';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    type?: ConfirmType;
    onConfirm: () => void;
    onCancel: () => void;
    loading?: boolean;
}

const ICONS = {
    default: <Info className="text-slate-400" size={32} />,
    danger: <Trash2 className="text-danger" size={32} />,
    warning: <AlertTriangle className="text-warning" size={32} />,
    info: <Info className="text-info" size={32} />,
    success: <Info className="text-success" size={32} />,
    question: <HelpCircle className="text-accent" size={32} />,
};

const ConfirmDialog = ({
    isOpen,
    title,
    message,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    type = 'question',
    onConfirm,
    onCancel,
    loading = false
}: ConfirmDialogProps) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onCancel}
            title={title}
            maxWidth="400px"
            footer={(
                <div className="flex justify-center gap-4 w-full">
                    <Button variant="secondary" onClick={onCancel} disabled={loading}>
                        {cancelLabel}
                    </Button>
                    <Button
                        variant={type === 'danger' ? 'danger' : 'primary'}
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? 'Procesando...' : confirmLabel}
                    </Button>
                </div>
            )}
        >
            <div className="flex flex-col items-center text-center py-4">
                <div className="mb-8" style={{ transform: 'scale(1.5)' }}>
                    {ICONS[type]}
                </div>
                <p className="text-secondary leading-relaxed font-semibold text-lg max-w-[340px]">
                    {message}
                </p>
            </div>
        </Modal>
    );
};

export default ConfirmDialog;
