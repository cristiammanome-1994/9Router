import type { UploadResult } from '../types';
import { formatCurrency } from '../utils/format';

interface ErrorListProps {
  results: UploadResult[];
}

export function ErrorList({ results }: ErrorListProps) {
  const errors = results.filter((r) => !r.result.success);

  if (errors.length === 0) return null;

  return (
    <div className="error-list">
      <h3>Arquivos com erro ({errors.length})</h3>
      {errors.map((r, i) => (
        <div key={i} className="error-item">
          <strong>{r.fileName}</strong>
          <span>{r.result.error}</span>
        </div>
      ))}
    </div>
  );
}

interface DocumentTabsProps {
  results: UploadResult[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

export function DocumentTabs({ results, activeIndex, onSelect }: DocumentTabsProps) {
  const successCount = results.filter((r) => r.result.success).length;

  return (
    <div className="doc-tabs">
      <div className="doc-tabs-header">
        <span>{successCount} documento(s) analisado(s)</span>
      </div>
      <div className="doc-tabs-list">
        {results.map((r, i) => (
          <button
            key={i}
            className={`doc-tab ${i === activeIndex ? 'active' : ''} ${!r.result.success ? 'error' : ''}`}
            onClick={() => onSelect(i)}
          >
            {r.fileName}
            {r.result.success && r.result.data && (
              <span className="tab-badge">
                {formatCurrency(r.result.data.totais.diferencialTotal)}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
