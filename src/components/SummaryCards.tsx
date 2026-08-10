import type { NFeData, NFeTotais } from '../types';
import { formatCurrency } from '../utils/format';

interface SummaryCardsProps {
  data: NFeData;
}

function Card({ label, value, subtitle, variant }: { label: string; value: string; subtitle?: string; variant?: 'default' | 'positive' | 'negative' | 'highlight' }) {
  const className = `summary-card ${variant ? `variant-${variant}` : ''}`;
  return (
    <div className={className}>
      <span className="summary-label">{label}</span>
      <span className="summary-value">{value}</span>
      {subtitle && <span className="summary-subtitle">{subtitle}</span>}
    </div>
  );
}

export function SummaryCards({ data }: SummaryCardsProps) {
  const t: NFeTotais = data.totais;
  const diffVariant = t.diferencialTotal > 0 ? 'negative' : 'positive';

  return (
    <div className="summary-grid">
      <Card label="Valor Total da Nota" value={formatCurrency(t.valorTotal)} variant="highlight" />
      <Card label="Carga Tributária Atual" value={formatCurrency(t.cargaTributariaAtual)} subtitle={`ICMS + IPI + PIS + COFINS`} />
      <Card label="Carga Nova (CBS + IBS)" value={formatCurrency(t.cargaTributariaNova)} subtitle="Reforma Tributária" />
      <Card
        label="Diferencial de Carga"
        value={formatCurrency(t.diferencialTotal)}
        subtitle={t.diferencialTotal > 0 ? 'Aumento de carga' : 'Redução de carga'}
        variant={diffVariant}
      />
      <Card label="CBS Total" value={formatCurrency(t.cbsTotal)} subtitle="Contribuição sobre Bens e Serviços" />
      <Card label="IBS Total" value={formatCurrency(t.ibsTotal)} subtitle="Imposto sobre Bens e Serviços" />
    </div>
  );
}
