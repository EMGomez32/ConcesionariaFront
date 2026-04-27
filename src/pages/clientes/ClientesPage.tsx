import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientesApi } from '../../api/clientes.api';
import type { Cliente, ClienteFilter } from '../../types/cliente.types';
import Button from '../../components/ui/Button';
import ClienteForm from '../../components/forms/ClienteForm';
import { useUIStore } from '../../store/uiStore';
import {
    Plus,
    Search,
    Phone,
    Mail,
    Edit,
    Trash2,
    Users,
    RefreshCw,
    MapPin,
    ChevronRight,
    FileText,
    Building2
} from 'lucide-react';
import Modal from '../../components/ui/Modal';
import DataTable, { type Column } from '../../components/ui/DataTable';
import PageTitle from '../../components/ui/PageTitle';
import { useConfirm } from '../../hooks/useConfirm';
import type { PaginatedResponse, ApiError } from '../../types/api.types';

const ClientesPage: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { addToast } = useUIStore();
    const confirm = useConfirm();

    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);

    // Queries
    const { data: response, isLoading, refetch } = useQuery<PaginatedResponse<Cliente>, ApiError>({
        queryKey: ['clientes', page, searchTerm],
        queryFn: async () => {
            const filters: ClienteFilter = {};
            if (searchTerm.trim()) filters.nombre = searchTerm;
            const res = await clientesApi.getAll(filters, { page, limit: 12 });
            // El interceptor devuelve response.data directamente
            // La estructura es: { results: [...], page, limit, totalPages, totalResults }
            return res;
        }
    });

    const clientes = response?.results || [];
    const totalPages = response?.totalPages || 1;

    // Mutations
    const createMutation = useMutation<Cliente, ApiError, Partial<Cliente>>({
        mutationFn: async (data: Partial<Cliente>) => {
            const res = await clientesApi.create(data);
            return res;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clientes'] });
            addToast('Cliente registrado correctamente', 'success');
            handleCloseModal();
        },
        onError: (err: ApiError) => {
            addToast(err?.message || 'Error al registrar cliente', 'error');
        }
    });

    const updateMutation = useMutation<Cliente, ApiError, { id: number, data: Partial<Cliente> }>({
        mutationFn: async ({ id, data }: { id: number, data: Partial<Cliente> }) => {
            const res = await clientesApi.update(id, data);
            return res;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clientes'] });
            addToast('Datos actualizados correctamente', 'success');
            handleCloseModal();
        },
        onError: (err: ApiError) => {
            addToast(err?.message || 'Error al actualizar cliente', 'error');
        }
    });

    const deleteMutation = useMutation<void, ApiError, number>({
        mutationFn: async (id: number) => {
            await clientesApi.delete(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clientes'] });
            addToast('Cliente eliminado correctamente', 'success');
        },
        onError: (err: ApiError) => {
            addToast(err?.message || 'Error al eliminar cliente', 'error');
        }
    });

    const handleOpenModal = (cliente?: Cliente) => {
        setEditingCliente(cliente || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCliente(null);
    };

    const handleSubmit = async (data: Partial<Cliente>) => {
        if (editingCliente) {
            updateMutation.mutate({ id: editingCliente.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const handleEditFromVerification = (cliente: Cliente) => {
        setEditingCliente(cliente);
        // El modal permanece abierto y ahora muestra el formulario de edición
    };

    const handleDelete = (cliente: Cliente) => {
        confirm({
            title: 'Eliminar Cliente',
            message: `¿Estás seguro de que deseas eliminar a "${cliente.nombre}"? Esta acción no se puede deshacer si existen registros vinculados.`,
            type: 'danger',
            confirmLabel: 'Eliminar Permanente',
            onConfirm: async () => {
                await deleteMutation.mutateAsync(cliente.id);
            }
        });
    };

    const columns: Column<Cliente>[] = [
        {
            header: 'Cliente',
            accessor: (c) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <div
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: 'var(--radius-md)',
                            background: 'rgba(var(--accent-rgb), 0.15)',
                            color: 'var(--accent)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.85rem',
                            border: '1px solid rgba(var(--accent-rgb), 0.25)'
                        }}
                    >
                        {c.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{c.nombre}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '0.15rem' }}>
                            <FileText size={10} />
                            <span>CUIT/CUIL: {c.dni || 'No registrado'}</span>
                        </div>
                    </div>
                </div>
            )
        },
        {
            header: 'Concesionaria',
            accessor: (c) => (
                c.concesionaria ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                        <Building2 size={12} />
                        <span style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.concesionaria.nombre}</span>
                    </div>
                ) : (
                    <span style={{ color: 'var(--text-muted)' }}>-</span>
                )
            )
        },
        {
            header: 'Contacto',
            accessor: (c) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                        <Mail size={12} />
                        <span style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email || 'Sin email'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                        <Phone size={12} />
                        <span>{c.telefono || 'Sin teléfono'}</span>
                    </div>
                </div>
            )
        },
        {
            header: 'Localización',
            accessor: (c) => (
                c.direccion ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        <MapPin size={10} />
                        <span style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.direccion}</span>
                    </div>
                ) : <span style={{ color: 'var(--text-muted)' }}>-</span>
            )
        },
        {
            header: 'Acciones',
            align: 'right',
            accessor: (c) => (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.25rem' }}>
                    <button className="icon-btn small" onClick={(e) => { e.stopPropagation(); handleOpenModal(c); }}>
                        <Edit size={14} />
                    </button>
                    <button className="icon-btn small danger" onClick={(e) => { e.stopPropagation(); handleDelete(c); }}>
                        <Trash2 size={14} />
                    </button>
                    <button className="icon-btn small" onClick={(e) => { e.stopPropagation(); navigate(`/clientes/${c.id}`); }}>
                        <ChevronRight size={14} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="page-container animate-fade-in">
            <PageTitle title="Clientes" />
            <header className="page-header">
                <div className="header-title">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-1)' }}>
                        <div className="icon-badge primary shadow-glow">
                            <Users size={22} />
                        </div>
                        <h1>Directorio de Clientes</h1>
                    </div>
                    <p>Gestiona la base de datos de contactos y prospectos de la concesionaria.</p>
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                    <Button variant="secondary" onClick={() => refetch()}>
                        <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                    </Button>
                    <Button variant="primary" onClick={() => handleOpenModal()}>
                        <Plus size={18} />
                        Nuevo Cliente
                    </Button>
                </div>
            </header>

            <div className="filters-bar glass">
                <div className="filters-search">
                    <Search size={16} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, CUIT/CUIL o email…"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setPage(1);
                        }}
                    />
                </div>
                <div className="filters-selects">
                    <div className="filter-field" style={{ justifyContent: 'flex-end' }}>
                        <Button variant="secondary" size="sm" onClick={() => { setSearchTerm(''); setPage(1); }}>
                            <RefreshCw size={14} /> Limpiar
                        </Button>
                    </div>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={clientes}
                isLoading={isLoading}
                onRowClick={(c) => navigate(`/clientes/${c.id}`)}
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                emptyMessage="No se encontraron registros de clientes"
                emptyIcon={<Users size={40} style={{ color: 'var(--text-muted)' }} />}
            />

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
                subtitle={editingCliente ? 'Actualiza la información del cliente.' : 'Completa los datos para registrar un nuevo cliente.'}
                maxWidth="700px"
            >
                <ClienteForm
                    initialData={editingCliente}
                    onSubmit={handleSubmit}
                    onCancel={handleCloseModal}
                    onEdit={handleEditFromVerification}
                    loading={createMutation.isPending || updateMutation.isPending}
                />
            </Modal>
        </div>
    );
};

export default ClientesPage;
