import React, { useState, useEffect } from 'react';
import type { CreateConcesionariaDto, Concesionaria } from '../../types/concesionaria.types';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { Building2, Mail, Phone, MapPin, Hash } from 'lucide-react';

interface ConcesionariaFormProps {
    onSubmit: (data: CreateConcesionariaDto) => Promise<void>;
    initialData?: Concesionaria | null;
    onCancel: () => void;
    loading?: boolean;
}

const ConcesionariaForm: React.FC<ConcesionariaFormProps> = ({ onSubmit, initialData, onCancel, loading }) => {
    const [formData, setFormData] = useState<CreateConcesionariaDto>({
        nombre: '',
        cuit: '',
        email: '',
        telefono: '',
        direccion: '',
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                nombre: initialData.nombre || '',
                cuit: initialData.cuit || '',
                email: initialData.email || '',
                telefono: initialData.telefono || '',
                direccion: initialData.direccion || '',
            });
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="form-grid">
            <Input
                label="Nombre de la Concesionaria *"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="ej. Automotores Sur"
                icon={<Building2 size={18} />}
                required
            />
            <Input
                label="CUIT / ID Fiscal"
                name="cuit"
                value={formData.cuit}
                onChange={handleChange}
                placeholder="30-12345678-9"
                icon={<Hash size={18} />}
            />
            <Input
                label="Email de Contacto"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="contacto@concesionaria.com"
                icon={<Mail size={18} />}
            />
            <Input
                label="Teléfono"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                placeholder="+54 11 1234-5678"
                icon={<Phone size={18} />}
            />
            <div className="full-width">
                <Input
                    label="Dirección Principal"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleChange}
                    placeholder="Av. Libertador 1234, CABA"
                    icon={<MapPin size={18} />}
                />
            </div>

            <div className="form-actions full-width">
                <Button type="button" variant="secondary" onClick={onCancel} style={{ paddingLeft: '2rem', paddingRight: '2rem' }}>
                    Cancelar
                </Button>
                <Button type="submit" variant="primary" loading={loading} style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}>
                    {initialData ? 'Guardar Cambios' : 'Crear Concesionaria'}
                </Button>
            </div>

            <style>{`
                .form-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1.5rem;
                }
                .full-width {
                    grid-column: span 2;
                }
                .form-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 1rem;
                    margin-top: 2rem;
                    padding-top: 2rem;
                    border-top: 1px solid var(--border);
                }
                
                /* Personalización de inputs si es necesario */
                .form-grid :global(.input-wrapper) {
                    margin-bottom: 0;
                }
            `}</style>
        </form>
    );
};

export default ConcesionariaForm;
