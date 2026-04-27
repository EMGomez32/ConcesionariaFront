import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { vehiculosApi } from '../../api/vehiculos.api';
import { sucursalesApi } from '../../api/sucursales.api';
import { marcasApi, modelosApi, versionesApi } from '../../api/catalogo.api';
import { unwrapList, unwrapPaged } from '../../utils/api';
import type { Vehiculo } from '../../types/vehiculo.types';
import type { Marca, Modelo, VersionVehiculo } from '../../types/catalogo.types';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { ArrowLeft, Save, Car, AlertCircle } from 'lucide-react';

const VehiculoFormPage = () => {
    const { id } = useParams();
    const isEdit = Boolean(id);
    const navigate = useNavigate();
    const { addToast } = useUIStore();
    const currentUser = useAuthStore(s => s.user);
    const isSuperAdmin = !!currentUser?.roles?.includes('super_admin');

    const [loading, setLoading] = useState(false);
    const [sucursales, setSucursales] = useState<{ value: number; label: string }[]>([]);

    /* ── Catálogo ─────────────────────────────────── */
    const [marcas, setMarcas] = useState<Marca[]>([]);
    const [modelos, setModelos] = useState<Modelo[]>([]);
    const [versiones, setVersiones] = useState<VersionVehiculo[]>([]);

    const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<Partial<Vehiculo>>({
        defaultValues: { marcaId: null, modeloId: null, versionVehiculoId: null },
    });

    const watchedMarcaId = watch('marcaId');
    const watchedModeloId = watch('modeloId');

    /* ── Bootstrap: sucursales + marcas + (si edit) vehículo ─ */
    useEffect(() => {
        let cancelled = false;

        const loadInitial = async () => {
            try {
                const sucRes = await sucursalesApi.getAll();
                if (cancelled) return;
                const sucList = unwrapList<{ id: number; nombre: string }>(sucRes);
                setSucursales(sucList.map(s => ({ value: s.id, label: s.nombre })));

                const marcasRes = await marcasApi.getAll({ limit: 500 });
                if (cancelled) return;
                setMarcas(unwrapPaged<Marca>(marcasRes).results);

                if (isEdit) {
                    const data = await vehiculosApi.getById(Number(id));
                    if (cancelled) return;
                    if (data.fechaIngreso) data.fechaIngreso = data.fechaIngreso.split('T')[0];
                    if (data.fechaCompra) data.fechaCompra = data.fechaCompra.split('T')[0];
                    reset(data);
                }
            } catch {
                if (!cancelled) addToast('Error al cargar datos del formulario', 'error');
            }
        };

        loadInitial();
        return () => { cancelled = true; };
    }, [id, isEdit, reset, addToast]);

    /* ── Cargar modelos cuando cambia la marca ──── */
    useEffect(() => {
        if (!watchedMarcaId) {
            setModelos([]);
            return;
        }
        let cancelled = false;
        modelosApi.getAll({ marcaId: Number(watchedMarcaId), limit: 1000 })
            .then(res => {
                if (cancelled) return;
                setModelos(unwrapPaged<Modelo>(res).results);
            })
            .catch(() => { /* silent */ });
        return () => { cancelled = true; };
    }, [watchedMarcaId]);

    /* ── Cargar versiones cuando cambia el modelo ──── */
    useEffect(() => {
        if (!watchedModeloId) {
            setVersiones([]);
            return;
        }
        let cancelled = false;
        versionesApi.getAll({ modeloId: Number(watchedModeloId), limit: 1000 })
            .then(res => {
                if (cancelled) return;
                setVersiones(unwrapPaged<VersionVehiculo>(res).results);
            })
            .catch(() => { /* silent */ });
        return () => { cancelled = true; };
    }, [watchedModeloId]);

    const marcaOptions = useMemo(
        () => marcas.filter(m => m.activo).map(m => ({ value: m.id, label: m.nombre })),
        [marcas],
    );
    const modeloOptions = useMemo(
        () => modelos.filter(m => m.activo).map(m => ({ value: m.id, label: m.nombre })),
        [modelos],
    );
    const versionOptions = useMemo(
        () => versiones.filter(v => v.activo).map(v => ({
            value: v.id,
            label: `${v.nombre}${v.anio ? ` (${v.anio})` : ''}`,
        })),
        [versiones],
    );

    /* ── Handlers cascada (escriben FK + texto) ──── */
    const handleMarcaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const v = e.target.value ? Number(e.target.value) : null;
        setValue('marcaId', v, { shouldDirty: true });
        const marca = marcas.find(m => m.id === v);
        setValue('marca', marca?.nombre ?? '', { shouldDirty: true });
        // Reset cascada hacia abajo
        setValue('modeloId', null, { shouldDirty: true });
        setValue('modelo', '', { shouldDirty: true });
        setValue('versionVehiculoId', null, { shouldDirty: true });
        setValue('version', '', { shouldDirty: true });
    };

    const handleModeloChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const v = e.target.value ? Number(e.target.value) : null;
        setValue('modeloId', v, { shouldDirty: true });
        const modelo = modelos.find(m => m.id === v);
        setValue('modelo', modelo?.nombre ?? '', { shouldDirty: true });
        // Reset versión
        setValue('versionVehiculoId', null, { shouldDirty: true });
        setValue('version', '', { shouldDirty: true });
    };

    const handleVersionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const v = e.target.value ? Number(e.target.value) : null;
        setValue('versionVehiculoId', v, { shouldDirty: true });
        const version = versiones.find(x => x.id === v);
        setValue('version', version?.nombre ?? '', { shouldDirty: true });
        // Auto-llenar año si la versión lo tiene y el form no
        if (version?.anio) setValue('anio', version.anio, { shouldDirty: true });
    };

    const onSubmit = async (data: Partial<Vehiculo>) => {
        if (!data.marca || !data.modelo) {
            addToast('Tenés que elegir una marca y un modelo del catálogo', 'error');
            return;
        }
        setLoading(true);
        try {
            if (isEdit) {
                await vehiculosApi.update(Number(id), data);
                addToast('Vehículo actualizado', 'success');
            } else {
                await vehiculosApi.create(data);
                addToast('Vehículo creado', 'success');
            }
            navigate('/vehiculos');
        } catch (err: unknown) {
            const e = err as { message?: string };
            addToast(e?.message ?? 'Error al guardar el vehículo', 'error');
        } finally {
            setLoading(false);
        }
    };

    const catalogoVacio = marcas.length === 0;
    const necesitaVincular = isEdit && watch('marcaId') == null && watch('marca');

    return (
        <div className="page-container animate-fade-in">
            <header className="page-header">
                <div className="header-title">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-1)' }}>
                        <button className="icon-btn" onClick={() => navigate('/vehiculos')} aria-label="Volver">
                            <ArrowLeft size={18} />
                        </button>
                        <div className="icon-badge primary shadow-glow">
                            <Car size={22} />
                        </div>
                        <h1>{isEdit ? 'Editar Vehículo' : 'Nuevo Vehículo'}</h1>
                    </div>
                    <p>Completá los datos del vehículo para registrarlo en el inventario.</p>
                </div>
            </header>

            <form onSubmit={handleSubmit(onSubmit)} className="card" style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                {/* Hidden fields registrados (texto + FKs) — se setean vía handlers */}
                <input type="hidden" {...register('marca')} />
                <input type="hidden" {...register('modelo')} />
                <input type="hidden" {...register('version')} />
                <input type="hidden" {...register('marcaId', { valueAsNumber: false })} />
                <input type="hidden" {...register('modeloId', { valueAsNumber: false })} />
                <input type="hidden" {...register('versionVehiculoId', { valueAsNumber: false })} />

                {catalogoVacio && (
                    <div className="uploader-alert uploader-alert-warning">
                        <AlertCircle size={16} />
                        <span>
                            Todavía no hay marcas en el catálogo de esta concesionaria.{' '}
                            <a href="/catalogo" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
                                Ir al Catálogo
                            </a>{' '}para cargar marcas, modelos y versiones antes de continuar.
                        </span>
                    </div>
                )}

                {necesitaVincular && (
                    <div className="uploader-alert uploader-alert-warning">
                        <AlertCircle size={16} />
                        <span>
                            Este vehículo todavía no está vinculado al catálogo
                            (actual: {watch('marca')} {watch('modelo')} {watch('version')}).
                            Seleccioná la marca y el modelo del catálogo para vincularlo.
                        </span>
                    </div>
                )}

                <section>
                    <h3 style={{ marginBottom: 'var(--space-4)', paddingBottom: 'var(--space-2)', borderBottom: '1px solid var(--border)' }}>Información General</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
                        <Select
                            label="Tipo *"
                            options={[{ value: 'USADO', label: 'Usado' }, { value: 'CERO_KM', label: '0 KM' }]}
                            {...register('tipo', { required: true })}
                        />
                        <Select
                            label="Origen"
                            options={[
                                { value: 'compra', label: 'Compra' },
                                { value: 'permuta', label: 'Permuta' },
                                { value: 'consignacion', label: 'Consignación' },
                                { value: 'otro', label: 'Otro' }
                            ]}
                            {...register('origen')}
                        />
                        <Select
                            label="Marca *"
                            options={marcaOptions}
                            value={watch('marcaId') ?? ''}
                            onChange={handleMarcaChange}
                            disabled={catalogoVacio}
                            error={errors.marca && 'Requerido'}
                        />
                        <Select
                            label="Modelo *"
                            options={modeloOptions}
                            value={watch('modeloId') ?? ''}
                            onChange={handleModeloChange}
                            disabled={!watchedMarcaId}
                            error={errors.modelo && 'Requerido'}
                        />
                        <Select
                            label="Versión"
                            options={versionOptions}
                            value={watch('versionVehiculoId') ?? ''}
                            onChange={handleVersionChange}
                            disabled={!watchedModeloId}
                        />
                        <Input label="Año" type="number" {...register('anio', { valueAsNumber: true })} />
                        <Input label="Dominio / Patente" {...register('dominio')} />
                        <Input label="Kilómetros al Ingreso" type="number" {...register('kmIngreso', { valueAsNumber: true })} />
                    </div>
                    {isSuperAdmin && (
                        <p style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                            Sos super_admin: las marcas/modelos del select pertenecen a la concesionaria del vehículo
                            (al editar se valida el tenant).
                        </p>
                    )}
                </section>

                <section>
                    <h3 style={{ marginBottom: 'var(--space-4)', paddingBottom: 'var(--space-2)', borderBottom: '1px solid var(--border)' }}>Estado y Ubicación</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
                        <Select
                            label="Estado Actual"
                            options={[
                                { value: 'preparacion', label: 'En Preparación' },
                                { value: 'publicado', label: 'Publicado' },
                                { value: 'reservado', label: 'Reservado' },
                                { value: 'vendido', label: 'Vendido' },
                                { value: 'devuelto', label: 'Devuelto' },
                            ]}
                            {...register('estado')}
                        />
                        <Select
                            label="Sucursal"
                            options={sucursales}
                            {...register('sucursalId', { valueAsNumber: true })}
                        />
                        <Input label="Color" {...register('color')} />
                        <Input label="Fecha de Ingreso *" type="date" {...register('fechaIngreso', { required: true })} error={errors.fechaIngreso && 'Requerido'} />
                    </div>
                </section>

                <section>
                    <h3 style={{ marginBottom: 'var(--space-4)', paddingBottom: 'var(--space-2)', borderBottom: '1px solid var(--border)' }}>Precios</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
                        <Input label="Precio Lista (Venta)" type="number" step="0.01" {...register('precioLista', { valueAsNumber: true })} />
                        <Input label="Precio Compra" type="number" step="0.01" {...register('precioCompra', { valueAsNumber: true })} />
                    </div>
                </section>

                <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', paddingTop: 'var(--space-5)', borderTop: '1px solid var(--border)' }}>
                    <Button type="button" variant="secondary" onClick={() => navigate('/vehiculos')}>Cancelar</Button>
                    <Button type="submit" variant="primary" loading={loading} disabled={catalogoVacio}>
                        <Save size={16} />
                        {isEdit ? 'Actualizar' : 'Guardar'} Vehículo
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default VehiculoFormPage;
