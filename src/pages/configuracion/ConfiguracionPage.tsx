import { useEffect, useState } from 'react';
import { Building2, User as UserIcon, Lock, Save, RefreshCw, Settings } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { concesionariasApi } from '../../api/concesionarias.api';
import { usuariosApi } from '../../api/usuarios.api';
import Button from '../../components/ui/Button';
import type { Concesionaria } from '../../types/concesionaria.types';

type Tab = 'concesionaria' | 'perfil' | 'password';

const ConfiguracionPage = () => {
    const { user, setUser } = useAuthStore();
    const { addToast } = useUIStore();

    const [tab, setTab] = useState<Tab>('concesionaria');

    // Concesionaria state
    const [concesionaria, setConcesionaria] = useState<Concesionaria | null>(null);
    const [concesionariaLoading, setConcesionariaLoading] = useState(false);
    const [concesionariaForm, setConcesionariaForm] = useState({
        nombre: '', cuit: '', email: '', telefono: '', direccion: '',
    });
    const [savingConcesionaria, setSavingConcesionaria] = useState(false);

    // Perfil state
    const [perfilForm, setPerfilForm] = useState({
        nombre: user?.nombre || '',
        email: user?.email || '',
    });
    const [savingPerfil, setSavingPerfil] = useState(false);

    // Password state
    const [passForm, setPassForm] = useState({ password: '', confirm: '' });
    const [savingPass, setSavingPass] = useState(false);

    const isAdmin = user?.roles?.includes('super_admin') || user?.roles?.includes('admin');
    const concesionariaId = user?.concesionariaId;

    useEffect(() => {
        if (!concesionariaId) return;
        setConcesionariaLoading(true);
        concesionariasApi.getById(concesionariaId)
            .then((res: unknown) => {
                const r = res as Concesionaria | { data?: Concesionaria };
                const data = ('id' in (r as Concesionaria) ? r : (r as { data?: Concesionaria })?.data) as Concesionaria | undefined;
                if (data) {
                    setConcesionaria(data);
                    setConcesionariaForm({
                        nombre: data.nombre || '',
                        cuit: data.cuit || '',
                        email: data.email || '',
                        telefono: data.telefono || '',
                        direccion: data.direccion || '',
                    });
                }
            })
            .catch(() => addToast('Error al cargar la concesionaria', 'error'))
            .finally(() => setConcesionariaLoading(false));
    }, [concesionariaId, addToast]);

    useEffect(() => {
        setPerfilForm({ nombre: user?.nombre || '', email: user?.email || '' });
    }, [user?.nombre, user?.email]);

    const handleSaveConcesionaria = async () => {
        if (!concesionariaId) return;
        if (!concesionariaForm.nombre) {
            addToast('El nombre es requerido', 'error');
            return;
        }
        setSavingConcesionaria(true);
        try {
            await concesionariasApi.update(concesionariaId, {
                nombre: concesionariaForm.nombre,
                ...(concesionariaForm.cuit && { cuit: concesionariaForm.cuit }),
                ...(concesionariaForm.email && { email: concesionariaForm.email }),
                ...(concesionariaForm.telefono && { telefono: concesionariaForm.telefono }),
                ...(concesionariaForm.direccion && { direccion: concesionariaForm.direccion }),
            });
            addToast('Concesionaria actualizada', 'success');
        } catch (err: unknown) {
            const e = err as { message?: string };
            addToast(e?.message || 'Error al actualizar la concesionaria', 'error');
        } finally {
            setSavingConcesionaria(false);
        }
    };

    const handleSavePerfil = async () => {
        if (!user?.id) return;
        if (!perfilForm.nombre || !perfilForm.email) {
            addToast('Nombre y email son requeridos', 'error');
            return;
        }
        setSavingPerfil(true);
        try {
            await usuariosApi.update(user.id, {
                nombre: perfilForm.nombre,
                email: perfilForm.email,
            });
            setUser({ nombre: perfilForm.nombre, email: perfilForm.email });
            addToast('Perfil actualizado', 'success');
        } catch (err: unknown) {
            const e = err as { message?: string };
            addToast(e?.message || 'Error al actualizar el perfil', 'error');
        } finally {
            setSavingPerfil(false);
        }
    };

    const handleSavePassword = async () => {
        if (!user?.id) return;
        if (passForm.password.length < 6) {
            addToast('La contraseña debe tener al menos 6 caracteres', 'error');
            return;
        }
        if (passForm.password !== passForm.confirm) {
            addToast('Las contraseñas no coinciden', 'error');
            return;
        }
        setSavingPass(true);
        try {
            await usuariosApi.resetPassword(user.id, passForm.password);
            addToast('Contraseña actualizada con éxito', 'success');
            setPassForm({ password: '', confirm: '' });
        } catch (err: unknown) {
            const e = err as { message?: string };
            addToast(e?.message || 'Error al actualizar la contraseña', 'error');
        } finally {
            setSavingPass(false);
        }
    };

    return (
        <div className="page-container animate-fade-in" style={{ maxWidth: 900 }}>
            <header className="page-header">
                <div className="header-title">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-1)' }}>
                        <div className="icon-badge primary shadow-glow">
                            <Settings size={22} />
                        </div>
                        <h1>Configuración</h1>
                    </div>
                    <p>Administrá tu concesionaria, tu perfil y la seguridad de tu cuenta.</p>
                </div>
            </header>

            <div className="tab-group" role="tablist" style={{ marginBottom: 'var(--space-5)' }}>
                <button
                    type="button"
                    role="tab"
                    aria-selected={tab === 'concesionaria'}
                    onClick={() => setTab('concesionaria')}
                    className={`tab-btn ${tab === 'concesionaria' ? 'is-active' : ''}`}
                >
                    <Building2 size={14} /> Mi concesionaria
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={tab === 'perfil'}
                    onClick={() => setTab('perfil')}
                    className={`tab-btn ${tab === 'perfil' ? 'is-active' : ''}`}
                >
                    <UserIcon size={14} /> Mi perfil
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={tab === 'password'}
                    onClick={() => setTab('password')}
                    className={`tab-btn ${tab === 'password' ? 'is-active' : ''}`}
                >
                    <Lock size={14} /> Cambiar contraseña
                </button>
            </div>

            {tab === 'concesionaria' && (
                <div className="card" style={{ padding: 'var(--space-6)' }}>
                    {concesionariaLoading ? (
                        <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-muted)' }}>
                            <RefreshCw size={20} className="animate-spin" style={{ display: 'inline-block', marginRight: '0.5rem' }} /> Cargando...
                        </div>
                    ) : !concesionariaId ? (
                        <p style={{ color: 'var(--text-muted)' }}>No estás asociado a ninguna concesionaria.</p>
                    ) : !concesionaria ? (
                        <p style={{ color: 'var(--text-muted)' }}>No se pudo cargar la concesionaria.</p>
                    ) : (
                        <>
                            <h3 style={{ marginBottom: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                <Building2 size={18} /> Datos de la concesionaria
                                {!isAdmin && (
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>(solo lectura)</span>
                                )}
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
                                <div>
                                    <label className="input-label">Nombre *</label>
                                    <input type="text" className="input-control" value={concesionariaForm.nombre} disabled={!isAdmin}
                                        onChange={e => setConcesionariaForm(f => ({ ...f, nombre: e.target.value }))} />
                                </div>
                                <div>
                                    <label className="input-label">CUIT</label>
                                    <input type="text" className="input-control" value={concesionariaForm.cuit} disabled={!isAdmin}
                                        onChange={e => setConcesionariaForm(f => ({ ...f, cuit: e.target.value }))} />
                                </div>
                                <div>
                                    <label className="input-label">Email</label>
                                    <input type="email" className="input-control" value={concesionariaForm.email} disabled={!isAdmin}
                                        onChange={e => setConcesionariaForm(f => ({ ...f, email: e.target.value }))} />
                                </div>
                                <div>
                                    <label className="input-label">Teléfono</label>
                                    <input type="text" className="input-control" value={concesionariaForm.telefono} disabled={!isAdmin}
                                        onChange={e => setConcesionariaForm(f => ({ ...f, telefono: e.target.value }))} />
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label className="input-label">Dirección</label>
                                    <input type="text" className="input-control" value={concesionariaForm.direccion} disabled={!isAdmin}
                                        onChange={e => setConcesionariaForm(f => ({ ...f, direccion: e.target.value }))} />
                                </div>
                            </div>
                            {isAdmin && (
                                <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', paddingTop: 'var(--space-5)', borderTop: '1px solid var(--border)', marginTop: 'var(--space-5)' }}>
                                    <Button variant="primary" onClick={handleSaveConcesionaria} disabled={savingConcesionaria}>
                                        <Save size={16} /> {savingConcesionaria ? 'Guardando...' : 'Guardar cambios'}
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {tab === 'perfil' && (
                <div className="card" style={{ padding: 'var(--space-6)' }}>
                    <h3 style={{ marginBottom: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <UserIcon size={18} /> Mi perfil
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
                        <div>
                            <label className="input-label">Nombre *</label>
                            <input type="text" className="input-control" value={perfilForm.nombre}
                                onChange={e => setPerfilForm(f => ({ ...f, nombre: e.target.value }))} />
                        </div>
                        <div>
                            <label className="input-label">Email *</label>
                            <input type="email" className="input-control" value={perfilForm.email}
                                onChange={e => setPerfilForm(f => ({ ...f, email: e.target.value }))} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', paddingTop: 'var(--space-5)', borderTop: '1px solid var(--border)', marginTop: 'var(--space-5)' }}>
                        <Button variant="primary" onClick={handleSavePerfil} disabled={savingPerfil}>
                            <Save size={16} /> {savingPerfil ? 'Guardando...' : 'Guardar cambios'}
                        </Button>
                    </div>
                </div>
            )}

            {tab === 'password' && (
                <div className="card" style={{ padding: 'var(--space-6)' }}>
                    <h3 style={{ marginBottom: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <Lock size={18} /> Cambiar contraseña
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
                        <div>
                            <label className="input-label">Nueva contraseña *</label>
                            <input type="password" className="input-control" value={passForm.password}
                                onChange={e => setPassForm(f => ({ ...f, password: e.target.value }))}
                                placeholder="Mínimo 6 caracteres" />
                        </div>
                        <div>
                            <label className="input-label">Confirmar contraseña *</label>
                            <input type="password" className="input-control" value={passForm.confirm}
                                onChange={e => setPassForm(f => ({ ...f, confirm: e.target.value }))} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', paddingTop: 'var(--space-5)', borderTop: '1px solid var(--border)', marginTop: 'var(--space-5)' }}>
                        <Button variant="primary" onClick={handleSavePassword} disabled={savingPass}>
                            <Lock size={16} /> {savingPass ? 'Guardando...' : 'Cambiar contraseña'}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConfiguracionPage;
