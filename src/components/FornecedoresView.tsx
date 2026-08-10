import type { AnaliseFornecedores } from '../types';
import { formatCurrency, formatPercent } from '../utils/format';

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

export function FornecedoresView({ analise }: { analise: AnaliseFornecedores }) {
  const { fornecedores, totaisGeral } = analise;
  const diffVariant = totaisGeral.diferencial > 0 ? 'negative' : 'positive';
  const mediaPctAtual = totaisGeral.valorTotal > 0 ? (totaisGeral.cargaTributariaAtual / totaisGeral.valorTotal) * 100 : 0;
  const mediaPctNova = totaisGeral.valorTotal > 0 ? (totaisGeral.cargaTributariaNova / totaisGeral.valorTotal) * 100 : 0;

  return (
    <div className="fornecedores-view">
      <div className="compilado-header">
        <h2>Análise de Fornecedores</h2>
        <p className="compilado-info">
          {totaisGeral.quantidadeFornecedores} fornecedor(es) &middot; {totaisGeral.quantidadeNotas} nota(s) &middot; {totaisGeral.quantidadeItens} item(ns)
        </p>
      </div>

      <div className="summary-grid">
        <Card label="Fornecedores Únicos" value={String(totaisGeral.quantidadeFornecedores)} subtitle={`${totaisGeral.quantidadeNotas} notas`} variant="highlight" />
        <Card label="Valor Total Compras" value={formatCurrency(totaisGeral.valorTotal)} />
        <Card label="Carga Tributária Atual" value={formatCurrency(totaisGeral.cargaTributariaAtual)} subtitle={`Média: ${formatPercent(mediaPctAtual)}`} />
        <Card label="Carga Nova (CBS + IBS)" value={formatCurrency(totaisGeral.cargaTributariaNova)} subtitle={`Média: ${formatPercent(mediaPctNova)}`} />
        <Card
          label="Diferencial Total"
          value={formatCurrency(totaisGeral.diferencial)}
          subtitle={totaisGeral.diferencial > 0 ? 'Aumento de carga' : 'Redução de carga'}
          variant={diffVariant}
        />
      </div>

      <div className="fornecedores-table-section">
        <h3>Detalhamento por Fornecedor</h3>
        <div className="table-scroll">
          <table className="items-table">
            <thead>
              <tr>
                <th>CNPJ</th>
                <th>Fornecedor</th>
                <th>UF/Município</th>
                <th className="num">Notas</th>
                <th className="num">Itens</th>
                <th className="num">Valor Total</th>
                <th className="num">Carga Atual</th>
                <th className="num">CBS</th>
                <th className="num">IBS</th>
                <th className="num">Carga Nova</th>
                <th className="num">Diferencial</th>
                <th className="num">% Atual</th>
                <th className="num">% Nova</th>
                <th>NCMs</th>
              </tr>
            </thead>
            <tbody>
              {fornecedores.map((f, i) => (
                <tr key={i} className={f.diferencial > 0 ? 'row-increase' : ''}>
                  <td className="mono">{f.cnpj}</td>
                  <td className="desc-col">{f.nome}</td>
                  <td>{f.uf} / {f.municipio}</td>
                  <td className="num">{f.quantidadeNotas}</td>
                  <td className="num">{f.quantidadeItens}</td>
                  <td className="num"><strong>{formatCurrency(f.valorTotal)}</strong></td>
                  <td className="num">{formatCurrency(f.cargaTributariaAtual)}</td>
                  <td className="num">{formatCurrency(f.cbsTotal)}</td>
                  <td className="num">{formatCurrency(f.ibsTotal)}</td>
                  <td className="num"><strong>{formatCurrency(f.cargaTributariaNova)}</strong></td>
                  <td className={`num ${f.diferencial > 0 ? 'text-negative' : 'text-positive'}`}>
                    {formatCurrency(f.diferencial)}
                  </td>
                  <td className="num">{formatPercent(f.cargaPercentualAtual)}</td>
                  <td className="num">{formatPercent(f.cargaPercentualNova)}</td>
                  <td className="small">
                    {f.ncms.slice(0, 5).join(', ')}
                    {f.ncms.length > 5 && <span> +{f.ncms.length - 5}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="fornecedores-insights">
        <h3>Insights</h3>
        <div className="insights-grid">
          <div className="insight-card">
            <h4>Top 5 Fornecedores por Valor</h4>
            <table className="insight-table">
              <thead>
                <tr><th>Fornecedor</th><th className="num">Valor</th><th className="num">% Total</th></tr>
              </thead>
              <tbody>
                {fornecedores.slice(0, 5).map((f, i) => (
                  <tr key={i}>
                    <td>{f.nome}</td>
                    <td className="num">{formatCurrency(f.valorTotal)}</td>
                    <td className="num">{formatPercent(totaisGeral.valorTotal > 0 ? (f.valorTotal / totaisGeral.valorTotal) * 100 : 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="insight-card">
            <h4>Maiores Diferenciais (Impacto Reforma)</h4>
            <table className="insight-table">
              <thead>
                <tr><th>Fornecedor</th><th className="num">Diferencial</th><th className="num">% Carga Atual</th></tr>
              </thead>
              <tbody>
                {fornecedores
                  .filter(f => f.diferencial !== 0)
                  .sort((a, b) => Math.abs(b.diferencial) - Math.abs(a.diferencial))
                  .slice(0, 5)
                  .map((f, i) => (
                    <tr key={i} className={f.diferencial > 0 ? 'row-increase' : ''}>
                      <td>{f.nome}</td>
                      <td className={`num ${f.diferencial > 0 ? 'text-negative' : 'text-positive'}`}>
                        {formatCurrency(f.diferencial)}
                      </td>
                      <td className="num">{formatPercent(f.cargaPercentualAtual)} → {formatPercent(f.cargaPercentualNova)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div className="insight-card">
            <h4>Por Estado (UF)</h4>
            <table className="insight-table">
              <thead>
                <tr><th>UF</th><th className="num">Fornecedores</th><th className="num">Valor</th><th className="num">% Carga Nova</th></tr>
              </thead>
              <tbody>
                {Object.entries(
                  fornecedores.reduce((acc, f) => {
                    if (!acc[f.uf]) acc[f.uf] = { qtd: 0, valor: 0, cargaNova: 0 };
                    acc[f.uf].qtd++;
                    acc[f.uf].valor += f.valorTotal;
                    acc[f.uf].cargaNova += f.cargaTributariaNova;
                    return acc;
                  }, {} as Record<string, { qtd: number; valor: number; cargaNova: number }>)
                )
                  .sort(([,a], [,b]) => b.valor - a.valor)
                  .slice(0, 5)
                  .map(([uf, data], i) => (
                    <tr key={i}>
                      <td>{uf}</td>
                      <td className="num">{data.qtd}</td>
                      <td className="num">{formatCurrency(data.valor)}</td>
                      <td className="num">{formatPercent(data.valor > 0 ? (data.cargaNova / data.valor) * 100 : 0)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div className="insight-card">
            <h4>Categorias Tributárias</h4>
            <table className="insight-table">
              <thead>
                <tr><th>Categoria</th><th className="num">Fornecedores</th><th className="num">Itens</th></tr>
              </thead>
              <tbody>
                {Object.entries(
                  fornecedores.reduce((acc, f) => {
                    for (const cat of f.categorias) {
                      if (!acc[cat]) acc[cat] = { qtd: 0, itens: 0 };
                      acc[cat].qtd++;
                      acc[cat].itens += f.quantidadeItens;
                    }
                    return acc;
                  }, {} as Record<string, { qtd: number; itens: number }>)
                )
                  .sort(([,a], [,b]) => b.itens - a.itens)
                  .slice(0, 5)
                  .map(([cat, data], i) => (
                    <tr key={i}>
                      <td className="small">{cat}</td>
                      <td className="num">{data.qtd}</td>
                      <td className="num">{data.itens}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}