import React, { useState, useEffect, useMemo } from 'react';
import type { Proveedor } from '../../types/proveedor.types';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Select from '../ui/Select';
import { Building2, Phone, Mail, MapPin, Tag } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { concesionariasApi } from '../../api/concesionarias.api';
import type { Concesionaria } from '../../types/concesionaria.types';
import { PROVINCIAS_ARGENTINA } from '../../data/provincias';

const TIPOS = ['importadora', 'taller', 'particular', 'financiera', 'otro'];

interface ProveedorFormProps {
    onSubmit: (data: Partial<Proveedor>) => Promise<void>;
    initialData?: Proveedor | null;
    onCancel: () => void;
    loading?: boolean;
}

const buildProveedorFormData = (initialData: Proveedor | null | undefined, concesionariaId?: number | null): Partial<Proveedor> => ({
    concesionariaId: initialData?.concesionariaId ?? concesionariaId ?? undefined,
    nombre: initialData?.nombre ?? '',
    tipo: initialData?.tipo ?? '',
    telefono: initialData?.telefono ?? '',
    email: initialData?.email ?? '',
    provincia: initialData?.provincia ?? '',
    departamento: initialData?.departamento ?? '',
    direccion: initialData?.direccion ?? '',
    activo: initialData?.activo ?? true,
});

const ProveedorForm: React.FC<ProveedorFormProps> = ({ onSubmit, initialData, onCancel, loading }) => {
    const { user } = useAuthStore();
    const isSuperAdmin = user?.roles?.includes('super_admin') ?? false;
    const [concesionarias, setConcesionarias] = useState<Concesionaria[]>([]);

    const [formData, setFormData] = useState<Partial<Proveedor>>(() =>
        buildProveedorFormData(initialData, user?.concesionariaId)
    );

    // Obtener departamentos basados en la provincia seleccionada
    const departamentos = useMemo(() => {
        if (!formData.provincia) return [];
        const provincia = PROVINCIAS_ARGENTINA.find(p => p.nombre === formData.provincia);
        return provincia?.departamentos || [];
    }, [formData.provincia]);

    useEffect(() => {
        if (isSuperAdmin) {
            concesionariasApi.getAll().then(res => setConcesionarias(res.data.results || res.data));
        }
    }, [isSuperAdmin]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        // Si cambia la provincia, limpiar el departamento
        if (name === 'provincia') {
            setFormData(prev => ({
                ...prev,
                provincia: value,
                departamento: '', // Resetear departamento
            }));
            return;
        }
        
        setFormData(prev => ({
            ...prev,
            [name]: name === 'concesionariaId' ? (value ? parseInt(value, 10) : undefined) : value,
        }));
    };

    const toggleActivo = () => setFormData(p => ({ ...p, activo: !p.activo }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="form-grid">
            {isSuperAdmin && (
                <div className="full-width">
                    <Select
                        label="Concesionaria"
                        name="concesionariaId"
                        value={formData.concesionariaId ?? ''}
                        onChange={handleChange}
                        options={concesionarias.map(c => ({ value: c.id, label: c.nombre }))}
                        required
                    />
                </div>
            )}

            <div className="full-width">
                <Input
                    label="Nombre *"
                    name="nombre"
                    value={formData.nombre || ''}
                    onChange={handleChange}
                    placeholder="Nombre del proveedor"
                    icon={<Building2 size={18} />}
                    required
                />
            </div>

            <Select
                label="Tipo de Proveedor"
                name="tipo"
                value={formData.tipo || ''}
                onChange={handleChange}
                options={[
                    { value: '', label: 'Seleccionar tipo' },
                    ...TIPOS.map(t => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) })),
                ]}
                required
            />

            <Input
                label="Teléfono"
                name="telefono"
                value={formData.telefono || ''}
                onChange={handleChange}
                placeholder="+54 11 0000-0000"
                icon={<Phone size={18} />}
            />

            <div className="full-width">
                <Input
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={handleChange}
                    placeholder="proveedor@mail.com"
                    icon={<Mail size={18} />}
                />
            </div>

            <Select
                label="Provincia"
                name="provincia"
                value={formData.provincia || ''}
                onChange={handleChange}
                options={[
                    { value: '', label: 'Seleccionar provincia' },
                    ...PROVINCIAS_ARGENTINA.map(p => ({ value: p.nombre, label: p.nombre })),
                ]}
            />

            <Select
                label="Departamento / Partido"
                name="departamento"
                value={formData.departamento || ''}
                onChange={handleChange}
                options={[
                    { value: '', label: formData.provincia ? 'Seleccionar departamento' : 'Primero seleccione una provincia' },
                    ...departamentos.map(d => ({ value: d, label: d })),
                ]}
                disabled={!formData.provincia}
            />

            <div className="full-width">
                <Input
                    label="Dirección"
                    name="direccion"
                    value={formData.direccion || ''}
                    onChange={handleChange}
                    placeholder="Calle, número, piso, departamento, etc."
                    icon={<MapPin size={18} />}
                />
            </div>

            <div className="full-width">
                <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontSize: '0.875rem', 
                    fontWeight: '600',
                    color: 'var(--text-secondary)'
                }}>
                    Estado del Proveedor
                </label>
                <div 
                    onClick={toggleActivo}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '1.25rem',
                        background: formData.activo 
                            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.05))' 
                            : 'linear-gradient(135deg, rgba(148, 163, 184, 0.1), rgba(100, 116, 139, 0.05))',
                        border: `2px solid ${formData.activo ? '#10b981' : '#64748b'}`,
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        userSelect: 'none'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = formData.activo 
                            ? '0 8px 24px rgba(16, 185, 129, 0.3)' 
                            : '0 8px 24px rgba(100, 116, 139, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: formData.activo 
                                ? 'linear-gradient(135deg, #10b981, #059669)' 
                                : 'linear-gradient(135deg, #64748b, #475569)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            boxShadow: formData.activo 
                                ? '0 4px 12px rgba(16, 185, 129, 0.4)' 
                                : '0 4px 12px rgba(100, 116, 139, 0.3)'
                        }}>
                            <Tag size={24} />
                        </div>
                        <div>
                            <div style={{ 
                                fontSize: '1rem', 
                                fontWeight: '800', 
                                color: 'var(--text-primary)',
                                marginBottom: '0.25rem'
                            }}>
                                {formData.activo ? 'Proveedor Operativo' : 'Proveedor Suspendido'}
                            </div>
                            <div style={{ 
                                fontSize: '0.75rem', 
                                color: 'var(--text-secondary)',
                                fontWeight: '600'
                            }}>
                                {formData.activo 
                                    ? 'Este proveedor está activo y disponible para operaciones' 
                                    : 'Este proveedor no está disponible para nuevas operaciones'}
                            </div>
                        </div>
                    </div>
                    
                    <div style={{
                        position: 'relative',
                        width: '60px',
                        height: '32px',
                        background: formData.activo ? '#10b981' : '#cbd5e1',
                        borderRadius: '16px',
                        transition: 'all 0.3s ease',
                        boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)'
                    }}>
                        <div style={{
                            position: 'absolute',
                            top: '4px',
                            left: formData.activo ? '32px' : '4px',
                            width: '24px',
                            height: '24px',
                            background: 'white',
                            borderRadius: '50%',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)'
                        }}></div>
                    </div>
                </div>
            </div>

            <div className="form-actions full-width">
                <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
                    Cancelar
                </Button>
                <Button type="submit" variant="primary" loading={loading}>
                    {initialData ? 'Actualizar Proveedor' : 'Registrar Proveedor'}
                </Button>
            </div>
        </form>
    );
};

export default ProveedorForm;

