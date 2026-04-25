import React, { useState, useMemo } from 'react';
import {
    Users,
    Search,
    Edit,
    Trash2,
    UserPlus,
    Key,
    Lock,
    Building2,
    Mail,
    X
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usuariosApi } from '../../api/usuarios.api';
import type { Usuario } from '../../types/usuario.types';
import { useUIStore } from '../../store/uiStore';
import UsuarioForm from '../../components/forms/UsuarioForm';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const UsuariosPage: React.FC = () => {
    const { addToast } = useUIStore();
    const queryClient = useQueryClient();

    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
    const [resetPasswordUserId, setResetPasswordUserId] = useState<number | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingUsuario, setDeletingUsuario] = useState<Usuario | null>(null);

    // Queries
    const { data: response, isLoading: loading, isError: error } = useQuery({
        queryKey: ['usuarios', searchTerm],
        queryFn: async () => {
            const filters = searchTerm ? { nombre: searchTerm } : {};
            const res = await usuariosApi.getAll(filters) as { results?: Usuario[]; total?: number; page?: number; limit?: number };
            return res || { results: [], total: 0, page: 1, limit: 10 };
        }
    });

    const usuarios = useMemo(() => response?.results || [], [response]);

    // Mutations
    const deleteMutation = useMutation({
        mutationFn: (id: number) => usuariosApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['usuarios'] });
            addToast('Usuario eliminado correctamente', 'success');
        },
        onError: (error: any) => {
            addToast(error?.message || 'Error al eliminar el usuario', 'error');
        }
    });

    const handleOpenModal = (usuario?: Usuario) => {
        setEditingUsuario(usuario || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingUsuario(null);
    };

    const handleSubmit = async (data: any) => {
        setSubmitting(true);
        try {
            if (editingUsuario) {
                await usuariosApi.update(editingUsuario.id, data);
                addToast('Usuario actualizado correctamente', 'success');
            } else {
                await usuariosApi.create(data);
                addToast('Usuario creado correctamente', 'success');
            }
            handleCloseModal();
            queryClient.invalidateQueries({ queryKey: ['usuarios'] });
        } catch (error: any) {
            addToast(error?.error?.message || 'Error al guardar los datos', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = (usuario: Usuario) => {
        setDeletingUsuario(usuario);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        if (deletingUsuario) {
            deleteMutation.mutate(deletingUsuario.id);
            setShowDeleteModal(false);
            setDeletingUsuario(null);
        }
    };

    const cancelDelete = () => {
        setShowDeleteModal(false);
        setDeletingUsuario(null);
    };

    const openResetPasswordModal = (usuarioId: number) => {
        setResetPasswordUserId(usuarioId);
        setNewPassword('');
        setShowResetPasswordModal(true);
    };

    const closeResetPasswordModal = () => {
        setShowResetPasswordModal(false);
        setResetPasswordUserId(null);
        setNewPassword('');
    };

    const handleResetPassword = async () => {
        if (!resetPasswordUserId || !newPassword.trim()) {
            addToast('Debe ingresar una nueva contraseña', 'error');
            return;
        }

        try {
            await usuariosApi.resetPassword(resetPasswordUserId, newPassword);
            addToast('Contraseña actualizada correctamente', 'success');
            closeResetPasswordModal();
        } catch (error: any) {
            addToast(error?.message || 'Error al actualizar la contraseña', 'error');
        }
    };

    if (error) {
        return (
            <div className="page-container">
                <div style={{
                    padding: '2rem',
                    textAlign: 'center',
                    color: 'var(--text-secondary)'
                }}>
                    Error al cargar los usuarios
                </div>
            </div>
        );
    }


    return (
        <div className="page-container">
            {/* Header */}
            <div className="page-header">
                <div className="page-title">
                    <Users size={32} />
                    <div>
                        <h1>Usuarios</h1>
                        <p>Gestión de usuarios del sistema</p>
                    </div>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => handleOpenModal()}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1.5rem',
                        background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%)',
                        border: 'none',
                        borderRadius: '12px',
                        color: 'white',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                    }}
                >
                    <UserPlus size={20} />
                    Nuevo Usuario
                </button>
            </div>

            {/* Filters */}
            <div className="filters-bar glass">
                <div style={{ flex: 1, maxWidth: '400px', position: 'relative' }}>
                    <Search
                        size={20}
                        style={{
                            position: 'absolute',
                            left: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--text-secondary)',
                            pointerEvents: 'none'
                        }}
                    />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.75rem 1rem 0.75rem 2.75rem',
                            background: 'var(--bg-elevated)',
                            border: '1px solid var(--border)',
                            borderRadius: '10px',
                            color: 'var(--text-primary)',
                            fontSize: '0.95rem',
                            outline: 'none',
                            transition: 'all 0.3s ease',
                        }}
                        onFocus={(e) => {
                            e.currentTarget.style.borderColor = 'var(--accent)';
                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(var(--accent-rgb), 0.1)';
                        }}
                        onBlur={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    />
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    Cargando usuarios...
                </div>
            ) : usuarios.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    No se encontraron usuarios
                </div>
            ) : (
                <div className="table-container glass">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Usuario</th>
                                <th>Email</th>
                                <th>Sucursal</th>
                                <th>Roles</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usuarios.map((usuario: Usuario) => (
                                <tr key={usuario.id}>
                                    {/* Usuario */}
                                    <td>
                                        <div className="user-cell">
                                            <div className="user-avatar">
                                                {usuario.nombre.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="user-info">
                                                <div className="user-name">{usuario.nombre}</div>
                                                {usuario.concesionaria && (
                                                    <div className="user-location">
                                                        <Building2 size={14} />
                                                        {usuario.concesionaria.nombre}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    {/* Email */}
                                    <td>
                                        <a href={`mailto:${usuario.email}`} className="contact-link">
                                            <Mail size={16} />
                                            {usuario.email}
                                        </a>
                                    </td>

                                    {/* Sucursal */}
                                    <td>
                                        {usuario.sucursal?.nombre || '-'}
                                    </td>

                                    {/* Roles */}
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            {usuario.roles && usuario.roles.length > 0 ? (
                                                usuario.roles.map((rol) => (
                                                    <span
                                                        key={rol.rol.id}
                                                        style={{
                                                            padding: '0.25rem 0.75rem',
                                                            background: 'var(--accent-light)',
                                                            color: 'var(--accent)',
                                                            borderRadius: '6px',
                                                            fontSize: '0.85rem',
                                                            fontWeight: '500',
                                                        }}
                                                    >
                                                        {rol.rol.nombre}
                                                    </span>
                                                ))
                                            ) : (
                                                <span style={{ color: 'var(--text-secondary)' }}>Sin roles</span>
                                            )}
                                        </div>
                                    </td>

                                    {/* Estado */}
                                    <td>
                                        <span
                                            style={{
                                                padding: '0.35rem 0.85rem',
                                                borderRadius: '8px',
                                                fontSize: '0.85rem',
                                                fontWeight: '600',
                                                background: usuario.activo 
                                                    ? 'rgba(34, 197, 94, 0.1)' 
                                                    : 'rgba(239, 68, 68, 0.1)',
                                                color: usuario.activo 
                                                    ? 'rgb(34, 197, 94)' 
                                                    : 'rgb(239, 68, 68)',
                                            }}
                                        >
                                            {usuario.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>

                                    {/* Actions */}
                                    <td>
                                        <div className="action-buttons">
                                            <button
                                                onClick={() => openResetPasswordModal(usuario.id)}
                                                className="action-btn"
                                                title="Cambiar contraseña"
                                            >
                                                <Key size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleOpenModal(usuario)}
                                                className="action-btn"
                                                title="Editar"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(usuario)}
                                                className="action-btn delete"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Edit/Create Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className="modal-content glass animate-fade-in" onClick={(e) => e.stopPropagation()}>
                        <header className="modal-header">
                            <div>
                                <h2>{editingUsuario ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
                                <p className="modal-subtitle">Completa los datos para {editingUsuario ? 'actualizar' : 'registrar'} el usuario.</p>
                            </div>
                            <button className="close-btn" onClick={handleCloseModal}>
                                <X size={24} />
                            </button>
                        </header>
                        <div className="modal-body">
                            <UsuarioForm
                                usuario={editingUsuario || undefined}
                                onSave={handleSubmit}
                                onCancel={handleCloseModal}
                                loading={submitting}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Reset Password Modal */}
            {showResetPasswordModal && (
                <div className="modal-overlay" onClick={closeResetPasswordModal}>
                    <div className="modal-content glass animate-fade-in" onClick={(e) => e.stopPropagation()}>
                        <header className="modal-header">
                            <div>
                                <h2>Cambiar Contraseña</h2>
                                <p className="modal-subtitle">Ingresa la nueva contraseña para el usuario.</p>
                            </div>
                            <button className="close-btn" onClick={closeResetPasswordModal}>
                                <X size={24} />
                            </button>
                        </header>
                        <div className="modal-body">
                            <Input
                                label="Nueva Contraseña"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Ingrese la nueva contraseña"
                                icon={<Lock size={18} />}
                            />
                            <div style={{
                                marginTop: '1.5rem',
                                display: 'flex',
                                gap: '1rem',
                                justifyContent: 'flex-end'
                            }}>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={closeResetPasswordModal}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="button"
                                    variant="primary"
                                    onClick={handleResetPassword}
                                >
                                    Actualizar Contraseña
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && deletingUsuario && (
                <div className="modal-overlay" onClick={cancelDelete}>
                    <div className="modal-content modal-confirmation glass animate-fade-in" onClick={(e) => e.stopPropagation()}>
                        <header className="modal-header">
                            <div>
                                <h2>Confirmar Eliminación</h2>
                                <p className="modal-subtitle">Esta acción no se puede deshacer.</p>
                            </div>
                            <button className="close-btn" onClick={cancelDelete}>
                                <X size={24} />
                            </button>
                        </header>
                        <div className="modal-body">
                            <div className="delete-warning">
                                <Trash2 size={48} />
                                <p>
                                    ¿Estás seguro de que deseas eliminar al usuario{' '}
                                    <strong>{deletingUsuario.nombre}</strong>?
                                </p>
                            </div>
                            <div style={{
                                marginTop: '2rem',
                                display: 'flex',
                                gap: '1rem',
                                justifyContent: 'flex-end'
                            }}>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={cancelDelete}
                                    style={{ paddingLeft: '2rem', paddingRight: '2rem' }}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="button"
                                    variant="primary"
                                    onClick={confirmDelete}
                                    style={{ 
                                        paddingLeft: '2.5rem', 
                                        paddingRight: '2.5rem',
                                        background: 'rgb(239, 68, 68)',
                                        borderColor: 'rgb(239, 68, 68)'
                                    }}
                                >
                                    Eliminar Usuario
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .page-container {
                    padding: 2rem;
                    max-width: 1400px;
                    margin: 0 auto;
                }

                .page-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                }

                .page-title {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    color: var(--text-primary);
                }

                .page-title h1 {
                    font-size: 2rem;
                    font-weight: 700;
                    margin: 0;
                }

                .page-title p {
                    margin: 0;
                    color: var(--text-secondary);
                    font-size: 0.95rem;
                }

                .filters-bar {
                    padding: 1.5rem;
                    border-radius: 16px;
                    margin-bottom: 1.5rem;
                    display: flex;
                    gap: 1rem;
                    align-items: center;
                }

                .glass {
                    background: var(--bg-card);
                    backdrop-filter: blur(10px);
                    border: 1px solid var(--border);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                }

                .table-container {
                    border-radius: 16px;
                    overflow: hidden;
                }

                .data-table {
                    width: 100%;
                    border-collapse: collapse;
                }

                .data-table thead {
                    background: var(--bg-elevated);
                    border-bottom: 2px solid var(--border);
                }

                .data-table th {
                    padding: 1rem 1.5rem;
                    text-align: left;
                    font-weight: 600;
                    color: var(--text-secondary);
                    font-size: 0.85rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .data-table tbody tr {
                    border-bottom: 1px solid var(--border);
                    transition: all 0.2s ease;
                }

                .data-table tbody tr:hover {
                    background: var(--bg-elevated);
                }

                .data-table td {
                    padding: 1.25rem 1.5rem;
                    color: var(--text-primary);
                }

                .user-cell {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .user-avatar {
                    width: 40px;
                    height: 40px;
                    border-radius: 10px;
                    background: linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: 600;
                    font-size: 1.1rem;
                }

                .user-info {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }

                .user-name {
                    font-weight: 600;
                    color: var(--text-primary);
                }

                .user-location {
                    display: flex;
                    align-items: center;
                    gap: 0.35rem;
                    color: var(--text-secondary);
                    font-size: 0.85rem;
                }

                .contact-link {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: var(--accent);
                    text-decoration: none;
                    transition: all 0.2s ease;
                    padding: 0.25rem 0;
                }

                .contact-link:hover {
                    color: var(--accent-dark);
                    text-decoration: underline;
                }

                .action-buttons {
                    display: flex;
                    gap: 0.5rem;
                }

                .action-btn {
                    padding: 0.5rem;
                    background: var(--bg-elevated);
                    border: 1px solid var(--border);
                    border-radius: 8px;
                    color: var(--text-secondary);
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .action-btn:hover {
                    background: var(--accent-light);
                    border-color: var(--accent);
                    color: var(--accent);
                    transform: translateY(-2px);
                }

                .action-btn.delete:hover {
                    background: rgba(239, 68, 68, 0.1);
                    border-color: rgb(239, 68, 68);
                    color: rgb(239, 68, 68);
                }

                /* Improved Modal Styles */
                .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1.5rem; }
                .modal-content { width: 100%; max-width: 650px; max-height: 95vh; overflow-y: auto; border-radius: 1.5rem; background: var(--bg-card); padding: 2.5rem; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); position: relative; border: 1px solid var(--border); }
                .animate-fade-in { animation: modalFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
                
                @keyframes modalFadeIn {
                    from { opacity: 0; transform: scale(0.95) translateY(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }

                .modal-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2.5rem; }
                .modal-header h2 { font-size: 1.75rem; font-weight: 800; color: var(--text-primary); letter-spacing: -0.025em; margin: 0; }
                .modal-subtitle { color: var(--text-secondary); font-size: 0.9375rem; margin-top: 0.25rem; }
                .close-btn { color: var(--text-muted); padding: 0.75rem; border-radius: 1rem; background: var(--bg-secondary); display: flex; transition: all 0.2s; border: none; cursor: pointer; }
                .close-btn:hover { background: #e2e8f0; color: var(--text-primary); transform: rotate(90deg); }
                
                .modal-confirmation { max-width: 500px; }
                .delete-warning {
                    text-align: center;
                    padding: 2rem 1rem;
                    background: var(--bg-secondary);
                    border-radius: 1rem;
                    border: 1px solid var(--border);
                }
                .delete-warning svg {
                    color: rgb(239, 68, 68);
                    margin-bottom: 1rem;
                }
                .delete-warning p {
                    color: var(--text-primary);
                    font-size: 1.05rem;
                    line-height: 1.6;
                    margin: 0;
                }
                .delete-warning strong {
                    color: var(--accent);
                    font-weight: 700;
                }
            `}</style>
        </div>
    );
};

export default UsuariosPage;
