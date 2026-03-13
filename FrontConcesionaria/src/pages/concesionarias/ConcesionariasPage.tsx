import { useState } from 'react';
import { concesionariasApi } from '../../api/concesionarias.api';
import { useConcesionarias, concesionariasKeys } from '../../hooks/useConcesionarias';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Concesionaria, CreateConcesionariaDto } from '../../types/concesionaria.types';
import Button from '../../components/ui/Button';
import { Plus, Search, Building2, MapPin, Mail, Edit, Trash2, Calendar, Phone, Hash, X } from 'lucide-react';
import ConcesionariaForm from '../../components/forms/ConcesionariaForm';
import { useUIStore } from '../../store/uiStore';

const ConcesionariasPage = () => {
    const { addToast } = useUIStore();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const { data, isLoading: loading, error } = useConcesionarias({ nombre: searchTerm });
    const concesionarias = data?.results || [];
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingConcesionaria, setEditingConcesionaria] = useState<Concesionaria | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingConcesionaria, setDeletingConcesionaria] = useState<Concesionaria | null>(null);

    const deleteMutation = useMutation({
        mutationFn: (id: number) => concesionariasApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: concesionariasKeys.lists() });
            addToast('Concesionaria eliminada correctamente (soft delete)', 'success');
        },
        onError: (error: any) => {
            addToast(error?.message || 'Error al eliminar la concesionaria', 'error');
        }
    });

    const handleOpenModal = (concesionaria?: Concesionaria) => {
        setEditingConcesionaria(concesionaria || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingConcesionaria(null);
    };

    const handleSubmit = async (data: CreateConcesionariaDto) => {
        setSubmitting(true);
        try {
            if (editingConcesionaria) {
                await concesionariasApi.update(editingConcesionaria.id, data);
                addToast('Concesionaria actualizada correctamente', 'success');
            } else {
                await concesionariasApi.create(data);
                addToast('Concesionaria creada correctamente', 'success');
            }
            handleCloseModal();
            queryClient.invalidateQueries({ queryKey: concesionariasKeys.lists() });
        } catch (error: any) {
            addToast(error?.error?.message || 'Error al guardar los datos', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = (concesionaria: Concesionaria) => {
        setDeletingConcesionaria(concesionaria);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        if (deletingConcesionaria) {
            deleteMutation.mutate(deletingConcesionaria.id);
            setShowDeleteModal(false);
            setDeletingConcesionaria(null);
        }
    };

    const cancelDelete = () => {
        setShowDeleteModal(false);
        setDeletingConcesionaria(null);
    };

    return (
        <div className="page-container">
            <header className="page-header">
                <div className="header-info">
                    <h1>Concesionarias</h1>
                    <p>Administración global de los tenants de la plataforma.</p>
                </div>
                <Button variant="primary" onClick={() => handleOpenModal()}>
                    <Plus size={20} style={{ marginRight: '0.5rem' }} />
                    Nueva Concesionaria
                </Button>
            </header>

            <div className="filters-bar glass">
                <div className="search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o CUIT..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="table-container glass">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>CUIT</th>
                            <th>Contacto</th>
                            <th>Email</th>
                            <th>Fecha Registro</th>
                            <th style={{ textAlign: 'right' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && !concesionarias ? (
                            [1, 2, 3].map(i => <tr key={i}><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Cargando datos...</td></tr>)
                        ) : error ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}>
                                <div style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{(error as any).message}</div>
                                <Button variant="secondary" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: concesionariasKeys.lists() })}>Reintentar</Button>
                            </td></tr>
                        ) : (concesionarias?.length || 0) === 0 ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                                <Building2 size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                <p>No se encontraron concesionarias.</p>
                                {!searchTerm && <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Es posible que debas ejecutar el seed de la base de datos.</p>}
                            </td></tr>
                        ) : (
                            concesionarias?.map((c) => (
                                <tr key={c.id}>
                                    <td>
                                        <div className="user-cell">
                                            <div className="user-avatar">
                                                <Building2 size={16} />
                                            </div>
                                            <div>
                                                <div className="brand">{c.nombre}</div>
                                                <div className="location-info">
                                                    <MapPin size={12} />
                                                    <span>{c.direccion || 'Sin dirección'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="contact-link">
                                            <Hash size={14} />
                                            <span>{c.cuit || '-'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="contact-link">
                                            <Phone size={14} />
                                            <span>{c.telefono || '-'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="contact-link">
                                            <Mail size={14} />
                                            <span>{c.email || '-'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="contact-link">
                                            <Calendar size={14} />
                                            <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div className="action-buttons">
                                            <button className="icon-btn" onClick={() => handleOpenModal(c)}>
                                                <Edit size={18} />
                                            </button>
                                            <button className="icon-btn danger" onClick={() => handleDelete(c)}>
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal Simple */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className="modal-content glass animate-fade-in" onClick={e => e.stopPropagation()}>
                        <header className="modal-header">
                            <div>
                                <h2>{editingConcesionaria ? 'Editar Concesionaria' : 'Nueva Concesionaria'}</h2>
                                <p className="modal-subtitle">Completa los datos para {editingConcesionaria ? 'actualizar' : 'registrar'} la concesionaria.</p>
                            </div>
                            <button className="close-btn" onClick={handleCloseModal}>
                                <X size={24} />
                            </button>
                        </header>
                        <div className="modal-body">
                            <ConcesionariaForm
                                initialData={editingConcesionaria}
                                onSubmit={handleSubmit}
                                onCancel={handleCloseModal}
                                loading={submitting}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && deletingConcesionaria && (
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
                                    ¿Estás seguro de que deseas eliminar la concesionaria{' '}
                                    <strong>{deletingConcesionaria.nombre}</strong>?
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
                                    Eliminar Concesionaria
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .page-container { display: flex; flex-direction: column; gap: 2rem; animation: fadeIn 0.5s ease-out; }
                .page-header { display: flex; justify-content: space-between; align-items: center; }
                .header-info h1 { font-size: 2.25rem; font-weight: 800; letter-spacing: -0.025em; color: var(--text-primary); }
                .header-info p { color: var(--text-secondary); margin-top: 0.25rem; font-size: 1rem; }
                .filters-bar { padding: 1.25rem; border-radius: 1.25rem; display: flex; gap: 1rem; border: 1px solid var(--border); }
                .search-box { flex: 1; display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1.25rem; background: var(--bg-card); border: 1px solid var(--border); border-radius: 1rem; box-shadow: var(--shadow-sm); transition: all 0.2s; }
                .search-box:focus-within { border-color: var(--accent); box-shadow: 0 0 0 4px var(--accent-light); }
                .search-box input { width: 100%; background: transparent; border: none; outline: none; color: var(--text-primary); font-size: 0.9375rem; }
                .search-box svg { color: var(--text-muted); }

                .table-container { border-radius: 1.25rem; overflow: hidden; border: 1px solid var(--border); background: var(--bg-card); box-shadow: var(--shadow-md); }
                .data-table { width: 100%; border-collapse: collapse; text-align: left; }
                .data-table th { padding: 1.25rem 1.5rem; background: var(--bg-secondary); color: var(--text-secondary); font-weight: 700; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--border); }
                .data-table td { padding: 1.5rem; border-bottom: 1px solid var(--border); transition: background 0.2s; }
                .data-table tbody tr:hover td { background: var(--bg-primary); }
                .data-table tbody tr:last-child td { border-bottom: none; }

                .user-cell { display: flex; align-items: center; gap: 1.25rem; }
                .user-avatar { width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, var(--accent), #818cf8); color: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.2); }
                .brand { font-weight: 700; font-size: 1rem; color: var(--text-primary); }
                .location-info { display: flex; align-items: center; gap: 0.375rem; color: var(--text-muted); font-size: 0.8125rem; margin-top: 0.25rem; }
                .contact-link { display: flex; align-items: center; gap: 0.5rem; color: var(--text-secondary); font-size: 0.875rem; }
                .action-buttons { display: flex; justify-content: flex-end; gap: 0.51rem; }
                .icon-btn { padding: 0.625rem; border-radius: 0.75rem; color: var(--text-secondary); background: var(--bg-primary); border: 1px solid var(--border); }
                .icon-btn:hover { background: var(--accent-light); color: var(--accent); border-color: transparent; transform: translateY(-1px); }
                .icon-btn.danger:hover { background: #fee2e2; color: #ef4444; border-color: transparent; }

                /* Improved Modal Styles */
                .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1.5rem; }
                .modal-content { width: 100%; max-width: 650px; max-height: 95vh; overflow-y: auto; border-radius: 1.5rem; background: var(--bg-card); padding: 2.5rem; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); position: relative; border: 1px solid var(--border); }
                .animate-fade-in { animation: modalFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
                
                @keyframes modalFadeIn {
                    from { opacity: 0; transform: scale(0.95) translateY(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }

                .modal-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2.5rem; }
                .modal-header h2 { font-size: 1.75rem; font-weight: 800; color: var(--text-primary); letter-spacing: -0.025em; }
                .modal-subtitle { color: var(--text-secondary); font-size: 0.9375rem; margin-top: 0.25rem; }
                .close-btn { color: var(--text-muted); padding: 0.75rem; border-radius: 1rem; background: var(--bg-secondary); display: flex; transition: all 0.2s; }
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

export default ConcesionariasPage;
