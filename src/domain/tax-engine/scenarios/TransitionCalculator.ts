// Transition Calculator - C03: Cenários anuais 2026-2033
// Implementa a transição progressiva da Reforma Tributária

import type { AliquotasAno, ParametrosSimulacao } from '../types';

export interface CenarioTransicao {
  ano: number;
  cbs: number;
  ibsEstadual: number;
  ibsMunicipal: number;
  ibsTotal: number;
  icms: number;
  iss: number;
  pis: number;
  cofins: number;
  ipi: number;
  reducaoICMS: number;
  reducaoISS: number;
  reducaoPIS: number;
  reducaoCOFINS: number;
  reducaoIPI: number;
  descricao: string;
}

export class TransitionCalculator {
  private cenarios: Map<number, CenarioTransicao> = new Map();

  constructor() {
    this.carregarCenariosPadrao();
  }

  private carregarCenariosPadrao(): void {
    // Cronograma baseado na EC 132/2023 e Lei 14.988/2024
    // CBS: 0,9% (2026) → 9,65% (2033)
    // IBS: 0,1% (2026) → 9,65% (2033)
    // Reduções progressivas dos tributos atuais

    const cenarios: CenarioTransicao[] = [
      {
        ano: 2026,
        cbs: 0.90,
        ibsEstadual: 0.05,
        ibsMunicipal: 0.05,
        ibsTotal: 0.10,
        icms: 18.0, // redução inicial
        iss: 5.0,
        pis: 0.65,
        cofins: 3.0,
        ipi: 5.0,
        reducaoICMS: 5.0, // % de redução sobre alíquota cheia
        reducaoISS: 0.0,
        reducaoPIS: 0.0,
        reducaoCOFINS: 0.0,
        reducaoIPI: 0.0,
        descricao: 'Início da transição: CBS 0,9% + IBS 0,1% (teste). Redução ICMS 5pp.',
      },
      {
        ano: 2027,
        cbs: 1.80,
        ibsEstadual: 0.10,
        ibsMunicipal: 0.10,
        ibsTotal: 0.20,
        icms: 17.0,
        iss: 5.0,
        pis: 0.65,
        cofins: 3.0,
        ipi: 5.0,
        reducaoICMS: 10.0,
        reducaoISS: 0.0,
        reducaoPIS: 0.0,
        reducaoCOFINS: 0.0,
        reducaoIPI: 0.0,
        descricao: 'CBS 1,8% + IBS 0,2%. Redução ICMS 10pp.',
      },
      {
        ano: 2028,
        cbs: 2.70,
        ibsEstadual: 0.15,
        ibsMunicipal: 0.15,
        ibsTotal: 0.30,
        icms: 16.0,
        iss: 5.0,
        pis: 0.65,
        cofins: 3.0,
        ipi: 5.0,
        reducaoICMS: 15.0,
        reducaoISS: 0.0,
        reducaoPIS: 0.0,
        reducaoCOFINS: 0.0,
        reducaoIPI: 0.0,
        descricao: 'CBS 2,7% + IBS 0,3%. Redução ICMS 15pp.',
      },
      {
        ano: 2029,
        cbs: 3.60,
        ibsEstadual: 0.50,
        ibsMunicipal: 0.50,
        ibsTotal: 1.00,
        icms: 15.0,
        iss: 4.5,
        pis: 0.65,
        cofins: 3.0,
        ipi: 4.5,
        reducaoICMS: 20.0,
        reducaoISS: 10.0,
        reducaoPIS: 0.0,
        reducaoCOFINS: 0.0,
        reducaoIPI: 10.0,
        descricao: 'CBS 3,6% + IBS 1,0%. IBS Estadual inicia. Reduções ICMS 20pp, ISS 10pp, IPI 10pp.',
      },
      {
        ano: 2030,
        cbs: 4.80,
        ibsEstadual: 1.00,
        ibsMunicipal: 1.00,
        ibsTotal: 2.00,
        icms: 13.0,
        iss: 4.0,
        pis: 0.65,
        cofins: 3.0,
        ipi: 4.0,
        reducaoICMS: 25.0,
        reducaoISS: 20.0,
        reducaoPIS: 0.0,
        reducaoCOFINS: 0.0,
        reducaoIPI: 20.0,
        descricao: 'CBS 4,8% + IBS 2,0%. Reduções ICMS 25pp, ISS 20pp, IPI 20pp.',
      },
      {
        ano: 2031,
        cbs: 6.00,
        ibsEstadual: 2.50,
        ibsMunicipal: 2.50,
        ibsTotal: 5.00,
        icms: 11.0,
        iss: 3.0,
        pis: 0.65,
        cofins: 3.0,
        ipi: 3.0,
        reducaoICMS: 35.0,
        reducaoISS: 40.0,
        reducaoPIS: 0.0,
        reducaoCOFINS: 0.0,
        reducaoIPI: 40.0,
        descricao: 'CBS 6,0% + IBS 5,0%. Reduções ICMS 35pp, ISS 40pp, IPI 40pp.',
      },
      {
        ano: 2032,
        cbs: 7.50,
        ibsEstadual: 5.00,
        ibsMunicipal: 5.00,
        ibsTotal: 10.00,
        icms: 8.0,
        iss: 2.0,
        pis: 0.65,
        cofins: 3.0,
        ipi: 2.0,
        reducaoICMS: 50.0,
        reducaoISS: 60.0,
        reducaoPIS: 0.0,
        reducaoCOFINS: 0.0,
        reducaoIPI: 60.0,
        descricao: 'CBS 7,5% + IBS 10,0%. Reduções ICMS 50pp, ISS 60pp, IPI 60pp.',
      },
      {
        ano: 2033,
        cbs: 9.65,
        ibsEstadual: 4.825,
        ibsMunicipal: 4.825,
        ibsTotal: 9.65,
        icms: 0.0,
        iss: 0.0,
        pis: 0.0,
        cofins: 0.0,
        ipi: 0.0,
        reducaoICMS: 100.0,
        reducaoISS: 100.0,
        reducaoPIS: 100.0,
        reducaoCOFINS: 100.0,
        reducaoIPI: 100.0,
        descricao: 'Pleno vigor: CBS 9,65% + IBS 9,65% (Estadual 4,825% + Municipal 4,825%). Extinção ICMS, ISS, PIS, COFINS, IPI.',
      },
    ];

    for (const c of cenarios) {
      this.cenarios.set(c.ano, c);
    }
  }

  /**
   * Carrega cenários de catálogo JSON
   */
  static async carregarDeCatalogo(path: string): Promise<TransitionCalculator> {
    try {
      const response = await fetch(path);
      if (response.ok) {
        const data = await response.json();
        const calc = new TransitionCalculator();
        if (data.cenarios) {
          calc.cenarios.clear();
          for (const c of data.cenarios) {
            calc.cenarios.set(c.ano, c);
          }
        }
        return calc;
      }
    } catch (err) {
      console.warn('Falha ao carregar catálogo de transição, usando padrão:', err);
    }
    return new TransitionCalculator();
  }

  /**
   * Obtém cenário para um ano específico
   */
  getCenario(ano: number): CenarioTransicao | null {
    return this.cenarios.get(ano) || null;
  }

  /**
   * Lista todos os cenários disponíveis
   */
  getAllCenarios(): CenarioTransicao[] {
    return Array.from(this.cenarios.values()).sort((a, b) => a.ano - b.ano);
  }

  /**
   * Obtém parâmetros de alíquotas para um ano
   */
  getAliquotasAno(ano: number): {
    cbs: number;
    ibsEstadual: number;
    ibsMunicipal: number;
    ibsTotal: number;
    icms: number;
    iss: number;
    pis: number;
    cofins: number;
    ipi: number;
  } | null {
    const cenario = this.getCenario(ano);
    if (!cenario) return null;

    return {
      cbs: cenario.cbs,
      ibsEstadual: cenario.ibsEstadual,
      ibsMunicipal: cenario.ibsMunicipal,
      ibsTotal: cenario.ibsTotal,
      icms: cenario.icms,
      iss: cenario.iss,
      pis: cenario.pis,
      cofins: cenario.cofins,
      ipi: cenario.ipi,
    };
  }

  /**
   * Calcula alíquotas efetivas considerando reduções
   */
  calcularAliquotasEfetivas(ano: number, aliquotasCheias: { icms: number; iss: number; pis: number; cofins: number; ipi: number }): {
    icms: number;
    iss: number;
    pis: number;
    cofins: number;
    ipi: number;
  } {
    const cenario = this.getCenario(ano);
    if (!cenario) return aliquotasCheias;

    return {
      icms: Math.max(0, aliquotasCheias.icms - cenario.reducaoICMS),
      iss: Math.max(0, aliquotasCheias.iss - cenario.reducaoISS),
      pis: Math.max(0, aliquotasCheias.pis - cenario.reducaoPIS),
      cofins: Math.max(0, aliquotasCheias.cofins - cenario.reducaoCOFINS),
      ipi: Math.max(0, aliquotasCheias.ipi - cenario.reducaoIPI),
    };
  }

  /**
   * Gera relatório comparativo entre anos
   */
  gerarRelatorioComparativo(anoInicio: number = 2026, anoFim: number = 2033): string {
    const linhas: string[] = [];
    linhas.push('=== RELATÓRIO DE TRANSIÇÃO TRIBUTÁRIA ===');
    linhas.push('');
    linhas.push('Ano | CBS    | IBS Est. | IBS Mun. | IBS Tot. | ICMS   | ISS    | PIS    | COFINS | IPI');
    linhas.push('----|--------|----------|----------|----------|--------|--------|--------|--------|------');

    for (let ano = anoInicio; ano <= anoFim; ano++) {
      const c = this.getCenario(ano);
      if (c) {
        linhas.push(
          `${ano} | ${c.cbs.toFixed(2)}% | ${c.ibsEstadual.toFixed(2)}%  | ${c.ibsMunicipal.toFixed(2)}%   | ${c.ibsTotal.toFixed(2)}%  | ${c.icms.toFixed(1)}% | ${c.iss.toFixed(1)}% | ${c.pis.toFixed(2)}% | ${c.cofins.toFixed(1)}%  | ${c.ipi.toFixed(1)}%`
        );
      }
    }

    return linhas.join('\n');
  }

  /**
   * Valida se um ano está no período de transição
   */
  isAnoValido(ano: number): boolean {
    return this.cenarios.has(ano);
  }

  /**
   * Obtém próximo ano disponível
   */
  getProximoAno(ano: number): number | null {
    const anos = Array.from(this.cenarios.keys()).sort((a, b) => a - b);
    const idx = anos.indexOf(ano);
    if (idx >= 0 && idx < anos.length - 1) {
      return anos[idx + 1];
    }
    return null;
  }

  /**
   * Obtém ano anterior
   */
  getAnoAnterior(ano: number): number | null {
    const anos = Array.from(this.cenarios.keys()).sort((a, b) => a - b);
    const idx = anos.indexOf(ano);
    if (idx > 0) {
      return anos[idx - 1];
    }
    return null;
  }
}

export default TransitionCalculator;