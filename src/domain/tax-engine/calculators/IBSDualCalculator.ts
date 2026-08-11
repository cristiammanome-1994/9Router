// IBS Dual Calculator - C02: Separação IBS Estadual e Municipal
// Implementa IBS = IBS Estadual + IBS Municipal com alíquotas por UF/Município

import type { ResultadoCalculoItem, AliquotasAno, ParametrosSimulacao } from '../types';

export interface IBSConfigUF {
  uf: string;
  aliquotaEstadual: number; // % IBS Estadual
  aliquotaMunicipal: number; // % IBS Municipal
  aliquotaReferenciaCFC: number; // Alíquota de referência do CFC
  // Alíquotas municipais podem variar
  municipios?: Map<string, { aliquotaMunicipal: number }>;
}

export interface IBSDualResultado {
  ibsEstadual: number;
  ibsMunicipal: number;
  ibsTotal: number;
  aliquotaEstadual: number;
  aliquotaMunicipal: number;
  ufDestino: string;
  municipioDestino: string;
  detalhe: string;
}

export class IBSDualCalculator {
  private ufsConfig: Map<string, IBSConfigUF> = new Map();

  constructor(ufsConfig: IBSConfigUF[] = []) {
    this.carregarUFSConfig(ufsConfig);
  }

  private carregarUFSConfig(ufsConfig: IBSConfigUF[]): void {
    // Configuração padrão baseada na alíquota de referência CFC
    // A alíquota total de referência do IBS é 9,65% (dividida entre Estadual e Municipal)
    // Em 2026, pode haver alíquotas de transição
    const ufsPadrao = [
      { uf: 'AC', aliquotaEstadual: 4.825, aliquotaMunicipal: 4.825, aliquotaReferenciaCFC: 9.65 },
      { uf: 'AL', aliquotaEstadual: 4.825, aliquotaMunicipal: 4.825, aliquotaReferenciaCFC: 9.65 },
      { uf: 'AP', aliquotaEstadual: 4.825, aliquotaMunicipal: 4.825, aliquotaReferenciaCFC: 9.65 },
      { uf: 'AM', aliquotaEstadual: 4.825, aliquotaMunicipal: 4.825, aliquotaReferenciaCFC: 9.65 },
      { uf: 'BA', aliquotaEstadual: 4.825, aliquotaMunicipal: 4.825, aliquotaReferenciaCFC: 9.65 },
      { uf: 'CE', aliquotaEstadual: 4.825, aliquotaMunicipal: 4.825, aliquotaReferenciaCFC: 9.65 },
      { uf: 'DF', aliquotaEstadual: 4.825, aliquotaMunicipal: 4.825, aliquotaReferenciaCFC: 9.65 },
      { uf: 'ES', aliquotaEstadual: 4.825, aliquotaMunicipal: 4.825, aliquotaReferenciaCFC: 9.65 },
      { uf: 'GO', aliquotaEstadual: 4.825, aliquotaMunicipal: 4.825, aliquotaReferenciaCFC: 9.65 },
      { uf: 'MA', aliquotaEstadual: 4.825, aliquotaMunicipal: 4.825, aliquotaReferenciaCFC: 9.65 },
      { uf: 'MG', aliquotaEstadual: 4.825, aliquotaMunicipal: 4.825, aliquotaReferenciaCFC: 9.65 },
      { uf: 'MS', aliquotaEstadual: 4.825, aliquotaMunicipal: 4.825, aliquotaReferenciaCFC: 9.65 },
      { uf: 'MT', aliquotaEstadual: 4.825, aliquotaMunicipal: 4.825, aliquotaReferenciaCFC: 9.65 },
      { uf: 'PA', aliquotaEstadual: 4.825, aliquotaMunicipal: 4.825, aliquotaReferenciaCFC: 9.65 },
      { uf: 'PB', aliquotaEstadual: 4.825, aliquotaMunicipal: 4.825, aliquotaReferenciaCFC: 9.65 },
      { uf: 'PE', aliquotaEstadual: 4.825, aliquotaMunicipal: 4.825, aliquotaReferenciaCFC: 9.65 },
      { uf: 'PI', aliquotaEstadual: 4.825, aliquotaMunicipal: 4.825, aliquotaReferenciaCFC: 9.65 },
      { uf: 'PR', aliquotaEstadual: 4.825, aliquotaMunicipal: 4.825, aliquotaReferenciaCFC: 9.65 },
      { uf: 'RJ', aliquotaEstadual: 4.825, aliquotaMunicipal: 4.825, aliquotaReferenciaCFC: 9.65 },
      { uf: 'RN', aliquotaEstadual: 4.825, aliquotaMunicipal: 4.825, aliquotaReferenciaCFC: 9.65 },
      { uf: 'RO', aliquotaEstadual: 4.825, aliquotaMunicipal: 4.825, aliquotaReferenciaCFC: 9.65 },
      { uf: 'RR', aliquotaEstadual: 4.825, aliquotaMunicipal: 4.825, aliquotaReferenciaCFC: 9.65 },
      { uf: 'RS', aliquotaEstadual: 4.825, aliquotaMunicipal: 4.825, aliquotaReferenciaCFC: 9.65 },
      { uf: 'SC', aliquotaEstadual: 4.825, aliquotaMunicipal: 4.825, aliquotaReferenciaCFC: 9.65 },
      { uf: 'SE', aliquotaEstadual: 4.825, aliquotaMunicipal: 4.825, aliquotaReferenciaCFC: 9.65 },
      { uf: 'SP', aliquotaEstadual: 4.825, aliquotaMunicipal: 4.825, aliquotaReferenciaCFC: 9.65 },
      { uf: 'TO', aliquotaEstadual: 4.825, aliquotaMunicipal: 4.825, aliquotaReferenciaCFC: 9.65 },
    ];

    for (const uf of ufsPadrao) {
      this.ufsConfig.set(uf.uf, uf);
    }

    // Carregar configurações customizadas passadas
    for (const uf of ufsConfig) {
      this.ufsConfig.set(uf.uf, uf);
    }
  }

  /**
   * Carrega configuração de UFs a partir de catálogo JSON
   */
  static async carregarDeCatalogo(path: string): Promise<IBSDualCalculator> {
    try {
      const response = await fetch(path);
      if (response.ok) {
        const data = await response.json();
        return new IBSDualCalculator(data.ufs || []);
      }
    } catch (err) {
      console.warn('Falha ao carregar catálogo IBS UF, usando padrão:', err);
    }
    return new IBSDualCalculator();
  }

  /**
   * Calcula IBS Dual (Estadual + Municipal) para um item
   */
  calcularIBSDual(
    baseCalculo: number,
    ufDestino: string,
    municipioDestino: string,
    aliquotaIBSNacional: number, // 9.65% padrão
    params?: { aliquotaEstadual?: number; aliquotaMunicipal?: number }
  ): IBSDualResultado {
    const ufConfig = this.ufsConfig.get(ufDestino.toUpperCase()) || {
      uf: ufDestino.toUpperCase(),
      aliquotaEstadual: 4.825,
      aliquotaMunicipal: 4.825,
      aliquotaReferenciaCFC: 9.65,
    };

    // Usar parâmetros manuais se fornecidos, senão usar configuração da UF
    const aliquotaEstadual = params?.aliquotaEstadual ?? ufConfig.aliquotaEstadual;
    const aliquotaMunicipal = params?.aliquotaMunicipal ?? ufConfig.aliquotaMunicipal;

    const ibsEstadual = (baseCalculo * aliquotaEstadual) / 100;
    const ibsMunicipal = (baseCalculo * aliquotaMunicipal) / 100;
    const ibsTotal = ibsEstadual + ibsMunicipal;

    const detalhe = `IBS Estadual (${ufConfig.uf}): ${aliquotaEstadual.toFixed(4)}% = R$ ${ibsEstadual.toFixed(2)} | ` +
      `IBS Municipal (${municipioDestino}/${ufConfig.uf}): ${aliquotaMunicipal.toFixed(4)}% = R$ ${ibsMunicipal.toFixed(2)} | ` +
      `Total IBS: ${(aliquotaEstadual + aliquotaMunicipal).toFixed(4)}% = R$ ${ibsTotal.toFixed(2)}`;

    return {
      ibsEstadual,
      ibsMunicipal,
      ibsTotal,
      aliquotaEstadual,
      aliquotaMunicipal,
      ufDestino: ufConfig.uf,
      municipioDestino,
      detalhe,
    };
  }

  /**
   * Calcula IBS para operação interestadual (partilha origem/destino)
   * Regra: IBS Estadual vai para UF destino; IBS Municipal vai para município destino
   */
  calcularIBSInterestadual(
    baseCalculo: number,
    ufOrigem: string,
    ufDestino: string,
    municipioDestino: string,
    aliquotaIBSNacional: number
  ): { ibsOrigem: IBSDualResultado; ibsDestino: IBSDualResultado; detalhe: string } {
    // IBS Estadual: 100% para UF destino (princípio do destino)
    const ibsDestino = this.calcularIBSDual(baseCalculo, ufDestino, 'Destino', 9.65);
    
    // IBS Origem: zero para operações interestaduais (todo IBS vai para destino)
    const ibsOrigem: IBSDualResultado = {
      ibsEstadual: 0,
      ibsMunicipal: 0,
      ibsTotal: 0,
      aliquotaEstadual: 0,
      aliquotaMunicipal: 0,
      ufDestino: ufOrigem.toUpperCase(),
      municipioDestino: 'Origem',
      detalhe: `Operação interestadual: IBS 100% para UF destino (${ufDestino.toUpperCase()})`,
    };

    return {
      ibsOrigem,
      ibsDestino,
      detalhe: `Interestadual ${ufOrigem.toUpperCase()} → ${ufDestino.toUpperCase()}: IBS 100% destino (princípio do destino)`,
    };
  }

  /**
   * Obtém configuração de uma UF
   */
  getUFConfig(uf: string): IBSConfigUF | null {
    return this.ufsConfig.get(uf.toUpperCase()) || null;
  }

  /**
   * Atualiza configuração de uma UF
   */
  setUFConfig(uf: string, config: IBSConfigUF): void {
    this.ufsConfig.set(uf.toUpperCase(), config);
  }

  /**
   * Lista todas as UFs configuradas
   */
  getAllUFS(): IBSConfigUF[] {
    return Array.from(this.ufsConfig.values());
  }
}

export default IBSDualCalculator;