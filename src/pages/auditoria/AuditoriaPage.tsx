import { useState, useEffect, useCallback } from 'react';
import { Search, Download, Eye, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { auditoriaApi } from '../../api/auditoria.api';
import type { AuditLog, AccionAudit, AuditLogFilter } from '../../api/auditoria.api';
import { useUIStore } from '../../store/uiStore';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';

const ACCIONES: AccionAudit[] = ['create', 'update', 'cancel', 'delete_soft', 'login', 'logout'];

const accionColor: Record<AccionAudit, string> = {
  create: 'status-badge status-activo',
  update: 'status-badge status-pendiente',
  cancel: 'status-badge status-cancelado',
  delete_soft: 'status-badge status-cancelado',
  login: 'status-badge status-activo',
  logout: 'status-badge status-inactivo',
};

const accionLabel: Record<AccionAudit, string> = {
  create: 'Crear',
  update: 'Actualizar',
  cancel: 'Cancelar',
  delete_soft: 'Eliminar',
  login: 'Login',
  logout: 'Logout',
};

interface DetailModalProps {
  log: AuditLog | null;
  onClose: () => void;
}

const dlStyle: React.CSSProperties = { fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 };

const DetailModal = ({ log, onClose }: DetailModalProps) => (
  <Modal
    isOpen={log !== null}
    onClose={onClose}
    title="Detalle de Registro"
    maxWidth="540px"
    footer={<Button variant="secondary" onClick={onClose}>Cerrar</Button>}
  >
    {log && (
      <>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <div>
            <div style={dlStyle}>ID</div>
            <div style={{ fontWeight: 600 }}>#{log.id}</div>
          </div>
          <div>
            <div style={dlStyle}>Fecha</div>
            <div>{new Date(log.createdAt).toLocaleString('es-AR')}</div>
          </div>
          <div>
            <div style={dlStyle}>Usuario</div>
            <div>{log.usuario ? `${log.usuario.nombre} (${log.usuario.email})` : '—'}</div>
          </div>
          <div>
            <div style={dlStyle}>Acción</div>
            <span className={accionColor[log.accion]}>{accionLabel[log.accion]}</span>
          </div>
          <div>
            <div style={dlStyle}>Entidad</div>
            <div style={{ fontWeight: 500 }}>{log.entidad}</div>
          </div>
          <div>
            <div style={dlStyle}>ID Entidad</div>
            <div>{log.entidadId ?? '—'}</div>
          </div>
          <div>
            <div style={dlStyle}>IP</div>
            <div>{log.ip ?? '—'}</div>
          </div>
          <div>
            <div style={dlStyle}>Usuario ID</div>
            <div>{log.usuarioId ?? '—'}</div>
          </div>
        </div>
        {log.userAgent && (
          <div style={{ marginTop: 'var(--space-4)' }}>
            <div style={dlStyle}>User Agent</div>
            <div style={{ fontSize: '0.8rem', wordBreak: 'break-all', color: 'var(--text-secondary)' }}>{log.userAgent}</div>
          </div>
        )}
        {log.detalle && (
          <div style={{ marginTop: 'var(--space-4)' }}>
            <div style={dlStyle}>Detalle</div>
            <pre style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-3)',
              fontSize: '0.8rem',
              fontFamily: 'var(--font-mono)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              maxHeight: 200,
              overflow: 'auto',
            }}>
              {log.detalle}
            </pre>
          </div>
        )}
      </>
    )}
  </Modal>
);

export default function AuditoriaPage() {
  const { addToast } = useUIStore();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Filtros
  const [search, setSearch] = useState('');
  const [filterAccion, setFilterAccion] = useState('');
  const [filterEntidad, setFilterEntidad] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const buildFilter = useCallback((): AuditLogFilter => {
    const f: AuditLogFilter = { page, limit: 50 };
    if (filterAccion) f.accion = filterAccion as AccionAudit;
    if (filterEntidad) f.entidad = filterEntidad;
    if (filterStartDate) f.startDate = filterStartDate;
    if (filterEndDate) f.endDate = filterEndDate;
    return f;
  }, [page, filterAccion, filterEntidad, filterStartDate, filterEndDate]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await auditoriaApi.getAll(buildFilter()) as { results?: AuditLog[]; totalPages?: number; totalResults?: number };
      const results: AuditLog[] = res?.results ?? [];
      setLogs(results);
      if (res?.totalPages) setTotalPages(res.totalPages);
      if (res?.totalResults) setTotalResults(res.totalResults);
    } catch {
      addToast('Error al cargar el log de auditoría', 'error');
    } finally {
      setLoading(false);
    }
  }, [buildFilter, addToast]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSearch = () => {
    setPage(1);
    fetchLogs();
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await auditoriaApi.exportCsv(buildFilter()) as Blob;
      const url = window.URL.createObjectURL(new Blob([res]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `auditoria_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      addToast('Exportación iniciada', 'success');
    } catch {
      addToast('Error al exportar', 'error');
    } finally {
      setExporting(false);
    }
  };

  const filteredLogs = logs.filter(l => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      l.entidad.toLowerCase().includes(q) ||
      (l.usuario?.nombre?.toLowerCase().includes(q) ?? false) ||
      (l.usuario?.email?.toLowerCase().includes(q) ?? false) ||
      (l.detalle?.toLowerCase().includes(q) ?? false)
    );
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Auditoría</h1>
          <p className="page-subtitle">Log de todas las operaciones del sistema ({totalResults} registros)</p>
        </div>
        <button className="btn btn-secondary" onClick={handleExport} disabled={exporting}>
          <Download size={16} />
          {exporting ? 'Exportando...' : 'Exportar CSV'}
        </button>
      </div>

      {/* Filtros */}
      <div className="filters-bar glass">
        <div className="filters-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Buscar por entidad, usuario o detalle…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <div className="filters-selects">
          <div className="filter-field">
            <label className="input-label">Acción</label>
            <select className="input-control" value={filterAccion} onChange={e => { setFilterAccion(e.target.value); setPage(1); }}>
              <option value="">Todas las acciones</option>
              {ACCIONES.map(a => <option key={a} value={a}>{accionLabel[a]}</option>)}
            </select>
          </div>
          <div className="filter-field">
            <label className="input-label">Entidad</label>
            <input className="input-control" type="text" placeholder="ej: Vehiculo" value={filterEntidad} onChange={e => { setFilterEntidad(e.target.value); setPage(1); }} />
          </div>
          <div className="filter-field">
            <label className="input-label">Desde</label>
            <input className="input-control" type="date" value={filterStartDate} onChange={e => { setFilterStartDate(e.target.value); setPage(1); }} />
          </div>
          <div className="filter-field">
            <label className="input-label">Hasta</label>
            <input className="input-control" type="date" value={filterEndDate} onChange={e => { setFilterEndDate(e.target.value); setPage(1); }} />
          </div>
          <div className="filter-field" style={{ justifyContent: 'flex-end' }}>
            <Button variant="primary" size="sm" onClick={handleSearch}>
              <Search size={14} /> Buscar
            </Button>
            <Button variant="secondary" size="sm" onClick={() => { setSearch(''); setFilterAccion(''); setFilterEntidad(''); setFilterStartDate(''); setFilterEndDate(''); setPage(1); }}>
              <RefreshCw size={14} /> Limpiar
            </Button>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="glass table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Usuario</th>
              <th>Entidad</th>
              <th>ID</th>
              <th>Acción</th>
              <th>Detalle</th>
              <th>IP</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Cargando...</td></tr>
            ) : filteredLogs.length === 0 ? (
              <tr><td colSpan={8}>
                <div className="dt-empty">
                  <div className="dt-empty-badge"><Search size={36} /></div>
                  <p className="dt-empty-text">Sin registros</p>
                </div>
              </td></tr>
            ) : filteredLogs.map(log => (
              <tr key={log.id}>
                <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>{new Date(log.createdAt).toLocaleString('es-AR')}</td>
                <td style={{ fontSize: '0.85rem' }}>
                  {log.usuario ? (
                    <div>
                      <div style={{ fontWeight: 500 }}>{log.usuario.nombre}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{log.usuario.email}</div>
                    </div>
                  ) : '—'}
                </td>
                <td style={{ fontWeight: 500 }}>{log.entidad}</td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{log.entidadId ?? '—'}</td>
                <td><span className={accionColor[log.accion]}>{accionLabel[log.accion]}</span></td>
                <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  {log.detalle ?? '—'}
                </td>
                <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{log.ip ?? '—'}</td>
                <td>
                  <button className="btn-icon" title="Ver detalle" onClick={() => setSelectedLog(log)}>
                    <Eye size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="pagination">
          <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Página {page} de {totalPages}
          </span>
          <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      <DetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  );
}
