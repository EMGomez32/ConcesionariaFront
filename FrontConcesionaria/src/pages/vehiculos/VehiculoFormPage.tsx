import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { vehiculosApi } from '../../api/vehiculos.api';
import { sucursalesApi } from '../../api/sucursales.api';
import type { Vehiculo } from '../../types/vehiculo.types';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { ArrowLeft, Save } from 'lucide-react';

const VehiculoFormPage = () => {
    const { id } = useParams();
    const isEdit = Boolean(id);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [sucursales, setSucursales] = useState<{ value: number; label: string }[]>([]);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<Partial<Vehiculo>>();

    useEffect(() => {
        // Cargar sucursales para el select
        sucursalesApi.getAll().then(res => {
            setSucursales(res.data.map((s: any) => ({ value: s.id, label: s.nombre })));
        });

        if (isEdit) {
            vehiculosApi.getById(Number(id)).then(res => {
                // Formatear fechas para el input type="date"
                const data = res.data;
                if (data.fechaIngreso) data.fechaIngreso = data.fechaIngreso.split('T')[0];
                if (data.fechaCompra) data.fechaCompra = data.fechaCompra.split('T')[0];
                reset(data);
            });
        }
    }, [id, isEdit, reset]);

    const onSubmit = async (data: Partial<Vehiculo>) => {
        setLoading(true);
        try {
            if (isEdit) {
                await vehiculosApi.update(Number(id), data);
            } else {
                await vehiculosApi.create(data);
            }
            navigate('/vehiculos');
        } catch (err) {
            console.error(err);
            alert('Error al guardar el vehículo');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <header className="page-header">
                <div className="header-info">
                    <button className="back-btn" onClick={() => navigate('/vehiculos')}>
                        <ArrowLeft size={20} />
                        Volver
                    </button>
                    <h1>{isEdit ? 'Editar Vehículo' : 'Nuevo Vehículo'}</h1>
                </div>
            </header>

            <form onSubmit={handleSubmit(onSubmit)} className="form-card glass animate-fade-in">
                <div className="form-section">
                    <h3>Información General</h3>
                    <div className="form-grid">
                        <Select
                            label="Tipo"
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
                        <Input label="Marca" {...register('marca', { required: true })} error={errors.marca && 'Requerido'} />
                        <Input label="Modelo" {...register('modelo', { required: true })} error={errors.modelo && 'Requerido'} />
                        <Input label="Versión" {...register('version')} />
                        <Input label="Año" type="number" {...register('anio', { valueAsNumber: true })} />
                        <Input label="Dominio / Patente" {...register('dominio')} />
                        <Input label="Kilómetros al Ingreso" type="number" {...register('kmIngreso', { valueAsNumber: true })} />
                    </div>
                </div>

                <div className="form-section">
                    <h3>Estado y Ubicación</h3>
                    <div className="form-grid">
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
                        <Input label="Fecha de Ingreso" type="date" {...register('fechaIngreso', { required: true })} error={errors.fechaIngreso && 'Requerido'} />
                    </div>
                </div>

                <div className="form-section">
                    <h3>Precios</h3>
                    <div className="form-grid">
                        <Input label="Precio Lista (Venta)" type="number" step="0.01" {...register('precioLista', { valueAsNumber: true })} />
                        <Input label="Precio Compra" type="number" step="0.01" {...register('precioCompra', { valueAsNumber: true })} />
                    </div>
                </div>

                <div className="form-footer">
                    <Button type="button" variant="outline" onClick={() => navigate('/vehiculos')}>Cancelar</Button>
                    <Button type="submit" variant="primary" loading={loading}>
                        <Save size={20} style={{ marginRight: '0.5rem' }} />
                        {isEdit ? 'Actualizar' : 'Guardar'} Vehículo
                    </Button>
                </div>
            </form>

            <style>{`
        .page-container { display: flex; flex-direction: column; gap: 2rem; }
        .back-btn { display: flex; align-items: center; gap: 0.5rem; color: var(--text-secondary); margin-bottom: 0.5rem; }
        .back-btn:hover { color: var(--accent); }
        .form-card { padding: 2.5rem; border-radius: 1.5rem; display: flex; flex-direction: column; gap: 2.5rem; }
        .form-section h3 { font-size: 1.125rem; margin-bottom: 1.5rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border); }
        .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; }
        .form-footer { display: flex; justify-content: flex-end; gap: 1rem; padding-top: 1rem; border-top: 1px solid var(--border); }
      `}</style>
        </div>
    );
};

export default VehiculoFormPage;
