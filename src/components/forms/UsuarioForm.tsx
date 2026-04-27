import React, { useState, useEffect } from 'react';
import type { Usuario, CreateUsuarioDto, UpdateUsuarioDto, Rol } from '../../types/usuario.types';
import type { Sucursal } from '../../types/sucursal.types';
import type { Concesionaria } from '../../types/concesionaria.types';
import { rolesApi } from '../../api/roles.api';
import { sucursalesApi } from '../../api/sucursales.api';
import { concesionariasApi } from '../../api/concesionarias.api';
import { useAuthStore } from '../../store/authStore';
import { unwrapList } from '../../utils/api';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { User, Mail, ShieldCheck, AlertCircle, Send } from 'lucide-react';

interface UsuarioFormProps {
    usuario?: Usuario;
    onSave: (data: CreateUsuarioDto | UpdateUsuarioDto) => void;
    onCancel: () => void;
    loading?: boolean;
}

const UsuarioForm: React.FC<UsuarioFormProps> = ({ usuario, onSave, onCancel, loading: isSubmitting }) => {
    const currentUser = useAuthStore((s) => s.user);
    const isSuperAdmin = !!currentUser?.roles?.includes('super_admin');

    // Lazy initial state — se calcula sólo al montar (el caller pasa key={id||'new'}).
    // El password YA NO se setea acá: en el alta el usuario lo crea por email,
    // y para reset usamos el flujo de account/password-reset.
    const [formData, setFormData] = useState(() => ({
        nombre: usuario?.nombre ?? '',
        email: usuario?.email ?? '',
        sucursalId: usuario?.sucursalId ?? 0,
        roleIds: usuario?.roles?.map(r => r.rolId) ?? [],
    }));

    const [concesionarias, setConcesionarias] = useState<Concesionaria[]>([]);
    const [selectedConcesionariaId, setSelectedConcesionariaId] = useState<number>(
        () => usuario?.sucursal?.concesionariaId ?? currentUser?.concesionariaId ?? 0
    );
    const [sucursales, setSucursales] = useState<Sucursal[]>([]);
    const [roles, setRoles] = useState<Rol[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    // Carga de catálogos al montar
    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            try {
                setLoadError(null);
                const tasks: Promise<unknown>[] = [rolesApi.getAll()];
                if (isSuperAdmin) {
                    tasks.push(concesionariasApi.getAll());
                } else if (currentUser?.concesionariaId) {
                    tasks.push(sucursalesApi.getAll({ concesionariaId: currentUser.concesionariaId }));
                }
                const [rolesRes, secondRes] = await Promise.all(tasks);
                if (cancelled) return;

                setRoles(unwrapList<Rol>(rolesRes));
                if (isSuperAdmin) {
                    setConcesionarias(unwrapList<Concesionaria>(secondRes));
                } else if (currentUser?.concesionariaId) {
                    setSucursales(unwrapList<Sucursal>(secondRes));
                }
            } catch (err) {
                if (cancelled) return;
                console.error('Error cargando datos del form de usuario:', err);
                setLoadError('No se pudieron cargar los catálogos. Reintentá o cerrá el modal.');
            } finally {
                if (!cancelled) setLoadingData(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, [isSuperAdmin, currentUser?.concesionariaId]);

    // Si super_admin cambia de concesionaria, recarga sucursales
    useEffect(() => {
        if (!isSuperAdmin || !selectedConcesionariaId) {
            if (isSuperAdmin) setSucursales([]);
            return;
        }
        let cancelled = false;
        sucursalesApi.getAll({ concesionariaId: selectedConcesionariaId })
            .then((res) => { if (!cancelled) setSucursales(unwrapList<Sucursal>(res)); })
            .catch((err) => { if (!cancelled) console.error('Error cargando sucursales:', err); });
        return () => { cancelled = true; };
    }, [selectedConcesionariaId, isSuperAdmin]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'sucursalId' ? (value ? parseInt(value, 10) : 0) : value,
        }));
    };

    const handleRoleToggle = (rolId: number) => {
        setFormData(prev => ({
            ...prev,
            roleIds: prev.roleIds.includes(rolId)
                ? prev.roleIds.filter(id => id !== rolId)
                : [...prev.roleIds, rolId],
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const concesionariaId = isSuperAdmin
            ? selectedConcesionariaId
            : currentUser?.concesionariaId ?? 0;

        if (!concesionariaId) {
            setLoadError('Seleccioná una concesionaria antes de guardar.');
            return;
        }
        if (!formData.sucursalId) {
            setLoadError('Seleccioná una sucursal.');
            return;
        }
        if (formData.roleIds.length === 0) {
            setLoadError('Asigná al menos un rol.');
            return;
        }

        setLoadError(null);
        const payload: CreateUsuarioDto | UpdateUsuarioDto = {
            nombre: formData.nombre,
            email: formData.email,
            sucursalId: formData.sucursalId,
            roleIds: formData.roleIds,
            concesionariaId,
        };
        onSave(payload);
    };

    if (loadingData) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', padding: 'var(--space-6) 0' }}>
                <span className="skeleton skeleton-text" style={{ width: '60%' }} />
                <span className="skeleton skeleton-text" style={{ width: '90%' }} />
                <span className="skeleton skeleton-text" style={{ width: '75%' }} />
                <span className="skeleton skeleton-rect" style={{ width: '100%', marginTop: 'var(--space-3)' }} />
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="usuario-form">
            {loadError && (
                <div className="uploader-alert uploader-alert-error" style={{ marginBottom: 'var(--space-4)' }}>
                    <AlertCircle size={14} />
                    <span>{loadError}</span>
                </div>
            )}

            <div className="form-grid">
                <Input
                    label="Nombre completo *"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    placeholder="Ej: Juan Pérez"
                    icon={<User size={16} />}
                    required
                />

                <Input
                    label="Email *"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="juan@empresa.com"
                    icon={<Mail size={16} />}
                    required
                />

                {!usuario && (
                    <div className="full-width">
                        <div className="invite-notice">
                            <Send size={16} />
                            <div>
                                <strong>Flujo de invitación por email</strong>
                                <p>
                                    El sistema le envía al usuario un email con un link único para que
                                    cree su contraseña y active su cuenta. La invitación vence en 48 hs;
                                    podés reenviarla desde el listado en cualquier momento.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {isSuperAdmin && (
                    <div className="input-group">
                        <label className="input-label">Concesionaria *</label>
                        <select
                            className="input-control"
                            value={selectedConcesionariaId || ''}
                            onChange={(e) => setSelectedConcesionariaId(e.target.value ? parseInt(e.target.value, 10) : 0)}
                            required
                        >
                            <option value="">Seleccioná una concesionaria</option>
                            {concesionarias.map(c => (
                                <option key={c.id} value={c.id}>{c.nombre}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="input-group">
                    <label className="input-label">Sucursal *</label>
                    <select
                        name="sucursalId"
                        className="input-control"
                        value={formData.sucursalId || ''}
                        onChange={handleChange}
                        required
                        disabled={isSuperAdmin && !selectedConcesionariaId}
                    >
                        <option value="">
                            {isSuperAdmin && !selectedConcesionariaId
                                ? 'Seleccioná concesionaria primero'
                                : sucursales.length === 0
                                    ? 'No hay sucursales disponibles'
                                    : 'Seleccioná una sucursal'}
                        </option>
                        {sucursales.map(s => (
                            <option key={s.id} value={s.id}>{s.nombre}</option>
                        ))}
                    </select>
                </div>

                <div className="full-width">
                    <div className="input-group">
                        <label className="input-label">
                            <ShieldCheck size={14} style={{ display: 'inline', marginRight: '0.4rem', verticalAlign: 'middle' }} />
                            Roles *
                        </label>
                        {(() => {
                            // Solo super_admin puede ver/asignar el rol super_admin.
                            // Para el resto (admin), filtramos esa opción del listado.
                            const visibleRoles = isSuperAdmin
                                ? roles
                                : roles.filter(r => r.nombre !== 'super_admin');
                            if (visibleRoles.length === 0) {
                                return (
                                    <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', padding: 'var(--space-3)' }}>
                                        No hay roles disponibles. Contactá al administrador.
                                    </p>
                                );
                            }
                            return (
                                <div className="roles-grid">
                                    {visibleRoles.map(rol => (
                                        <label key={rol.id} className="role-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={formData.roleIds.includes(rol.id)}
                                                onChange={() => handleRoleToggle(rol.id)}
                                            />
                                            <span>{rol.nombre}</span>
                                        </label>
                                    ))}
                                </div>
                            );
                        })()}
                    </div>
                </div>
            </div>

            <div className="form-actions full-width">
                <Button type="button" variant="secondary" onClick={onCancel}>
                    Cancelar
                </Button>
                <Button type="submit" variant="primary" loading={isSubmitting}>
                    {usuario ? 'Actualizar usuario' : 'Crear usuario'}
                </Button>
            </div>

            <style>{`
                .usuario-form {
                    padding: 0.5rem 0;
                }
                .form-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: var(--space-4);
                }
                .full-width {
                    grid-column: span 2;
                }
                .roles-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
                    gap: 0.6rem;
                    padding: var(--space-3);
                    background: var(--bg-secondary);
                    border: 1px solid var(--border);
                    border-radius: var(--radius-md);
                }
                .role-checkbox {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 0.75rem;
                    background: var(--bg-card);
                    border-radius: var(--radius-sm);
                    cursor: pointer;
                    transition: border-color var(--duration-base) var(--easing-soft),
                                background var(--duration-base) var(--easing-soft);
                    border: 1px solid var(--border);
                }
                .role-checkbox:hover {
                    border-color: var(--accent);
                    background: var(--accent-light);
                }
                .role-checkbox input[type="checkbox"] {
                    width: 1rem;
                    height: 1rem;
                    cursor: pointer;
                    accent-color: var(--accent);
                }
                .role-checkbox span {
                    font-size: var(--text-sm);
                    font-weight: 500;
                    color: var(--text-primary);
                    text-transform: capitalize;
                }
                .form-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: var(--space-3);
                    margin-top: var(--space-5);
                    padding-top: var(--space-5);
                    border-top: 1px solid var(--border);
                }
                .invite-notice {
                    display: flex;
                    gap: 0.75rem;
                    padding: var(--space-3) var(--space-4);
                    background: rgba(6, 182, 212, 0.08);
                    border: 1px solid rgba(6, 182, 212, 0.25);
                    border-radius: var(--radius-md);
                    color: var(--text-secondary);
                    font-size: var(--text-sm);
                }
                .invite-notice svg { color: var(--accent-2); flex-shrink: 0; margin-top: 2px; }
                .invite-notice strong { color: var(--text-primary); display: block; margin-bottom: 4px; }
                .invite-notice p { margin: 0; line-height: 1.5; }
            `}</style>
        </form>
    );
};

export default UsuarioForm;
