// Main Tax Calculator - Motor Tributário Principal
// Integra todos os componentes: C01-C07

import type {
  ResultadoCalculoItem,
  ParametrosSimulacao,
  NCMConfig,
  CFOPConfig,
  BaseCalculoItem,
} from '../types';
import { CreditEngine } from '../credits/CreditEngine';
import { IBSDualCalculator } from '../calculators/IBSDualCalculator';
import { BaseCalculator } from '../calculators/BaseCalculator';
import { CFOPClassifier } from '../classifications/CFOPClassifier';
import { TransitionCalculator } from '../scenarios/TransitionCalculator';
import { CatalogLoader, CatalogosCarregados } from '../catalogs/CatalogLoader';

export class TaxCalculator {
  private creditEngine: CreditEngine;
  private ibsDual: IBSDualCalculator;
  private baseCalculator: BaseCalculator;
  private cfopClassifier: CFOPClassifier;
  private transitionCalc: TransitionCalculator;
  private catalogos: CatalogosCarregados | null = null;
  private catalogosCarregados = false;

  constructor() {
    this.creditEngine = new CreditEngine();
    this.ibsDual = new IBSDualCalculator();
    this.baseCalculator = new BaseCalculator();
    this.cfopClassifier = new CFOPClassifier();
    this.transitionCalc = new TransitionCalculator();
  }

  /**
   * Inicializa o motor carregando todos os catálogos
   */
  async inicializar(ano: number = 2026): Promise<void> {
    if (this.catalogosCarregados && this.catalogos?.versoes.get('ano') === ano.toString()) {
      return;
    }

    const catalogos = await CatalogLoader.carregarCatalogos(ano);
    this.catalogos = catalogos;
    this.catalogosCarregados = true;

    // Configurar CreditEngine com catálogos
    this.creditEngine = await CreditEngine.carregarDeCatalogos(
      `/catalogos/${ano}/creditos.json`,
      `/catalogos/${ano}/ncm-cbs-ibs-${ano}.json`,
      `/catalogos/${ano}/cfop.json`
    );

    // Configurar IBS Dual
    this.ibsDual = await IBSDualCalculator.carregarDeCatalogo(`/catalogos/${ano}/ibs-uf.json`);

    // Configurar CFOP Classifier
    this.cfopClassifier = new CFOPClassifier();
    this.cfopClassifier.carregarDeCatalogo(
      Array.from(catalogos.cfops.values())
    );

    // Configurar Transition Calculator
    this.transitionCalc = await TransitionCalculator.carregarDeCatalogo(
      `/catalogos/${ano}/transicao.json`
    );
  }

  /**
   * Calcula impostos para um item da NFe
   */
  async calcularItem(
    itemXml: any,
    ncm: string,
    cfop: string,
    params: ParametrosSimulacao
  ): Promise<ResultadoCalculoItem> {
    // Garantir inicialização
    if (!this.catalogosCarregados) {
      await this.inicializar(params.ano);
    }

    // 1. Extrair dados do produto
    const produtoData = BaseCalculator.extrairDadosProduto(itemXml.prod || itemXml);

    // 2. Classificar CFOP
    const cfopConfig = this.cfopClassifier.classificar(cfop);
    const tipoOperacao = cfopConfig?.tipoOperacao || 'outra';

    // 3. Calcular base de CBS/IBS (C06)
    const { baseCalculo, alertas: alertasBase } = BaseCalculator.calcularBaseCalculo(
      produtoData,
      null,
      null
    );

    // 4. Buscar alíquotas NCM do catálogo (C04)
    const ncmConfig = this.catalogos 
      ? CatalogLoader.buscarNCM(this.catalogos, ncm)
      : { cbs: 9.65, ibs: 9.65, ibsEstadual: 4.825, ibsMunicipal: 4.825, descricao: 'Padrão (fallback)', tipo: 'padrao', cashback: 0, ncmEncontrado: false };

    // 5. Obter alíquotas do ano de transição (C03)
    const aliquotasAno = this.transitionCalc.getAliquotasAno(params.ano);
    const aliquotaCBS = params.usarAliquotasManuais && params.aliquotaCbsManual 
      ? params.aliquotaCbsManual 
      : (aliquotasAno?.cbs ?? ncmConfig.cbs);
    const aliquotaIBS = params.usarAliquotasManuais && params.aliquotaIbsManual
      ? params.aliquotaIbsManual
      : (aliquotasAno?.ibsTotal ?? ncmConfig.ibs);
    const aliquotaIBS_Estadual = aliquotasAno?.ibsEstadual ?? (ncmConfig.ibsEstadual ?? 4.825);
    const aliquotaIBS_Municipal = aliquotasAno?.ibsMunicipal ?? (ncmConfig.ibsMunicipal ?? 4.825);

    // 6. Buscar Imposto Seletivo (C05)
    const isConfig = this.catalogos 
      ? CatalogLoader.buscarImpostoSeletivo(this.catalogos, ncm)
      : null;
    const aliquotaIS = isConfig?.aliquotaAdValorem || 0;

    // 7. Classificar CFOP (C07)
    const cfopClassificado = this.cfopClassifier.classificar(cfop);
    const isExportacao = cfopClassificado?.tipoOperacao === 'exportacao';
    const isDevolucao = cfopClassificado?.tipoOperacao === 'devolucao';
    const isTransferencia = cfopClassificado?.tipoOperacao === 'transferencia';
    const isComST = cfopClassificado?.regimeEspecial === 'st';
    const isComDIFAL = cfopClassificado?.regimeEspecial === 'difal';
    const isComFCP = cfopClassificado?.regimeEspecial === 'fcp';

    // 8. Aplicar regras especiais por CFOP
    let aliquotaCBSFinal = aliquotaCBS;
    let aliquotaIBSFinal = aliquotaIBS;
    let incideCBS = cfopClassificado?.incideCBS ?? true;
    let incideIBS = cfopClassificado?.incideIBS ?? true;
    let incideIS = cfopClassificado?.incideIS ?? false;

    // Exportação: CBS/IBS = 0%
    if (isExportacao) {
      aliquotaCBSFinal = 0;
      aliquotaIBSFinal = 0;
      incideCBS = false;
      incideIBS = false;
    }

    // Devolução: não incide, gera crédito para o emitente original
    if (isDevolucao) {
      aliquotaCBSFinal = 0;
      aliquotaIBSFinal = 0;
      incideCBS = false;
      incideIBS = false;
    }

    // 9. Calcular valores brutos
    const base = baseCalculo.valorOperacao;
    const cbsBruta = incideCBS ? (base * aliquotaCBSFinal) / 100 : 0;
    const ibsBruta = incideIBS ? (base * aliquotaIBSFinal) / 100 : 0;
    const isBruta = incideIS ? (base * aliquotaIS) / 100 : 0;

    // 10. Calcular IBS Dual (C02)
    const ufDestino = 'SP'; // TODO: obter da NFe
    const municipioDestino = 'São Paulo'; // TODO: obter da NFe
    const ibsDual = this.ibsDual.calcularIBSDual(
      base,
      ufDestino,
      municipioDestino,
      aliquotaIBSFinal
    );

    // 11. Calcular créditos (C01)
    // Criar item temporário para cálculo de créditos
    const itemTemp: ResultadoCalculoItem = {
      ncm,
      cfop,
      descricao: itemXml.prod?.xProd || '',
      baseCalculo,
      aliquotaCBS: aliquotaCBSFinal,
      aliquotaIBS: aliquotaIBSFinal,
      aliquotaIBS_Estadual: aliquotaIBS_Estadual,
      aliquotaIBS_Municipal: aliquotaIBS_Municipal,
      aliquotaIS,
      cbsBruta,
      ibsBruta: ibsDual.ibsTotal,
      ibsEstadualBruta: ibsDual.ibsEstadual,
      ibsMunicipalBruta: ibsDual.ibsMunicipal,
      isBruta,
      cbsLiquida: 0,
      ibsLiquida: 0,
      ibsEstadualLiquida: 0,
      ibsMunicipalLiquida: 0,
      isLiquida: 0,
      totalCBS_IBS: 0,
      totalComIS: 0,
      tipoOperacao,
      regimeEspecial: undefined,
      isSeletivo: false,
      cashbackPercentual: 0,
      cashbackObservacao: '',
      auditoria: {
        ncmEncontrado: ncmConfig.ncmEncontrado,
        cfopClassificado: !!cfopClassificado,
        baseCalculoDetalhada: BaseCalculator.gerarAuditoriaBase(baseCalculo),
        creditosAplicados: [],
        alertas: [...alertasBase],
      },
    };

    const { creditoCBS, creditoIBS, detalheCBS, detalheIBS } = this.creditEngine.calcularCreditos(
      itemTemp,
      { ...params, incluirCreditos: true }
    );

    // 12. Calcular líquidos
    const cbsLiquida = Math.max(0, cbsBruta - creditoCBS);
    const ibsLiquida = Math.max(0, ibsDual.ibsTotal - creditoIBS);
    const isLiquida = isBruta;

    // 13. Cashback (apenas informativo)
    const cashbackPct = this.catalogos 
      ? CatalogLoader.buscarCashback(this.catalogos, ncm)
      : 0;

    // 14. Montar resultado
    const alertas: string[] = [...alertasBase];
    if (isExportacao) alertas.push('Exportação: CBS/IBS = 0% (imunidade)');
    if (isDevolucao) alertas.push('Devolução: CBS/IBS = 0% (gera crédito para emitente original)');
    if (isComST) alertas.push('Operação com ICMS-ST: base CBS/IBS exclui ICMS-ST');
    if (isComDIFAL) alertas.push('Operação com DIFAL: base CBS/IBS exclui DIFAL');
    if (isComFCP) alertas.push('Operação com FCP: base CBS/IBS exclui FCP');
    if (!ncmConfig.ncmEncontrado) alertas.push('⚠ NCM não encontrado no catálogo - usando alíquota padrão');

    return {
      ncm,
      cfop,
      descricao: itemXml.prod?.xProd || '',
      baseCalculo,
      aliquotaCBS: aliquotaCBSFinal,
      aliquotaIBS: aliquotaIBSFinal,
      aliquotaIBS_Estadual: aliquotaIBS_Estadual,
      aliquotaIBS_Municipal: aliquotaIBS_Municipal,
      aliquotaIS,
      cbsBruta,
      ibsBruta: ibsDual.ibsTotal,
      ibsEstadualBruta: ibsDual.ibsEstadual,
      ibsMunicipalBruta: ibsDual.ibsMunicipal,
      isBruta,
      creditoCBS,
      creditoIBS,
      creditoCBSDetalhe: detalheCBS,
      creditoIBSDetalhe: detalheIBS,
      cbsLiquida,
      ibsLiquida,
      ibsEstadualLiquida: Math.max(0, ibsDual.ibsEstadual - (creditoIBS * (ibsDual.ibsEstadual / ibsDual.ibsTotal) || 0)),
      ibsMunicipalLiquida: Math.max(0, ibsDual.ibsMunicipal - (creditoIBS * (ibsDual.ibsMunicipal / ibsDual.ibsTotal) || 0)),
      isLiquida,
      totalCBS_IBS: cbsLiquida + ibsDual.ibsTotal,
      totalComIS: cbsLiquida + ibsDual.ibsTotal + isLiquida,
      tipoOperacao,
      regimeEspecial: cfopClassificado?.regimeEspecial,
      isSeletivo: aliquotaIS > 0,
      cashbackPercentual: cashbackPct,
      cashbackObservacao: cashbackPct > 0 
        ? `Cashback consumidor: ${cashbackPct}% (não reduz base do emitente; elegibilidade depende de renda ≤ 2 SM e cadastro Gov.br)`
        : 'Não elegível a cashback',
      auditoria: {
        ncmEncontrado: ncmConfig.ncmEncontrado,
        cfopClassificado: !!cfopClassificado,
        baseCalculoDetalhada: BaseCalculator.gerarAuditoriaBase(baseCalculo),
        creditosAplicados: [detalheCBS, detalheIBS].filter(Boolean),
        alertas,
      },
    };
  }

  /**
   * Calcula impostos para uma NFe completa
   */
  async calcularNFe(xmlContent: string, params: ParametrosSimulacao): Promise<{
    itens: ResultadoCalculoItem[];
    totais: {
      cbsBrutaTotal: number;
      ibsBrutaTotal: number;
      isBrutaTotal: number;
      creditoCBSTotal: number;
      creditoIBSTotal: number;
      cbsLiquidaTotal: number;
      ibsLiquidaTotal: number;
      isLiquidaTotal: number;
      totalGeral: number;
    };
    alertas: string[];
  }> {
    // Parse do XML (delegar ao parser existente)
    const { parseNFeXml } = await import('../../utils/parser');
    const resultado = parseNFeXml(xmlContent);

    if (!resultado.success || !resultado.data) {
      throw new Error(resultado.error || 'Erro ao parsear NFe');
    }

    const itens: ResultadoCalculoItem[] = [];
    const alertasGerais: string[] = [];

    for (const item of resultado.data.itens) {
      // Reconstruir XML do item para processar
      const itemXml = { prod: {} };
      // Nota: em produção, manter o XML original do item
      // Por enquanto, usar dados já extraídos
      
      const resultadoItem = await this.calcularItem(
        { prod: {} },
        item.ncm,
        item.cfop,
        params
      );
      
      // Sobrescrever com dados reais do item
      itens.push({
        ...resultadoItem,
        descricao: item.descricao,
        baseCalculo: {
          ...resultadoItem.baseCalculo,
          valorProduto: item.valorTotal,
        },
      });
    }

    // Calcular totais
    const totais = {
      cbsBrutaTotal: itens.reduce((s, i) => s + i.cbsBruta, 0),
      ibsBrutaTotal: itens.reduce((s, i) => s + i.ibsBruta, 0),
      isBrutaTotal: itens.reduce((s, i) => s + i.isBruta, 0),
      creditoCBSTotal: itens.reduce((s, i) => s + i.creditoCBS, 0),
      creditoIBSTotal: itens.reduce((s, i) => s + i.creditoIBS, 0),
      cbsLiquidaTotal: itens.reduce((s, i) => s + i.cbsLiquida, 0),
      ibsLiquidaTotal: itens.reduce((s, i) => s + i.ibsLiquida, 0),
      isLiquidaTotal: itens.reduce((s, i) => s + i.isLiquida, 0),
      totalGeral: itens.reduce((s, i) => s + i.totalComIS, 0),
    };

    return { itens, totais, alertas: alertasGerais };
  }

  /**
   * Simula cenário para um ano específico
   */
  async simularAno(ano: number, params: ParametrosSimulacao, xmlContent?: string): Promise<any> {
    const paramsAno = { ...params, ano };
    
    if (xmlContent) {
      return this.calcularNFe(xmlContent, paramsAno);
    }

    // Retorna parâmetros do ano para simulação manual
    const aliquotas = this.transitionCalc.getAliquotasAno(ano);
    const cenario = this.transitionCalc.getCenario(ano);
    
    return {
      ano,
      parametros: paramsAno,
      aliquotas,
      cenario: cenario?.descricao,
    };
  }
}

export default TaxCalculator;