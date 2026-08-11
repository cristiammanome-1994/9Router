// Credit Engine - C01: Não-cumulatividade CBS/IBS
// Motor de cálculo de créditos CBS e IBS

import type {
  CreditoConfig,
  ResultadoCalculoItem,
  ParametrosSimulacao,
  NCMConfig,
  CFOPConfig,
} from './types';

export class CreditEngine {
  private creditosConfig: CreditoConfig[] = [];
  private ncmsConfig: Map<string, NCMConfig> = new Map();
  private cfopsConfig: Map<string, CFOPConfig> = new Map();

  constructor(
    creditosConfig: CreditoConfig[] = [],
    ncmsConfig: NCMConfig[] = [],
    cfopsConfig: CFOPConfig[] = []
  ) {
    this.creditosConfig = creditosConfig;
    this.ncmsConfig = new Map(ncmsConfig.map(n => [n.ncmPrefix, n]));
    this.cfopsConfig = new Map(cfopsConfig.map(c => [c.cfop, c]));
  }

  /**
   * Carrega configurações de créditos a partir de catálogo JSON
   */
  static async carregarDeCatalogos(
    creditosPath: string,
    ncmsPath: string,
    cfopsPath: string
  ): Promise<CreditEngine> {
    try {
      const [creditosRes, ncmsRes, cfopsRes] = await Promise.all([
        fetch(creditosPath),
        fetch(ncmsPath),
        fetch(cfopsPath),
      ]);

      const [creditos, ncms, cfops] = await Promise.all([
        creditosRes.ok ? creditosRes.json() : { creditos: [] },
        ncmsRes.ok ? ncmsRes.json() : { categorias: [] },
        cfopsRes.ok ? cfopsRes.json() : { cfops: [] },
      ]);

      return new CreditEngine(
        creditos.creditos || [],
        ncms.categorias || [],
        cfops.cfops || []
      );
    } catch (err) {
      console.warn('Falha ao carregar catálogos de créditos, usando configuração padrão:', err);
      return new CreditEngine([], [], []);
    }
  }

  /**
   * Calcula créditos de CBS e IBS para um item
   */
  calcularCreditos(
    item: ResultadoCalculoItem,
    params: ParametrosSimulacao
  ): { creditoCBS: number; creditoIBS: number; detalheCBS: string; detalheIBS: string } {
    if (!params.incluirCreditos) {
      return {
        creditoCBS: 0,
        creditoIBS: 0,
        detalheCBS: 'Créditos desativados nos parâmetros',
        detalheIBS: 'Créditos desativados nos parâmetros',
      };
    }

    const ncmConfig = this.ncmsConfig.get(item.ncm.substring(0, 4));
    const cfopConfig = this.cfopsConfig.get(item.cfop);

    // Verifica se a operação gera crédito
    const creditoConfig = this.buscarConfigCredito(item.ncm, item.cfop, item.auditoria.tipoOperacao);

    const detalhesCBS: string[] = [];
    const detalhesIBS: string[] = [];

    let creditoCBS = 0;
    let creditoIBS = 0;

    // Verifica se a operação gera crédito CBS
    if (creditoConfig?.geraCreditoCBS && cfopConfig?.geraCreditoCBS) {
      const baseCredito = item.baseCalculo.valorOperacao;
      const percentualCBS = creditoConfig.percentualCreditoCBS || 0;
      creditoCBS = (baseCredito * percentualCBS) / 100;
      detalhesCBS.push(`CBS: ${percentualCBS}% sobre R$ ${baseCredito.toFixed(2)} = R$ ${creditoCBS.toFixed(2)}`);
    } else {
      detalhesCBS.push('CBS: Operação não gera crédito (CFOP/NCM não elegível)');
    }

    // Verifica se a operação gera crédito IBS
    if (creditoConfig?.geraCreditoIBS && cfopConfig?.geraCreditoIBS) {
      const baseCredito = item.baseCalculo.valorOperacao;
      const percentualIBS = creditoConfig.percentualCreditoIBS || 0;
      creditoIBS = (baseCredito * percentualIBS) / 100;
      detalhesIBS.push(`IBS: ${percentualIBS}% sobre R$ ${baseCredito.toFixed(2)} = R$ ${creditoIBS.toFixed(2)}`);
    } else {
      detalhesIBS.push('IBS: Operação não gera crédito (CFOP/NCM não elegível)');
    }

    // Valida regime do emitente (C06)
    if (creditoConfig?.condicoes?.emitenteRegime) {
      // Em produção, isso viria do cadastro do emitente
      // Por ora, apenas registra a necessidade de validação
      detalhesCBS.push('⚠ Validação de regime do emitente necessária');
      detalhesIBS.push('⚠ Validação de regime do emitente necessária');
    }

    // Valida regime do destinatário
    if (creditoConfig?.condicoes?.destinatarioRegime) {
      detalhesCBS.push('⚠ Validação de regime do destinatário necessária');
      detalhesIBS.push('⚠ Validação de regime do destinatário necessária');
    }

    return {
      creditoCBS: Math.max(0, creditoCBS),
      creditoIBS: Math.max(0, creditoIBS),
      detalheCBS: detalhesCBS.join('; '),
      detalheIBS: detalhesIBS.join('; '),
    };
  }

  /**
   * Busca configuração de crédito para o NCM/CFOP/TipoOperação
   */
  private buscarConfigCredito(ncm: string, cfop: string, tipoOperacao: string): CreditoConfig | undefined {
    const ncmPrefix = ncm.replace(/\D/g, '').substring(0, 4);

    // Busca exata por NCM + CFOP
    let config = this.creditosConfig.find(
      c => c.ncmPrefix === ncmPrefix && c.cfop === cfop
    );

    // Busca por NCM + tipoOperação
    if (!config) {
      config = this.creditosConfig.find(
        c => c.ncmPrefix === ncmPrefix && c.tipoOperacao === tipoOperacao
      );
    }

    // Busca por NCM apenas
    if (!config) {
      config = this.creditosConfig.find(c => c.ncmPrefix === ncmPrefix);
    }

    // Busca por capítulo (2 dígitos)
    if (!config) {
      const capitulo = ncmPrefix.substring(0, 2);
      config = this.creditosConfig.find(
        c => c.ncmPrefix && c.ncmPrefix.startsWith(capitulo) && c.ncmPrefix.length === 2
      );
    }

    // Fallback: configuração padrão por tipo de operação
    if (!config) {
      config = this.creditosConfig.find(c => c.tipoOperacao === tipoOperacao && !c.ncmPrefix);
    }

    return config;
  }

  /**
   * Verifica se um NCM gera crédito
   */
  ncmGeraCredito(ncm: string): { cbs: boolean; ibs: boolean } {
    const ncmPrefix = ncm.replace(/\D/g, '').substring(0, 4);
    const config = this.creditosConfig.find(c => c.ncmPrefix === ncmPrefix);
    return {
      cbs: config?.geraCreditoCBS ?? false,
      ibs: config?.geraCreditoIBS ?? false,
    };
  }

  /**
   * Verifica se um CFOP gera crédito
   */
  cfopGeraCredito(cfop: string): { cbs: boolean; ibs: boolean } {
    const config = this.cfopsConfig.get(cfop);
    return {
      cbs: config?.geraCreditoCBS ?? false,
      ibs: config?.geraCreditoIBS ?? false,
    };
  }

  /**
   * Retorna lista de NCMs que geram crédito (para auditoria)
   */
  getNCMsComCredito(): string[] {
    return this.creditosConfig
      .filter(c => c.geraCreditoCBS || c.geraCreditoIBS)
      .map(c => c.ncmPrefix);
  }

  /**
   * Retorna lista de CFOPs que geram crédito (para auditoria)
   */
  getCFOPsComCredito(): string[] {
    return Array.from(this.cfopsConfig.values())
      .filter(c => c.geraCreditoCBS || c.geraCreditoIBS)
      .map(c => c.cfop);
  }
}

export default CreditEngine;