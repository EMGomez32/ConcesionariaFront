import { useEffect, useMemo, useState, useCallback } from 'react';
import { cajaApi } from '../../api/caja.api';
import { unwrapList, unwrapPaged } from '../../utils/api';
import { useUIStore } from '../../store/uiStore';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Badge from '../../components/ui/Badge';
import {
    Wallet, Plus, ArrowDownCircle, ArrowUpCircle, ClipboardCheck,
    RefreshCw, Trash2, AlertCircle,
} from 'lucide-react';
import type {
    Caja, MovimientoCaja, CierreCaja, MovimientoTipo,
} from '../../types/caja.types';

const fmt = (v: number | string | null | undefined) => {
    if (v == null) return '—';
    const n = Number(v);
    return `$ ${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const today = () => new Date().toISOString().slice(0, 10);

const CajaPage = () => {
    const { addToast } = useUIStore();

    const [cajas, setCajas] = useState<Caja[]>([]);
    const [activeCajaId, setActiveCajaId] = useState<number | null>(null);
    const [movimientos, setMovimientos] = useState<MovimientoCaja[]>([]);
    const [cierres, setCierres] = useState<CierreCaja[]>([]);
    const [loading, setLoading] = useState(false);

    /* ── Modal: nuevo movimiento ── */
    const [movModal, setMovModal] = useState<{ open: boolean; tipo: MovimientoTipo }>({ open: false, tipo: 'ingreso' });
    const [movForm, setMovForm] = useState({ fecha: today(), monto: '', descripcion: '' });
    const [savingMov, setSavingMov] = useState(false);

    /* ── Modal: cerrar día ── */
    const [cierreModal, setCierreModal] = useState(false);
    const [cierreForm, setCierreForm] = useState({ fecha: today(), saldoReal: '', observaciones: '' });
    const [savingCierre, setSavingCierre] = useState(false);

    /* ── Modal: nueva caja ── */
    const [cajaModal, setCajaModal] = useState(false);
    const [cajaForm, setCajaForm] = useState({ nombre: '', tipo: 'efectivo' as 'efectivo' | 'mercado_pago' | 'banco' | 'otro' });
    const [savingCaja, setSavingCaja] = useState(false);

    /* ── Confirm delete ── */
    const [confirmDel, setConfirmDel] = useState<{ tipo: 'mov' | 'cierre'; id: number; label: string } | null>(null);
    const [deleting, setDeleting] = useState(false);

    const loadCajas = useCallback(async () => {
        try {
            const res = await cajaApi.getCajas();
            const list = unwrapList<Caja>(res);
            setCajas(list);
            if (list.length > 0 && activeCajaId == null) setActiveCajaId(list[0].id);
        } catch {
            addToast('Error al cargar cajas', 'error');
        }
    }, [addToast, activeCajaId]);

    const loadMovimientos = useCallback(async (cajaId: number) => {
        try {
            const res = await cajaApi.getMovimientos({ cajaId, limit: 50 });
            setMovimientos(unwrapPaged<MovimientoCaja>(res).results);
        } catch {
            addToast('Error al cargar movimientos', 'error');
        }
    }, [addToast]);

    const loadCierres = useCallback(async (cajaId: number) => {
        try {
            const res = await cajaApi.getCierres({ cajaId, limit: 30 });
            setCierres(unwrapPaged<CierreCaja>(res).results);
        } catch {
            addToast('Error al cargar cierres', 'error');
        }
    }, [addToast]);

    useEffect(() => { loadCajas(); }, [loadCajas]);

    useEffect(() => {
        if (activeCajaId == null) return;
        setLoading(true);
        Promise.all([loadMovimientos(activeCajaId), loadCierres(activeCajaId)])
            .finally(() => setLoading(false));
    }, [activeCajaId, loadMovimientos, loadCierres]);

    const activeCaja = useMemo(() => cajas.find(c => c.id === activeCajaId), [cajas, activeCajaId]);

    /* ── Handlers ── */
    const openMovModal = (tipo: MovimientoTipo) => {
        setMovForm({ fecha: today(), monto: '', descripcion: '' });
        setMovModal({ open: true, tipo });
    };

    const handleMovSave = async () => {
        if (!activeCajaId) return;
        const monto = Number(movForm.monto);
        if (!Number.isFinite(monto) || monto <= 0) {
            addToast('Monto inválido', 'error');
            return;
        }
        setSavingMov(true);
        try {
            await cajaApi.createMovimiento({
                cajaId: activeCajaId,
                tipo: movModal.tipo,
                fecha: new Date(movForm.fecha).toISOString(),
                monto,
                descripcion: movForm.descripcion || undefined,
                origen: 'manual',
            });
            addToast(`${movModal.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'} registrado`, 'success');
            setMovModal({ open: false, tipo: 'ingreso' });
            await loadMovimientos(activeCajaId);
            await loadCajas();
        } catch (e: unknown) {
            addToast((e as { message?: string })?.message ?? 'Error al guardar movimiento', 'error');
        } finally {
            setSavingMov(false);
        }
    };

    const handleCerrarDia = async () => {
        if (!activeCajaId) return;
        setSavingCierre(true);
        try {
            await cajaApi.cerrarDia({
                cajaId: activeCajaId,
                fecha: new Date(cierreForm.fecha).toISOString(),
                saldoReal: cierreForm.saldoReal ? Number(cierreForm.saldoReal) : null,
                observaciones: cierreForm.observaciones || null,
            });
            addToast('Cierre registrado', 'success');
            setCierreModal(false);
            setCierreForm({ fecha: today(), saldoReal: '', observaciones: '' });
            await loadCierres(activeCajaId);
        } catch (e: unknown) {
            addToast((e as { message?: string })?.message ?? 'Error al cerrar día', 'error');
        } finally {
            setSavingCierre(false);
        }
    };

    const handleCajaSave = async () => {
        if (!cajaForm.nombre.trim()) {
            addToast('Nombre obligatorio', 'error');
            return;
        }
        setSavingCaja(true);
        try {
            await cajaApi.createCaja({ nombre: cajaForm.nombre.trim(), tipo: cajaForm.tipo, moneda: 'ARS' });
            addToast('Caja creada', 'success');
            setCajaModal(false);
            setCajaForm({ nombre: '', tipo: 'efectivo' });
            await loadCajas();
        } catch (e: unknown) {
            addToast((e as { message?: string })?.message ?? 'Error al crear caja', 'error');
        } finally {
            setSavingCaja(false);
        }
    };

    const doDelete = async () => {
        if (!confirmDel || !activeCajaId) return;
        setDeleting(true);
        try {
            if (confirmDel.tipo === 'mov') {
                await cajaApi.deleteMovimiento(confirmDel.id);
                await loadMovimientos(activeCajaId);
                await loadCajas();
            } else {
                await cajaApi.deleteCierre(confirmDel.id);
                await loadCierres(activeCajaId);
            }
            addToast('Eliminado', 'success');
            setConfirmDel(null);
        } catch {
            addToast('Error al eliminar', 'error');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="page-container">
            <header className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Wallet size={28} style={{ color: 'var(--accent)' }} />
                    <div>
                        <h1 className="page-title">Caja</h1>
                        <p className="page-subtitle">Movimientos y cierres diarios por caja.</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button variant="secondary" onClick={() => { loadCajas(); if (activeCajaId) { loadMovimientos(activeCajaId); loadCierres(activeCajaId); } }}>
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </Button>
                    <Button variant="secondary" onClick={() => setCajaModal(true)}>
                        <Plus size={16} /> Nueva Caja
                    </Button>
                </div>
            </header>

            {/* Tabs por caja */}
            <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
                <div className="tab-group" role="tablist">
                    {cajas.length === 0 ? (
                        <div style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>
                            No hay cajas. Hacé clic en "Nueva Caja" para crear la primera.
                        </div>
                    ) : cajas.map(c => (
                        <button
                            key={c.id}
                            type="button"
                            role="tab"
                            aria-selected={activeCajaId === c.id}
                            onClick={() => setActiveCajaId(c.id)}
                            className={`tab-btn ${activeCajaId === c.id ? 'is-active' : ''}`}
                        >
                            {c.nombre}
                            <span style={{
                                marginLeft: '0.5rem', fontSize: '0.75rem',
                                color: activeCajaId === c.id ? 'rgba(255,255,255,0.85)' : 'var(--text-muted)',
                            }}>
                                {fmt(c.saldoActual ?? 0)}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {activeCaja && (
                <>
                    {/* Resumen + acciones rápidas */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: 'var(--space-3)',
                        marginBottom: 'var(--space-4)',
                    }}>
                        <div className="card" style={{ padding: 'var(--space-4)' }}>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>SALDO ACTUAL</div>
                            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                {fmt(activeCaja.saldoActual ?? 0)}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                {activeCaja.tipo.replace('_', ' ').toUpperCase()} · {activeCaja.moneda}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                            <Button variant="primary" onClick={() => openMovModal('ingreso')}>
                                <ArrowDownCircle size={16} /> Registrar Ingreso
                            </Button>
                            <Button variant="secondary" onClick={() => openMovModal('egreso')}>
                                <ArrowUpCircle size={16} /> Registrar Egreso
                            </Button>
                            <Button variant="secondary" onClick={() => setCierreModal(true)}>
                                <ClipboardCheck size={16} /> Cerrar Día
                            </Button>
                        </div>
                    </div>

                    {/* Cierres diarios */}
                    <div className="glass" style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-4)' }}>
                        <h3 style={{ marginTop: 0, marginBottom: 'var(--space-3)' }}>Cierres diarios</h3>
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Saldo inicial</th>
                                        <th>Ingresos</th>
                                        <th>Egresos</th>
                                        <th>Saldo teórico</th>
                                        <th>Saldo real</th>
                                        <th>Diferencia</th>
                                        <th>Observaciones</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cierres.length === 0 ? (
                                        <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                            Todavía no hay cierres para esta caja.
                                        </td></tr>
                                    ) : cierres.map(c => {
                                        const dif = c.diferencia != null ? Number(c.diferencia) : null;
                                        return (
                                            <tr key={c.id}>
                                                <td>{new Date(c.fecha).toLocaleDateString('es-AR')}</td>
                                                <td>{fmt(c.saldoInicial)}</td>
                                                <td style={{ color: 'var(--success, #16a34a)' }}>{fmt(c.ingresosDia)}</td>
                                                <td style={{ color: 'var(--danger, #dc2626)' }}>{fmt(c.egresosDia)}</td>
                                                <td className="fw-bold">{fmt(c.saldoTeorico)}</td>
                                                <td>{fmt(c.saldoReal)}</td>
                                                <td>
                                                    {dif == null
                                                        ? '—'
                                                        : <Badge variant={dif === 0 ? 'success' : Math.abs(dif) < 100 ? 'warning' : 'danger'}>
                                                            {fmt(dif)}
                                                        </Badge>}
                                                </td>
                                                <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                    {c.observaciones || '—'}
                                                </td>
                                                <td>
                                                    <button
                                                        className="icon-btn danger"
                                                        title="Eliminar cierre"
                                                        onClick={() => setConfirmDel({ tipo: 'cierre', id: c.id, label: `cierre del ${new Date(c.fecha).toLocaleDateString('es-AR')}` })}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Movimientos */}
                    <div className="glass" style={{ padding: 'var(--space-4)' }}>
                        <h3 style={{ marginTop: 0, marginBottom: 'var(--space-3)' }}>Últimos movimientos</h3>
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Tipo</th>
                                        <th>Monto</th>
                                        <th>Descripción</th>
                                        <th>Origen</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {movimientos.length === 0 ? (
                                        <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                            Esta caja todavía no tiene movimientos.
                                        </td></tr>
                                    ) : movimientos.map(m => (
                                        <tr key={m.id}>
                                            <td>{new Date(m.fecha).toLocaleDateString('es-AR')}</td>
                                            <td>
                                                <Badge variant={m.tipo === 'ingreso' ? 'success' : 'danger'}>
                                                    {m.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
                                                </Badge>
                                            </td>
                                            <td className="fw-bold">{fmt(m.monto)}</td>
                                            <td>{m.descripcion || '—'}</td>
                                            <td><Badge variant="default">{m.origen}</Badge></td>
                                            <td>
                                                <button
                                                    className="icon-btn danger"
                                                    title="Eliminar"
                                                    onClick={() => setConfirmDel({ tipo: 'mov', id: m.id, label: `movimiento de ${fmt(m.monto)}` })}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* Modal: movimiento */}
            <Modal
                isOpen={movModal.open}
                onClose={() => setMovModal({ open: false, tipo: 'ingreso' })}
                title={movModal.tipo === 'ingreso' ? 'Nuevo ingreso' : 'Nuevo egreso'}
                maxWidth="480px"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setMovModal({ open: false, tipo: 'ingreso' })}>Cancelar</Button>
                        <Button variant="primary" onClick={handleMovSave} loading={savingMov}>Guardar</Button>
                    </>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    <div className="input-group">
                        <label className="input-label">Fecha *</label>
                        <input type="date" className="input-control" value={movForm.fecha} onChange={e => setMovForm(f => ({ ...f, fecha: e.target.value }))} />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Monto *</label>
                        <div className="input-container has-icon">
                            <span className="input-icon" style={{ fontWeight: 700 }}>$</span>
                            <input
                                type="number"
                                className="input-control"
                                placeholder="0.00"
                                value={movForm.monto}
                                onChange={e => setMovForm(f => ({ ...f, monto: e.target.value }))}
                                min={0}
                                step="0.01"
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="input-group">
                        <label className="input-label">Descripción</label>
                        <textarea
                            className="input-control"
                            rows={3}
                            placeholder="Concepto del movimiento..."
                            value={movForm.descripcion}
                            onChange={e => setMovForm(f => ({ ...f, descripcion: e.target.value }))}
                            style={{ resize: 'vertical' }}
                        />
                    </div>
                </div>
            </Modal>

            {/* Modal: cierre */}
            <Modal
                isOpen={cierreModal}
                onClose={() => setCierreModal(false)}
                title={`Cerrar día — ${activeCaja?.nombre ?? ''}`}
                subtitle="El sistema calcula saldo inicial + ingresos/egresos del día. Ingresá lo que efectivamente hay para detectar diferencias."
                maxWidth="520px"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setCierreModal(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={handleCerrarDia} loading={savingCierre}>
                            Confirmar cierre
                        </Button>
                    </>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    <div className="input-group">
                        <label className="input-label">Fecha del cierre *</label>
                        <input type="date" className="input-control" value={cierreForm.fecha} onChange={e => setCierreForm(f => ({ ...f, fecha: e.target.value }))} />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Saldo real (opcional)</label>
                        <div className="input-container has-icon">
                            <span className="input-icon" style={{ fontWeight: 700 }}>$</span>
                            <input
                                type="number"
                                className="input-control"
                                placeholder="Lo que contás físicamente / saldo MP"
                                value={cierreForm.saldoReal}
                                onChange={e => setCierreForm(f => ({ ...f, saldoReal: e.target.value }))}
                                step="0.01"
                            />
                        </div>
                        <span className="input-feedback" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Si lo dejás vacío, se registra el saldo teórico sin auditar.
                        </span>
                    </div>
                    <div className="input-group">
                        <label className="input-label">Observaciones</label>
                        <textarea
                            className="input-control"
                            rows={3}
                            placeholder="Por qué hay diferencia, ajustes, etc."
                            value={cierreForm.observaciones}
                            onChange={e => setCierreForm(f => ({ ...f, observaciones: e.target.value }))}
                            style={{ resize: 'vertical' }}
                        />
                    </div>
                    <div className="uploader-alert uploader-alert-info">
                        <AlertCircle size={14} />
                        <span>Si ya hay un cierre para este día, se actualiza con los nuevos valores.</span>
                    </div>
                </div>
            </Modal>

            {/* Modal: nueva caja */}
            <Modal
                isOpen={cajaModal}
                onClose={() => setCajaModal(false)}
                title="Nueva Caja"
                maxWidth="440px"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setCajaModal(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={handleCajaSave} loading={savingCaja}>Crear caja</Button>
                    </>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    <div className="input-group">
                        <label className="input-label">Nombre *</label>
                        <input
                            type="text"
                            className="input-control"
                            placeholder="Ej: Caja Dólares, Banco Galicia..."
                            value={cajaForm.nombre}
                            onChange={e => setCajaForm(f => ({ ...f, nombre: e.target.value }))}
                            autoFocus
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Tipo *</label>
                        <select
                            className="input-control"
                            value={cajaForm.tipo}
                            onChange={e => setCajaForm(f => ({ ...f, tipo: e.target.value as typeof f.tipo }))}
                        >
                            <option value="efectivo">Efectivo</option>
                            <option value="mercado_pago">Mercado Pago</option>
                            <option value="banco">Banco</option>
                            <option value="otro">Otro</option>
                        </select>
                    </div>
                </div>
            </Modal>

            <ConfirmDialog
                isOpen={confirmDel !== null}
                title={confirmDel?.tipo === 'cierre' ? 'Eliminar cierre' : 'Eliminar movimiento'}
                message={confirmDel ? `¿Eliminar ${confirmDel.label}? Esta acción no se puede deshacer (afecta saldos).` : ''}
                confirmLabel="Eliminar"
                cancelLabel="Cancelar"
                type="danger"
                onConfirm={doDelete}
                onCancel={() => setConfirmDel(null)}
                loading={deleting}
            />
        </div>
    );
};

export default CajaPage;
