import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, RefreshCw, Eye, Receipt, ChevronLeft, ChevronRight, AlertTriangle, Package, Layers, FileText } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { billingApi } from '../../api/billing.api';
import type {
  Plan,
  ConcesionariaSubscription,
  Invoice,
  Payment,
  PlanInterval,
  SubscriptionStatus,
  InvoiceStatus,
  CreatePlanDto,
  MetodoPago,
} from '../../api/billing.api';
import { concesionariasApi } from '../../api/concesionarias.api';
import { useUIStore } from '../../store/uiStore';

type Tab = 'planes' | 'suscripciones' | 'facturas';

interface Concesionaria { id: number; nombre: string; }

const INTERVAL_LABELS: Record<PlanInterval, string> = { MONTH: 'Mensual', YEAR: 'Anual' };

const SUB_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  trialing: 'Trial',
  active: 'Activa',
  past_due: 'Vencida',
  canceled: 'Cancelada',
  paused: 'Pausada',
};
const SUB_STATUS_COLORS: Record<SubscriptionStatus, string> = {
  trialing: 'status-badge status-pendiente',
  active: 'status-badge status-activo',
  past_due: 'status-badge status-cancelado',
  canceled: 'status-badge status-cancelado',
  paused: 'status-badge status-inactivo',
};

const INV_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: 'Borrador',
  open: 'Abierta',
  paid: 'Pagada',
  void: 'Anulada',
  uncollectible: 'Incobrable',
};
const INV_STATUS_COLORS: Record<InvoiceStatus, string> = {
  draft: 'status-badge status-inactivo',
  open: 'status-badge status-pendiente',
  paid: 'status-badge status-activo',
  void: 'status-badge status-inactivo',
  uncollectible: 'status-badge status-cancelado',
};

const METODOS: MetodoPago[] = ['efectivo', 'transferencia', 'tarjeta', 'cheque', 'otro'];
const INV_STATUSES: InvoiceStatus[] = ['draft', 'open', 'paid', 'void', 'uncollectible'];
const NEXT_STATUSES: Partial<Record<SubscriptionStatus, SubscriptionStatus[]>> = {
  trialing: ['active', 'canceled'],
  active: ['past_due', 'canceled', 'paused'],
  past_due: ['active', 'canceled'],
  paused: ['active', 'canceled'],
};

// ─── Payment Detail Modal ─────────────────────────────────────────────────────
interface PaymentListProps {
  invoice: Invoice;
  onClose: () => void;
  onAddPayment: (inv: Invoice) => void;
}
const InvoiceDetailModal = ({ invoice, onClose, onAddPayment }: PaymentListProps) => {
  const payments: Payment[] = invoice.payments ?? [];
  const paid = payments.reduce((s, p) => s + parseFloat(p.monto), 0);
  const total = parseFloat(invoice.total);
  const pending = total - paid;
  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Factura ${invoice.numero ?? `#${invoice.id}`}`}
      maxWidth="600px"
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>Cerrar</Button>
          {invoice.status !== 'paid' && invoice.status !== 'void' && (
            <Button variant="primary" onClick={() => { onClose(); onAddPayment(invoice); }}>
              <Plus size={14} /> Registrar pago
            </Button>
          )}
        </>
      )}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 2 }}>Estado</div>
          <span className={INV_STATUS_COLORS[invoice.status]}>{INV_STATUS_LABELS[invoice.status]}</span>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 2 }}>Total</div>
          <div style={{ fontWeight: 600 }}>{invoice.moneda} {parseFloat(invoice.total).toLocaleString('es-AR')}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 2 }}>Saldo pendiente</div>
          <div style={{ fontWeight: 600, color: pending > 0 ? 'var(--color-danger, #ef4444)' : 'inherit' }}>
            {invoice.moneda} {pending.toLocaleString('es-AR')}
          </div>
        </div>
        {invoice.periodoDesde && (
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 2 }}>Período</div>
            <div>{invoice.periodoDesde?.slice(0, 10)} — {invoice.periodoHasta?.slice(0, 10)}</div>
          </div>
        )}
        {invoice.dueDate && (
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 2 }}>Vencimiento</div>
            <div>{invoice.dueDate.slice(0, 10)}</div>
          </div>
        )}
        {invoice.paidAt && (
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 2 }}>Fecha pago</div>
            <div>{new Date(invoice.paidAt).toLocaleDateString('es-AR')}</div>
          </div>
        )}
      </div>

      <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Pagos registrados</div>
      {payments.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Sin pagos registrados.</p>
      ) : (
        <table className="table" style={{ marginBottom: '0.75rem' }}>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Monto</th>
              <th>Moneda</th>
              <th>Método</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(p => (
              <tr key={p.id}>
                <td style={{ fontSize: '0.82rem' }}>{new Date(p.createdAt).toLocaleDateString('es-AR')}</td>
                <td style={{ fontWeight: 500 }}>{parseFloat(p.monto).toLocaleString('es-AR')}</td>
                <td>{p.moneda}</td>
                <td style={{ textTransform: 'capitalize' }}>{p.metodo ?? '—'}</td>
                <td><span className="status-badge status-activo">{p.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Modal>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BillingPage() {
  const { addToast } = useUIStore();
  const [activeTab, setActiveTab] = useState<Tab>('planes');

  // ── PLANES ────────────────────────────────────────────────────────────────
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [loadingPlanes, setLoadingPlanes] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [savingPlan, setSavingPlan] = useState(false);
  const [filterPlanActivo, setFilterPlanActivo] = useState('');
  const [planForm, setPlanForm] = useState<CreatePlanDto>({
    nombre: '',
    interval: 'MONTH',
    precio: '',
    moneda: 'ARS',
    maxUsuarios: undefined,
    maxSucursales: undefined,
    maxVehiculos: undefined,
    activo: true,
  });

  const fetchPlanes = useCallback(async () => {
    setLoadingPlanes(true);
    try {
      const params = filterPlanActivo !== '' ? { activo: filterPlanActivo === 'true' } : undefined;
      const res = await billingApi.getPlanes(params) as { results?: Plan[] } | Plan[];
      const arr: Plan[] = Array.isArray(res) ? res : (res?.results ?? []);
      setPlanes(arr);
    } catch {
      addToast('Error al cargar planes', 'error');
    } finally {
      setLoadingPlanes(false);
    }
  }, [filterPlanActivo, addToast]);

  useEffect(() => { if (activeTab === 'planes') fetchPlanes(); }, [activeTab, fetchPlanes]);

  const openCreatePlan = () => {
    setEditingPlan(null);
    setPlanForm({ nombre: '', interval: 'MONTH', precio: '', moneda: 'ARS', maxUsuarios: undefined, maxSucursales: undefined, maxVehiculos: undefined, activo: true });
    setShowPlanModal(true);
  };

  const openEditPlan = (p: Plan) => {
    setEditingPlan(p);
    setPlanForm({
      nombre: p.nombre,
      interval: p.interval,
      precio: p.precio,
      moneda: p.moneda,
      maxUsuarios: p.maxUsuarios ?? undefined,
      maxSucursales: p.maxSucursales ?? undefined,
      maxVehiculos: p.maxVehiculos ?? undefined,
      activo: p.activo,
    });
    setShowPlanModal(true);
  };

  const handleSavePlan = async () => {
    if (!planForm.nombre || !planForm.precio) {
      addToast('Nombre y precio son obligatorios', 'error');
      return;
    }
    setSavingPlan(true);
    try {
      if (editingPlan) {
        await billingApi.updatePlan(editingPlan.id, planForm);
        addToast('Plan actualizado', 'success');
      } else {
        await billingApi.createPlan(planForm);
        addToast('Plan creado', 'success');
      }
      setShowPlanModal(false);
      fetchPlanes();
    } catch {
      addToast('Error al guardar plan', 'error');
    } finally {
      setSavingPlan(false);
    }
  };

  const handleTogglePlanActivo = async (p: Plan) => {
    try {
      await billingApi.updatePlan(p.id, { activo: !p.activo });
      addToast(`Plan ${!p.activo ? 'activado' : 'desactivado'}`, 'success');
      fetchPlanes();
    } catch {
      addToast('Error al actualizar plan', 'error');
    }
  };

  // ── SUSCRIPCIONES ──────────────────────────────────────────────────────────
  const [concesionarias, setConcesionarias] = useState<Concesionaria[]>([]);
  const [subscriptions, setSubscriptions] = useState<Record<number, ConcesionariaSubscription | null>>({});
  const [loadingConc, setLoadingConc] = useState(false);
  const [selectedConcSub, setSelectedConcSub] = useState<Concesionaria | null>(null);
  const [showSubModal, setShowSubModal] = useState(false);
  const [savingSub, setSavingSub] = useState(false);
  const [subForm, setSubForm] = useState({
    planId: 0,
    status: 'trialing' as SubscriptionStatus,
    trialEndsAt: '',
    currentPeriodStart: '',
    currentPeriodEnd: '',
  });

  const fetchConcWithSubs = useCallback(async () => {
    setLoadingConc(true);
    try {
      const res = await concesionariasApi.getAll({}, { limit: 200 }) as { results?: Concesionaria[] } | Concesionaria[];
      const list: Concesionaria[] = Array.isArray(res) ? res : (res?.results ?? []);
      setConcesionarias(list);
      const subMap: Record<number, ConcesionariaSubscription | null> = {};
      await Promise.allSettled(
        list.map(async (c) => {
          try {
            const r = await billingApi.getSubscriptionByConcesionaria(c.id);
            subMap[c.id] = (r as ConcesionariaSubscription | null) ?? null;
          } catch {
            subMap[c.id] = null;
          }
        })
      );
      setSubscriptions(subMap);
    } catch {
      addToast('Error al cargar concesionarias', 'error');
    } finally {
      setLoadingConc(false);
    }
  }, [addToast]);

  useEffect(() => { if (activeTab === 'suscripciones') fetchConcWithSubs(); }, [activeTab, fetchConcWithSubs]);

  const openSubModal = (c: Concesionaria) => {
    setSelectedConcSub(c);
    const sub = subscriptions[c.id];
    setSubForm({
      planId: sub?.planId ?? (planes[0]?.id ?? 0),
      status: sub?.status ?? 'trialing',
      trialEndsAt: sub?.trialEndsAt ? sub.trialEndsAt.slice(0, 10) : '',
      currentPeriodStart: sub?.currentPeriodStart ? sub.currentPeriodStart.slice(0, 10) : '',
      currentPeriodEnd: sub?.currentPeriodEnd ? sub.currentPeriodEnd.slice(0, 10) : '',
    });
    setShowSubModal(true);
  };

  const handleSaveSub = async () => {
    if (!selectedConcSub || !subForm.planId) {
      addToast('Seleccioná un plan', 'error');
      return;
    }
    setSavingSub(true);
    try {
      await billingApi.updateSubscription(selectedConcSub.id, {
        planId: subForm.planId,
        status: subForm.status,
        trialEndsAt: subForm.trialEndsAt || null,
        currentPeriodStart: subForm.currentPeriodStart || null,
        currentPeriodEnd: subForm.currentPeriodEnd || null,
      });
      addToast('Suscripción actualizada', 'success');
      setShowSubModal(false);
      fetchConcWithSubs();
    } catch {
      addToast('Error al actualizar suscripción', 'error');
    } finally {
      setSavingSub(false);
    }
  };

  // ── FACTURAS ───────────────────────────────────────────────────────────────
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [invPage, setInvPage] = useState(1);
  const [invTotalPages, setInvTotalPages] = useState(1);
  const [filterInvStatus, setFilterInvStatus] = useState('');
  const [showCreateInvModal, setShowCreateInvModal] = useState(false);
  const [savingInv, setSavingInv] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payInvoice, setPayInvoice] = useState<Invoice | null>(null);
  const [savingPay, setSavingPay] = useState(false);
  const [invFormSubLoading, setInvFormSubLoading] = useState(false);
  const [invForm, setInvForm] = useState({
    concesionariaId: 0,
    subscriptionId: 0,
    numero: '',
    periodoDesde: '',
    periodoHasta: '',
    subtotal: '',
    impuestos: '0',
    total: '',
    moneda: 'ARS',
    dueDate: '',
  });
  const [payForm, setPayForm] = useState({
    monto: '',
    moneda: 'ARS',
    metodo: 'transferencia' as MetodoPago,
  });

  const fetchInvoices = useCallback(async () => {
    setLoadingInvoices(true);
    try {
      const params: { status?: InvoiceStatus; page: number; limit: number } = { page: invPage, limit: 20 };
      if (filterInvStatus) params.status = filterInvStatus as InvoiceStatus;
      const res = await billingApi.getInvoices(params) as { results?: Invoice[]; totalPages?: number };
      const results: Invoice[] = res?.results ?? [];
      setInvoices(results);
      if (res?.totalPages) setInvTotalPages(res.totalPages);
    } catch {
      addToast('Error al cargar facturas', 'error');
    } finally {
      setLoadingInvoices(false);
    }
  }, [invPage, filterInvStatus, addToast]);

  useEffect(() => { if (activeTab === 'facturas') fetchInvoices(); }, [activeTab, fetchInvoices]);

  // Ensure concesionarias loaded for invoice form
  useEffect(() => {
    if (activeTab === 'facturas' && concesionarias.length === 0) {
      concesionariasApi.getAll({}, { limit: 200 })
        .then(res => {
          const r = res as { results?: Concesionaria[] } | Concesionaria[];
          setConcesionarias(Array.isArray(r) ? r : (r?.results ?? []));
        })
        .catch(() => {});
    }
  }, [activeTab, concesionarias.length]);

  const handleConcChangeInv = async (concId: number) => {
    setInvForm(f => ({ ...f, concesionariaId: concId, subscriptionId: 0 }));
    if (!concId) return;
    setInvFormSubLoading(true);
    try {
      const r = await billingApi.getSubscriptionByConcesionaria(concId);
      const sub = r as ConcesionariaSubscription;
      if (sub?.id) setInvForm(f => ({ ...f, subscriptionId: sub.id }));
    } catch {
      addToast('Esta concesionaria no tiene suscripción asignada', 'info');
    } finally {
      setInvFormSubLoading(false);
    }
  };

  const handleCreateInvoice = async () => {
    if (!invForm.subscriptionId || !invForm.periodoDesde || !invForm.periodoHasta || !invForm.total) {
      addToast('Completá los campos obligatorios', 'error');
      return;
    }
    setSavingInv(true);
    try {
      await billingApi.createInvoice({
        subscriptionId: invForm.subscriptionId,
        numero: invForm.numero || undefined,
        periodoDesde: invForm.periodoDesde,
        periodoHasta: invForm.periodoHasta,
        subtotal: parseFloat(invForm.subtotal) || 0,
        impuestos: parseFloat(invForm.impuestos) || 0,
        total: parseFloat(invForm.total) || 0,
        moneda: invForm.moneda,
        dueDate: invForm.dueDate || undefined,
      });
      addToast('Factura creada', 'success');
      setShowCreateInvModal(false);
      fetchInvoices();
    } catch {
      addToast('Error al crear factura', 'error');
    } finally {
      setSavingInv(false);
    }
  };

  const handleViewInvoice = async (inv: Invoice) => {
    try {
      const res = await billingApi.getInvoiceById(inv.id);
      setSelectedInvoice((res as Invoice) ?? inv);
    } catch {
      setSelectedInvoice(inv);
    }
  };

  const handleRegisterPayment = async () => {
    if (!payInvoice || !payForm.monto) {
      addToast('Ingresá el monto', 'error');
      return;
    }
    setSavingPay(true);
    try {
      await billingApi.registrarPago(payInvoice.id, {
        monto: parseFloat(payForm.monto) || 0,
        moneda: payForm.moneda,
        metodo: payForm.metodo,
      });
      addToast('Pago registrado', 'success');
      setShowPayModal(false);
      setPayInvoice(null);
      fetchInvoices();
    } catch {
      addToast('Error al registrar pago', 'error');
    } finally {
      setSavingPay(false);
    }
  };

  // ── RENDER ─────────────────────────────────────────────────────────────────
  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'planes', label: 'Planes', icon: <Package size={14} /> },
    { id: 'suscripciones', label: 'Suscripciones', icon: <Layers size={14} /> },
    { id: 'facturas', label: 'Facturas', icon: <FileText size={14} /> },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Billing SaaS</h1>
          <p className="page-subtitle">Planes, suscripciones y facturación</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-group" role="tablist" style={{ marginBottom: '1.5rem' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={activeTab === t.id}
            onClick={() => setActiveTab(t.id)}
            className={`tab-btn ${activeTab === t.id ? 'is-active' : ''}`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: PLANES ── */}
      {activeTab === 'planes' && (
        <>
          <div className="filters-bar glass">
            <div className="filters-selects">
              <div className="filter-field">
                <label className="input-label">Estado</label>
                <select
                  className="input-control"
                  value={filterPlanActivo}
                  onChange={e => setFilterPlanActivo(e.target.value)}
                >
                  <option value="">Todos los planes</option>
                  <option value="true">Activos</option>
                  <option value="false">Inactivos</option>
                </select>
              </div>
              <div className="filter-field" style={{ justifyContent: 'flex-end' }}>
                <Button variant="secondary" size="sm" onClick={fetchPlanes} disabled={loadingPlanes}>
                  <RefreshCw size={14} /> Actualizar
                </Button>
                <Button variant="primary" size="sm" onClick={openCreatePlan}>
                  <Plus size={14} /> Nuevo Plan
                </Button>
              </div>
            </div>
          </div>

          {loadingPlanes ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Cargando planes...</div>
          ) : planes.length === 0 ? (
            <div className="dt-empty">
              <div className="dt-empty-badge"><Package size={36} /></div>
              <p className="dt-empty-text">No hay planes creados</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {planes.map(p => (
                <div key={p.id} className="glass" style={{ padding: '1.5rem', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{p.nombre}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{INTERVAL_LABELS[p.interval]}</div>
                    </div>
                    <span className={p.activo ? 'status-badge status-activo' : 'status-badge status-inactivo'}>
                      {p.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                    {p.moneda} {parseFloat(p.precio).toLocaleString('es-AR')}
                    <span style={{ fontSize: '0.9rem', fontWeight: 400, color: 'var(--text-secondary)' }}>
                      /{p.interval === 'MONTH' ? 'mes' : 'año'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <div>Usuarios: <strong style={{ color: 'var(--text-primary)' }}>{p.maxUsuarios ?? 'Ilimitado'}</strong></div>
                    <div>Sucursales: <strong style={{ color: 'var(--text-primary)' }}>{p.maxSucursales ?? 'Ilimitado'}</strong></div>
                    <div>Vehículos: <strong style={{ color: 'var(--text-primary)' }}>{p.maxVehiculos ?? 'Ilimitado'}</strong></div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => openEditPlan(p)}>
                      <Edit2 size={14} /> Editar
                    </button>
                    <button
                      className={`btn btn-sm ${p.activo ? 'btn-secondary' : 'btn-primary'}`}
                      style={{ flex: 1 }}
                      onClick={() => handleTogglePlanActivo(p)}
                    >
                      {p.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── TAB: SUSCRIPCIONES ── */}
      {activeTab === 'suscripciones' && (
        <>
          <div className="filters-bar glass">
            <div className="filters-selects">
              <div className="filter-field" style={{ justifyContent: 'flex-end' }}>
                <Button variant="secondary" size="sm" onClick={fetchConcWithSubs} disabled={loadingConc}>
                  <RefreshCw size={14} /> {loadingConc ? 'Cargando...' : 'Actualizar'}
                </Button>
              </div>
            </div>
          </div>
          <div className="glass table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Concesionaria</th>
                  <th>Plan</th>
                  <th>Estado</th>
                  <th>Período</th>
                  <th>Trial hasta</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {loadingConc ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Cargando...</td></tr>
                ) : concesionarias.length === 0 ? (
                  <tr><td colSpan={6}>
                    <div className="dt-empty">
                      <div className="dt-empty-badge"><Layers size={36} /></div>
                      <p className="dt-empty-text">Sin concesionarias</p>
                    </div>
                  </td></tr>
                ) : concesionarias.map(c => {
                  const sub = subscriptions[c.id];
                  const isPastDue = sub?.status === 'past_due';
                  return (
                    <tr key={c.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{c.nombre}</div>
                        {isPastDue && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: '#ef4444', marginTop: 2 }}>
                            <AlertTriangle size={12} /> Suscripción vencida
                          </div>
                        )}
                      </td>
                      <td>{sub?.plan?.nombre ?? <span style={{ color: 'var(--text-secondary)' }}>—</span>}</td>
                      <td>
                        {sub ? (
                          <span className={SUB_STATUS_COLORS[sub.status]}>{SUB_STATUS_LABELS[sub.status]}</span>
                        ) : (
                          <span className="status-badge status-inactivo">Sin suscripción</span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {sub?.currentPeriodStart ? `${sub.currentPeriodStart.slice(0, 10)} — ${sub.currentPeriodEnd?.slice(0, 10) ?? '?'}` : '—'}
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {sub?.trialEndsAt ? sub.trialEndsAt.slice(0, 10) : '—'}
                      </td>
                      <td>
                        <button className="btn btn-secondary btn-sm" onClick={() => openSubModal(c)}>
                          <Edit2 size={14} /> Gestionar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── TAB: FACTURAS ── */}
      {activeTab === 'facturas' && (
        <>
          <div className="filters-bar glass">
            <div className="filters-selects">
              <div className="filter-field">
                <label className="input-label">Estado</label>
                <select
                  className="input-control"
                  value={filterInvStatus}
                  onChange={e => { setFilterInvStatus(e.target.value); setInvPage(1); }}
                >
                  <option value="">Todos los estados</option>
                  {INV_STATUSES.map(s => <option key={s} value={s}>{INV_STATUS_LABELS[s]}</option>)}
                </select>
              </div>
              <div className="filter-field" style={{ justifyContent: 'flex-end' }}>
                <Button variant="primary" size="sm" onClick={() => {
                  setInvForm({ concesionariaId: 0, subscriptionId: 0, numero: '', periodoDesde: '', periodoHasta: '', subtotal: '', impuestos: '0', total: '', moneda: 'ARS', dueDate: '' });
                  setShowCreateInvModal(true);
                }}>
                  <Plus size={14} /> Nueva Factura
                </Button>
              </div>
            </div>
          </div>

          <div className="glass table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Suscripción</th>
                  <th>Período</th>
                  <th>Subtotal</th>
                  <th>Impuestos</th>
                  <th>Total</th>
                  <th>Vencimiento</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {loadingInvoices ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Cargando...</td></tr>
                ) : invoices.length === 0 ? (
                  <tr><td colSpan={9}>
                    <div className="dt-empty">
                      <div className="dt-empty-badge"><FileText size={36} /></div>
                      <p className="dt-empty-text">Sin facturas</p>
                    </div>
                  </td></tr>
                ) : invoices.map(inv => (
                  <tr key={inv.id}>
                    <td style={{ fontWeight: 500 }}>{inv.numero ?? `#${inv.id}`}</td>
                    <td style={{ fontSize: '0.82rem' }}>
                      {inv.subscription?.concesionaria?.nombre ?? `Sub #${inv.subscriptionId}`}
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {inv.periodoDesde?.slice(0, 10) ?? '—'} — {inv.periodoHasta?.slice(0, 10) ?? '—'}
                    </td>
                    <td>{inv.moneda} {parseFloat(inv.subtotal).toLocaleString('es-AR')}</td>
                    <td>{inv.moneda} {parseFloat(inv.impuestos).toLocaleString('es-AR')}</td>
                    <td style={{ fontWeight: 600 }}>{inv.moneda} {parseFloat(inv.total).toLocaleString('es-AR')}</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{inv.dueDate?.slice(0, 10) ?? '—'}</td>
                    <td><span className={INV_STATUS_COLORS[inv.status]}>{INV_STATUS_LABELS[inv.status]}</span></td>
                    <td style={{ display: 'flex', gap: '0.25rem' }}>
                      <button className="btn-icon" title="Ver pagos" onClick={() => handleViewInvoice(inv)}>
                        <Eye size={16} />
                      </button>
                      {inv.status !== 'paid' && inv.status !== 'void' && (
                        <button className="btn-icon" title="Registrar pago" onClick={() => { setPayInvoice(inv); setPayForm({ monto: '', moneda: inv.moneda, metodo: 'transferencia' }); setShowPayModal(true); }}>
                          <Receipt size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {invTotalPages > 1 && (
            <div className="pagination">
              <button className="btn btn-secondary btn-sm" onClick={() => setInvPage(p => Math.max(1, p - 1))} disabled={invPage === 1}>
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Página {invPage} de {invTotalPages}
              </span>
              <button className="btn btn-secondary btn-sm" onClick={() => setInvPage(p => Math.min(invTotalPages, p + 1))} disabled={invPage === invTotalPages}>
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}

      {/* ── MODAL: PLAN ── */}
      <Modal
        isOpen={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        title={editingPlan ? 'Editar Plan' : 'Nuevo Plan'}
        maxWidth="540px"
        footer={(
          <>
            <Button variant="secondary" onClick={() => setShowPlanModal(false)}>Cancelar</Button>
            <Button variant="primary" onClick={handleSavePlan} loading={savingPlan}>
              Guardar
            </Button>
          </>
        )}
      >
        <div className="input-group">
          <label className="input-label">Nombre *</label>
          <input className="input-control" value={planForm.nombre} onChange={e => setPlanForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej: Plan Pro" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <div className="input-group">
            <label className="input-label">Intervalo *</label>
            <select className="input-control" value={planForm.interval as string} onChange={e => setPlanForm(f => ({ ...f, interval: e.target.value as PlanInterval }))}>
              <option value="MONTH">Mensual</option>
              <option value="YEAR">Anual</option>
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Moneda</label>
            <input className="input-control" value={planForm.moneda} onChange={e => setPlanForm(f => ({ ...f, moneda: e.target.value }))} placeholder="ARS" />
          </div>
        </div>
        <div className="input-group">
          <label className="input-label">Precio *</label>
          <input className="input-control" type="number" step="0.01" value={planForm.precio as string} onChange={e => setPlanForm(f => ({ ...f, precio: e.target.value }))} placeholder="0.00" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)' }}>
          <div className="input-group">
            <label className="input-label">Máx. usuarios</label>
            <input className="input-control" type="number" value={planForm.maxUsuarios ?? ''} onChange={e => setPlanForm(f => ({ ...f, maxUsuarios: e.target.value ? parseInt(e.target.value) : undefined }))} placeholder="∞" />
          </div>
          <div className="input-group">
            <label className="input-label">Máx. sucursales</label>
            <input className="input-control" type="number" value={planForm.maxSucursales ?? ''} onChange={e => setPlanForm(f => ({ ...f, maxSucursales: e.target.value ? parseInt(e.target.value) : undefined }))} placeholder="∞" />
          </div>
          <div className="input-group">
            <label className="input-label">Máx. vehículos</label>
            <input className="input-control" type="number" value={planForm.maxVehiculos ?? ''} onChange={e => setPlanForm(f => ({ ...f, maxVehiculos: e.target.value ? parseInt(e.target.value) : undefined }))} placeholder="∞" />
          </div>
        </div>
        <div className="input-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-primary)', fontSize: 'var(--text-sm)', textTransform: 'none', letterSpacing: 0, fontWeight: 500 }}>
            <input type="checkbox" checked={planForm.activo ?? true} onChange={e => setPlanForm(f => ({ ...f, activo: e.target.checked }))} style={{ accentColor: 'var(--accent)' }} />
            Plan activo
          </label>
        </div>
      </Modal>

      {/* ── MODAL: SUSCRIPCIÓN ── */}
      {selectedConcSub && (
        <Modal
          isOpen={showSubModal}
          onClose={() => setShowSubModal(false)}
          title={`Gestionar Suscripción — ${selectedConcSub.nombre}`}
          maxWidth="520px"
          footer={(
            <>
              <Button variant="secondary" onClick={() => setShowSubModal(false)}>Cancelar</Button>
              <Button variant="primary" onClick={handleSaveSub} loading={savingSub}>
                Guardar
              </Button>
            </>
          )}
        >
          {subscriptions[selectedConcSub.id]?.status === 'past_due' && (
            <div className="uploader-alert uploader-alert-error" style={{ marginBottom: 'var(--space-4)' }}>
              <AlertTriangle size={14} />
              <span>Suscripción vencida — se recomienda actualizar el estado</span>
            </div>
          )}
          <div className="input-group">
            <label className="input-label">Plan *</label>
            <select className="input-control" value={subForm.planId} onChange={e => setSubForm(f => ({ ...f, planId: parseInt(e.target.value) }))}>
              <option value={0}>— Seleccionar plan —</option>
              {planes.map(p => <option key={p.id} value={p.id}>{p.nombre} ({INTERVAL_LABELS[p.interval]})</option>)}
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Estado</label>
            <select className="input-control" value={subForm.status} onChange={e => setSubForm(f => ({ ...f, status: e.target.value as SubscriptionStatus }))}>
              {(Object.keys(SUB_STATUS_LABELS) as SubscriptionStatus[]).map(s => {
                const current = subscriptions[selectedConcSub.id]?.status;
                const allowed = current ? (NEXT_STATUSES[current] ?? []) : Object.keys(SUB_STATUS_LABELS) as SubscriptionStatus[];
                const isDisabled = current && s !== current && !allowed.includes(s);
                return <option key={s} value={s} disabled={!!isDisabled}>{SUB_STATUS_LABELS[s]}</option>;
              })}
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Trial hasta</label>
            <input className="input-control" type="date" value={subForm.trialEndsAt} onChange={e => setSubForm(f => ({ ...f, trialEndsAt: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="input-group">
              <label className="input-label">Período desde</label>
              <input className="input-control" type="date" value={subForm.currentPeriodStart} onChange={e => setSubForm(f => ({ ...f, currentPeriodStart: e.target.value }))} />
            </div>
            <div className="input-group">
              <label className="input-label">Período hasta</label>
              <input className="input-control" type="date" value={subForm.currentPeriodEnd} onChange={e => setSubForm(f => ({ ...f, currentPeriodEnd: e.target.value }))} />
            </div>
          </div>
        </Modal>
      )}

      {/* ── MODAL: NUEVA FACTURA ── */}
      <Modal
        isOpen={showCreateInvModal}
        onClose={() => setShowCreateInvModal(false)}
        title="Nueva Factura"
        maxWidth="540px"
        footer={(
          <>
            <Button variant="secondary" onClick={() => setShowCreateInvModal(false)}>Cancelar</Button>
            <Button variant="primary" onClick={handleCreateInvoice} loading={savingInv} disabled={!invForm.subscriptionId}>
              Crear factura
            </Button>
          </>
        )}
      >
        <div className="input-group">
          <label className="input-label">Concesionaria *</label>
          <select
            className="input-control"
            value={invForm.concesionariaId}
            onChange={e => handleConcChangeInv(parseInt(e.target.value))}
          >
            <option value={0}>— Seleccionar —</option>
            {concesionarias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          {invFormSubLoading && <span className="input-feedback">Buscando suscripción…</span>}
          {invForm.subscriptionId > 0 && <span className="input-feedback" style={{ color: 'var(--success)' }}>✓ Suscripción #{invForm.subscriptionId} encontrada</span>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <div className="input-group">
            <label className="input-label">Número</label>
            <input className="input-control" value={invForm.numero} onChange={e => setInvForm(f => ({ ...f, numero: e.target.value }))} placeholder="Auto" />
          </div>
          <div className="input-group">
            <label className="input-label">Moneda</label>
            <input className="input-control" value={invForm.moneda} onChange={e => setInvForm(f => ({ ...f, moneda: e.target.value }))} />
          </div>
          <div className="input-group">
            <label className="input-label">Período desde *</label>
            <input className="input-control" type="date" value={invForm.periodoDesde} onChange={e => setInvForm(f => ({ ...f, periodoDesde: e.target.value }))} />
          </div>
          <div className="input-group">
            <label className="input-label">Período hasta *</label>
            <input className="input-control" type="date" value={invForm.periodoHasta} onChange={e => setInvForm(f => ({ ...f, periodoHasta: e.target.value }))} />
          </div>
          <div className="input-group">
            <label className="input-label">Subtotal</label>
            <input className="input-control" type="number" step="0.01" value={invForm.subtotal} onChange={e => setInvForm(f => ({ ...f, subtotal: e.target.value }))} placeholder="0.00" />
          </div>
          <div className="input-group">
            <label className="input-label">Impuestos</label>
            <input className="input-control" type="number" step="0.01" value={invForm.impuestos} onChange={e => setInvForm(f => ({ ...f, impuestos: e.target.value }))} placeholder="0.00" />
          </div>
        </div>
        <div className="input-group">
          <label className="input-label">Total *</label>
          <input className="input-control" type="number" step="0.01" value={invForm.total} onChange={e => setInvForm(f => ({ ...f, total: e.target.value }))} placeholder="0.00" />
        </div>
        <div className="input-group">
          <label className="input-label">Vencimiento</label>
          <input className="input-control" type="date" value={invForm.dueDate} onChange={e => setInvForm(f => ({ ...f, dueDate: e.target.value }))} />
        </div>
      </Modal>

      {/* ── MODAL: DETALLE FACTURA / PAGOS ── */}
      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onAddPayment={(inv) => { setPayInvoice(inv); setPayForm({ monto: '', moneda: inv.moneda, metodo: 'transferencia' }); setShowPayModal(true); }}
        />
      )}

      {/* ── MODAL: REGISTRAR PAGO ── */}
      {payInvoice && (
        <Modal
          isOpen={showPayModal}
          onClose={() => { setShowPayModal(false); setPayInvoice(null); }}
          title={`Registrar Pago — ${payInvoice.numero ?? `Factura #${payInvoice.id}`}`}
          maxWidth="460px"
          footer={(
            <>
              <Button variant="secondary" onClick={() => { setShowPayModal(false); setPayInvoice(null); }}>Cancelar</Button>
              <Button variant="primary" onClick={handleRegisterPayment} loading={savingPay}>
                Registrar pago
              </Button>
            </>
          )}
        >
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            <span>Total factura: </span>
            <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums' }}>
              {payInvoice.moneda} {parseFloat(payInvoice.total).toLocaleString('es-AR')}
            </strong>
          </div>
          <div className="input-group">
            <label className="input-label">Monto *</label>
            <input className="input-control" type="number" step="0.01" value={payForm.monto} onChange={e => setPayForm(f => ({ ...f, monto: e.target.value }))} placeholder="0.00" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="input-group">
              <label className="input-label">Moneda</label>
              <input className="input-control" value={payForm.moneda} onChange={e => setPayForm(f => ({ ...f, moneda: e.target.value }))} />
            </div>
            <div className="input-group">
              <label className="input-label">Método</label>
              <select className="input-control" value={payForm.metodo} onChange={e => setPayForm(f => ({ ...f, metodo: e.target.value as MetodoPago }))}>
                {METODOS.map(m => <option key={m} value={m} style={{ textTransform: 'capitalize' }}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
              </select>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
