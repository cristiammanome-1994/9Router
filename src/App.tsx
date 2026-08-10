import { useState, useMemo, useCallback, useEffect } from 'react';
import type { UploadResult, RelatorioCompilado, ViewMode, ParametrosEmpresa, ComparativoRegimes, AnaliseFornecedores } from './types';
import { FileUpload } from './components/FileUpload';
import { SummaryCards } from './components/SummaryCards';
import { ItemTable } from './components/ItemTable';
import { ErrorList } from './components/DocumentTabs';
import { DocumentSidebar } from './components/DocumentSidebar';
import { RelatorioCompiladoView } from './components/RelatorioCompilado';
import { ComparativoRegimesView } from './components/ComparativoRegimes';
import { FornecedoresView } from './components/FornecedoresView';
import { gerarRelatorioCompilado, verificarDuplicados } from './utils/consolidacao';
import { compararRegimes, getRegimeAtualFromNFes } from './utils/simuladorRegimes';
import { analisarFornecedores } from './utils/fornecedores';
import './App.css';

// Parâmetros padrão iniciais
const PARAMETROS_INICIAIS: ParametrosEmpresa = {
  faturamentoAnual: 0,
  folhaPagamento: 0,
  regimeAtual: 'lucro-presumido',
  uf: 'SP',
  municipio: 'São Paulo',
  atividadePrincipal: 'comercio',
};


function App() {
  const [results, setResults] = useState<UploadResult[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('individual');
  const [showSidebar, setShowSidebar] = useState(true);
  const [simulacaoParams, setSimulacaoParams] = useState<ParametrosEmpresa>(PARAMETROS_INICIAIS);
  const [comparativo, setComparativo] = useState<ComparativoRegimes | null>(null);
  const [analiseFornecedores, setAnaliseFornecedores] = useState<AnaliseFornecedores | null>(null);

  const handleResults = useCallback((newResults: UploadResult[]) => {
    setResults((prev) => {
      const combined = [...prev, ...newResults];
      return verificarDuplicados(combined);
    });
  }, []);

  // Definir activeId após o estado atualizar
  useEffect(() => {
    if (results.length > 0 && !activeId) {
      const firstSuccess = results.find((r) => r.result.success);
      if (firstSuccess) setActiveId(firstSuccess.id);
    }
  }, [results, activeId]);

  // Atualizar parâmetros de simulação baseado nos dados das NF-es
  useEffect(() => {
    const relatorio = gerarRelatorioCompilado(results);
    if (relatorio.totais.valorTotal > 0) {
      setSimulacaoParams((prev) => ({
        ...prev,
        faturamentoAnual: prev.faturamentoAnual || relatorio.totais.valorTotal * 12,
        folhaPagamento: prev.folhaPagamento || relatorio.totais.valorTotal * 1.8, // ~15% do faturamento
        regimeAtualDetectado: getRegimeAtualFromNFes({
          icmsTotal: relatorio.totais.icmsTotal,
          ipiTotal: relatorio.totais.ipiTotal,
          pisTotal: relatorio.totais.pisTotal,
          cofinsTotal: relatorio.totais.cofinsTotal,
        }),
      }));
    }
  }, [results]);

  // Calcular comparativo quando parâmetros mudam
  useEffect(() => {
    const relatorio = gerarRelatorioCompilado(results);
    if (relatorio.totais.valorTotal > 0) {
      const comp = compararRegimes(simulacaoParams, {
        valorTotal: relatorio.totais.valorTotal,
        icmsTotal: relatorio.totais.icmsTotal,
        ipiTotal: relatorio.totais.ipiTotal,
        pisTotal: relatorio.totais.pisTotal,
        cofinsTotal: relatorio.totais.cofinsTotal,
      });
      setComparativo(comp);
    }
  }, [simulacaoParams, results]);

  // Calcular análise de fornecedores
  useEffect(() => {
    if (results.length > 0) {
      const analise = analisarFornecedores(results);
      setAnaliseFornecedores(analise);
    }
  }, [results]);

  const handleClear = useCallback(() => {
    setResults([]);
    setActiveId(null);
    setComparativo(null);
    setAnaliseFornecedores(null);
  }, []);

  const handleSelect = useCallback((id: string) => {
    setActiveId(id);
    setViewMode('individual');
  }, []);

  const handleToggleSelect = useCallback((id: string) => {
    setResults((prev) =>
      prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r)),
    );
  }, []);

  const handleSelectAll = useCallback((selected: boolean) => {
    setResults((prev) => prev.map((r) => (r.result.success ? { ...r, selected } : r)));
  }, []);

  const handleRemove = useCallback((id: string) => {
    setResults((prev) => {
      const filtered = prev.filter((r) => r.id !== id);
      if (activeId === id) {
        const next = filtered.find((r) => r.result.success);
        setActiveId(next?.id || null);
      }
      return filtered;
    });
  }, [activeId]);

  const handleParamsChange = useCallback((partial: Partial<ParametrosEmpresa>) => {
    setSimulacaoParams((prev) => ({ ...prev, ...partial }));
  }, []);

  const relatorio: RelatorioCompilado = useMemo(() => gerarRelatorioCompilado(results), [results]);
  const currentResult = results.find((r) => r.id === activeId)?.result;
  const hasData = currentResult?.success && currentResult.data;

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>
            <span className="logo-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="8" y1="13" x2="16" y2="13" />
                <line x1="8" y1="17" x2="16" y2="17" />
              </svg>
            </span>
            Analisador XML - Reforma Tributária
          </h1>
          <p className="subtitle">
            Compare a tributação atual (ICMS/IPI/PIS/COFINS) com os novos impostos CBS + IBS da Reforma Tributária (Lei 14.988/2024)
          </p>
        </div>
      </header>

      <main className="app-main">
        <div className="toolbar">
          <FileUpload onResults={handleResults} />

          {results.length > 0 && (
            <div className="toolbar-actions">
              <div className="view-toggle">
                <button
                  className={viewMode === 'individual' ? 'active' : ''}
                  onClick={() => setViewMode('individual')}
                >
                  Individual
                </button>
                <button
                  className={viewMode === 'compilado' ? 'active' : ''}
                  onClick={() => setViewMode('compilado')}
                >
                  Relatório Compilado
                </button>
                <button
                  className={viewMode === 'simulacao' ? 'active' : ''}
                  onClick={() => setViewMode('simulacao')}
                >
                  Simulador de Regimes
                </button>
                <button
                  className={viewMode === 'fornecedores' ? 'active' : ''}
                  onClick={() => setViewMode('fornecedores')}
                >
                  Análise de Fornecedores
                </button>
              </div>
              <button className="clear-btn" onClick={handleClear}>
                Limpar todos
              </button>
            </div>
          )}

          {results.length > 0 && (
            <button className="sidebar-toggle" onClick={() => setShowSidebar(!showSidebar)}>
              {showSidebar ? '◀ Ocultar lista' : '▶ Mostrar lista'}
            </button>
          )}
        </div>

        <ErrorList results={results} />

        <div className="content-layout">
          {showSidebar && (
            <DocumentSidebar
              results={results}
              activeId={activeId}
              onSelect={handleSelect}
              onToggleSelect={handleToggleSelect}
              onSelectAll={handleSelectAll}
              onRemove={handleRemove}
            />
          )}

          <div className="content-area" style={{ flex: showSidebar ? '1' : '1', minWidth: 0 }}>
            {viewMode === 'compilado' ? (
              <RelatorioCompiladoView relatorio={relatorio} />
            ) : viewMode === 'simulacao' ? (
              comparativo ? (
                <ComparativoRegimesView comparativo={comparativo} onParamsChange={handleParamsChange} />
              ) : (
                <div className="empty-selection">
                  <p>Carregue NF-es para habilitar o simulador de regimes.</p>
                </div>
              )
            ) : viewMode === 'fornecedores' ? (
              analiseFornecedores ? (
                <FornecedoresView analise={analiseFornecedores} />
              ) : (
                <div className="empty-selection">
                  <p>Carregue NF-es para habilitar a análise de fornecedores.</p>
                </div>
              )
            ) : hasData && currentResult.data ? (
              <>
                <SummaryCards data={currentResult.data} />
                <ItemTable data={currentResult.data} />
              </>
            ) : results.length === 0 ? (
              <div className="info-section">
                <h2>Como funciona</h2>
                <div className="info-cards">
                  <div className="info-card">
                    <div className="info-number">1</div>
                    <h3>Upload do XML</h3>
                    <p>Arraste arquivos XML de NF-e ou arquivos ZIP contendo múltiplos XMLs para a área de upload acima.</p>
                  </div>
                  <div className="info-card">
                    <div className="info-number">2</div>
                    <h3>Análise automática</h3>
                    <p>O sistema extrai os itens, NCMs e impostos da nota e calcula as alíquotas de CBS e IBS conforme a nova legislação.</p>
                  </div>
                  <div className="info-card">
                    <div className="info-number">3</div>
                    <h3>Comparativo</h3>
                    <p>Visualize individualmente por nota, o relatório compilado consolidado ou simule regimes tributários.</p>
                  </div>
                </div>

                <div className="legend-section">
                  <h3>Sobre a Reforma Tributária</h3>
                  <p>
                    A Reforma Tributária (Emenda Constitucional 132/2023 e Lei 14.988/2024) substitui tributos como PIS, COFINS, IPI, ICMS e ISS
                    por dois novos impostos sobre o consumo:
                  </p>
                  <ul>
                    <li><strong>CBS</strong> - Contribuição sobre Bens e Serviços (federal, alíquota padrão de 9,65%)</li>
                    <li><strong>IBS</strong> - Imposto sobre Bens e Serviços (estados e municípios, alíquota padrão de 9,65%)</li>
                  </ul>
                  <p>
                    Alguns produtos têm <strong>alíquota reduzida</strong> (1,45%) como alimentos da cesta básica, medicamentos e produtos hortícolas,
                    enquanto bebidas alcoólicas têm <strong>alíquota majorada</strong> (19,3%). Produtos essenciais também podem receber
                    <strong> cashback</strong> parcial ou integral.
                  </p>
                </div>
              </div>
            ) : (
              <div className="empty-selection">
                <p>Selecione uma NF-e na lista ao lado para ver os detalhes.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <p>9Router - Analisador XML da Reforma Tributária &middot; Base legal: Lei 14.988/2024 e EC 132/2023</p>
      </footer>
    </div>
  );
}

export default App;