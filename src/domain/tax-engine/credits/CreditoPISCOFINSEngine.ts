// Créditos PIS/COFINS por CNAE - A04
// Configuração de créditos não cumulativos por atividade/CNAE

export interface CreditoPISCOFINSConfig {
  ncmPrefix: string;
  cnaePrefix?: string;
  atividade?: string;
  percentualCreditoPIS: number; // % sobre base de crédito
  percentualCreditoCOFINS: number; // % sobre base de crédito
  descricao: string;
  // Condições
  condicoes?: {
    regimeEmitente?: string[]; // regimes que geram crédito
    regimeDestinatario?: string[]; // regimes que permitem crédito
    operacoesElegiveis?: string[]; // CFOP elegíveis
    ufOrigem?: string[];
    ufDestino?: string[];
  };
}

export interface CreditoPISCOFINSResultado {
  elegivel: boolean;
  baseCalculo: number;
  creditoPIS: number;
  creditoCOFINS: number;
  detalhePIS: string;
  detalheCOFINS: string;
  alertas: string[];
}

export class CreditoPISCOFINSEngine {
  private configs: Map<string, CreditoPISCOFINSConfig> = new Map();

  constructor(configs: CreditoPISCOFINSConfig[] = []) {
    this.carregarConfigs(configs);
  }

  private carregarConfigs(configs: CreditoPISCOFINSConfig[]): void {
    // Configurações padrão baseadas na legislação (LC 199/2023, IN RFB 2.121/2022)
    const configsPadrao: CreditoPISCOFINSConfig[] = [
      // Combustíveis - crédito integral
      {
        ncmPrefix: '2710',
        descricao: 'Combustíveis líquidos - crédito integral PIS/COFINS não cumulativos',
        percentualCreditoPIS: 1.65,
        percentualCreditoCOFINS: 7.6,
        condicoes: {
          operacoesElegiveis: ['1101', '1102', '1103', '2101', '2102', '2103'],
        },
      },
      {
        ncmPrefix: '2711',
        descricao: 'Gás natural/GLP - crédito integral',
        percentualCreditoPIS: 1.65,
        percentualCreditoCOFINS: 7.6,
        condicoes: {
          operacoesElegiveis: ['1101', '1102', '2101', '2102'],
        },
      },
      // Insumos industriais - crédito integral
      {
        ncmPrefix: '28',
        descricao: 'Produtos químicos inorgânicos - crédito integral',
        percentualCreditoPIS: 1.65,
        percentualCreditoCOFINS: 7.6,
        condicoes: {
          operacoesElegiveis: ['1101', '1102', '1103', '2101', '2102', '2103'],
        },
      },
      {
        ncmPrefix: '29',
        descricao: 'Produtos químicos orgânicos - crédito integral',
        percentualCreditoPIS: 1.65,
        percentualCreditoCOFINS: 7.6,
        condicoes: {
          operacoesElegiveis: ['1101', '1102', '1103', '2101', '2102', '2103'],
        },
      },
      {
        ncmPrefix: '30',
        descricao: 'Medicamentos - crédito reduzido 50%',
        percentualCreditoPIS: 0.825,
        percentualCreditoCOFINS: 3.8,
        condicoes: {
          operacoesElegiveis: ['1101', '1102', '1103', '2101', '2102', '2103'],
        },
      },
      // Insumos agropecuários
      {
        ncmPrefix: '31',
        descricao: 'Fertilizantes - crédito integral',
        percentualCreditoPIS: 1.65,
        percentualCreditoCOFINS: 7.6,
        condicoes: {
          operacoesElegiveis: ['1101', '1102', '1103', '2101', '2102', '2103'],
        },
      },
      {
        ncmPrefix: '3808',
        descricao: 'Agrotóxicos - crédito integral',
        percentualCreditoPIS: 1.65,
        percentualCreditoCOFINS: 7.6,
        condicoes: {
          operacoesElegiveis: ['1101', '1102', '1103', '2101', '2102', '2103'],
        },
      },
      // Máquinas e equipamentos - crédito integral (ativo imobilizado)
      {
        ncmPrefix: '84',
        descricao: 'Máquinas e equipamentos - crédito integral (ativo imobilizado)',
        percentualCreditoPIS: 1.65,
        percentualCreditoCOFINS: 7.6,
        condicoes: {
          operacoesElegiveis: ['1101', '1102', '2101', '2102'],
        },
      },
      // Energia elétrica - crédito integral
      {
        ncmPrefix: '2716',
        descricao: 'Energia elétrica - crédito integral',
        percentualCreditoPIS: 1.65,
        percentualCreditoCOFINS: 7.6,
        condicoes: {
          operacoesElegiveis: ['1101', '1102', '2101', '2102'],
        },
      },
      // Serviços de transporte - crédito integral
      {
        ncmPrefix: '99',
        descricao: 'Serviços de transporte - crédito integral',
        percentualCreditoPIS: 1.65,
        percentualCreditoCOFINS: 7.6,
        condicoes: {
          operacoesElegiveis: ['1101', '1102', '2101', '2102'],
        },
      },
      // Serviços de comunicação - crédito integral
      {
        ncmPrefix: '61',
        descricao: 'Serviços de telecomunicações - crédito integral',
        percentualCreditoPIS: 1.65,
        percentualCreditoCOFINS: 7.6,
        condicoes: {
          operacoesElegiveis: ['1101', '1102', '2101', '2102'],
        },
      },
      // Serviços financeiros - SEM crédito (vedado)
      {
        ncmPrefix: '64',
        descricao: 'Serviços financeiros - vedado crédito PIS/COFINS',
        percentualCreditoPIS: 0,
        percentualCreditoCOFINS: 0,
        condicoes: {
          operacoesElegiveis: [],
        },
      },
      // Serviços de seguros - SEM crédito (vedado)
      {
        ncmPrefix: '65',
        descricao: 'Seguros - vedado crédito PIS/COFINS',
        percentualCreditoPIS: 0,
        percentualCreditoCOFINS: 0,
        condicoes: {
          operacoesElegiveis: [],
        },
      },
      // Aluguel de imóveis - crédito parcial (40%)
      {
        ncmPrefix: '68',
        descricao: 'Aluguel de imóveis - crédito parcial 40%',
        percentualCreditoPIS: 0.66,
        percentualCreditoCOFINS: 3.04,
        condicoes: {
          operacoesElegiveis: ['1101', '1102', '2101', '2102'],
        },
      },
      // Bebidas açucaradas - SEM crédito (vedado pela legislação)
      {
        ncmPrefix: '2202',
        descricao: 'Bebidas açucaradas - crédito não permitido',
        percentualCreditoPIS: 0,
        percentualCreditoCOFINS: 0,
        condicoes: {
          operacoesElegiveis: [],
        },
      },
      // Padrão - crédito presumido 30% (setor serviços/comércio)
      {
        ncmPrefix: 'DEFAULT',
        descricao: 'Padrão - crédito presumido 30%',
        percentualCreditoPIS: 0.495, // 30% de 1.65%
        percentualCreditoCOFINS: 2.28, // 30% de 7.6%
        condicoes: {
          operacoesElegiveis: ['1101', '1102', '1103', '2101', '2102', '2103'],
        },
      },
      // Informática - crédito integral
      {
        ncmPrefix: '8471',
        descricao: 'Equipamentos de informática - crédito integral',
        percentualCreditoPIS: 1.65,
        percentualCreditoCOFINS: 7.6,
        condicoes: {
          operacoesElegiveis: ['1101', '1102', '2101', '2102'],
        },
      },
    ];

    // Mesclar com configs personalizadas
    const todasConfigs = [...configsPadrao, ...configs];
    for (const config of todasConfigs) {
      this.configs.set(config.ncmPrefix, config);
    }
  }

  static async carregarDeCatalogo(path: string): Promise<CreditoPISCOFINSEngine> {
    try {
      const response = await fetch(path);
      if (response.ok) {
        const data = await response.json();
        return new CreditoPISCOFINSEngine(data.configs || []);
      }
    } catch (err) {
      console.warn('Falha ao carregar catálogo PIS/COFINS:', err);
    }
    return new CreditoPISCOFINSEngine();
  }

  /**
   * Calcula créditos PIS/COFINS para um item
   */
  calcularCreditos(
    ncm: string,
    cfop: string,
    baseCalculo: number,
    regimeEmitente: string,
    regimeDestinatario: string,
    incluirCreditos: boolean = true
  ): CreditoPISCOFINSResultado {
    const alertas: string[] = [];
    
    // Se créditos desativados, retorna zero
    if (!incluirCreditos) {
      return {
        elegivel: false,
        baseCalculo: 0,
        creditoPIS: 0,
        creditoCOFINS: 0,
        detalhePIS: 'Créditos desativados nos parâmetros',
        detalheCOFINS: 'Créditos desativados nos parâmetros',
        alertas: ['Créditos PIS/COFINS desativados nos parâmetros da simulação'],
      };
    }
    
    const ncmPrefix = ncm.replace(/\D/g, '').substring(0, 4);

    // Buscar configuração exata
    let config = this.configs.get(ncmPrefix);

    // Busca por capítulo (2 dígitos)
    if (!config) {
      const capitulo = ncmPrefix.substring(0, 2);
      const porCapitulo = Array.from(this.configs.entries()).find(
        ([key]) => key.startsWith(capitulo) && key.length === 2
      );
      if (porCapitulo) {
        config = porCapitulo[1];
      }
    }

    // Fallback DEFAULT
    if (!config) {
      config = this.configs.get('DEFAULT');
    }

    if (!config) {
      return {
        elegivel: false,
        baseCalculo: 0,
        creditoPIS: 0,
        creditoCOFINS: 0,
        detalhePIS: 'Nenhuma configuração de crédito encontrada',
        detalheCOFINS: 'Nenhuma configuração de crédito encontrada',
        alertas: ['Nenhuma regra de crédito configurada'],
      };
    }

    // Se ambos percentuais são 0, não é elegível (ex: serviços financeiros, seguros)
    if (config.percentualCreditoPIS === 0 && config.percentualCreditoCOFINS === 0) {
      return {
        elegivel: false,
        baseCalculo: 0,
        creditoPIS: 0,
        creditoCOFINS: 0,
        detalhePIS: `${config.descricao} - crédito não permitido`,
        detalheCOFINS: `${config.descricao} - crédito não permitido`,
        alertas: [`${config.descricao} não gera crédito PIS/COFINS (alíquota 0%)`],
      };
    }

    // Verificar se CFOP é elegível
    const cfopElegivel = config.condicoes?.operacoesElegiveis?.includes(cfop) ?? false;
    if (!cfopElegivel && config.condicoes?.operacoesElegiveis?.length) {
      return {
        elegivel: false,
        baseCalculo: 0,
        creditoPIS: 0,
        creditoCOFINS: 0,
        detalhePIS: `CFOP ${cfop} não elegível para crédito`,
        detalheCOFINS: `CFOP ${cfop} não elegível para crédito`,
        alertas: [`CFOP ${cfop} não está na lista de operações elegíveis para crédito`],
      };
    }

    // Verificar regime do emitente
    if (config.condicoes?.regimeEmitente?.length) {
      if (!config.condicoes.regimeEmitente.includes(regimeEmitente)) {
        return {
          elegivel: false,
          baseCalculo: 0,
          creditoPIS: 0,
          creditoCOFINS: 0,
          detalhePIS: `Regime do emitente ${regimeEmitente} não elegível`,
          detalheCOFINS: `Regime do emitente ${regimeEmitente} não elegível`,
          alertas: [`Regime do emitente ${regimeEmitente} não permite crédito para este NCM`],
        };
      }
    }

    // Verificar regime do destinatário
    if (config.condicoes?.regimeDestinatario?.length) {
      if (!config.condicoes.regimeDestinatario.includes(regimeDestinatario)) {
        return {
          elegivel: false,
          baseCalculo: 0,
          creditoPIS: 0,
          creditoCOFINS: 0,
          detalhePIS: `Regime do destinatário ${regimeDestinatario} não elegível`,
          detalheCOFINS: `Regime do destinatário ${regimeDestinatario} não elegível`,
          alertas: [`Regime do destinatário ${regimeDestinatario} não permite crédito`],
        };
      }
    }

    // Calcular créditos
    const creditoPIS = (baseCalculo * config.percentualCreditoPIS) / 100;
    const creditoCOFINS = (baseCalculo * config.percentualCreditoCOFINS) / 100;

    const detalhePIS = `PIS: ${config.percentualCreditoPIS}% sobre R$ ${baseCalculo.toFixed(2)} = R$ ${creditoPIS.toFixed(2)} (${config.descricao})`;
    const detalheCOFINS = `COFINS: ${config.percentualCreditoCOFINS}% sobre R$ ${baseCalculo.toFixed(2)} = R$ ${creditoCOFINS.toFixed(2)} (${config.descricao})`;

    return {
      elegivel: true,
      baseCalculo,
      creditoPIS,
      creditoCOFINS,
      detalhePIS,
      detalheCOFINS,
      alertas: [],
    };
  }

  /**
   * Busca configuração por NCM
   */
  getConfig(ncm: string): CreditoPISCOFINSConfig | null {
    const ncmPrefix = ncm.replace(/\D/g, '').substring(0, 4);
    
    // Busca exata
    if (this.configs.has(ncmPrefix)) {
      return this.configs.get(ncmPrefix) || null;
    }

    // Busca por capítulo
    const capitulo = ncmPrefix.substring(0, 2);
    const porCapitulo = Array.from(this.configs.entries()).find(
      ([key]) => key.startsWith(capitulo) && key.length === 2
    );
    if (porCapitulo) {
      return porCapitulo[1];
    }

    // Fallback
    return this.configs.get('DEFAULT') || null;
  }

  /**
   * Verifica se um NCM gera crédito
   */
  ncmGeraCredito(ncm: string): { cbs: boolean; ibs: boolean } {
    const ncmPrefix = ncm.replace(/\D/g, '').substring(0, 4);
    let configNcm = this.configs.get(ncmPrefix);
    
    // Se não encontrou exato, busca por capítulo
    if (!configNcm) {
      const capitulo = ncmPrefix.substring(0, 2);
      const porCapitulo = Array.from(this.configs.entries()).find(
        ([key]) => key.startsWith(capitulo) && key.length === 2
      );
      if (porCapitulo) {
        configNcm = porCapitulo[1];
      }
    }
    
    // Se não encontrou, usa DEFAULT
    if (!configNcm) {
      configNcm = this.configs.get('DEFAULT');
    }
    
    if (!configNcm) {
      return { cbs: false, ibs: false };
    }
    
    // Se ambos percentuais são 0, não gera crédito
    if (configNcm.percentualCreditoPIS === 0 && configNcm.percentualCreditoCOFINS === 0) {
      return { cbs: false, ibs: false };
    }
    
    return {
      cbs: configNcm.percentualCreditoPIS > 0,
      ibs: configNcm.percentualCreditoCOFINS > 0,
    };
  }

  /**
   * Verifica se um CFOP gera crédito
   */
  cfopGeraCredito(cfop: string): { cbs: boolean; ibs: boolean } {
    // Como não temos CFOP configurado no CreditEngine, delega para CFOPClassifier se disponível
    // Por enquanto, retorna baseado no CFOP padrão (entradas geram crédito)
    const cfopsEntrada = ['1101', '1102', '1103', '1104', '1105', '1106', '1107', '1108', '1109', '1110',
                          '2101', '2102', '2103', '2104', '2105', '2106', '2107', '2108', '2109', '2110',
                          '3101', '3102', '3103', '3104', '3105'];
    return {
      cbs: cfopsEntrada.includes(cfop),
      ibs: cfopsEntrada.includes(cfop),
    };
  }

  /**
   * Retorna lista de NCMs com crédito configurado
   */
  getNCMsComCredito(): string[] {
    return Array.from(this.configs.keys())
      .filter(k => k !== 'DEFAULT')
      .filter(k => {
        const config = this.configs.get(k);
        return config && (config.percentualCreditoPIS > 0 || config.percentualCreditoCOFINS > 0);
      });
  }

  /**
   * Retorna lista de CFOPs que geram crédito
   */
  getCFOPsComCredito(): string[] {
    return ['1101', '1102', '1103', '1102', '1103', '1104', '1105', '1106', '1107', '1108', '1109', '1110',
            '2101', '2102', '2103', '2102', '2103', '2103', '2104', '2105', '2106', '2107', '2108', '2109', '2110',
            '3101', '3102', '3103', '3104', '3105'];
  }
}

export default CreditoPISCOFINSEngine;