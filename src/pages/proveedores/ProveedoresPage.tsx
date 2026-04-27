import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { proveedoresApi } from '../../api/proveedores.api';
import type { Proveedor } from '../../types/proveedor.types';
import Button from '../../components/ui/Button';
import ProveedorForm from '../../components/forms/ProveedorForm';
import { useUIStore } from '../../store/uiStore';
import {
    Plus,
    Search,
    Building2,
    Phone,
    Mail,
    Edit,
    Trash2,
    Truck,
    RefreshCw,
    MapPin,
    ChevronRight,
    CheckCircle2,
    XCircle
} from 'lucide-react';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { useConfirm } from '../../hooks/useConfirm';
import type { PaginatedResponse } from '../../types/api.types';
import type { ProveedorFilter } from '../../types/proveedor.types';
import { getApiErrorMessage } from '../../utils/error';

import type { BadgeVariant } from '../../components/ui/Badge';

const TIPO_BADGE: Record<string, BadgeVariant> = {
    importadora: 'violet',
    taller: 'warning',
    particular: 'success',
    financiera: 'cyan',
    otro: 'default',
};

const ProveedoresPage: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { addToast } = useUIStore();
    const confirm = useConfirm();

    const [searchTerm, setSearchTerm] = useState('');
    const [filterTipo, setFilterTipo] = useState('');
    const [filterActivo, setFilterActivo] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProveedor, setEditingProveedor] = useState<Proveedor | null>(null);

    // Queries
    const { data: response, isLoading, isError, refetch } = useQuery<PaginatedResponse<Proveedor>, Error>({
        queryKey: ['proveedores', searchTerm, filterTipo, filterActivo],
        queryFn: async () => {
            const filters: ProveedorFilter = {};
            if (searchTerm.trim()) filters.nombre = searchTerm;
            if (filterTipo) filters.tipo = filterTipo;
            if (filterActivo !== '') filters.activo = filterActivo === 'true';
            const res = await proveedoresApi.getAll(filters);
            return res;
        }
    });

    const proveedores = response?.results || [];

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: Partial<Proveedor>) => proveedoresApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['proveedores'] });
            addToast('Proveedor registrado correctamente', 'success');
            handleCloseModal();
        },
        onError: (err) => {
            addToast(getApiErrorMessage(err, 'Error al registrar proveedor'), 'error');
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number, data: Partial<Proveedor> }) => proveedoresApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['proveedores'] });
            addToast('Datos actualizados correctamente', 'success');
            handleCloseModal();
        },
        onError: (err) => {
            addToast(getApiErrorMessage(err, 'Error al actualizar proveedor'), 'error');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => proveedoresApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['proveedores'] });
            addToast('Proveedor eliminado correctamente', 'success');
        },
        onError: (err) => {
            addToast(getApiErrorMessage(err, 'Error al eliminar proveedor'), 'error');
        }
    });

    const handleOpenModal = (proveedor?: Proveedor) => {
        setEditingProveedor(proveedor || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProveedor(null);
    };

    const handleSubmit = async (data: Partial<Proveedor>) => {
        if (editingProveedor) {
            updateMutation.mutate({ id: editingProveedor.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const handleDelete = (p: Proveedor) => {
        confirm({
            title: 'Eliminar Proveedor',
            message: `¿Estás seguro de que deseas eliminar a "${p.nombre}"? Esto afectará los registros históricos asociados.`,
            type: 'danger',
            confirmLabel: 'Eliminar Permanentemente',
            onConfirm: async () => {
                await deleteMutation.mutateAsync(p.id);
            }
        });
    };

    return (
        <div className="page-container animate-fade-in">
            <header className="page-header">
                <div className="header-title">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="icon-badge primary shadow-glow">
                            <Truck size={22} />
                        </div>
                        <h1>Proveedores Externos</h1>
                    </div>
                    <p>Gestión de importadoras, talleres, financieras y colaboradores externos.</p>
                </div>

                <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => refetch()}>
                        <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                    </Button>
                    <Button variant="primary" onClick={() => handleOpenModal()}>
                        <Plus size={18} />
                        Nuevo Proveedor
                    </Button>
                </div>
            </header>

            <div className="filters-bar glass">
                <div className="filters-search">
                    <Search size={16} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o empresa…"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="filters-selects">
                    <div className="filter-field">
                        <label className="input-label">Tipo</label>
                        <select className="input-control" value={filterTipo} onChange={e => setFilterTipo(e.target.value)}>
                            <option value="">Cualquier tipo</option>
                            <option value="importadora">Importadora</option>
                            <option value="taller">Taller</option>
                            <option value="particular">Particular</option>
                            <option value="financiera">Financiera</option>
                            <option value="otro">Otro</option>
                        </select>
                    </div>
                    <div className="filter-field">
                        <label className="input-label">Estado</label>
                        <select className="input-control" value={filterActivo} onChange={e => setFilterActivo(e.target.value)}>
                            <option value="">Cualquier estado</option>
                            <option value="true">Activos</option>
                            <option value="false">Inactivos</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="proveedores-grid">
                {isLoading && !proveedores.length ? (
                    [1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="card skeleton-card" style={{ height: '220px' }}></div>
                    ))
                ) : isError ? (
                    <div className="dt-empty" style={{ gridColumn: '1/-1' }}>
                        <p className="dt-empty-text" style={{ color: 'var(--danger)' }}>Error al sincronizar proveedores</p>
                    </div>
                ) : proveedores.length === 0 ? (
                    <div className="dt-empty" style={{ gridColumn: '1/-1' }}>
                        <div className="dt-empty-badge"><Truck size={36} /></div>
                        <p className="dt-empty-text">No hay proveedores registrados</p>
                    </div>
                ) : (
                    proveedores.map((p: Proveedor) => (
                        <div key={p.id} className="card prov-card">
                            <div className="prov-card-head">
                                <div className="prov-card-identity">
                                    <div className="prov-avatar">
                                        <Building2 size={22} />
                                    </div>
                                    <div className="prov-meta">
                                        <h3 className="prov-name">{p.nombre}</h3>
                                        <Badge variant={TIPO_BADGE[p.tipo || 'otro']}>
                                            {p.tipo || 'Sin tipo'}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="prov-actions">
                                    <button
                                        className="icon-btn"
                                        onClick={() => handleOpenModal(p)}
                                        aria-label="Editar proveedor"
                                        title="Editar"
                                    >
                                        <Edit size={14} />
                                    </button>
                                    <button
                                        className="icon-btn danger"
                                        onClick={() => handleDelete(p)}
                                        aria-label="Eliminar proveedor"
                                        title="Eliminar"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            <div className="prov-card-body">
                                <div className="prov-line">
                                    <span className="prov-line-icon"><Mail size={14} /></span>
                                    <span className="prov-line-text">{p.email || 'Sin correo'}</span>
                                </div>
                                <div className="prov-line">
                                    <span className="prov-line-icon"><Phone size={14} /></span>
                                    <span className="prov-line-text">{p.telefono || 'Sin teléfono'}</span>
                                </div>
                                {p.direccion && (
                                    <div className="prov-line">
                                        <span className="prov-line-icon"><MapPin size={14} /></span>
                                        <span className="prov-line-text">{p.direccion}</span>
                                    </div>
                                )}
                            </div>

                            <div className="prov-card-foot">
                                <Badge variant={p.activo ? 'success' : 'default'}>
                                    {p.activo
                                        ? <><CheckCircle2 size={11} style={{ marginRight: 4 }} /> Operativo</>
                                        : <><XCircle size={11} style={{ marginRight: 4 }} /> Inactivo</>}
                                </Badge>
                                <Button variant="ghost" size="sm" onClick={() => navigate(`/proveedores/${p.id}`)}>
                                    Ver ficha
                                    <ChevronRight size={14} />
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingProveedor ? 'Actualizar Proveedor' : 'Registrar Nuevo Proveedor'}
                maxWidth="600px"
            >
                <ProveedorForm
                    initialData={editingProveedor}
                    onSubmit={handleSubmit}
                    onCancel={handleCloseModal}
                    loading={createMutation.isPending || updateMutation.isPending}
                />
            </Modal>
        </div>
    );
};

export default ProveedoresPage;

