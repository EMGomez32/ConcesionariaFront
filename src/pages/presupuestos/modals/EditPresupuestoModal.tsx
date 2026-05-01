import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import { STATUS } from '../presupuestos.utils';

interface EditForm {
    estado: string;
    observaciones: string;
}

interface EditPresupuestoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: () => void;
    saving: boolean;
    form: EditForm;
    onFormChange: (f: EditForm) => void;
}

/**
 * Modal de edición de Presupuesto.
 * Sprint 4 — extraído de PresupuestosPage.tsx para reducir tamaño.
 */
const EditPresupuestoModal = ({
    isOpen,
    onClose,
    onSubmit,
    saving,
    form,
    onFormChange,
}: EditPresupuestoModalProps) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Gestión de Auditoría"
            subtitle="Ajuste el estado legal y administrativo de la cotización."
            maxWidth="500px"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>Desistir</Button>
                    <Button variant="primary" className="flex-1" onClick={onSubmit} loading={saving}>
                        Acreditar Cambios
                    </Button>
                </>
            }
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
                <div className="input-group">
                    <label className="input-label">Estado del expediente</label>
                    <select
                        className="input-control"
                        value={form.estado}
                        onChange={(e) => onFormChange({ ...form, estado: e.target.value })}
                    >
                        {Object.entries(STATUS).map(([k, v]) => (
                            <option key={k} value={k}>{v.label}</option>
                        ))}
                    </select>
                </div>
                <div className="input-group">
                    <label className="input-label">Observaciones de auditoría</label>
                    <textarea
                        className="input-control"
                        rows={4}
                        value={form.observaciones}
                        onChange={(e) => onFormChange({ ...form, observaciones: e.target.value })}
                        style={{ resize: 'vertical' }}
                        placeholder="Justificación del cambio de estado o notas para vendedores…"
                    />
                </div>
            </div>
        </Modal>
    );
};

export default EditPresupuestoModal;
