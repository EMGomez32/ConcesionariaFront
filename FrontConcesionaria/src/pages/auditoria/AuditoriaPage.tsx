import { useState, useEffect, useCallback } from 'react';
import { Search, Download, Eye, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { auditoriaApi } from '../../api/auditoria.api';
import type { AuditLog, AccionAudit, AuditLogFilter } from '../../api/auditoria.api';
import { useUIStore } from '../../store/uiStore';

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
  log: AuditLog;
  onClose: () => void;
}

const DetailModal = ({ log, onClose }: DetailModalProps) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
      <div className="modal-header">
        <h3>Detalle de Registro</h3>
        <button className="btn-icon" onClick={onClose}><X size={20} /></button>
      </div>
      <div className="modal-body">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 2 }}>ID</div>
            <div style={{ fontWeight: 600 }}>#{log.id}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 2 }}>Fecha</div>
            <div>{new Date(log.createdAt).toLocaleString('es-AR')}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 2 }}>Usuario</div>
            <div>{log.usuario ? `${log.usuario.nombre} (${log.usuario.email})` : '—'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 2 }}>Acción</div>
            <span className={accionColor[log.accion]}>{accionLabel[log.accion]}</span>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 2 }}>Entidad</div>
            <div style={{ fontWeight: 500 }}>{log.entidad}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 2 }}>ID Entidad</div>
            <div>{log.entidadId ?? '—'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 2 }}>IP</div>
            <div>{log.ip ?? '—'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 2 }}>Usuario ID</div>
            <div>{log.usuarioId ?? '—'}</div>
          </div>
        </div>
        {log.userAgent && (
          <div style={{ marginTop: '0.75rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 2 }}>User Agent</div>
            <div style={{ fontSize: '0.8rem', wordBreak: 'break-all', color: 'var(--text-secondary)' }}>{log.userAgent}</div>
          </div>
        )}
        {log.detalle && (
          <div style={{ marginTop: '0.75rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 2 }}>Detalle</div>
            <pre style={{
              background: 'var(--bg-secondary)',
              borderRadius: '0.5rem',
              padding: '0.75rem',
              fontSize: '0.8rem',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              maxHeight: 200,
              overflow: 'auto',
            }}>
              {log.detalle}
            </pre>
          </div>
        )}
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
      </div>
    </div>
  </div>
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
      const res = await auditoriaApi.getAll(buildFilter());
      const data = res.data?.data;
      const results: AuditLog[] = data?.results ?? data ?? [];
      setLogs(results);
      if (data?.totalPages) setTotalPages(data.totalPages);
      if (data?.totalResults) setTotalResults(data.totalResults);
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
      const res = await auditoriaApi.exportCsv(buildFilter());
      const url = window.URL.createObjectURL(new Blob([res.data]));
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
      <div className="glass" style={{ padding: '1rem', marginBottom: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 180px' }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Buscar</label>
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Entidad, usuario, detalle..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
        </div>
        <div style={{ flex: '1 1 140px' }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Acción</label>
          <select className="form-select" value={filterAccion} onChange={e => { setFilterAccion(e.target.value); setPage(1); }}>
            <option value="">Todas</option>
            {ACCIONES.map(a => <option key={a} value={a}>{accionLabel[a]}</option>)}
          </select>
        </div>
        <div style={{ flex: '1 1 140px' }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Entidad</label>
          <input className="form-input" type="text" placeholder="ej: Vehiculo" value={filterEntidad} onChange={e => { setFilterEntidad(e.target.value); setPage(1); }} />
        </div>
        <div style={{ flex: '1 1 140px' }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Desde</label>
          <input className="form-input" type="date" value={filterStartDate} onChange={e => { setFilterStartDate(e.target.value); setPage(1); }} />
        </div>
        <div style={{ flex: '1 1 140px' }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Hasta</label>
          <input className="form-input" type="date" value={filterEndDate} onChange={e => { setFilterEndDate(e.target.value); setPage(1); }} />
        </div>
        <button className="btn btn-primary" onClick={handleSearch}>
          <Search size={16} /> Buscar
        </button>
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
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Sin registros</td></tr>
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

      {selectedLog && <DetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />}
    </div>
  );
}
