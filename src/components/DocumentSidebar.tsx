import type { UploadResult } from '../types';
import { formatCurrency, formatDate } from '../utils/format';

interface DocumentSidebarProps {
  results: UploadResult[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onToggleSelect: (id: string) => void;
  onSelectAll: (selected: boolean) => void;
  onRemove: (id: string) => void;
}

export function DocumentSidebar({
  results,
  activeId,
  onSelect,
  onToggleSelect,
  onSelectAll,
  onRemove,
}: DocumentSidebarProps) {
  const successResults = results.filter((r) => r.result.success);
  const allSelected = successResults.length > 0 && successResults.every((r) => r.selected);

  if (results.length === 0) return null;

  return (
    <aside className="doc-sidebar">
      <div className="sidebar-header">
        <h3>Documentos ({successResults.length})</h3>
        {successResults.length > 0 && (
          <button className="sidebar-select-all" onClick={() => onSelectAll(!allSelected)}>
            {allSelected ? 'Desmarcar todos' : 'Selecionar todos'}
          </button>
        )}
      </div>

      <div className="sidebar-list">
        {results.map((r) => {
          const isActive = r.id === activeId;
          const hasError = !r.result.success;
          const isDuplicate = r.result.isDuplicate;

          return (
            <div
              key={r.id}
              className={`sidebar-item ${isActive ? 'active' : ''} ${hasError ? 'error' : ''} ${isDuplicate ? 'duplicate' : ''} ${!r.selected ? 'unselected' : ''}`}
              onClick={() => !hasError && onSelect(r.id)}
            >
              <label className="sidebar-checkbox" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={r.selected}
                  disabled={hasError}
                  onChange={() => onToggleSelect(r.id)}
                />
              </label>

              <div className="sidebar-item-content">
                <div className="sidebar-item-name">
                  {r.result.data?.numero ? `#${r.result.data.numero}` : r.fileName}
                  {isDuplicate && <span className="badge badge-duplicate" title="NF-e duplicada">DUP</span>}
                  {r.source === 'zip' && <span className="badge badge-zip" title="Veio de arquivo ZIP">ZIP</span>}
                </div>
                <div className="sidebar-item-meta">
                  <span className="sidebar-item-emitente">
                    {r.result.data?.emitente?.nome || r.fileName}
                  </span>
                  {r.zipName && <span className="sidebar-item-zip">de: {r.zipName}</span>}
                </div>
                <div className="sidebar-item-footer">
                  {hasError ? (
                    <span className="sidebar-error">Erro</span>
                  ) : (
                    <>
                      <span className="sidebar-date">{formatDate(r.result.data?.dataEmissao)}</span>
                      <span className={`sidebar-dif ${r.result.data && r.result.data.totais.diferencialTotal > 0 ? 'text-negative' : 'text-positive'}`}>
                        {formatCurrency(r.result.data?.totais.diferencialTotal || 0)}
                      </span>
                    </>
                  )}
                </div>
                {hasError && (
                  <div className="sidebar-item-error">{r.result.error}</div>
                )}
              </div>

              <button
                className="sidebar-remove"
                onClick={(e) => { e.stopPropagation(); onRemove(r.id); }}
                title="Remover"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
