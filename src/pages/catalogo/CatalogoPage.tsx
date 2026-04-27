import { useEffect, useMemo, useState, useCallback } from 'react';
import { marcasApi, modelosApi, versionesApi } from '../../api/catalogo.api';
import { concesionariasApi } from '../../api/concesionarias.api';
import { unwrapPaged } from '../../utils/api';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Badge from '../../components/ui/Badge';
import {
    Plus, Edit, Trash2, RefreshCw, BookOpen, Tag, Layers, Car, Building2,
} from 'lucide-react';
import type {
    Marca, Modelo, VersionVehiculo,
} from '../../types/catalogo.types';
import type { Concesionaria } from '../../types/concesionaria.types';

type Tab = 'marcas' | 'modelos' | 'versiones';

interface ConfirmDeleteState {
    type: Tab;
    id: number;
    label: string;
}

const CatalogoPage = () => {
    const { addToast } = useUIStore();
    const currentUser = useAuthStore(s => s.user);
    const isSuperAdmin = !!currentUser?.roles?.includes('super_admin');

    /* ── Tabs ────────────────────────────────────────── */
    const [tab, setTab] = useState<Tab>('marcas');

    /* ── Concesionaria scope (only for super_admin) ──── */
    const [concesionarias, setConcesionarias] = useState<Concesionaria[]>([]);
    const [selectedConcesionariaId, setSelectedConcesionariaId] = useState<number | ''>('');

    useEffect(() => {
        if (!isSuperAdmin) return;
        concesionariasApi.getAll()
            .then(res => {
                const list = unwrapPaged<Concesionaria>(res).results;
                setConcesionarias(list);
                if (list.length > 0) setSelectedConcesionariaId(list[0].id);
            })
            .catch(() => addToast('Error al cargar concesionarias', 'error'));
    }, [isSuperAdmin, addToast]);

    const scopeConcesionariaId = isSuperAdmin
        ? (selectedConcesionariaId ? Number(selectedConcesionariaId) : undefined)
        : currentUser?.concesionariaId ?? undefined;

    /* ── Data ────────────────────────────────────────── */
    const [marcas, setMarcas] = useState<Marca[]>([]);
    const [modelos, setModelos] = useState<Modelo[]>([]);
    const [versiones, setVersiones] = useState<VersionVehiculo[]>([]);
    const [loading, setLoading] = useState(false);

    /* ── Filters per tab ─────────────────────────────── */
    const [filterMarca, setFilterMarca] = useState<number | ''>('');
    const [filterModelo, setFilterModelo] = useState<number | ''>('');
    const [search, setSearch] = useState('');

    const loadMarcas = useCallback(async () => {
        if (isSuperAdmin && !scopeConcesionariaId) {
            setMarcas([]);
            return;
        }
        setLoading(true);
        try {
            const res = await marcasApi.getAll({
                limit: 200,
                ...(isSuperAdmin && scopeConcesionariaId ? { concesionariaId: scopeConcesionariaId } : {}),
            });
            setMarcas(unwrapPaged<Marca>(res).results);
        } catch {
            addToast('Error al cargar marcas', 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast, isSuperAdmin, scopeConcesionariaId]);

    const loadModelos = useCallback(async () => {
        if (isSuperAdmin && !scopeConcesionariaId) {
            setModelos([]);
            return;
        }
        setLoading(true);
        try {
            const res = await modelosApi.getAll({
                limit: 200,
                ...(filterMarca ? { marcaId: Number(filterMarca) } : {}),
                ...(isSuperAdmin && scopeConcesionariaId ? { concesionariaId: scopeConcesionariaId } : {}),
            });
            setModelos(unwrapPaged<Modelo>(res).results);
        } catch {
            addToast('Error al cargar modelos', 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast, filterMarca, isSuperAdmin, scopeConcesionariaId]);

    const loadVersiones = useCallback(async () => {
        if (isSuperAdmin && !scopeConcesionariaId) {
            setVersiones([]);
            return;
        }
        setLoading(true);
        try {
            const res = await versionesApi.getAll({
                limit: 200,
                ...(filterModelo ? { modeloId: Number(filterModelo) } : {}),
                ...(isSuperAdmin && scopeConcesionariaId ? { concesionariaId: scopeConcesionariaId } : {}),
            });
            setVersiones(unwrapPaged<VersionVehiculo>(res).results);
        } catch {
            addToast('Error al cargar versiones', 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast, filterModelo, isSuperAdmin, scopeConcesionariaId]);

    // Reload current tab's data when scope or filters change
    useEffect(() => {
        if (tab === 'marcas') loadMarcas();
        if (tab === 'modelos') loadModelos();
        if (tab === 'versiones') loadVersiones();
    }, [tab, loadMarcas, loadModelos, loadVersiones]);

    // For modelos and versiones tabs we also need the marcas (and modelos) for selects
    useEffect(() => {
        if (tab === 'marcas') return;
        if (isSuperAdmin && !scopeConcesionariaId) return;
        marcasApi.getAll({
            limit: 500,
            ...(isSuperAdmin && scopeConcesionariaId ? { concesionariaId: scopeConcesionariaId } : {}),
        })
            .then(res => setMarcas(unwrapPaged<Marca>(res).results))
            .catch(() => { /* silent */ });
    }, [tab, isSuperAdmin, scopeConcesionariaId]);

    useEffect(() => {
        if (tab !== 'versiones') return;
        if (isSuperAdmin && !scopeConcesionariaId) return;
        modelosApi.getAll({
            limit: 1000,
            ...(isSuperAdmin && scopeConcesionariaId ? { concesionariaId: scopeConcesionariaId } : {}),
        })
            .then(res => setModelos(unwrapPaged<Modelo>(res).results))
            .catch(() => { /* silent */ });
    }, [tab, isSuperAdmin, scopeConcesionariaId]);

    /* ── Filtered (client-side search) ─────────────── */
    const filteredMarcas = useMemo(() =>
        marcas.filter(m => !search || m.nombre.toLowerCase().includes(search.toLowerCase())),
    [marcas, search]);

    const filteredModelos = useMemo(() =>
        modelos.filter(m => !search || m.nombre.toLowerCase().includes(search.toLowerCase())),
    [modelos, search]);

    const filteredVersiones = useMemo(() =>
        versiones.filter(v => !search || v.nombre.toLowerCase().includes(search.toLowerCase())),
    [versiones, search]);

    /* ── Modal: Marca ─────────────────────────────── */
    const [marcaModal, setMarcaModal] = useState<{ open: boolean; edit: Marca | null }>({ open: false, edit: null });
    const [marcaForm, setMarcaForm] = useState({ nombre: '', activo: true });
    const [marcaError, setMarcaError] = useState('');
    const [marcaSaving, setMarcaSaving] = useState(false);

    const openMarcaModal = (edit: Marca | null = null) => {
        setMarcaForm(edit ? { nombre: edit.nombre, activo: edit.activo } : { nombre: '', activo: true });
        setMarcaError('');
        setMarcaModal({ open: true, edit });
    };
    const closeMarcaModal = () => setMarcaModal({ open: false, edit: null });

    const saveMarca = async () => {
        if (!marcaForm.nombre.trim()) {
            setMarcaError('El nombre es obligatorio.');
            return;
        }
        if (isSuperAdmin && !scopeConcesionariaId) {
            setMarcaError('Seleccioná una concesionaria primero.');
            return;
        }
        setMarcaSaving(true);
        setMarcaError('');
        try {
            if (marcaModal.edit) {
                await marcasApi.update(marcaModal.edit.id, { nombre: marcaForm.nombre.trim(), activo: marcaForm.activo });
                addToast('Marca actualizada', 'success');
            } else {
                await marcasApi.create({
                    nombre: marcaForm.nombre.trim(),
                    activo: marcaForm.activo,
                    ...(isSuperAdmin ? { concesionariaId: scopeConcesionariaId } : {}),
                });
                addToast('Marca creada', 'success');
            }
            closeMarcaModal();
            loadMarcas();
        } catch (e: unknown) {
            const err = e as { message?: string };
            setMarcaError(err?.message ?? 'Error al guardar marca');
        } finally {
            setMarcaSaving(false);
        }
    };

    /* ── Modal: Modelo ─────────────────────────────── */
    const [modeloModal, setModeloModal] = useState<{ open: boolean; edit: Modelo | null }>({ open: false, edit: null });
    const [modeloForm, setModeloForm] = useState({ nombre: '', marcaId: '' as number | '', activo: true });
    const [modeloError, setModeloError] = useState('');
    const [modeloSaving, setModeloSaving] = useState(false);

    const openModeloModal = (edit: Modelo | null = null) => {
        setModeloForm(edit
            ? { nombre: edit.nombre, marcaId: edit.marcaId, activo: edit.activo }
            : { nombre: '', marcaId: filterMarca || '', activo: true });
        setModeloError('');
        setModeloModal({ open: true, edit });
    };
    const closeModeloModal = () => setModeloModal({ open: false, edit: null });

    const saveModelo = async () => {
        if (!modeloForm.nombre.trim()) { setModeloError('El nombre es obligatorio.'); return; }
        if (!modeloModal.edit && !modeloForm.marcaId) { setModeloError('Seleccioná una marca.'); return; }
        if (isSuperAdmin && !scopeConcesionariaId) { setModeloError('Seleccioná una concesionaria primero.'); return; }
        setModeloSaving(true);
        setModeloError('');
        try {
            if (modeloModal.edit) {
                await modelosApi.update(modeloModal.edit.id, { nombre: modeloForm.nombre.trim(), activo: modeloForm.activo });
                addToast('Modelo actualizado', 'success');
            } else {
                await modelosApi.create({
                    nombre: modeloForm.nombre.trim(),
                    marcaId: Number(modeloForm.marcaId),
                    activo: modeloForm.activo,
                    ...(isSuperAdmin ? { concesionariaId: scopeConcesionariaId } : {}),
                });
                addToast('Modelo creado', 'success');
            }
            closeModeloModal();
            loadModelos();
        } catch (e: unknown) {
            const err = e as { message?: string };
            setModeloError(err?.message ?? 'Error al guardar modelo');
        } finally {
            setModeloSaving(false);
        }
    };

    /* ── Modal: Versión ─────────────────────────────── */
    const [versionModal, setVersionModal] = useState<{ open: boolean; edit: VersionVehiculo | null }>({ open: false, edit: null });
    const [versionForm, setVersionForm] = useState({
        nombre: '',
        modeloId: '' as number | '',
        anio: '' as string,
        precioSugerido: '' as string,
        activo: true,
    });
    const [versionError, setVersionError] = useState('');
    const [versionSaving, setVersionSaving] = useState(false);

    const openVersionModal = (edit: VersionVehiculo | null = null) => {
        setVersionForm(edit ? {
            nombre: edit.nombre,
            modeloId: edit.modeloId,
            anio: edit.anio?.toString() ?? '',
            precioSugerido: edit.precioSugerido != null ? String(edit.precioSugerido) : '',
            activo: edit.activo,
        } : {
            nombre: '',
            modeloId: filterModelo || '',
            anio: '',
            precioSugerido: '',
            activo: true,
        });
        setVersionError('');
        setVersionModal({ open: true, edit });
    };
    const closeVersionModal = () => setVersionModal({ open: false, edit: null });

    const saveVersion = async () => {
        if (!versionForm.nombre.trim()) { setVersionError('El nombre es obligatorio.'); return; }
        if (!versionModal.edit && !versionForm.modeloId) { setVersionError('Seleccioná un modelo.'); return; }
        if (isSuperAdmin && !scopeConcesionariaId) { setVersionError('Seleccioná una concesionaria primero.'); return; }
        setVersionSaving(true);
        setVersionError('');
        try {
            const payload = {
                nombre: versionForm.nombre.trim(),
                anio: versionForm.anio ? Number(versionForm.anio) : null,
                precioSugerido: versionForm.precioSugerido ? Number(versionForm.precioSugerido) : null,
                activo: versionForm.activo,
            };
            if (versionModal.edit) {
                await versionesApi.update(versionModal.edit.id, payload);
                addToast('Versión actualizada', 'success');
            } else {
                await versionesApi.create({
                    ...payload,
                    modeloId: Number(versionForm.modeloId),
                    ...(isSuperAdmin ? { concesionariaId: scopeConcesionariaId } : {}),
                });
                addToast('Versión creada', 'success');
            }
            closeVersionModal();
            loadVersiones();
        } catch (e: unknown) {
            const err = e as { message?: string };
            setVersionError(err?.message ?? 'Error al guardar versión');
        } finally {
            setVersionSaving(false);
        }
    };

    /* ── Delete ────────────────────────────────────── */
    const [confirmDelete, setConfirmDelete] = useState<ConfirmDeleteState | null>(null);
    const [deleting, setDeleting] = useState(false);

    const doDelete = async () => {
        if (!confirmDelete) return;
        setDeleting(true);
        try {
            if (confirmDelete.type === 'marcas') {
                await marcasApi.delete(confirmDelete.id);
                loadMarcas();
            } else if (confirmDelete.type === 'modelos') {
                await modelosApi.delete(confirmDelete.id);
                loadModelos();
            } else {
                await versionesApi.delete(confirmDelete.id);
                loadVersiones();
            }
            addToast('Eliminado correctamente', 'success');
            setConfirmDelete(null);
        } catch (e: unknown) {
            const err = e as { message?: string };
            addToast(err?.message ?? 'No se pudo eliminar', 'error');
        } finally {
            setDeleting(false);
        }
    };

    /* ── Render ────────────────────────────────────── */
    const refreshCurrent = () => {
        if (tab === 'marcas') loadMarcas();
        if (tab === 'modelos') loadModelos();
        if (tab === 'versiones') loadVersiones();
    };

    return (
        <div className="page-container">
            <header className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <BookOpen size={28} style={{ color: 'var(--accent)' }} />
                    <div>
                        <h1 className="page-title">Catálogo</h1>
                        <p className="page-subtitle">Estandarización de marcas, modelos y versiones por concesionaria.</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button variant="secondary" onClick={refreshCurrent}>
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </Button>
                    {tab === 'marcas' && (
                        <Button variant="primary" onClick={() => openMarcaModal()}>
                            <Plus size={16} /> Nueva Marca
                        </Button>
                    )}
                    {tab === 'modelos' && (
                        <Button variant="primary" onClick={() => openModeloModal()}>
                            <Plus size={16} /> Nuevo Modelo
                        </Button>
                    )}
                    {tab === 'versiones' && (
                        <Button variant="primary" onClick={() => openVersionModal()}>
                            <Plus size={16} /> Nueva Versión
                        </Button>
                    )}
                </div>
            </header>

            {/* Concesionaria scope (super_admin) */}
            {isSuperAdmin && (
                <div className="filters-bar glass" style={{ marginBottom: 'var(--space-3)' }}>
                    <div className="input-group" style={{ minWidth: 280 }}>
                        <label className="input-label">
                            <Building2 size={12} style={{ marginRight: 6, verticalAlign: '-2px' }} />
                            Concesionaria
                        </label>
                        <select
                            className="input-control"
                            value={selectedConcesionariaId}
                            onChange={e => setSelectedConcesionariaId(e.target.value ? Number(e.target.value) : '')}
                        >
                            <option value="">Seleccionar concesionaria...</option>
                            {concesionarias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                        </select>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
                <div className="tab-group" role="tablist">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={tab === 'marcas'}
                        onClick={() => { setTab('marcas'); setSearch(''); }}
                        className={`tab-btn ${tab === 'marcas' ? 'is-active' : ''}`}
                    >
                        <Tag size={14} /> Marcas
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={tab === 'modelos'}
                        onClick={() => { setTab('modelos'); setSearch(''); }}
                        className={`tab-btn ${tab === 'modelos' ? 'is-active' : ''}`}
                    >
                        <Layers size={14} /> Modelos
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={tab === 'versiones'}
                        onClick={() => { setTab('versiones'); setSearch(''); }}
                        className={`tab-btn ${tab === 'versiones' ? 'is-active' : ''}`}
                    >
                        <Car size={14} /> Versiones
                    </button>
                </div>
            </div>

            {/* Filters per tab */}
            <div className="filters-bar glass" style={{ marginBottom: 'var(--space-3)' }}>
                <div className="filters-selects">
                    <div className="filter-field" style={{ flex: 1 }}>
                        <label className="input-label">Buscar por nombre</label>
                        <input
                            type="text"
                            className="input-control"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder={
                                tab === 'marcas' ? 'Ej: Toyota, Ford...' :
                                tab === 'modelos' ? 'Ej: Hilux, Ranger...' :
                                'Ej: SRX 4x4...'
                            }
                        />
                    </div>
                    {tab === 'modelos' && (
                        <div className="filter-field">
                            <label className="input-label">Filtrar por marca</label>
                            <select
                                className="input-control"
                                value={filterMarca}
                                onChange={e => setFilterMarca(e.target.value ? Number(e.target.value) : '')}
                            >
                                <option value="">Todas las marcas</option>
                                {marcas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                            </select>
                        </div>
                    )}
                    {tab === 'versiones' && (
                        <div className="filter-field">
                            <label className="input-label">Filtrar por modelo</label>
                            <select
                                className="input-control"
                                value={filterModelo}
                                onChange={e => setFilterModelo(e.target.value ? Number(e.target.value) : '')}
                            >
                                <option value="">Todos los modelos</option>
                                {modelos.map(m => (
                                    <option key={m.id} value={m.id}>
                                        {m.marca?.nombre ? `${m.marca.nombre} — ` : ''}{m.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="glass table-container">
                {tab === 'marcas' && (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Modelos</th>
                                <th>Estado</th>
                                <th style={{ textAlign: 'right' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>
                                    <RefreshCw size={20} className="animate-spin" />
                                </td></tr>
                            ) : filteredMarcas.length === 0 ? (
                                <tr><td colSpan={4}>
                                    <div className="dt-empty">
                                        <div className="dt-empty-badge"><Tag size={28} /></div>
                                        <p className="dt-empty-text">No hay marcas cargadas.</p>
                                    </div>
                                </td></tr>
                            ) : filteredMarcas.map(m => (
                                <tr key={m.id}>
                                    <td className="fw-bold">{m.nombre}</td>
                                    <td>{m._count?.modelos ?? 0}</td>
                                    <td>
                                        <Badge variant={m.activo ? 'success' : 'default'}>
                                            {m.activo ? 'Activa' : 'Inactiva'}
                                        </Badge>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                                            <button className="icon-btn" onClick={() => openMarcaModal(m)} title="Editar">
                                                <Edit size={15} />
                                            </button>
                                            <button
                                                className="icon-btn danger"
                                                onClick={() => setConfirmDelete({ type: 'marcas', id: m.id, label: m.nombre })}
                                                title="Eliminar"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {tab === 'modelos' && (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Marca</th>
                                <th>Modelo</th>
                                <th>Versiones</th>
                                <th>Estado</th>
                                <th style={{ textAlign: 'right' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
                                    <RefreshCw size={20} className="animate-spin" />
                                </td></tr>
                            ) : filteredModelos.length === 0 ? (
                                <tr><td colSpan={5}>
                                    <div className="dt-empty">
                                        <div className="dt-empty-badge"><Layers size={28} /></div>
                                        <p className="dt-empty-text">No hay modelos cargados.</p>
                                    </div>
                                </td></tr>
                            ) : filteredModelos.map(m => (
                                <tr key={m.id}>
                                    <td>{m.marca?.nombre ?? `#${m.marcaId}`}</td>
                                    <td className="fw-bold">{m.nombre}</td>
                                    <td>{m._count?.versiones ?? 0}</td>
                                    <td>
                                        <Badge variant={m.activo ? 'success' : 'default'}>
                                            {m.activo ? 'Activo' : 'Inactivo'}
                                        </Badge>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                                            <button className="icon-btn" onClick={() => openModeloModal(m)} title="Editar">
                                                <Edit size={15} />
                                            </button>
                                            <button
                                                className="icon-btn danger"
                                                onClick={() => setConfirmDelete({ type: 'modelos', id: m.id, label: `${m.marca?.nombre ?? ''} ${m.nombre}` })}
                                                title="Eliminar"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {tab === 'versiones' && (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Marca</th>
                                <th>Modelo</th>
                                <th>Versión</th>
                                <th>Año</th>
                                <th>Precio sugerido</th>
                                <th>Estado</th>
                                <th style={{ textAlign: 'right' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                                    <RefreshCw size={20} className="animate-spin" />
                                </td></tr>
                            ) : filteredVersiones.length === 0 ? (
                                <tr><td colSpan={7}>
                                    <div className="dt-empty">
                                        <div className="dt-empty-badge"><Car size={28} /></div>
                                        <p className="dt-empty-text">No hay versiones cargadas.</p>
                                    </div>
                                </td></tr>
                            ) : filteredVersiones.map(v => (
                                <tr key={v.id}>
                                    <td>{v.modelo?.marca?.nombre ?? '-'}</td>
                                    <td>{v.modelo?.nombre ?? `#${v.modeloId}`}</td>
                                    <td className="fw-bold">{v.nombre}</td>
                                    <td>{v.anio ?? '-'}</td>
                                    <td>
                                        {v.precioSugerido != null
                                            ? `$ ${Number(v.precioSugerido).toLocaleString('es-AR')}`
                                            : '-'}
                                    </td>
                                    <td>
                                        <Badge variant={v.activo ? 'success' : 'default'}>
                                            {v.activo ? 'Activa' : 'Inactiva'}
                                        </Badge>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                                            <button className="icon-btn" onClick={() => openVersionModal(v)} title="Editar">
                                                <Edit size={15} />
                                            </button>
                                            <button
                                                className="icon-btn danger"
                                                onClick={() => setConfirmDelete({ type: 'versiones', id: v.id, label: v.nombre })}
                                                title="Eliminar"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* ─── Modal Marca ─── */}
            <Modal
                isOpen={marcaModal.open}
                onClose={closeMarcaModal}
                title={marcaModal.edit ? 'Editar Marca' : 'Nueva Marca'}
                maxWidth="440px"
                footer={
                    <>
                        <Button variant="secondary" onClick={closeMarcaModal}>Cancelar</Button>
                        <Button variant="primary" onClick={saveMarca} loading={marcaSaving}>
                            {marcaModal.edit ? 'Guardar Cambios' : 'Crear Marca'}
                        </Button>
                    </>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    <div className="input-group">
                        <label className="input-label">Nombre *</label>
                        <input
                            type="text"
                            className="input-control"
                            value={marcaForm.nombre}
                            onChange={e => setMarcaForm(f => ({ ...f, nombre: e.target.value }))}
                            placeholder="Ej: Toyota, Ford, Volkswagen..."
                            autoFocus
                        />
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                        <input
                            type="checkbox"
                            checked={marcaForm.activo}
                            onChange={e => setMarcaForm(f => ({ ...f, activo: e.target.checked }))}
                            style={{ accentColor: 'var(--accent-2)' }}
                        />
                        Marca activa
                    </label>
                    {marcaError && (
                        <div className="uploader-alert uploader-alert-error">
                            <span>{marcaError}</span>
                        </div>
                    )}
                </div>
            </Modal>

            {/* ─── Modal Modelo ─── */}
            <Modal
                isOpen={modeloModal.open}
                onClose={closeModeloModal}
                title={modeloModal.edit ? 'Editar Modelo' : 'Nuevo Modelo'}
                maxWidth="500px"
                footer={
                    <>
                        <Button variant="secondary" onClick={closeModeloModal}>Cancelar</Button>
                        <Button variant="primary" onClick={saveModelo} loading={modeloSaving}>
                            {modeloModal.edit ? 'Guardar Cambios' : 'Crear Modelo'}
                        </Button>
                    </>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    <div className="input-group">
                        <label className="input-label">Marca *</label>
                        <select
                            className="input-control"
                            value={modeloForm.marcaId}
                            onChange={e => setModeloForm(f => ({ ...f, marcaId: e.target.value ? Number(e.target.value) : '' }))}
                            disabled={!!modeloModal.edit}
                        >
                            <option value="">Seleccionar marca...</option>
                            {marcas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                        </select>
                    </div>
                    <div className="input-group">
                        <label className="input-label">Nombre del modelo *</label>
                        <input
                            type="text"
                            className="input-control"
                            value={modeloForm.nombre}
                            onChange={e => setModeloForm(f => ({ ...f, nombre: e.target.value }))}
                            placeholder="Ej: Hilux, Corolla, Ranger..."
                        />
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                        <input
                            type="checkbox"
                            checked={modeloForm.activo}
                            onChange={e => setModeloForm(f => ({ ...f, activo: e.target.checked }))}
                            style={{ accentColor: 'var(--accent-2)' }}
                        />
                        Modelo activo
                    </label>
                    {modeloError && (
                        <div className="uploader-alert uploader-alert-error">
                            <span>{modeloError}</span>
                        </div>
                    )}
                </div>
            </Modal>

            {/* ─── Modal Versión ─── */}
            <Modal
                isOpen={versionModal.open}
                onClose={closeVersionModal}
                title={versionModal.edit ? 'Editar Versión' : 'Nueva Versión'}
                maxWidth="560px"
                footer={
                    <>
                        <Button variant="secondary" onClick={closeVersionModal}>Cancelar</Button>
                        <Button variant="primary" onClick={saveVersion} loading={versionSaving}>
                            {versionModal.edit ? 'Guardar Cambios' : 'Crear Versión'}
                        </Button>
                    </>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    <div className="input-group">
                        <label className="input-label">Modelo *</label>
                        <select
                            className="input-control"
                            value={versionForm.modeloId}
                            onChange={e => setVersionForm(f => ({ ...f, modeloId: e.target.value ? Number(e.target.value) : '' }))}
                            disabled={!!versionModal.edit}
                        >
                            <option value="">Seleccionar modelo...</option>
                            {modelos.map(m => (
                                <option key={m.id} value={m.id}>
                                    {m.marca?.nombre ? `${m.marca.nombre} — ` : ''}{m.nombre}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="input-group">
                        <label className="input-label">Nombre de la versión *</label>
                        <input
                            type="text"
                            className="input-control"
                            value={versionForm.nombre}
                            onChange={e => setVersionForm(f => ({ ...f, nombre: e.target.value }))}
                            placeholder="Ej: SRX 4x4 AT, GLX, Comfortline..."
                        />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                        <div className="input-group">
                            <label className="input-label">Año</label>
                            <input
                                type="number"
                                className="input-control"
                                value={versionForm.anio}
                                onChange={e => setVersionForm(f => ({ ...f, anio: e.target.value }))}
                                placeholder="2024"
                                min={1900}
                                max={2100}
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Precio sugerido</label>
                            <div className="input-container has-icon">
                                <span className="input-icon" style={{ fontWeight: 700 }}>$</span>
                                <input
                                    type="number"
                                    className="input-control"
                                    value={versionForm.precioSugerido}
                                    onChange={e => setVersionForm(f => ({ ...f, precioSugerido: e.target.value }))}
                                    placeholder="0.00"
                                    min={0}
                                    step="0.01"
                                />
                            </div>
                        </div>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                        <input
                            type="checkbox"
                            checked={versionForm.activo}
                            onChange={e => setVersionForm(f => ({ ...f, activo: e.target.checked }))}
                            style={{ accentColor: 'var(--accent-2)' }}
                        />
                        Versión activa
                    </label>
                    {versionError && (
                        <div className="uploader-alert uploader-alert-error">
                            <span>{versionError}</span>
                        </div>
                    )}
                </div>
            </Modal>

            <ConfirmDialog
                isOpen={confirmDelete !== null}
                title={
                    confirmDelete?.type === 'marcas' ? 'Eliminar marca'
                    : confirmDelete?.type === 'modelos' ? 'Eliminar modelo'
                    : 'Eliminar versión'
                }
                message={confirmDelete ? `¿Eliminar "${confirmDelete.label}"? Es un soft-delete: se desactiva pero los datos no se borran.` : ''}
                confirmLabel="Eliminar"
                cancelLabel="Cancelar"
                type="danger"
                onConfirm={doDelete}
                onCancel={() => setConfirmDelete(null)}
                loading={deleting}
            />
        </div>
    );
};

export default CatalogoPage;
