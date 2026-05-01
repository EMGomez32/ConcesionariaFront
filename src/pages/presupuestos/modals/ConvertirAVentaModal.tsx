import { ArrowRight } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import { FORMA_PAGO_OPTIONS_CONV } from '../presupuestos.utils';
import type { FormaPagoVenta } from '../../../types/venta.types';

interface ConvertirForm {
    formaPago: FormaPagoVenta;
    moneda: 'ARS' | 'USD';
    fechaVenta: string;
    observaciones: string;
}

interface ConvertirAVentaModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: () => void;
    saving: boolean;
    form: ConvertirForm;
    onFormChange: (f: ConvertirForm) => void;
}

/**
 * Modal "Convertir presupuesto en venta".
 * Sprint 4 — extraído de PresupuestosPage.tsx para reducir tamaño.
 */
const ConvertirAVentaModal = ({
    isOpen,
    onClose,
    onSubmit,
    saving,
    form,
    onFormChange,
}: ConvertirAVentaModalProps) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Convertir en Venta"
            subtitle="Definí los datos de cierre. El resto los toma del presupuesto."
            maxWidth="520px"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button variant="primary" className="flex-1" onClick={onSubmit} loading={saving}>
                        <ArrowRight size={16} className="mr-2" /> Crear venta
                    </Button>
                </>
            }
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                    <div className="input-group">
                        <label className="input-label">Forma de pago</label>
                        <select
                            className="input-control"
                            value={form.formaPago}
                            onChange={(e) =>
                                onFormChange({ ...form, formaPago: e.target.value as FormaPagoVenta })
                            }
                        >
                            {FORMA_PAGO_OPTIONS_CONV.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="input-group">
                        <label className="input-label">Moneda</label>
                        <select
                            className="input-control"
                            value={form.moneda}
                            onChange={(e) =>
                                onFormChange({ ...form, moneda: e.target.value as 'ARS' | 'USD' })
                            }
                        >
                            <option value="ARS">ARS</option>
                            <option value="USD">USD</option>
                        </select>
                    </div>
                </div>
                <div className="input-group">
                    <label className="input-label">Fecha de venta</label>
                    <input
                        type="date"
                        className="input-control"
                        value={form.fechaVenta}
                        onChange={(e) => onFormChange({ ...form, fechaVenta: e.target.value })}
                    />
                </div>
                <div className="input-group">
                    <label className="input-label">Observaciones</label>
                    <textarea
                        className="input-control"
                        rows={3}
                        value={form.observaciones}
                        onChange={(e) => onFormChange({ ...form, observaciones: e.target.value })}
                        style={{ resize: 'vertical' }}
                    />
                </div>
            </div>
        </Modal>
    );
};

export default ConvertirAVentaModal;
