// Testes para BaseCalculator - C06: Base de cálculo CBS/IBS (Art. 13)
import { BaseCalculator } from '../calculators/BaseCalculator';

describe('BaseCalculator - C06: Base CBS/IBS Art. 13', () => {
  describe('calcularBaseCalculo', () => {
    it('deve calcular base simples apenas com vProd', () => {
      const produto = {
        vProd: 10000,
      };

      const { baseCalculo, alertas } = BaseCalculator.calcularBaseCalculo(produto, null, null);

      expect(baseCalculo.valorProduto).toBe(10000);
      expect(baseCalculo.valorOperacao).toBe(10000);
      expect(alertas).toHaveLength(0);
    });

    it('deve incluir frete na base', () => {
      const produto = {
        vProd: 10000,
        vFrete: 500,
      };

      const { baseCalculo } = BaseCalculator.calcularBaseCalculo(produto, null, null);

      expect(baseCalculo.valorProduto).toBe(10000);
      expect(baseCalculo.frete).toBe(500);
      expect(baseCalculo.valorOperacao).toBe(10500);
      expect(baseCalculo.componentes.incluiFrete).toBe(true);
    });

    it('deve incluir seguro na base', () => {
      const produto = {
        vProd: 10000,
        vSeg: 200,
      };

      const { baseCalculo } = BaseCalculator.calcularBaseCalculo(produto, null, null);

      expect(baseCalculo.valorOperacao).toBe(10200);
      expect(baseCalculo.componentes.incluiSeguro).toBe(true);
    });

    it('deve incluir outras despesas na base', () => {
      const produto = {
        vProd: 10000,
        vOutro: 300,
      };

      const { baseCalculo } = BaseCalculator.calcularBaseCalculo(produto, null, null);

      expect(baseCalculo.valorOperacao).toBe(10300);
      expect(baseCalculo.componentes.incluiOutrasDespesas).toBe(true);
    });

    it('deve incluir II na base', () => {
      const produto = {
        vProd: 10000,
        vII: 1500,
      };

      const { baseCalculo } = BaseCalculator.calcularBaseCalculo(produto, null, null);

      expect(baseCalculo.valorOperacao).toBe(11500);
      expect(baseCalculo.componentes.incluiII).toBe(true);
    });

    it('deve incluir IPI na base', () => {
      const produto = {
        vProd: 10000,
        vIPI: 1000,
      };

      const { baseCalculo } = BaseCalculator.calcularBaseCalculo(produto, null, null);

      expect(baseCalculo.valorOperacao).toBe(11000);
      expect(baseCalculo.componentes.incluiIPI).toBe(true);
    });

    it('deve excluir desconto incondicionado da base', () => {
      const produto = {
        vProd: 10000,
        vDesc: 500,
      };

      const { baseCalculo } = BaseCalculator.calcularBaseCalculo(produto, null, null);

      expect(baseCalculo.valorOperacao).toBe(9500);
      expect(baseCalculo.componentes.excluiDescontoIncondicionado).toBe(true);
    });

    it('deve excluir desconto condicionado da base', () => {
      const produto = {
        vProd: 10000,
        vDescCond: 300,
      };

      const { baseCalculo } = BaseCalculator.calcularBaseCalculo(produto, null, null);

      expect(baseCalculo.valorOperacao).toBe(9700);
      expect(baseCalculo.componentes.excluiDescontoCondicionado).toBe(true);
    });

    it('deve EXCLUIR ICMS-ST da base (não subtrair, alertar)', () => {
      const produto = {
        vProd: 10000,
        vICMSST: 1800,
      };

      const { baseCalculo, alertas } = BaseCalculator.calcularBaseCalculo(produto, null, null);

      // ICMS-ST NÃO deve ser subtraído da base
      expect(baseCalculo.valorOperacao).toBe(10000);
      expect(baseCalculo.icmsSt).toBe(1800);
      expect(baseCalculo.componentes.excluiICMSST).toBe(true);
      expect(alertas).toContainEqual(expect.stringContaining('ICMS-ST'));
      expect(alertas[0]).toContain('NÃO compõe base CBS/IBS');
    });

    it('deve EXCLUIR DIFAL da base (não subtrair, alertar)', () => {
      const produto = {
        vProd: 10000,
        vICMSDIFAL: 1200,
      };

      const { baseCalculo, alertas } = BaseCalculator.calcularBaseCalculo(produto, null, null);

      expect(baseCalculo.valorOperacao).toBe(10000);
      expect(baseCalculo.difal).toBe(1200);
      expect(baseCalculo.componentes.excluiDIFAL).toBe(true);
      expect(alertas).toContainEqual(expect.stringContaining('DIFAL'));
      expect(alertas[0]).toContain('NÃO compõe base CBS/IBS');
    });

    it('deve EXCLUIR FCP da base (não subtrair, alertar)', () => {
      const produto = {
        vProd: 10000,
        vFCP: 200,
      };

      const { baseCalculo, alertas } = BaseCalculator.calcularBaseCalculo(produto, null, null);

      expect(baseCalculo.valorOperacao).toBe(10000);
      expect(baseCalculo.fcp).toBe(200);
      expect(baseCalculo.componentes.excluiFCP).toBe(true);
      expect(alertas).toContainEqual(expect.stringContaining('FCP'));
    });

    it('deve calcular base completa com todos os componentes', () => {
      const produto = {
        vProd: 10000,
        vFrete: 500,
        vSeg: 200,
        vOutro: 100,
        vII: 1500,
        vIPI: 1000,
        vDesc: 500,
        vDescCond: 100,
        vICMSST: 1800,
        vICMSDIFAL: 500,
        vFCP: 100,
      };

      const { baseCalculo, alertas } = BaseCalculator.calcularBaseCalculo(produto, null, null);

      // Base = 10000 + 500 + 200 + 100 + 1500 + 1000 - 500 - 100 = 12700
      // ICMS-ST (1800), DIFAL (500), FCP (100) NÃO subtraídos, apenas alertados
      expect(baseCalculo.valorOperacao).toBe(12700);
      expect(alertas.length).toBe(3); // ICMS-ST, DIFAL, FCP
    });

    it('não deve permitir base negativa', () => {
      const produto = {
        vProd: 1000,
        vDesc: 2000, // desconto maior que produto
      };

      const { baseCalculo } = BaseCalculator.calcularBaseCalculo(produto, null, null);

      expect(baseCalculo.valorOperacao).toBe(0); // Math.max(0, -1000)
    });
  });

  describe('extrairDadosProduto', () => {
    it('deve extrair todos os campos do produto XML', () => {
      const prod = {
        vProd: '10000.00',
        vFrete: '500.00',
        vSeg: '200.00',
        vOutro: '100.00',
        vII: '1500.00',
        vIPI: '1000.00',
        vDesc: '500.00',
        vDescCond: '100.00',
        vICMSST: '1800.00',
        vICMSDIFAL: '500.00',
        vFCP: '100.00',
        vICMSSTRet: '100.00',
      };

      const resultado = BaseCalculator.extrairDadosProduto(prod);

      expect(resultado.vProd).toBe(10000);
      expect(resultado.vFrete).toBe(500);
      expect(resultado.vSeg).toBe(200);
      expect(resultado.vOutro).toBe(100);
      expect(resultado.vII).toBe(1500);
      expect(resultado.vIPI).toBe(1000);
      expect(resultado.vDesc).toBe(500);
      expect(resultado.vDescCond).toBe(100);
      expect(resultado.vICMSST).toBe(1800);
      expect(resultado.vICMSDIFAL).toBe(500);
      expect(resultado.vFCP).toBe(100);
      expect(resultado.vICMSSTRet).toBe(100);
    });

    it('deve lidar com valores ausentes', () => {
      const prod = {
        vProd: '10000.00',
      };

      const resultado = BaseCalculator.extrairDadosProduto(prod);

      expect(resultado.vProd).toBe(10000);
      expect(resultado.vFrete).toBe(0);
      expect(resultado.vSeg).toBe(0);
      expect(resultado.vII).toBe(0);
    });
  });

  describe('gerarAuditoriaBase', () => {
    it('deve gerar string de auditoria legível', () => {
      const base = {
        valorProduto: 10000,
        frete: 500,
        seguro: 200,
        outrasDespesas: 100,
        ii: 1500,
        ipi: 1000,
        descontoIncondicionado: 500,
        descontoCondicionado: 100,
        icmsSt: 1800,
        difal: 500,
        fcp: 100,
        valorOperacao: 12700,
      } as any;

      const auditoria = BaseCalculator.gerarAuditoriaBase(base);

      expect(auditoria).toContain('Produto: 10000.00');
      expect(auditoria).toContain('+ Frete: 500.00');
      expect(auditoria).toContain('+ Seguro: 200.00');
      expect(auditoria).toContain('+ II: 1500.00');
      expect(auditoria).toContain('+ IPI: 1000.00');
      expect(auditoria).toContain('- Desc. incond.: 500.00');
      expect(auditoria).toContain('- Desc. cond.: 100.00');
      expect(auditoria).toContain('(ICMS-ST 1800.00 excluído)');
      expect(auditoria).toContain('(DIFAL 500.00 excluído)');
      expect(auditoria).toContain('(FCP 100.00 excluído)');
      expect(auditoria).toContain('= Base CBS/IBS: 12700.00');
    });
  });
});