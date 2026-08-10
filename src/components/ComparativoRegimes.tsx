import type { ComparativoRegimes, SimulacaoRegime, ParametrosEmpresa } from '../types';
import { formatCurrency, formatPercent } from '../utils/format';
import { useState } from 'react';

interface ComparativoRegimesProps {
  comparativo: ComparativoRegimes;
  onParamsChange: (params: Partial<ParametrosEmpresa>) => void;
}

const REGIME_ICONS: Record<string, string> = {
  simples: '📋',
  'simples-hibrido': '🔀',
  'lucro-presumido': '📊',
  'lucro-real': '📈',
};

function RegimeCard({ simulacao, isRecomendado, isAtual }: { simulacao: SimulacaoRegime; isRecomendado: boolean; isAtual: boolean }) {
  const economiaPositiva = simulacao.economiaVsAtual > 0;
  
  return (
    <div className={`regime-card ${isRecomendado ? 'recomendado' : ''} ${!simulacao.viavel ? 'inviavel' : ''} ${isAtual ? 'atual' : ''}`}>
      {isRecomendado && <div className="badge-recomendado">✓ RECOMENDADO</div>}
      {isAtual && <div className="badge-atual">REGIME ATUAL</div>}
      {!simulacao.viavel && <div className="badge-inviavel">⚠ INVIÁVEL</div>}
      
      <div className="regime-header">
        <span className="regime-icon">{REGIME_ICONS[simulacao.regime]}</span>
        <h3>{simulacao.nome}</h3>
      </div>
      
      <p className="regime-desc">{simulacao.descricao}</p>
      
      <div className="regime-total">
        <span className="total-label">Carga Anual Estimada</span>
        <span className="total-value">{formatCurrency(simulacao.cargas.total)}</span>
        <span className="total-pct">({formatPercent(simulacao.cargaEfetivaPercentual)} sobre faturamento)</span>
      </div>
      
      <div className="regime-economia">
        <span className={`economia-value ${economiaPositiva ? 'positiva' : 'negativa'}`}>
          {economiaPositiva ? 'Economia' : 'Aumento'} vs Atual: {formatCurrency(Math.abs(simulacao.economiaVsAtual))}
        </span>
        <span className="economia-pct">
          ({formatPercent(Math.abs(simulacao.economiaVsAtual) / (simulacao.cargas.total + simulacao.economiaVsAtual) * 100)})
        </span>
      </div>
      
      <details className="regime-breakdown">
        <summary>Detalhamento por tributo</summary>
        <table className="breakdown-table">
          <tbody>
            {simulacao.cargas.irpj > 0 && <tr><td>IRPJ</td><td className="num">{formatCurrency(simulacao.cargas.irpj)}</td><td className="pct">{formatPercent(simulacao.cargas.irpj / simulacao.cargas.total * 100)}</td></tr>}
            {simulacao.cargas.csll > 0 && <tr><td>CSLL</td><td className="num">{formatCurrency(simulacao.cargas.csll)}</td><td className="pct">{formatPercent(simulacao.cargas.csll / simulacao.cargas.total * 100)}</td></tr>}
            {simulacao.cargas.pis > 0 && <tr><td>PIS</td><td className="num">{formatCurrency(simulacao.cargas.pis)}</td><td className="pct">{formatPercent(simulacao.cargas.pis / simulacao.cargas.total * 100)}</td></tr>}
            {simulacao.cargas.cofins > 0 && <tr><td>COFINS</td><td className="num">{formatCurrency(simulacao.cargas.cofins)}</td><td className="pct">{formatPercent(simulacao.cargas.cofins / simulacao.cargas.total * 100)}</td></tr>}
            {simulacao.cargas.cpp > 0 && <tr><td>CPP (INSS Patronal)</td><td className="num">{formatCurrency(simulacao.cargas.cpp)}</td><td className="pct">{formatPercent(simulacao.cargas.cpp / simulacao.cargas.total * 100)}</td></tr>}
            {simulacao.cargas.icms > 0 && <tr><td>ICMS</td><td className="num">{formatCurrency(simulacao.cargas.icms)}</td><td className="pct">{formatPercent(simulacao.cargas.icms / simulacao.cargas.total * 100)}</td></tr>}
            {simulacao.cargas.iss > 0 && <tr><td>ISS</td><td className="num">{formatCurrency(simulacao.cargas.iss)}</td><td className="pct">{formatPercent(simulacao.cargas.iss / simulacao.cargas.total * 100)}</td></tr>}
            {simulacao.cargas.ipi > 0 && <tr><td>IPI</td><td className="num">{formatCurrency(simulacao.cargas.ipi)}</td><td className="pct">{formatPercent(simulacao.cargas.ipi / simulacao.cargas.total * 100)}</td></tr>}
          </tbody>
        </table>
      </details>
      
      {simulacao.observacoes.length > 0 && (
        <div className="regime-obs">
          <strong>Observações:</strong>
          <ul>
            {simulacao.observacoes.map((obs, i) => (
              <li key={i}>{obs}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function ComparativoRegimesView({ comparativo, onParamsChange }: ComparativoRegimesProps) {
  const [editMode, setEditMode] = useState(false);
  const params = comparativo.empresa;
  
  const handleInputChange = (field: keyof ParametrosEmpresa, value: string | number) => {
    onParamsChange({ [field]: value });
  };

  return (
    <div className="comparativo-view">
      <div className="comparativo-header">
        <h2>Simulador de Regime Tributário</h2>
        <p className="comparativo-subtitle">
          Comparação baseada nas NF-es analisadas projetadas para 12 meses
        </p>
      </div>

      {/* Parâmetros da empresa */}
      <div className="params-section">
        <h3>Parâmetros da Empresa</h3>
        <div className="params-grid">
          <div className="param-field">
            <label>Faturamento Anual (R$)</label>
            <input
              type="number"
              value={params.faturamentoAnual}
              onChange={(e) => handleInputChange('faturamentoAnual', Number(e.target.value))}
              step="1000"
              min="0"
              disabled={!editMode}
            />
          </div>
          <div className="param-field">
            <label>Folha de Pagamento Anual (R$)</label>
            <input
              type="number"
              value={params.folhaPagamento}
              onChange={(e) => handleInputChange('folhaPagamento', Number(e.target.value))}
              step="1000"
              min="0"
              disabled={!editMode}
            />
          </div>
          <div className="param-field">
            <label>UF</label>
            <input
              type="text"
              value={params.uf}
              onChange={(e) => handleInputChange('uf', e.target.value.toUpperCase())}
              maxLength={2}
              disabled={!editMode}
            />
          </div>
          <div className="param-field">
            <label>Município</label>
            <input
              type="text"
              value={params.municipio}
              onChange={(e) => handleInputChange('municipio', e.target.value)}
              disabled={!editMode}
            />
          </div>
          <div className="param-field">
            <label>Atividade Principal</label>
            <select
              value={params.atividadePrincipal}
              onChange={(e) => handleInputChange('atividadePrincipal', e.target.value as any)}
              disabled={!editMode}
            >
              <option value="comercio">Comércio</option>
              <option value="industria">Indústria</option>
              <option value="servicos">Serviços</option>
              <option value="misto">Misto</option>
            </select>
          </div>
          <div className="param-field">
            <label>Anexo Simples</label>
            <select
              value={params.anexoSimples || ''}
              onChange={(e) => handleInputChange('anexoSimples', (e.target.value || undefined) as any)}
              disabled={!editMode}
            >
              <option value="">Auto (por atividade)</option>
              <option value="I">Anexo I - Comércio</option>
              <option value="II">Anexo II - Indústria</option>
              <option value="III">Anexo III - Serviços</option>
              <option value="IV">Anexo IV - Serviços</option>
              <option value="V">Anexo V - Serviços</option>
            </select>
          </div>
        </div>
        <button className="edit-toggle" onClick={() => setEditMode(!editMode)}>
          {editMode ? 'Salvar parâmetros' : 'Editar parâmetros'}
        </button>
      </div>

      {/* Regime atual detectado */}
      <div className="regime-atual-banner">
        <strong>Regime atual detectado nas NF-es:</strong> {getRegimeAtualFromNFes(comparativo.empresa as any)}
      </div>

      {/* Grid de regimes */}
      <div className="regimes-grid">
        {comparativo.simulacoes.map((sim) => (
          <RegimeCard
            key={sim.regime}
            simulacao={sim}
            isRecomendado={sim.regime === comparativo.recomendado.regime}
            isAtual={sim.regime === params.regimeAtual}
          />
        ))}
      </div>

      {/* Resumo comparativo */}
      <div className="summary-table-section">
        <h3>Resumo Comparativo</h3>
        <div className="table-scroll">
          <table className="items-table">
            <thead>
              <tr>
                <th>Regime</th>
                <th className="num">Carga Anual</th>
                <th className="num">% Faturamento</th>
                <th className="num">vs Atual</th>
                <th className="num">Economia %</th>
                <th>Viável</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {comparativo.simulacoes.map((sim) => (
                <tr key={sim.regime} className={sim.regime === comparativo.recomendado.regime ? 'recomendado-row' : ''}>
                  <td>
                    <span className="regime-name">{REGIME_ICONS[sim.regime]} {sim.nome}</span>
                  </td>
                  <td className="num">{formatCurrency(sim.cargas.total)}</td>
                  <td className="num">{formatPercent(sim.cargaEfetivaPercentual)}</td>
                  <td className={`num ${sim.economiaVsAtual > 0 ? 'positiva' : 'negativa'}`}>
                    {sim.economiaVsAtual > 0 ? '−' : '+'}{formatCurrency(Math.abs(sim.economiaVsAtual))}
                  </td>
                  <td className="num">
                    {formatPercent(Math.abs(sim.economiaVsAtual) / (sim.cargas.total + sim.economiaVsAtual) * 100)}
                  </td>
                  <td className="center">{sim.viavel ? '✓' : '✗'}</td>
                  <td>
                    {sim.regime === comparativo.recomendado.regime && <span className="status-badge best">MELHOR</span>}
                    {sim.regime === params.regimeAtual && <span className="status-badge current">ATUAL</span>}
                    {!sim.viavel && <span className="status-badge invalid">INVIÁVEL</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Análise do gestor tributário */}
      <div className="analise-gestor">
        <h3>Análise do Gestor Tributário</h3>
        <div className="analise-grid">
          <div className="analise-card">
            <h4>🎯 Recomendação: {comparativo.recomendado.nome}</h4>
            <p>
              <strong>Economia potencial:</strong> {formatCurrency(comparativo.recomendado.economiaVsAtual)}/ano 
              ({formatPercent(comparativo.recomendado.economiaVsAtual / (comparativo.recomendado.cargas.total + comparativo.recomendado.economiaVsAtual) * 100)})
            </p>
            <p>{comparativo.recomendado.descricao}</p>
            {comparativo.recomendado.observacoes.map((obs, i) => (
              <p key={i} className="obs-item">⚠ {obs}</p>
            ))}
          </div>
          
          <div className="analise-card">
            <h4>📊 Pontos de Atenção</h4>
            <ul>
              <li>Simples Nacional: limite de R$ 4,8M/ano; vedado para atividades financeiras, factoring, etc.</li>
              <li>Lucro Presumido: limite de R$ 78M/ano; base IRPJ/CSLL 32% (comércio) ou 8% (serviços)</li>
              <li>Lucro Real: obrigatório acima de R$ 78M; permite créditos PIS/COFINS não cumulativos e prejuízos fiscais</li>
              <li>Simples Híbrido: ICMS/ISS no Simples + federais no Presumido; complexidade operacional maior</li>
              <li>Reforma Tributária (2026+): CBS/IBS substituirão PIS/COFINS/IPI/ICMS/ISS; impacto variará por regime</li>
            </ul>
          </div>
          
          <div className="analise-card">
            <h4>💡 Próximos Passos</h4>
            <ol>
              <li>Validar enquadramento da atividade no Simples (consultar CNAE)</li>
              <li>Simular com dados reais de 12 meses (não apenas projeção de NF-es)</li>
              <li>Considerar custos de compliance: Lucro Real exige contabilidade completa</li>
              <li>Avaliar impacto da Reforma Tributária na transição 2026-2033</li>
              <li>Consultar contador para decisão final</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper para detectar regime atual (simplificado)
function getRegimeAtualFromNFes(params: any): string {
  // Isso será preenchido pelo componente pai
  return params.regimeAtualDetectado || 'A ser detectado';
}