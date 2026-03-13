import { useState } from 'react';
import { sucursalesApi } from '../../api/sucursales.api';
import { useSucursales, sucursalesKeys } from '../../hooks/useSucursales';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Sucursal, CreateSucursalDto } from '../../types/sucursal.types';
import Button from '../../components/ui/Button';
import { Plus, Search, Store, MapPin, Phone, Edit, Trash2, X, CheckCircle, XCircle } from 'lucide-react';
import SucursalForm from '../../components/forms/SucursalForm';
import { useUIStore } from '../../store/uiStore';

const SucursalesPage = () => {
    const { addToast } = useUIStore();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const { data: sucursales = [], isLoading: loading, error } = useSucursales({ nombre: searchTerm });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSucursal, setEditingSucursal] = useState<Sucursal | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingSucursal, setDeletingSucursal] = useState<Sucursal | null>(null);

    const deleteMutation = useMutation({
        mutationFn: (id: number) => sucursalesApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: sucursalesKeys.lists() });
            addToast('Sucursal eliminada correctamente', 'success');
        },
        onError: (error: any) => {
            addToast(error?.message || 'Error al eliminar la sucursal', 'error');
        }
    });


    const handleOpenModal = (sucursal?: Sucursal) => {
        setEditingSucursal(sucursal || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingSucursal(null);
    };

    const handleSubmit = async (data: CreateSucursalDto) => {
        setSubmitting(true);
        try {
            if (editingSucursal) {
                await sucursalesApi.update(editingSucursal.id, data);
                addToast('Sucursal actualizada correctamente', 'success');
            } else {
                await sucursalesApi.create(data);
                addToast('Sucursal creada correctamente', 'success');
            }
            handleCloseModal();
            queryClient.invalidateQueries({ queryKey: sucursalesKeys.lists() });
        } catch (error: any) {
            addToast(error?.error?.message || 'Error al guardar los datos', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = (sucursal: Sucursal) => {
        setDeletingSucursal(sucursal);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        if (deletingSucursal) {
            deleteMutation.mutate(deletingSucursal.id);
            setShowDeleteModal(false);
            setDeletingSucursal(null);
        }
    };

    const cancelDelete = () => {
        setShowDeleteModal(false);
        setDeletingSucursal(null);
    };

    return (
        <div className="page-container">
            <header className="page-header">
                <div className="header-info">
                    <h1>Sucursales</h1>
                    <p>Administración de puntos de venta y centros operativos.</p>
                </div>
                <Button variant="primary" onClick={() => handleOpenModal()}>
                    <Plus size={20} style={{ marginRight: '0.5rem' }} />
                    Nueva Sucursal
                </Button>
            </header>

            <div className="filters-bar glass">
                <div className="search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Buscar sucursal por nombre..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="table-container glass">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Sucursal</th>
                            <th>Concesionaria</th>
                            <th>Dirección</th>
                            <th>Contacto</th>
                            <th>Estado</th>
                            <th style={{ textAlign: 'right' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && !sucursales ? (
                            [1, 2, 3].map(i => <tr key={i}><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Cargando datos...</td></tr>)
                        ) : error ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}>
                                <div style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{(error as any).message}</div>
                                <Button variant="secondary" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: sucursalesKeys.lists() })}>Reintentar</Button>
                            </td></tr>
                        ) : (sucursales?.length || 0) === 0 ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                                <Store size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                <p>No se encontraron sucursales.</p>
                            </td></tr>
                        ) : (
                            sucursales?.map((s) => (
                                <tr key={s.id}>
                                    <td>
                                        <div className="user-cell">
                                            <div className="user-avatar">
                                                <Store size={18} />
                                            </div>
                                            <div>
                                                <div className="brand">{s.nombre}</div>
                                                {s.ciudad && (
                                                    <div className="location-info">
                                                        <span>{s.ciudad}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{ fontWeight: 500 }}>{s.concesionaria?.nombre || '-'}</span>
                                    </td>
                                    <td>
                                        <div className="contact-link">
                                            <MapPin size={14} />
                                            <span>{s.direccion || '-'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="contact-link">
                                            <Phone size={14} />
                                            <span>{s.telefono || '-'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className={`status-badge ${s.activo ? 'active' : 'inactive'}`}>
                                            {s.activo ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                            <span>{s.activo ? 'Activa' : 'Inactiva'}</span>
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div className="action-buttons">
                                            <button className="icon-btn" onClick={() => handleOpenModal(s)}>
                                                <Edit size={18} />
                                            </button>
                                            <button className="icon-btn danger" onClick={() => handleDelete(s)}>
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

            {/* Modal Editar/Crear */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className="modal-content glass animate-fade-in" onClick={e => e.stopPropagation()}>
                        <header className="modal-header">
                            <div>
                                <h2>{editingSucursal ? 'Editar Sucursal' : 'Nueva Sucursal'}</h2>
                                <p className="modal-subtitle">Configure los datos de la sucursal operativa.</p>
                            </div>
                            <button className="close-btn" onClick={handleCloseModal}>
                                <X size={24} />
                            </button>
                        </header>
                        <div className="modal-body">
                            <SucursalForm
                                initialData={editingSucursal}
                                onSubmit={handleSubmit}
                                onCancel={handleCloseModal}
                                loading={submitting}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Confirmar Eliminación */}
            {showDeleteModal && deletingSucursal && (
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
                                    ¿Estás seguro de que deseas eliminar la sucursal{' '}
                                    <strong>{deletingSucursal.nombre}</strong>?
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
                                    Eliminar Sucursal
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
                .search-box { flex: 1; display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1.25rem; background: var(--bg-card); border: 1px solid var(--border); border-radius: 1rem; box-shadow: var(--shadow-sm); }
                .search-box input { width: 100%; background: transparent; border: none; outline: none; color: var(--text-primary); }
                
                .table-container { border-radius: 1.25rem; overflow: hidden; border: 1px solid var(--border); background: var(--bg-card); box-shadow: var(--shadow-md); }
                .data-table { width: 100%; border-collapse: collapse; text-align: left; }
                .data-table th { padding: 1.25rem 1.5rem; background: var(--bg-secondary); color: var(--text-secondary); font-weight: 700; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--border); }
                .data-table td { padding: 1.5rem; border-bottom: 1px solid var(--border); }

                .user-cell { display: flex; align-items: center; gap: 1.25rem; }
                .user-avatar { width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, var(--accent), #818cf8); color: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.2); }
                .brand { font-weight: 700; font-size: 1rem; color: var(--text-primary); }
                .location-info { font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem; }
                .contact-link { display: flex; align-items: center; gap: 0.5rem; color: var(--text-secondary); font-size: 0.8125rem; }
                
                .status-badge { display: flex; align-items: center; gap: 0.5rem; padding: 0.375rem 0.75rem; border-radius: 2rem; font-size: 0.75rem; font-weight: 700; width: fit-content; text-transform: uppercase; letter-spacing: 0.025em; }
                .status-badge.active { background: #dcfce7; color: #15803d; }
                .status-badge.inactive { background: #fee2e2; color: #b91c1c; }

                .action-buttons { display: flex; justify-content: flex-end; gap: 0.5rem; }
                .icon-btn { padding: 0.625rem; border-radius: 0.75rem; color: var(--text-secondary); background: var(--bg-primary); border: 1px solid var(--border); }
                .icon-btn:hover { background: var(--bg-secondary); color: var(--accent); transform: translateY(-1px); }
                .icon-btn.danger:hover { background: #fee2e2; color: #ef4444; }

                /* Modal Styles */
                .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1.5rem; }
                .modal-content { width: 100%; max-width: 650px; max-height: 95vh; overflow-y: auto; border-radius: 1.5rem; background: var(--bg-card); padding: 2.5rem; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); position: relative; border: 1px solid var(--border); }
                .modal-confirmation { max-width: 500px; }
                .modal-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
                .modal-header h2 { font-size: 1.5rem; font-weight: 700; color: var(--text-primary); }
                .modal-subtitle { color: var(--text-secondary); margin-top: 0.25rem; font-size: 0.875rem; }
                .close-btn { padding: 0.5rem; border-radius: 0.5rem; color: var(--text-secondary); background: transparent; border: none; transition: all 0.2s; }
                .close-btn:hover { background: var(--bg-secondary); color: var(--text-primary); }
                .modal-body { color: var(--text-primary); }
                .delete-warning { text-align: center; padding: 2rem 1rem; }
                .delete-warning svg { color: #ef4444; margin: 0 auto 1.5rem; opacity: 0.8; }
                .delete-warning p { font-size: 1rem; color: var(--text-secondary); line-height: 1.6; }
                .delete-warning strong { color: var(--text-primary); font-weight: 600; }
                .animate-fade-in { animation: modalFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
                @keyframes modalFadeIn {
                    from { opacity: 0; transform: scale(0.95) translateY(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default SucursalesPage;
