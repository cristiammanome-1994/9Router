// CFOP Classifier - C07: Classificação de operações por CFOP
// Classifica operações e define regras tributárias

import type { CFOPConfig } from '../types';

export class CFOPClassifier {
  private cfops: Map<string, CFOPConfig> = new Map();

  constructor(cfopsConfig: CFOPConfig[] = []) {
    this.cfops = new Map(cfopsConfig.map(c => [c.cfop, c]));
    this.carregarCFOPsPadrao();
  }

  private carregarCFOPsPadrao(): void {
    // CFOPs de Venda - NÃO geram crédito (são saídas)
    this.adicionarCFOP('5101', 'Venda de produção do estabelecimento', 'venda_interna', false, false, true, true, false, 'saida');
    this.adicionarCFOP('5102', 'Venda de mercadoria adquirida ou recebida de terceiros', 'venda_interna', false, false, true, true, false, 'saida');
    this.adicionarCFOP('5103', 'Venda de mercadoria adquirida ou recebida de terceiros, em venda à ordem', 'venda_interna', false, false, true, true, false, 'saida');
    this.adicionarCFOP('5104', 'Venda de mercadoria adquirida ou recebida de terceiros, em venda a prazo', 'venda_interna', false, false, true, true, false, 'saida');
    this.adicionarCFOP('5105', 'Venda de produção do estabelecimento, destinada a zona franca de Manaus ou áreas de livre comércio', 'exportacao', false, false, false, false, false, 'saida', 'zona_franca');
    this.adicionarCFOP('5106', 'Venda de mercadoria adquirida ou recebida de terceiros, destinada a zona franca de Manaus ou áreas de livre comércio', 'exportacao', false, false, false, false, false, 'saida', 'zona_franca');
    this.adicionarCFOP('5107', 'Venda de produção do estabelecimento, destinada a área de livre comércio', 'exportacao', false, false, false, false, false, 'saida', 'area_livre');
    this.adicionarCFOP('5108', 'Venda de mercadoria adquirida ou recebida de terceiros, destinada a área de livre comércio', 'exportacao', false, false, false, false, false, 'saida', 'area_livre');
    this.adicionarCFOP('5109', 'Venda de produção do estabelecimento, em operação com suspensão do ICMS', 'venda_interna', false, false, true, true, false, 'saida', 'suspensao');
    this.adicionarCFOP('5110', 'Venda de mercadoria adquirida ou recebida de terceiros, em operação com suspensão do ICMS', 'venda_interna', false, false, true, true, false, 'saida', 'suspensao');

    // Vendas Interestaduais - NÃO geram crédito (são saídas)
    this.adicionarCFOP('6101', 'Venda de produção do estabelecimento, interestadual', 'venda_interestadual', false, false, true, true, false, 'saida');
    this.adicionarCFOP('6102', 'Venda de mercadoria adquirida ou recebida de terceiros, interestadual', 'venda_interestadual', false, false, true, true, false, 'saida');
    this.adicionarCFOP('6103', 'Venda de mercadoria adquirida ou recebida de terceiros, em venda à ordem, interestadual', 'venda_interestadual', false, false, true, true, false, 'saida');
    this.adicionarCFOP('6104', 'Venda de mercadoria adquirida ou recebida de terceiros, em venda a prazo, interestadual', 'venda_interestadual', false, false, true, true, false, 'saida');
    this.adicionarCFOP('6105', 'Venda de produção do estabelecimento, destinada a zona franca de Manaus ou áreas de livre comércio, interestadual', 'exportacao', false, false, false, false, false, 'saida', 'zona_franca');
    this.adicionarCFOP('6106', 'Venda de mercadoria adquirida ou recebida de terceiros, destinada a zona franca de Manaus ou áreas de livre comércio, interestadual', 'exportacao', false, false, false, false, false, 'saida', 'zona_franca');
    this.adicionarCFOP('6107', 'Venda de produção do estabelecimento, destinada a área de livre comércio, interestadual', 'exportacao', false, false, false, false, false, 'saida', 'area_livre');
    this.adicionarCFOP('6108', 'Venda de mercadoria adquirida ou recebida de terceiros, destinada a área de livre comércio, interestadual', 'exportacao', false, false, false, false, false, 'saida', 'area_livre');
    this.adicionarCFOP('6109', 'Venda de produção do estabelecimento, em operação com suspensão do ICMS, interestadual', 'venda_interestadual', false, false, true, true, false, 'saida', 'suspensao');
    this.adicionarCFOP('6110', 'Venda de mercadoria adquirida ou recebida de terceiros, em operação com suspensão do ICMS, interestadual', 'venda_interestadual', false, false, true, true, false, 'saida', 'suspensao');

    // Exportações - NÃO geram crédito para o exportador (são saídas com isenção)
    this.adicionarCFOP('7101', 'Exportação de produção do estabelecimento', 'exportacao', false, false, false, false, false, 'saida', 'exportacao');
    this.adicionarCFOP('7102', 'Exportação de mercadoria adquirida ou recebida de terceiros', 'exportacao', false, false, false, false, false, 'saida', 'exportacao');
    this.adicionarCFOP('7103', 'Exportação de mercadoria recebida em consignação industrial', 'exportacao', false, false, false, false, false, 'saida', 'exportacao');
    this.adicionarCFOP('7104', 'Exportação de mercadoria adquirida ou recebida de terceiros, em venda à ordem', 'exportacao', false, false, false, false, false, 'saida', 'exportacao');
    this.adicionarCFOP('7105', 'Exportação de mercadoria recebida em consignação mercantil', 'exportacao', false, false, false, false, false, 'saida', 'exportacao');
    this.adicionarCFOP('7106', 'Exportação de mercadoria adquirida ou recebida de terceiros, em venda a prazo', 'exportacao', false, false, false, false, false, 'saida', 'exportacao');
    this.adicionarCFOP('7107', 'Exportação de mercadoria recebida para industrialização por conta e ordem do adquirente', 'exportacao', false, false, false, false, false, 'saida', 'exportacao');
    this.adicionarCFOP('7108', 'Exportação de mercadoria adquirida ou recebida de terceiros, em consignação mercantil ou industrial', 'exportacao', false, false, false, false, false, 'saida', 'exportacao');

    // Devoluções
    this.adicionarCFOP('1201', 'Devolução de venda de produção do estabelecimento', 'devolucao', false, false, false, false, false, 'entrada', 'devolucao');
    this.adicionarCFOP('1202', 'Devolução de venda de mercadoria adquirida ou recebida de terceiros', 'devolucao', false, false, false, false, false, 'entrada', 'devolucao');
    this.adicionarCFOP('1203', 'Devolução de venda de mercadoria recebida em consignação industrial', 'devolucao', false, false, false, false, false, 'entrada', 'devolucao');
    this.adicionarCFOP('1204', 'Devolução de venda de mercadoria adquirida ou recebida de terceiros, em venda à ordem', 'devolucao', false, false, false, false, false, 'entrada', 'devolucao');
    this.adicionarCFOP('1205', 'Devolução de venda de mercadoria recebida em consignação mercantil', 'devolucao', false, false, false, false, false, 'entrada', 'devolucao');
    this.adicionarCFOP('1206', 'Devolução de venda de mercadoria adquirida ou recebida de terceiros, em venda a prazo', 'devolucao', false, false, false, false, false, 'entrada', 'devolucao');
    this.adicionarCFOP('2201', 'Devolução de venda interestadual de produção do estabelecimento', 'devolucao', false, false, false, false, false, 'entrada', 'devolucao');
    this.adicionarCFOP('2202', 'Devolução de venda interestadual de mercadoria adquirida ou recebida de terceiros', 'devolucao', false, false, false, false, false, 'entrada', 'devolucao');
    this.adicionarCFOP('7201', 'Devolução de exportação de produção do estabelecimento', 'devolucao', false, false, false, false, false, 'entrada', 'devolucao');
    this.adicionarCFOP('7202', 'Devolução de exportação de mercadoria adquirida ou recebida de terceiros', 'devolucao', false, false, false, false, false, 'entrada', 'devolucao');

    // Transferências
    this.adicionarCFOP('5151', 'Transferência de produção do estabelecimento, para outro estabelecimento da mesma empresa', 'transferencia', false, false, true, true, false, 'saida', 'transferencia');
    this.adicionarCFOP('5152', 'Transferência de mercadoria adquirida ou recebida de terceiros, para outro estabelecimento da mesma empresa', 'transferencia', false, false, true, true, false, 'saida', 'transferencia');
    this.adicionarCFOP('6151', 'Transferência interestadual de produção do estabelecimento, para outro estabelecimento da mesma empresa', 'transferencia', false, false, true, true, false, 'saida', 'transferencia');
    this.adicionarCFOP('6152', 'Transferência interestadual de mercadoria adquirida ou recebida de terceiros, para outro estabelecimento da mesma empresa', 'transferencia', false, false, true, true, false, 'saida', 'transferencia');
    this.adicionarCFOP('5153', 'Transferência de produção do estabelecimento, para outro estabelecimento da mesma empresa, em operação com suspensão do ICMS', 'transferencia', false, false, true, true, false, 'saida', 'transferencia');
    this.adicionarCFOP('6153', 'Transferência interestadual de produção do estabelecimento, para outro estabelecimento da mesma empresa, em operação com suspensão do ICMS', 'transferencia', false, false, true, true, false, 'saida', 'transferencia');

    // Entradas (Compras)
    this.adicionarCFOP('1101', 'Compra para industrialização', 'entrada', true, true, true, true, false, 'entrada');
    this.adicionarCFOP('1102', 'Compra para comercialização', 'entrada', true, true, true, true, false, 'entrada');
    this.adicionarCFOP('1103', 'Compra para uso como matéria-prima', 'entrada', true, true, true, true, false, 'entrada');
    this.adicionarCFOP('1104', 'Compra para uso como produto intermediário', 'entrada', true, true, true, true, false, 'entrada');
    this.adicionarCFOP('1105', 'Compra para uso como material de uso e consumo', 'entrada', true, true, true, true, false, 'entrada');
    this.adicionarCFOP('1106', 'Compra para uso como material de embalagem', 'entrada', true, true, true, true, false, 'entrada');
    this.adicionarCFOP('1107', 'Compra para uso como combustível', 'entrada', true, true, true, true, false, 'entrada');
    this.adicionarCFOP('1108', 'Compra para ativo imobilizado', 'entrada', true, true, true, true, false, 'entrada');
    this.adicionarCFOP('1109', 'Compra para uso como mercadoria', 'entrada', true, true, true, true, false, 'entrada');
    this.adicionarCFOP('1110', 'Compra para uso como produto acabado', 'entrada', true, true, true, true, false, 'entrada');
    this.adicionarCFOP('1111', 'Compra para uso como subproduto', 'entrada', true, true, true, true, false, 'entrada');
    this.adicionarCFOP('1112', 'Compra para uso como resíduo', 'entrada', true, true, true, true, false, 'entrada');
    this.adicionarCFOP('1113', 'Compra para uso como brinde', 'entrada', true, true, true, true, false, 'entrada');
    this.adicionarCFOP('1114', 'Compra para uso como amostra', 'entrada', true, true, true, true, false, 'entrada');
    this.adicionarCFOP('1115', 'Compra para uso como mostruário', 'entrada', true, true, true, true, false, 'entrada');
    this.adicionarCFOP('1116', 'Compra para uso como material de uso e consumo na industrialização', 'entrada', true, true, true, true, false, 'entrada');
    this.adicionarCFOP('1117', 'Compra para uso como material de embalagem na industrialização', 'entrada', true, true, true, true, false, 'entrada');
    this.adicionarCFOP('1118', 'Compra para uso como combustível na industrialização', 'entrada', true, true, true, true, false, 'entrada');
    this.adicionarCFOP('1119', 'Compra para uso como ativo imobilizado na industrialização', 'entrada', true, true, true, true, false, 'entrada');
    this.adicionarCFOP('1120', 'Compra para uso como mercadoria na industrialização', 'entrada', true, true, true, true, false, 'entrada');
    this.adicionarCFOP('1121', 'Compra para uso como produto acabado na industrialização', 'entrada', true, true, true, true, false, 'entrada');
    this.adicionarCFOP('1122', 'Compra para uso como subproduto na industrialização', 'entrada', true, true, true, true, false, 'entrada');
    this.adicionarCFOP('1123', 'Compra para uso como resíduo na industrialização', 'entrada', true, true, true, true, false, 'entrada');
    this.adicionarCFOP('1124', 'Compra para uso como brinde na industrialização', 'entrada', true, true, true, true, false, 'entrada');
    this.adicionarCFOP('1125', 'Compra para uso como amostra na industrialização', 'entrada', true, true, true, true, false, 'entrada');
    this.adicionarCFOP('1126', 'Compra para uso como mostruário na industrialização', 'entrada', true, true, true, true, false, 'entrada');

    // Entradas Interestaduais
    this.adicionarCFOP('2101', 'Compra interestadual para industrialização', 'entrada', true, true, true, true, false, 'entrada');
    this.adicionarCFOP('2102', 'Compra interestadual para comercialização', 'entrada', true, true, true, true, false, 'entrada');
    this.adicionarCFOP('2103', 'Compra interestadual para uso como matéria-prima', 'entrada', true, true, true, true, false, 'entrada');
    this.adicionarCFOP('2104', 'Compra interestadual para uso como produto intermediário', 'entrada', true, true, true, true, false, 'entrada');
    this.adicionarCFOP('2105', 'Compra interestadual para uso como material de uso e consumo', 'entrada', true, true, true, true, false, 'entrada');
    this.adicionarCFOP('2106', 'Compra interestadual para uso como material de embalagem', 'entrada', true, true, true, true, false, 'entrada');
    this.adicionarCFOP('2107', 'Compra interestadual para uso como combustível', 'entrada', true, true, true, true, false, 'entrada');
    this.adicionarCFOP('2108', 'Compra interestadual para ativo imobilizado', 'entrada', true, true, true, true, false, 'entrada');
    this.adicionarCFOP('2109', 'Compra interestadual para uso como mercadoria', 'entrada', true, true, true, true, false, 'entrada');
    this.adicionarCFOP('2110', 'Compra interestadual para uso como produto acabado', 'entrada', true, true, true, true, false, 'entrada');

    // Importações
    this.adicionarCFOP('3101', 'Importação direta', 'entrada', true, true, true, true, true, 'entrada', 'importacao');
    this.adicionarCFOP('3102', 'Importação por conta e ordem de terceiros', 'entrada', true, true, true, true, true, 'entrada', 'importacao');
    this.adicionarCFOP('3103', 'Importação por encomenda', 'entrada', true, true, true, true, true, 'entrada', 'importacao');
    this.adicionarCFOP('3104', 'Importação por conta e ordem, com cobertura cambial', 'entrada', true, true, true, true, true, 'entrada', 'importacao');
    this.adicionarCFOP('3105', 'Importação por encomenda, com cobertura cambial', 'entrada', true, true, true, true, true, 'entrada', 'importacao');

    // Simples Nacional
    this.adicionarCFOP('5111', 'Venda de produção do estabelecimento, optante pelo Simples Nacional', 'venda_interna', true, true, true, true, false, 'saida', 'simples');
    this.adicionarCFOP('5112', 'Venda de mercadoria adquirida ou recebida de terceiros, optante pelo Simples Nacional', 'venda_interna', true, true, true, true, false, 'saida', 'simples');
    this.adicionarCFOP('6111', 'Venda interestadual de produção do estabelecimento, optante pelo Simples Nacional', 'venda_interestadual', true, true, true, true, false, 'saida', 'simples');
    this.adicionarCFOP('6112', 'Venda interestadual de mercadoria adquirida ou recebida de terceiros, optante pelo Simples Nacional', 'venda_interestadual', true, true, true, true, false, 'saida', 'simples');

    // Operações com ICMS-ST
    this.adicionarCFOP('5113', 'Venda de produção do estabelecimento, com ICMS-ST', 'venda_interna', true, true, true, true, false, 'saida', 'st');
    this.adicionarCFOP('5114', 'Venda de mercadoria adquirida ou recebida de terceiros, com ICMS-ST', 'venda_interna', true, true, true, true, false, 'saida', 'st');
    this.adicionarCFOP('6113', 'Venda interestadual de produção do estabelecimento, com ICMS-ST', 'venda_interestadual', true, true, true, true, false, 'saida', 'st');
    this.adicionarCFOP('6114', 'Venda interestadual de mercadoria adquirida ou recebida de terceiros, com ICMS-ST', 'venda_interestadual', true, true, true, true, false, 'saida', 'st');

    // Operações com DIFAL
    this.adicionarCFOP('6115', 'Venda interestadual com DIFAL', 'venda_interestadual', true, true, true, true, false, 'saida', 'difal');
    this.adicionarCFOP('6116', 'Venda interestadual com FCP', 'venda_interestadual', true, true, true, true, false, 'saida', 'fcp');
  }

  private adicionarCFOP(
    cfop: string,
    descricao: string,
    tipoOperacao: 'venda_interna' | 'venda_interestadual' | 'exportacao' | 'devolucao' | 'transferencia' | 'entrada' | 'saida' | 'outra',
    geraCreditoCBS: boolean,
    geraCreditoIBS: boolean,
    incideCBS: boolean,
    incideIBS: boolean,
    incideIS: boolean,
    fluxo: 'entrada' | 'saida',
    regimeEspecial?: string
  ): void {
    const config: CFOPConfig = {
      cfop,
      descricao,
      tipoOperacao,
      geraCreditoCBS,
      geraCreditoIBS,
      incideCBS,
      incideIBS,
      incideIS,
      fluxo,
      regimeEspecial: regimeEspecial as any,
    };
    this.cfops.set(cfop, config);
  }

  /**
   * Carrega CFOPs de catálogo JSON
   */
  carregarDeCatalogo(cfopsConfig: CFOPConfig[]): void {
    for (const cfop of cfopsConfig) {
      this.cfops.set(cfop.cfop, cfop);
    }
  }

  /**
   * Classifica um CFOP
   */
  classificar(cfop: string): CFOPConfig | null {
    return this.cfops.get(cfop) || null;
  }

  /**
   * Obtém tipo de operação do CFOP
   */
  getTipoOperacao(cfop: string): string {
    const config = this.cfops.get(cfop);
    return config?.tipoOperacao || 'outra';
  }

  /**
   * Verifica se CFOP gera crédito CBS
   */
  geraCreditoCBS(cfop: string): boolean {
    return this.cfops.get(cfop)?.geraCreditoCBS ?? false;
  }

  /**
   * Verifica se CFOP gera crédito IBS
   */
  geraCreditoIBS(cfop: string): boolean {
    return this.cfops.get(cfop)?.geraCreditoIBS ?? false;
  }

  /**
   * Verifica se CFOP incide CBS
   */
  incideCBS(cfop: string): boolean {
    return this.cfops.get(cfop)?.incideCBS ?? true;
  }

  /**
   * Verifica se CFOP incide IBS
   */
  incideIBS(cfop: string): boolean {
    return this.cfops.get(cfop)?.incideIBS ?? true;
  }

  /**
   * Verifica se CFOP incide Imposto Seletivo
   */
  incideIS(cfop: string): boolean {
    return this.cfops.get(cfop)?.incideIS ?? false;
  }

  /**
   * Verifica se é operação de exportação
   */
  isExportacao(cfop: string): boolean {
    return this.cfops.get(cfop)?.tipoOperacao === 'exportacao';
  }

  /**
   * Verifica se é devolução
   */
  isDevolucao(cfop: string): boolean {
    return this.cfops.get(cfop)?.tipoOperacao === 'devolucao';
  }

  /**
   * Verifica se é transferência
   */
  isTransferencia(cfop: string): boolean {
    return this.cfops.get(cfop)?.tipoOperacao === 'transferencia';
  }

  /**
   * Verifica se é operação com ST
   */
  isComST(cfop: string): boolean {
    return this.cfops.get(cfop)?.regimeEspecial === 'st';
  }

  /**
   * Verifica se é operação com DIFAL
   */
  isComDIFAL(cfop: string): boolean {
    return this.cfops.get(cfop)?.regimeEspecial === 'difal';
  }

  /**
   * Verifica se é operação com FCP
   */
  isComFCP(cfop: string): boolean {
    return this.cfops.get(cfop)?.regimeEspecial === 'fcp';
  }

  /**
   * Verifica se é operação Simples Nacional
   */
  isSimplesNacional(cfop: string): boolean {
    return this.cfops.get(cfop)?.regimeEspecial === 'simples';
  }

  /**
   * Verifica se é operação de exportação
   */
  isExportacaoRegime(cfop: string): boolean {
    return this.cfops.get(cfop)?.regimeEspecial === 'exportacao';
  }

  /**
   * Verifica se é operação de zona franca
   */
  isZonaFranca(cfop: string): boolean {
    return this.cfops.get(cfop)?.regimeEspecial === 'zona_franca' || this.cfops.get(cfop)?.regimeEspecial === 'area_livre';
  }

  /**
   * Verifica se é operação com suspensão
   */
  isSuspensao(cfop: string): boolean {
    return this.cfops.get(cfop)?.regimeEspecial === 'suspensao';
  }

  /**
   * Verifica se é operação de importação
   */
  isImportacao(cfop: string): boolean {
    return this.cfops.get(cfop)?.regimeEspecial === 'importacao';
  }

  /**
   * Retorna todos os CFOPs carregados
   */
  getAllCFOPs(): CFOPConfig[] {
    return Array.from(this.cfops.values());
  }

  /**
   * Obtém descrição do CFOP
   */
  getDescricao(cfop: string): string {
    return this.cfops.get(cfop)?.descricao || 'CFOP não cadastrado';
  }

  /**
   * Estatísticas dos CFOPs carregados
   */
  getEstatisticas(): { total: number; porTipo: Record<string, number> } {
    const porTipo: Record<string, number> = {};
    for (const config of this.cfops.values()) {
      porTipo[config.tipoOperacao] = (porTipo[config.tipoOperacao] || 0) + 1;
    }
    return {
      total: this.cfops.size,
      porTipo,
    };
  }
}

export default CFOPClassifier;