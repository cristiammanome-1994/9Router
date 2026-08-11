// Testes de Integracao - TaxCalculator completo (C01-C07)
import { TaxCalculator } from '../TaxCalculator';

describe('TaxCalculator - Integracao C01-C07', () => {
  let taxCalculator: any;

  beforeAll(async () => {
    // Importar dinamicamente para evitar problemas de ESM
    const { TaxCalculator: TC } = await import('../TaxCalculator');
    taxCalculator = new TC();
    await taxCalculator.inicializar(2026);
  });

  describe('C01 - Nao-cumulatividade CBS/IBS', () => {
    it('deve calcular crÃ©ditos CBS e IBS para entrada de combustÃ­vel', async () => {
      const itemXml = {
        prod: {
          cProd: 'PROD001',
          xProd: 'Ãleo Diesel',
          NCM: '27101921',
          CFOP: '1101',
          qCom: '1000',
          uCom: 'L',
          vUnCom: '5.00',
          vProd: '5000.00',
          vFrete: '100.00',
          vSeg: '50.00',
          vOutro: '0.00',
          vII: '0.00',
          vIPI: '0.00',
          vDesc: '0.00',
          vDescCond: '0.00',
          vICMSST: '0.00',
          vICMSDIFAL: '0.00',
          vFCP: '0.00',
        },
      };

      const params = {
        ano: 2026,
        ufOrigem: 'SP',
        ufDestino: 'SP',
        municipioOrigem: 'Sao Paulo',
        municipioDestino: 'Sao Paulo',
        regimeEmitente: 'lucro-real',
        regimeDestinatario: 'lucro-real',
        usarAliquotasManuais: false,
        incluirCreditos: true,
      };

      const resultado = await taxCalculator.calcularItem(
        itemXml,
        '27101921',
        '1101',
        params
      );

      // Verificar que crÃ©ditos foram calculados
      expect(resultado.creditoCBS).toBeGreaterThan(0);
      expect(resultado.creditoIBS).toBeGreaterThan(0);
      expect(resultado.cbsLiquida).toBeLessThan(resultado.cbsBruta);
      expect(resultado.ibsLiquida).toBeLessThan(resultado.ibsBruta);
      expect(resultado.auditoria.creditosAplicados.length).toBeGreaterThan(0);
    });

    it('nao deve gerar crÃ©dito para venda (CFOP 5101)', async () => {
      const itemXml = {
        prod: {
          cProd: 'PROD001',
          xProd: 'Ãleo Diesel',
          NCM: '27101921',
          CFOP: '5101',
          qCom: '1000',
          uCom: 'L',
          vUnCom: '5.00',
          vProd: '5000.00',
        },
      };

      const params = {
        ano: 2026,
        incluirCreditos: true,
      };

      const resultado = await taxCalculator.calcularItem(
        itemXml,
        '27101921',
        '5101',
        params
      );

      // Venda nao gera crÃ©dito para o vendedor
      expect(resultado.creditoCBS).toBe(0);
      expect(resultado.creditoIBS).toBe(0);
    });
  });

  describe('C02 - IBS Dual', () => {
    it('deve separar IBS em Estadual e Municipal', async () => {
      const itemXml = {
        prod: {
          cProd: 'PROD001',
          xProd: 'Produto Teste',
          NCM: '84713012',
          CFOP: '5101',
          qCom: '1',
          uCom: 'UN',
          vUnCom: '10000.00',
          vProd: '10000.00',
        },
      };

      const params = { ano: 2026 };

      const resultado = await taxCalculator.calcularItem(
        itemXml,
        '84713012',
        '5101',
        params
      );

      // Verificar separacao IBS
      expect(resultado.ibsEstadualBruta).toBeGreaterThan(0);
      expect(resultado.ibsMunicipalBruta).toBeGreaterThan(0);
      expect(resultado.ibsBruta).toBe(
        resultado.ibsEstadualBruta + resultado.ibsMunicipalBruta
      );
      expect(resultado.ibsEstadualLiquida).toBeGreaterThanOrEqual(0);
      expect(resultado.ibsMunicipalLiquida).toBeGreaterThanOrEqual(0);
      expect(resultado.auditoria.baseCalculoDetalhada).toContain('IBS Estadual');
      expect(resultado.auditoria.baseCalculoDetalhada).toContain('IBS Municipal');
    });
  });

  describe('C03 - Transicao 2026-2033', () => {
    it('deve usar alÃ­quotas de 2026 (inÃ­cio transicao)', async () => {
      const itemXml = {
        prod: {
          NCM: '84713012',
          CFOP: '5101',
          vProd: '10000.00',
        },
      };

      const params = { ano: 2026 };
      const resultado = await taxCalculator.calcularItem(
        itemXml,
        '84713012',
        '5101',
        params
      );

      // 2026: CBS 0.9%, IBS 0.1% (total 1.0%)
      expect(resultado.aliquotaCBS).toBe(0.90);
      expect(resultado.aliquotaIBS).toBe(0.10);
      expect(resultado.aliquotaIBS_Estadual).toBe(0.05);
      expect(resultado.aliquotaIBS_Municipal).toBe(0.05);
    });

    it('deve usar alÃ­quotas de 2033 (pleno vigor)', async () => {
      const itemXml = {
        prod: { NCM: '84713012', CFOP: '5101', vProd: '10000.00' },
      };

      const params = { ano: 2033 };
      const resultado = await taxCalculator.calcularItem(
        itemXml,
        '84713012',
        '5101',
        params
      );

      // 2033: CBS 9.65%, IBS 9.65% (Estadual 4.825% + Municipal 4.825%)
      expect(resultado.aliquotaCBS).toBe(9.65);
      expect(resultado.aliquotaIBS).toBe(9.65);
      expect(resultado.aliquotaIBS_Estadual).toBe(4.825);
      expect(resultado.aliquotaIBS_Municipal).toBe(4.825);
    });
  });

  describe('C04 - CatÃ¡logo NCM externalizado', () => {
    it('deve usar alÃ­quotas do catÃ¡logo JSON para NCM reduzido', async () => {
      const itemXml = { prod: { NCM: '0201', CFOP: '5101', vProd: '10000.00' } };
      const params = { ano: 2026 };

      const resultado = await taxCalculator.calcularItem(
        itemXml,
        '0201',
        '5101',
        params
      );

      // NCM 0201 (carnes) tem alÃ­quota reduzida 3.86% cada
      expect(resultado.aliquotaCBS).toBe(3.86);
      expect(resultado.aliquotaIBS).toBe(3.86);
      expect(resultado.auditoria.ncmEncontrado).toBe(true);
    });

    it('deve usar alÃ­quota zero para NCM 0000', async () => {
      const itemXml = { prod: { NCM: '0000', CFOP: '5101', vProd: '10000.00' } };
      const params = { ano: 2026 };

      const resultado = await taxCalculator.calcularItem(
        itemXml,
        '0000',
        '5101',
        params
      );

      expect(resultado.aliquotaCBS).toBe(0);
      expect(resultado.aliquotaIBS).toBe(0);
    });

    it('deve alertar quando NCM nao encontrado no catÃ¡logo', async () => {
      const itemXml = { prod: { NCM: '99999999', CFOP: '5101', vProd: '10000.00' } };
      const params = { ano: 2026 };

      const resultado = await taxCalculator.calcularItem(
        itemXml,
        '99999999',
        '5101',
        params
      );

      expect(resultado.auditoria.ncmEncontrado).toBe(false);
      expect(resultado.auditoria.alertas).toContainEqual(
        expect.stringContaining('NCM nao encontrado')
      );
      // Deve usar alÃ­quota padrao
      expect(resultado.aliquotaCBS).toBe(9.65);
    });
  });

  describe('C05 - Imposto Seletivo', () => {
    it('deve calcular IS para destilado (NCM 2208)', async () => {
      const itemXml = { prod: { NCM: '22083000', CFOP: '5101', vProd: '10000.00' } };
      const params = { ano: 2026 };

      const resultado = await taxCalculator.calcularItem(
        itemXml,
        '22083000',
        '5101',
        params
      );

      expect(resultado.isSeletivo).toBe(true);
      expect(resultado.aliquotaIS).toBeGreaterThan(0);
      expect(resultado.isBruta).toBeGreaterThan(0);
      expect(resultado.totalComIS).toBe(
        resultado.cbsBruta + resultado.ibsBruta + resultado.isBruta
      );
    });

    it('deve NÃO substituir CBS/IBS pelo IS', async () => {
      const itemXml = { prod: { NCM: '22083000', CFOP: '5101', vProd: '10000.00' } };
      const params = { ano: 2026 };

      const resultado = await taxCalculator.calcularItem(
        itemXml,
        '22083000',
        '5101',
        params
      );

      // IS deve ser ADICIONAL a CBS + IBS
      expect(resultado.totalComIS).toBe(
        resultado.cbsBruta + resultado.ibsBruta + resultado.isBruta
      );
      expect(resultado.totalComIS).toBeGreaterThan(
        resultado.cbsBruta + resultado.ibsBruta
      );
    });
  });

  describe('C06 - ICMS-ST/DIFAL/FCP fora da base', () => {
    it('deve excluir ICMS-ST da base CBS/IBS', async () => {
      const itemXml = {
        prod: {
          NCM: '84713012',
          CFOP: '5113', // Com ST
          vProd: '10000.00',
          vICMSST: '1800.00',
          vFrete: '100.00',
        },
      };

      const params = { ano: 2026 };
      const resultado = await taxCalculator.calcularItem(
        itemXml,
        '84713012',
        '5113',
        params
      );

      // Base deve ser: 10000 + 100 (frete) = 10100
      // ICMS-ST (1800) NÃO subtraÃ­do, apenas alertado
      expect(resultado.baseCalculo.valorOperacao).toBe(10100);
      expect(resultado.baseCalculo.icmsSt).toBe(1800);
      expect(resultado.baseCalculo.componentes.excluiICMSST).toBe(true);
      expect(resultado.auditoria.alertas).toContainEqual(
        expect.stringContaining('ICMS-ST')
      );
    });

    it('deve excluir DIFAL da base', async () => {
      const itemXml = {
        prod: {
          NCM: '84713012',
          CFOP: '6115', // Com DIFAL
          vProd: '10000.00',
          vICMSDIFAL: '500.00',
        },
      };

      const params = { ano: 2026 };
      const resultado = await taxCalculator.calcularItem(
        itemXml,
        '84713012',
        '6115',
        params
      );

      expect(resultado.baseCalculo.valorOperacao).toBe(10000);
      expect(resultado.baseCalculo.difal).toBe(500);
      expect(resultado.baseCalculo.componentes.excluiDIFAL).toBe(true);
      expect(resultado.auditoria.alertas).toContainEqual(
        expect.stringContaining('DIFAL')
      );
    });

    it('deve excluir FCP da base', async () => {
      const itemXml = {
        prod: {
          NCM: '84713012',
          CFOP: '6116', // Com FCP
          vProd: '10000.00',
          vFCP: '200.00',
        },
      );

      const params = { ano: 2026 };
      const resultado = await taxCalculator.calcularItem(
        itemXml,
        '84713012',
        '6116',
        params
      );

      expect(resultado.baseCalculo.valorOperacao).toBe(10000);
      expect(resultado.baseCalculo.fcp).toBe(200);
      expect(resultado.baseCalculo.componentes.excluiFCP).toBe(true);
      expect(resultado.auditoria.alertas).toContainEqual(
        expect.stringContaining('FCP')
      );
    });
  });

  describe('C07 - CFOP Classification', () => {
    it('deve classificar exportacao (7101) como isenta de CBS/IBS', async () => {
      const itemXml = { prod: { NCM: '84713012', CFOP: '7101', vProd: '10000.00' } };
      const params = { ano: 2026 };

      const resultado = await taxCalculator.calcularItem(
        itemXml,
        '84713012',
        '7101',
        params
      );

      expect(resultado.aliquotaCBS).toBe(0);
      expect(resultado.aliquotaIBS).toBe(0);
      expect(resultado.tipoOperacao).toBe('exportacao');
      expect(resultado.auditoria.alertas).toContainEqual(
        expect.stringContaining('Exportacao')
      );
    });

    it('deve classificar devolucao (1201) como isenta', async () => {
      const itemXml = { prod: { NCM: '84713012', CFOP: '1201', vProd: '10000.00' } };
      const params = { ano: 2026 };

      const resultado = await taxCalculator.calcularItem(
        itemXml,
        '84713012',
        '1201',
        params
      );

      expect(resultado.aliquotaCBS).toBe(0);
      expect(resultado.aliquotaIBS).toBe(0);
      expect(resultado.tipoOperacao).toBe('devolucao');
    });

    it('deve classificar transferÃªncia (5151) com CBS/IBS', async () => {
      const itemXml = { prod: { NCM: '84713012', CFOP: '5151', vProd: '10000.00' } };
      const params = { ano: 2026 };

      const resultado = await taxCalculator.calcularItem(
        itemXml,
        '84713012',
        '5151',
        params
      );

      expect(resultado.tipoOperacao).toBe('transferencia');
      expect(resultado.aliquotaCBS).toBeGreaterThan(0);
      expect(resultado.aliquotaIBS).toBeGreaterThan(0);
    });

    it('deve identificar operacao com ST (5113)', async () => {
      const itemXml = { prod: { NCM: '84713012', CFOP: '5113', vProd: '10000.00' } };
      const params = { ano: 2026 };

      const resultado = await taxCalculator.calcularItem(
        itemXml,
        '84713012',
        '5113',
        params
      );

      expect(resultado.regimeEspecial).toBe('st');
    });

    it('deve identificar operacao com DIFAL (6115)', async () => {
      const itemXml = { prod: { NCM: '84713012', CFOP: '6115', vProd: '10000.00' } };
      const params = { ano: 2026 };

      const resultado = await taxCalculator.calcularItem(
        itemXml,
        '84713012',
        '6115',
        params
      );

      expect(resultado.regimeEspecial).toBe('difal');
    });

    it('deve identificar Simples Nacional (5111)', async () => {
      const itemXml = { prod: { NCM: '84713012', CFOP: '5111', vProd: '10000.00' } };
      const params = { ano: 2026 };

      const resultado = await taxCalculator.calcularItem(
        itemXml,
        '84713012',
        '5111',
        params
      );

      expect(resultado.regimeEspecial).toBe('simples');
    });
    });
  });
});
