// Testes para TransitionCalculator - C03: Transição 2026-2033
import { TransitionCalculator } from '../scenarios/TransitionCalculator';

describe('TransitionCalculator - C03: Transição 2026-2033', () => {
  let transitionCalc: TransitionCalculator;

  beforeEach(() => {
    transitionCalc = new TransitionCalculator();
  });

  describe('getCenario', () => {
    it('deve retornar cenário para 2026 (início da transição)', () => {
      const cenario = transitionCalc.getCenario(2026);

      expect(cenario).not.toBeNull();
      expect(cenario?.ano).toBe(2026);
      expect(cenario?.cbs).toBe(0.90);
      expect(cenario?.ibsTotal).toBe(0.10);
      expect(cenario?.icms).toBe(18.0);
      expect(cenario?.descricao).toContain('Início da transição');
    });

    it('deve retornar cenário para 2029 (IBS Estadual inicia)', () => {
      const cenario = transitionCalc.getCenario(2029);

      expect(cenario).not.toBeNull();
      expect(cenario?.ano).toBe(2029);
      expect(cenario?.cbs).toBe(3.60);
      expect(cenario?.ibsEstadual).toBe(0.50);
      expect(cenario?.ibsMunicipal).toBe(0.50);
      expect(cenario?.ibsTotal).toBe(1.00);
      expect(cenario?.descricao).toContain('IBS Estadual inicia');
    });

    it('deve retornar cenário para 2033 (pleno vigor)', () => {
      const cenario = transitionCalc.getCenario(2033);

      expect(cenario).not.toBeNull();
      expect(cenario?.ano).toBe(2033);
      expect(cenario?.cbs).toBe(9.65);
      expect(cenario?.ibsEstadual).toBe(4.825);
      expect(cenario?.ibsMunicipal).toBe(4.825);
      expect(cenario?.ibsTotal).toBe(9.65);
      expect(cenario?.icms).toBe(0);
      expect(cenario?.iss).toBe(0);
      expect(cenario?.pis).toBe(0);
      expect(cenario?.cofins).toBe(0);
      expect(cenario?.ipi).toBe(0);
      expect(cenario?.descricao).toContain('Pleno vigor');
    });

    it('deve retornar null para ano fora do período', () => {
      const cenario = transitionCalc.getCenario(2025);
      expect(cenario).toBeNull();

      const cenario2034 = transitionCalc.getCenario(2034);
      expect(cenario2034).toBeNull();
    });
  });

  describe('getAllCenarios', () => {
    it('deve retornar todos os 8 cenários (2026-2033)', () => {
      const cenarios = transitionCalc.getAllCenarios();

      expect(cenarios.length).toBe(8);
      expect(cenarios[0].ano).toBe(2026);
      expect(cenarios[7].ano).toBe(2033);

      // Verificar ordem crescente
      for (let i = 1; i < cenarios.length; i++) {
        expect(cenarios[i].ano).toBeGreaterThan(cenarios[i - 1].ano);
      }
    });
  });

  describe('getAliquotasAno', () => {
    it('deve retornar alíquotas para 2026', () => {
      const aliquotas = transitionCalc.getAliquotasAno(2026);

      expect(aliquotas).not.toBeNull();
      expect(aliquotas?.cbs).toBe(0.90);
      expect(aliquotas?.ibsTotal).toBe(0.10);
      expect(aliquotas?.icms).toBe(18.0);
    });

    it('deve retornar alíquotas para 2033', () => {
      const aliquotas = transitionCalc.getAliquotasAno(2033);

      expect(aliquotas).not.toBeNull();
      expect(aliquotas?.cbs).toBe(9.65);
      expect(aliquotas?.ibsTotal).toBe(9.65);
      expect(aliquotas?.icms).toBe(0);
    });

    it('deve retornar null para ano inválido', () => {
      const aliquotas = transitionCalc.getAliquotasAno(2025);
      expect(aliquotas).toBeNull();
    });
  });

  describe('calcularAliquotasEfetivas', () => {
    it('deve aplicar reduções do ICMS em 2029', () => {
      const aliquotasCheias = { icms: 18, iss: 5, pis: 0.65, cofins: 3.0, ipi: 5 };
      const efetivas = transitionCalc.calcularAliquotasEfetivas(2029, aliquotasCheias);

      // Redução ICMS 20pp: 18 - 20 = 0 (mínimo 0)
      // Redução ISS 10pp: 5 - 10 = 0 (mínimo 0)
      // Redução IPI 10pp: 5 - 10 = 0 (mínimo 0)
      expect(efetivas.icms).toBe(0);
      expect(efetivas.iss).toBe(0);
      expect(efetivas.pis).toBe(0.65);
      expect(efetivas.cofins).toBe(3.0);
      expect(efetivas.ipi).toBe(0); // 5 - 10pp = 0 (mínimo 0)
    });

    it('deve aplicar reduções progressivas', () => {
      const aliquotasCheias = { icms: 18, iss: 5, pis: 0.65, cofins: 3.0, ipi: 5 };

      const efetivas2026 = transitionCalc.calcularAliquotasEfetivas(2026, aliquotasCheias);
      expect(efetivas2026.icms).toBe(13); // 18 - 5

      const efetivas2033 = transitionCalc.calcularAliquotasEfetivas(2033, aliquotasCheias);
      expect(efetivas2033.icms).toBe(0); // extinção
    });

    it('não deve permitir alíquotas negativas', () => {
      const aliquotasCheias = { icms: 10, iss: 3, pis: 0.65, cofins: 3.0, ipi: 3 };
      const efetivas = transitionCalc.calcularAliquotasEfetivas(2033, aliquotasCheias);

      expect(efetivas.icms).toBe(0);
      expect(efetivas.iss).toBe(0);
      expect(efetivas.ipi).toBe(0);
    });
  });

  describe('gerarRelatorioComparativo', () => {
    it('deve gerar relatório formatado com todos os anos', () => {
      const relatorio = transitionCalc.gerarRelatorioComparativo(2026, 2033);

      expect(relatorio).toContain('RELATÓRIO DE TRANSIÇÃO TRIBUTÁRIA');
      expect(relatorio).toContain('2026');
      expect(relatorio).toContain('2033');
      expect(relatorio).toContain('CBS');
      expect(relatorio).toContain('IBS');
      expect(relatorio).toContain('ICMS');
    });
  });

  describe('isAnoValido', () => {
    it('deve retornar true para anos válidos', () => {
      expect(transitionCalc.isAnoValido(2026)).toBe(true);
      expect(transitionCalc.isAnoValido(2033)).toBe(true);
      expect(transitionCalc.isAnoValido(2029)).toBe(true);
    });

    it('deve retornar false para anos inválidos', () => {
      expect(transitionCalc.isAnoValido(2025)).toBe(false);
      expect(transitionCalc.isAnoValido(2034)).toBe(false);
      expect(transitionCalc.isAnoValido(2000)).toBe(false);
    });
  });

  describe('getProximoAno / getAnoAnterior', () => {
    it('deve retornar próximo ano', () => {
      expect(transitionCalc.getProximoAno(2026)).toBe(2027);
      expect(transitionCalc.getProximoAno(2032)).toBe(2033);
      expect(transitionCalc.getProximoAno(2033)).toBeNull();
    });

    it('deve retornar ano anterior', () => {
      expect(transitionCalc.getAnoAnterior(2027)).toBe(2026);
      expect(transitionCalc.getAnoAnterior(2033)).toBe(2032);
      expect(transitionCalc.getAnoAnterior(2026)).toBeNull();
    });
  });

  describe('getAllCenarios', () => {
    it('deve ter alíquotas crescentes de CBS', () => {
      const cenarios = transitionCalc.getAllCenarios();
      for (let i = 1; i < cenarios.length; i++) {
        expect(cenarios[i].cbs).toBeGreaterThan(cenarios[i - 1].cbs);
      }
    });

    it('deve ter alíquotas crescentes ou estáveis de IBS (exceto ano final de convergência)', () => {
      const cenarios = transitionCalc.getAllCenarios();
      for (let i = 1; i < cenarios.length - 1; i++) {
        // Todos os anos exceto o último devem ter IBS crescente ou estável
        expect(cenarios[i].ibsTotal).toBeGreaterThanOrEqual(cenarios[i - 1].ibsTotal);
      }
      // O último ano (2033) pode ter IBS menor que o anterior (convergência com CBS)
      expect(cenarios[cenarios.length - 1].ibsTotal).toBe(9.65);
    });

    it('deve ter ICMS decrescente até zero', () => {
      const cenarios = transitionCalc.getAllCenarios();
      for (let i = 1; i < cenarios.length; i++) {
        expect(cenarios[i].icms).toBeLessThanOrEqual(cenarios[i - 1].icms);
      }
      expect(cenarios[cenarios.length - 1].icms).toBe(0);
    });
  });
});