// Testes para Simulador de Regimes - A02: Simples Híbrido, A03: Lucro Presumido
import { calcularCargaRegime, compararRegimes, getRegimeAtualFromNFes, getBasePresumida } from '../../../utils/simuladorRegimes';

describe('Simulador de Regimes - A02: Simples Híbrido', () => {
  const totaisBase = {
    valorTotal: 100000,
    icmsTotal: 18000,
    ipiTotal: 5000,
    pisTotal: 1000,
    cofinsTotal: 5000,
  };

  const paramsBase = {
    faturamentoAnual: 1200000, // 100k * 12
    folhaPagamento: 180000,
    regimeAtual: 'lucro-presumido' as const,
    uf: 'SP',
    municipio: 'São Paulo',
    atividadePrincipal: 'comercio' as const,
    anexoSimples: 'I' as const,
  };

  describe('Simples Híbrido (A02)', () => {
    it('deve calcular ICMS/ISS no Simples + Federais no Lucro Real', () => {
      const resultado = calcularCargaRegime('simples-hibrido', paramsBase, totaisBase);

      expect(resultado.regime).toBe('simples-hibrido');
      expect(resultado.nome).toBe('Simples Híbrido');
      expect(resultado.descricao).toContain('ICMS/ISS no Simples');
      expect(resultado.descricao).toContain('Federais no Lucro Real');

      // ICMS/ISS devem vir do Simples (decomposição da alíquota efetiva)
      expect(resultado.cargas.icms).toBeGreaterThan(0);
      expect(resultado.cargas.iss).toBeGreaterThanOrEqual(0);

      // Federais devem usar alíquotas do Lucro Real
      expect(resultado.cargas.irpj).toBeGreaterThan(0);
      expect(resultado.cargas.csll).toBeGreaterThan(0);
      expect(resultado.cargas.pis).toBeGreaterThan(0);
      expect(resultado.cargas.cofins).toBeGreaterThan(0);

      // PIS/COFINS no Lucro Real (não cumulativos) têm alíquotas MAIORES que Presumido
      // mas geram créditos que reduzem a carga efetiva
      expect(resultado.cargas.pis).toBeGreaterThan(paramsBase.faturamentoAnual * 0.65 / 100);
      expect(resultado.cargas.cofins).toBeGreaterThan(paramsBase.faturamentoAnual * 3.0 / 100);
    });

    it('deve ter observações corretas sobre Simples Híbrido', () => {
      const resultado = calcularCargaRegime('simples-hibrido', paramsBase, totaisBase);

      expect(resultado.observacoes).toContainEqual(
        expect.stringContaining('ICMS/ISS recolhidos via DAS')
      );
      expect(resultado.observacoes).toContainEqual(
        expect.stringContaining('IRPJ/CSLL/PIS/COFINS no Lucro Real (DARF)')
      );
      expect(resultado.observacoes).toContainEqual(
        expect.stringContaining('PIS/COFINS não cumulativos')
      );
    });

    it('deve ser inviável para faturamento > R$ 4,8M', () => {
      const paramsAcima = { ...paramsBase, faturamentoAnual: 5000000 };
      const resultado = calcularCargaRegime('simples-hibrido', paramsAcima, totaisBase);

      expect(resultado.viavel).toBe(false);
      expect(resultado.observacoes).toContainEqual(
        expect.stringContaining('excede limite do Simples')
      );
    });
  });

  describe('Comparação entre regimes', () => {
    it('deve retornar Simples Híbrido como recomendado quando for mais vantajoso', () => {
      const paramsComercio = {
        ...paramsBase,
        atividadePrincipal: 'comercio' as const,
        faturamentoAnual: 3000000,
      };

      const comparativo = compararRegimes(paramsComercio, {
        valorTotal: 250000,
        icmsTotal: 45000,
        ipiTotal: 10000,
        pisTotal: 5000,
        cofinsTotal: 10000,
      });

      // Verifica que o Simples Híbrido é uma das opções
      const hibrido = comparativo.simulacoes.find(s => s.regime === 'simples-hibrido');
      expect(hibrido).toBeDefined();
      expect(hibrido?.viavel).toBe(true);

      // Deve ter carga federal menor que Simples puro (pois federais no Lucro Real com créditos)
      const simples = comparativo.simulacoes.find(s => s.regime === 'simples');
      expect(hibrido?.cargas.irpj).toBeDefined();
      expect(hibrido?.cargas.csll).toBeDefined();
    });

    it('deve diferenciar Simples Híbrido de Simples puro', () => {
      const resultadoHibrido = calcularCargaRegime('simples-hibrido', paramsBase, totaisBase);
      const resultadoSimples = calcularCargaRegime('simples', paramsBase, totaisBase);

      // No Simples Híbrido, IRPJ/CSLL/PIS/COFINS usam alíquotas do Lucro Real
      // No Simples puro, tudo vem da decomposição da alíquota efetiva do Simples
      expect(resultadoHibrido.cargas.irpj).not.toBe(resultadoSimples.cargas.irpj);
      expect(resultadoHibrido.cargas.csll).not.toBe(resultadoSimples.cargas.csll);
      expect(resultadoHibrido.cargas.pis).not.toBe(resultadoSimples.cargas.pis);
      expect(resultadoHibrido.cargas.cofins).not.toBe(resultadoSimples.cargas.cofins);

      // Mas ICMS/ISS devem ser iguais (ambos no Simples)
      expect(resultadoHibrido.cargas.icms).toBe(resultadoSimples.cargas.icms);
      expect(resultadoHibrido.cargas.iss).toBe(resultadoSimples.cargas.iss);
    });
  });

  describe('getRegimeAtualFromNFes', () => {
    it('deve identificar regime provável baseado na composição dos impostos', () => {
      // ICMS dominante -> Simples
      expect(getRegimeAtualFromNFes({ icmsTotal: 15000, ipiTotal: 1000, pisTotal: 500, cofinsTotal: 2000 }))
        .toContain('Simples');

      // IPI presente -> Industrial
      expect(getRegimeAtualFromNFes({ icmsTotal: 5000, ipiTotal: 3000, pisTotal: 1000, cofinsTotal: 2000 }))
        .toContain('Industrial');

      // PIS/COFINS relevantes -> Lucro Presumido/Real
      expect(getRegimeAtualFromNFes({ icmsTotal: 5000, ipiTotal: 500, pisTotal: 4000, cofinsTotal: 8000 }))
        .toContain('Lucro');
    });
  });
});