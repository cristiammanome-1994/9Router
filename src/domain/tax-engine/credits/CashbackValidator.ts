// Cashback Validator - A01: Estrutura de validação de cashback
// Implementa regras de elegibilidade conforme Anexo III da Lei 14.988/2024

import type { NCMConfig } from '../types';

export interface CashbackConfig {
  ncmPrefix: string;
  descricao: string;
  percentual: number; // 100, 50, 0
  elegibilidade: {
    consumidorFinal: boolean; // apenas B2C
    pessoaFisica: boolean; // apenas PF
    rendaMaximaSalariosMinimos: number; // teto de renda
    limiteAnualPorCpf?: number; // teto anual por CPF
    ncmElegiveis: string[]; // NCMs que têm direito
  };
}

export interface CashbackValidationResult {
  elegivel: boolean;
  percentual: number;
  valorCashback: number;
  motivo: string;
  alertas: string[];
  detalhes: {
    consumidorFinal: boolean;
    pessoaFisica: boolean;
    rendaValida: boolean;
    ncmElegivel: boolean;
    limiteAnualAtingido: boolean;
  };
}

export class CashbackValidator {
  private configs: Map<string, CashbackConfig> = new Map();
  private limitesAnuais: Map<string, number> = new Map(); // CPF -> valor acumulado

  constructor(configs: CashbackConfig[] = []) {
    this.carregarConfigs(configs);
  }

  private carregarConfigs(configs: CashbackConfig[]): void {
    // Configurações padrão baseadas no Anexo III
    const configsPadrao: CashbackConfig[] = [
      {
        ncmPrefix: '01',
        descricao: 'Carnes e miudezas',
        percentual: 100,
        elegibilidade: {
          consumidorFinal: true,
          pessoaFisica: true,
          rendaMaximaSalariosMinimos: 2,
          ncmElegiveis: ['0101', '0102', '0103', '0104', '0105', '0106', '0201', '0202', '0203', '0204', '0205', '0206', '0207', '0208', '0209', '0210'],
        },
      },
      {
        ncmPrefix: '02',
        descricao: 'Carnes e miudezas',
        percentual: 100,
        elegibilidade: {
          consumidorFinal: true,
          pessoaFisica: true,
          rendaMaximaSalariosMinimos: 2,
          ncmElegiveis: ['0101', '0102', '0103', '0104', '0105', '0106', '0201', '0202', '0203', '0204', '0205', '0206', '0207', '0208', '0209', '0210'],
        },
      },
      {
        ncmPrefix: '03',
        descricao: 'Peixes e crustáceos',
        percentual: 100,
        elegibilidade: {
          consumidorFinal: true,
          pessoaFisica: true,
          rendaMaximaSalariosMinimos: 2,
          ncmElegiveis: ['0301', '0302', '0303', '0304', '0305', '0306', '0307', '0308'],
        },
      },
      {
        ncmPrefix: '04',
        descricao: 'Laticínios, ovos, mel',
        percentual: 100,
        elegibilidade: {
          consumidorFinal: true,
          pessoaFisica: true,
          rendaMaximaSalariosMinimos: 2,
          ncmElegiveis: ['0401', '0402', '0403', '0404', '0405', '0406', '0407', '0408', '0409', '0410'],
        },
      },
      {
        ncmPrefix: '07',
        descricao: 'Hortícolas',
        percentual: 100,
        elegibilidade: {
          consumidorFinal: true,
          pessoaFisica: true,
          rendaMaximaSalariosMinimos: 2,
          ncmElegiveis: ['0701', '0702', '0703', '0704', '0705', '0706', '0707', '0708', '0709', '0710', '0711', '0712', '0713', '0714'],
        },
      },
      {
        ncmPrefix: '08',
        descricao: 'Frutas',
        percentual: 100,
        elegibilidade: {
          consumidorFinal: true,
          pessoaFisica: true,
          rendaMaximaSalariosMinimos: 2,
          ncmElegiveis: ['0801', '0802', '0803', '0804', '0805', '0806', '0806', '0807', '0808', '0809', '0810', '0811', '0812', '0813', '0814'],
        },
      },
      {
        ncmPrefix: '10',
        descricao: 'Cereais',
        percentual: 100,
        elegibilidade: {
          consumidorFinal: true,
          pessoaFisica: true,
          rendaMaximaSalariosMinimos: 2,
          ncmElegiveis: ['1001', '1002', '1003', '1004', '1005', '1006', '1007', '1008'],
        },
      },
      {
        ncmPrefix: '11',
        descricao: 'Produtos da moagem',
        percentual: 100,
        elegibilidade: {
          consumidorFinal: true,
          pessoaFisica: true,
          rendaMaximaSalariosMinimos: 2,
          ncmElegiveis: ['1101', '1102', '1103', '1104', '1105', '1106', '1107', '1108', '1109'],
        },
      },
      {
        ncmPrefix: '19',
        descricao: 'Preparações de cereais, farinhas',
        percentual: 100,
        elegibilidade: {
          consumidorFinal: true,
          pessoaFisica: true,
          rendaMaximaSalariosMinimos: 2,
          ncmElegiveis: ['1901', '1902', '1903', '1904', '1905'],
        },
      },
      {
        ncmPrefix: '30',
        descricao: 'Medicamentos',
        percentual: 50,
        elegibilidade: {
          consumidorFinal: true,
          pessoaFisica: true,
          rendaMaximaSalariosMinimos: 2,
          ncmElegiveis: ['3001', '3002', '3003', '3004', '3005', '3006'],
        },
      },
      {
        ncmPrefix: '48',
        descricao: 'Papel e cartão',
        percentual: 100,
        elegibilidade: {
          consumidorFinal: true,
          pessoaFisica: true,
          rendaMaximaSalariosMinimos: 2,
          ncmElegiveis: ['4801', '4802', '4803', '4804', '4805', '4806', '4807', '4808', '4809', '4810', '4811', '4812', '4813', '4814', '4815', '4816', '4817', '4818', '4819', '4820', '4821', '4822', '4823'],
        },
      },
      {
        ncmPrefix: '49',
        descricao: 'Livros, jornais, impressos',
        percentual: 100,
        elegibilidade: {
          consumidorFinal: true,
          pessoaFisica: true,
          rendaMaximaSalariosMinimos: 2,
          ncmElegiveis: ['4901', '4902', '4903', '4904', '4905', '4906', '4907', '4908', '4909', '4910', '4911'],
        },
      },
      {
        ncmPrefix: '95',
        descricao: 'Brinquedos, jogos',
        percentual: 100,
        elegibilidade: {
          consumidorFinal: true,
          pessoaFisica: true,
          rendaMaximaSalariosMinimos: 2,
          ncmElegiveis: ['9501', '9502', '9503', '9504', '9505', '9506', '9506', '9507', '9508'],
        },
      },
    ];

    // Mesclar com configs personalizadas
    const todasConfigs = [...configsPadrao, ...configs];
    for (const config of todasConfigs) {
      this.configs.set(config.ncmPrefix, config);
    }
  }

  static async carregarDeCatalogo(path: string): Promise<CashbackValidator> {
    try {
      const response = await fetch(path);
      if (response.ok) {
        const data = await response.json();
        return new CashbackValidator(data.configs || []);
      }
    } catch (err) {
      console.warn('Falha ao carregar catálogo de cashback:', err);
    }
    return new CashbackValidator();
  }

  /**
   * Valida elegibilidade e calcula cashback para um item
   */
  validarCashback(
    ncm: string,
    valorItem: number,
    consumidor: {
      cpf?: string;
      pessoaFisica: boolean;
      rendaMensal?: number; // em salários mínimos
      consumidorFinal: boolean;
    }
  ): CashbackValidationResult {
    const ncmPrefix = ncm.replace(/\D/g, '').substring(0, 2);
    const config = this.configs.get(ncmPrefix);

    const alertas: string[] = [];
    let elegivel = false;
    let percentual = 0;
    let motivo = '';
    let rendaValida = true;
    let ncmElegivel = false;
    let consumidorFinalValido = false;
    let pessoaFisicaValida = false;
    let limiteAnualAtingido = false;

    if (!config) {
      motivo = 'NCM não possui cashback configurado';
      return this.criarResultado(false, 0, 0, motivo, ['NCM sem cashback'], {
        consumidorFinal: consumidor.consumidorFinal,
        pessoaFisica: consumidor.pessoaFisica,
        rendaValida: true,
        ncmElegivel: false,
        limiteAnualAtingido: false,
      });
    }

    // Verificar NCM elegível
    const ncmCompleto = ncm.replace(/\D/g, '').substring(0, 4);
    ncmElegivel = config.elegibilidade.ncmElegiveis.includes(ncmCompleto);

    if (!ncmElegivel) {
      alertas.push(`NCM ${ncmCompleto} não está na lista de elegíveis para cashback`);
    }

    // Verificar consumidor final (B2C)
    if (!consumidor.consumidorFinal) {
      alertas.push('Cashback apenas para consumidor final (operação B2C)');
    } else {
      consumidorFinalValido = true;
    }

    // Verificar pessoa física
    if (!consumidor.pessoaFisica) {
      alertas.push('Cashback apenas para pessoa física');
    } else {
      pessoaFisicaValida = true;
    }

    // Verificar renda (se informada)
    if (consumidor.rendaMensal !== undefined) {
      if (consumidor.rendaMensal > config.elegibilidade.rendaMaximaSalariosMinimos) {
        rendaValida = false;
        alertas.push(`Renda (${consumidor.rendaMensal} SM) excede limite de ${config.elegibilidade.rendaMaximaSalariosMinimos} salários-mínimos`);
      } else {
        rendaValida = true;
      }
    } else {
      alertas.push('Renda não informada - não foi possível validar limite de renda');
    }

    // Verificar limite anual por CPF
    if (consumidor.cpf && config.elegibilidade.limiteAnualPorCpf) {
      const acumulado = this.limitesAnuais.get(consumidor.cpf) || 0;
      const valorCashbackPotencial = (valorItem * config.percentual) / 100;
      
      if (acumulado + valorCashbackPotencial > config.elegibilidade.limiteAnualPorCpf) {
        limiteAnualAtingido = true;
        alertas.push(`Limite anual de cashback atingido para CPF ${consumidor.cpf}`);
      }
    }

    // Determinar elegibilidade final
    elegivel = ncmElegivel && consumidorFinalValido && pessoaFisicaValida && rendaValida && !limiteAnualAtingido;

    if (elegivel) {
      percentual = config.percentual;
      motivo = `Cashback de ${config.percentual}% aplicável (${config.descricao})`;
    } else {
      percentual = 0;
      if (!motivo) {
        motivo = 'Não elegível: ' + alertas.join('; ');
      }
    }

    // Atualizar limite anual se elegível
    if (elegivel && consumidor.cpf && config.elegibilidade.limiteAnualPorCpf) {
      const valorCashback = (valorItem * percentual) / 100;
      const atual = this.limitesAnuais.get(consumidor.cpf) || 0;
      this.limitesAnuais.set(consumidor.cpf, atual + valorCashback);
    }

    return this.criarResultado(elegivel, percentual, (valorItem * percentual) / 100, motivo, alertas, {
      consumidorFinal: consumidorFinalValido,
      pessoaFisica: pessoaFisicaValida,
      rendaValida,
      ncmElegivel,
      limiteAnualAtingido,
    });
  }

  private criarResultado(
    elegivel: boolean,
    percentual: number,
    valorCashback: number,
    motivo: string,
    alertas: string[],
    detalhes: any
  ): CashbackValidationResult {
    return {
      elegivel,
      percentual,
      valorCashback,
      motivo,
      alertas,
      detalhes,
    };
  }

  /**
   * Obtém configuração de cashback por NCM
   */
  getConfig(ncm: string): CashbackConfig | null {
    const prefixo = ncm.replace(/\D/g, '').substring(0, 2);
    return this.configs.get(prefixo) || null;
  }

  /**
   * Lista NCMs com cashback
   */
  getNCMsComCashback(): string[] {
    return Array.from(this.configs.keys());
  }

  /**
   * Reseta limite anual (para testes ou virada de ano)
   */
  resetarLimiteAnual(cpf?: string): void {
    if (cpf) {
      this.limitesAnuais.delete(cpf);
    } else {
      this.limitesAnuais.clear();
    }
  }

  /**
   * Obtém consumo de cashback por CPF
   */
  getConsumoAnual(cpf: string): number {
    return this.limitesAnuais.get(cpf) || 0;
  }
}

export default CashbackValidator;