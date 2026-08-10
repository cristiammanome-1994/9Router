import type { RelatorioCompilado } from '../types';
import { formatCurrency, formatNumber } from '../utils/format';

interface RelatorioCompiladoProps {
  relatorio: RelatorioCompilado;
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

export function RelatorioCompiladoView({ relatorio }: RelatorioCompiladoProps) {
  const t = relatorio.totais;
  const diffVariant = t.diferencialTotal > 0 ? 'negative' : 'positive';
  const cargaMediaPct = t.valorTotal > 0 ? (t.cargaTributariaNova / t.valorTotal) * 100 : 0;

  return (
    <div className="compilado-view">
      <div className="compilado-header">
        <h2>Relatório Compilado</h2>
        <p className="compilado-info">
          {t.quantidadeNotas} NF-e(s) selecionada(s) &middot; {t.quantidadeItens} item(ns) &middot;
          {relatorio.duplicados.length > 0 && (
            <span className="duplicate-warning"> ⚠ {relatorio.duplicados.length} duplicada(s) ignorada(s)</span>
          )}
        </p>
      </div>

      {relatorio.duplicados.length > 0 && (
        <div className="duplicate-banner">
          <strong>NF-e duplicadas detectadas (mesma chave de acesso):</strong>
          <div className="duplicate-list">
            {relatorio.duplicados.map((d) => (
              <span key={d.id} className="duplicate-tag">
                {d.result.data?.chave || d.fileName}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="summary-grid">
        <Card label="Notas Selecionadas" value={String(t.quantidadeNotas)} subtitle={`${t.quantidadeItens} itens`} variant="highlight" />
        <Card label="Valor Total Geral" value={formatCurrency(t.valorTotal)} />
        <Card label="Carga Tributária Atual" value={formatCurrency(t.cargaTributariaAtual)} subtitle="ICMS + IPI + PIS + COFINS" />
        <Card label="Carga Nova (CBS + IBS)" value={formatCurrency(t.cargaTributariaNova)} subtitle={`${formatNumber(cargaMediaPct)}% sobre valor`} />
        <Card
          label="Diferencial Total"
          value={formatCurrency(t.diferencialTotal)}
          subtitle={t.diferencialTotal > 0 ? 'Aumento de carga' : 'Redução de carga'}
          variant={diffVariant}
        />
        <Card label="CBS Total" value={formatCurrency(t.cbsTotal)} />
        <Card label="IBS Total" value={formatCurrency(t.ibsTotal)} />
      </div>

      <div className="breakdown-section">
        <h3>Detalhamento por Imposto (Atual)</h3>
        <div className="breakdown-grid">
          <div className="breakdown-item">
            <span className="breakdown-label">ICMS</span>
            <span className="breakdown-value">{formatCurrency(t.icmsTotal)}</span>
          </div>
          <div className="breakdown-item">
            <span className="breakdown-label">IPI</span>
            <span className="breakdown-value">{formatCurrency(t.ipiTotal)}</span>
          </div>
          <div className="breakdown-item">
            <span className="breakdown-label">PIS</span>
            <span className="breakdown-value">{formatCurrency(t.pisTotal)}</span>
          </div>
          <div className="breakdown-item">
            <span className="breakdown-label">COFINS</span>
            <span className="breakdown-value">{formatCurrency(t.cofinsTotal)}</span>
          </div>
        </div>
      </div>

      <div className="compilado-table-section">
        <h3>Por Categoria Tributária</h3>
        <div className="table-scroll">
          <table className="items-table">
            <thead>
              <tr>
                <th>Categoria</th>
                <th className="num">Qtde</th>
                <th className="num">Valor Total</th>
                <th className="num">Carga Atual</th>
                <th className="num">CBS</th>
                <th className="num">IBS</th>
                <th className="num">Carga Nova</th>
                <th className="num">Diferencial</th>
              </tr>
            </thead>
            <tbody>
              {relatorio.categorias.map((c, i) => (
                <tr key={i} className={c.diferencial > 0 ? 'row-increase' : ''}>
                  <td>{c.categoriaTributaria}</td>
                  <td className="num">{c.quantidadeItens}</td>
                  <td className="num">{formatCurrency(c.valorTotal)}</td>
                  <td className="num">{formatCurrency(c.cargaTributariaAtual)}</td>
                  <td className="num">{formatCurrency(c.cbsTotal)}</td>
                  <td className="num">{formatCurrency(c.ibsTotal)}</td>
                  <td className="num">{formatCurrency(c.cargaTributariaNova)}</td>
                  <td className={`num ${c.diferencial > 0 ? 'text-negative' : 'text-positive'}`}>
                    {formatCurrency(c.diferencial)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="compilado-table-section">
        <h3>Por NCM</h3>
        <div className="table-scroll">
          <table className="items-table">
            <thead>
              <tr>
                <th>NCM</th>
                <th>Descrição (1º item)</th>
                <th className="num">Qtde</th>
                <th className="num">Valor Total</th>
                <th className="num">Carga Atual</th>
                <th className="num">Carga Nova</th>
                <th className="num">Diferencial</th>
              </tr>
            </thead>
            <tbody>
              {relatorio.ncms.slice(0, 50).map((n, i) => (
                <tr key={i} className={n.diferencial > 0 ? 'row-increase' : ''}>
                  <td className="mono">{n.ncm}</td>
                  <td className="desc-col">{n.descricao}</td>
                  <td className="num">{n.quantidadeItens}</td>
                  <td className="num">{formatCurrency(n.valorTotal)}</td>
                  <td className="num">{formatCurrency(n.cargaTributariaAtual)}</td>
                  <td className="num">{formatCurrency(n.cargaTributariaNova)}</td>
                  <td className={`num ${n.diferencial > 0 ? 'text-negative' : 'text-positive'}`}>
                    {formatCurrency(n.diferencial)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {relatorio.ncms.length > 50 && (
            <p className="table-footer-note">
              Exibindo 50 de {relatorio.ncms.length} NCMs distintos.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}