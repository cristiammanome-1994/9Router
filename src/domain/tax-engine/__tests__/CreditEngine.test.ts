// Testes para CreditEngine - C01: Não-cumulatividade CBS/IBS
import { CreditEngine } from '../credits/CreditEngine';

describe('CreditEngine - C01: Não-cumulatividade CBS/IBS', () => {
  let creditEngine: CreditEngine;

  const creditosConfig = [
    {
      ncmPrefix: '2710',
      descricao: 'Combustíveis - crédito integral',
      geraCreditoCBS: true,
      geraCreditoIBS: true,
      percentualCreditoCBS: 9.65,
      percentualCreditoIBS: 9.65,
      tipoOperacao: 'entrada',
    },
    {
      ncmPrefix: '8471',
      descricao: 'Equipamentos de informática - crédito integral',
      geraCreditoCBS: true,
      geraCreditoIBS: true,
      percentualCreditoCBS: 9.65,
      percentualCreditoIBS: 9.65,
      tipoOperacao: 'entrada',
    },
    {
      ncmPrefix: '2202',
      descricao: 'Refrigerantes - sem crédito (bebida açucarada)',
      geraCreditoCBS: false,
      geraCreditoIBS: false,
      percentualCreditoCBS: 0,
      percentualCreditoIBS: 0,
      tipoOperacao: 'entrada',
    },
    {
      tipoOperacao: 'entrada',
      descricao: 'Entrada geral - crédito presumido 50%',
      geraCreditoCBS: true,
      geraCreditoIBS: true,
      percentualCreditoCBS: 4.825,
      percentualCreditoIBS: 4.825,
    },
  ];

  const ncmsConfig = [
    { ncmPrefix: '2710', cbs: 9.65, ibs: 9.65, descricao: 'Combustíveis' },
    { ncmPrefix: '8471', cbs: 9.65, ibs: 9.65, descricao: 'Informática' },
    { ncmPrefix: '2202', cbs: 9.65, ibs: 9.65, descricao: 'Refrigerantes' },
  ];

  const cfopsConfig = [
    { cfop: '1101', geraCreditoCBS: true, geraCreditoIBS: true, tipoOperacao: 'entrada' },
    { cfop: '1102', geraCreditoCBS: true, geraCreditoIBS: true, tipoOperacao: 'entrada' },
    { cfop: '5101', geraCreditoCBS: false, geraCreditoIBS: false, tipoOperacao: 'venda_interna' },
    { cfop: '1201', geraCreditoCBS: false, geraCreditoIBS: false, tipoOperacao: 'devolucao' },
  ];

  beforeEach(() => {
    creditEngine = new CreditEngine(creditosConfig, ncmsConfig, cfopsConfig);
  });

  describe('calcularCreditos', () => {
    it('deve calcular crédito integral para combustível (NCM 2710) com CFOP de entrada', () => {
      const item = {
        ncm: '27101921',
        cfop: '1101',
        baseCalculo: { valorOperacao: 10000 },
        auditoria: { tipoOperacao: 'entrada' },
      } as any;

      const params = { incluirCreditos: true, ano: 2026 } as any;
      const resultado = creditEngine.calcularCreditos(item, params);

      expect(resultado.creditoCBS).toBe(965); // 9.65% de 10000
      expect(resultado.creditoIBS).toBe(965);
      expect(resultado.detalheCBS).toContain('9.65%');
      expect(resultado.detalheIBS).toContain('9.65%');
    });

    it('deve calcular crédito integral para informática (NCM 8471) com CFOP de entrada', () => {
      const item = {
        ncm: '84713012',
        cfop: '1102',
        baseCalculo: { valorOperacao: 5000 },
        auditoria: { tipoOperacao: 'entrada' },
      } as any;

      const params = { incluirCreditos: true, ano: 2026 } as any;
      const resultado = creditEngine.calcularCreditos(item, params);

      expect(resultado.creditoCBS).toBe(482.5); // 9.65% de 5000
      expect(resultado.creditoIBS).toBe(482.5);
    });

    it('não deve gerar crédito para refrigerante (NCM 2202) - bebida açucarada', () => {
      const item = {
        ncm: '22021000',
        cfop: '1101',
        baseCalculo: { valorOperacao: 1000 },
        auditoria: { tipoOperacao: 'entrada' },
      } as any;

      const params = { incluirCreditos: true, ano: 2026 } as any;
      const resultado = creditEngine.calcularCreditos(item, params);

      expect(resultado.creditoCBS).toBe(0);
      expect(resultado.creditoIBS).toBe(0);
      expect(resultado.detalheCBS).toContain('não gera crédito');
    });

    it('não deve gerar crédito para CFOP de venda (5101)', () => {
      const item = {
        ncm: '27101921',
        cfop: '5101',
        baseCalculo: { valorOperacao: 10000 },
        auditoria: { tipoOperacao: 'venda_interna' },
      } as any;

      const params = { incluirCreditos: true, ano: 2026 } as any;
      const resultado = creditEngine.calcularCreditos(item, params);

      expect(resultado.creditoCBS).toBe(0);
      expect(resultado.creditoIBS).toBe(0);
    });

    it('não deve gerar crédito para CFOP de devolução (1201)', () => {
      const item = {
        ncm: '27101921',
        cfop: '1201',
        baseCalculo: { valorOperacao: 10000 },
        auditoria: { tipoOperacao: 'devolucao' },
      } as any;

      const params = { incluirCreditos: true, ano: 2026 } as any;
      const resultado = creditEngine.calcularCreditos(item, params);

      expect(resultado.creditoCBS).toBe(0);
      expect(resultado.creditoIBS).toBe(0);
    });

    it('deve retornar zero quando créditos desativados nos parâmetros', () => {
      const item = {
        ncm: '27101921',
        cfop: '1101',
        baseCalculo: { valorOperacao: 10000 },
        auditoria: { tipoOperacao: 'entrada' },
      } as any;

      const params = { incluirCreditos: false, ano: 2026 } as any;
      const resultado = creditEngine.calcularCreditos(item, params);

      expect(resultado.creditoCBS).toBe(0);
      expect(resultado.creditoIBS).toBe(0);
      expect(resultado.detalheCBS).toContain('desativados');
    });

    it('deve usar crédito presumido 50% para NCM sem configuração específica', () => {
      const item = {
        ncm: '99999999', // NCM não configurado
        cfop: '1101',
        baseCalculo: { valorOperacao: 10000 },
        auditoria: { tipoOperacao: 'entrada' },
      } as any;

      const params = { incluirCreditos: true, ano: 2026 } as any;
      const resultado = creditEngine.calcularCreditos(item, params);

      // Deve usar fallback de 50% (4.825%)
      expect(resultado.creditoCBS).toBe(482.5); // 4.825% de 10000
      expect(resultado.creditoIBS).toBe(482.5);
    });
  });

  describe('ncmGeraCredito', () => {
    it('deve retornar true para NCM com crédito configurado', () => {
      const resultado = creditEngine.ncmGeraCredito('27101921');
      expect(resultado.cbs).toBe(true);
      expect(resultado.ibs).toBe(true);
    });

    it('deve retornar false para NCM sem crédito', () => {
      const resultado = creditEngine.ncmGeraCredito('22021000');
      expect(resultado.cbs).toBe(false);
      expect(resultado.ibs).toBe(false);
    });
  });

  describe('cfopGeraCredito', () => {
    it('deve retornar true para CFOP de entrada', () => {
      const resultado = creditEngine.cfopGeraCredito('1101');
      expect(resultado.cbs).toBe(true);
      expect(resultado.ibs).toBe(true);
    });

    it('deve retornar false para CFOP de venda', () => {
      const resultado = creditEngine.cfopGeraCredito('5101');
      expect(resultado.cbs).toBe(false);
      expect(resultado.ibs).toBe(false);
    });
  });

  describe('getNCMsComCredito', () => {
    it('deve retornar lista de NCMs que geram crédito', () => {
      const ncmList = creditEngine.getNCMsComCredito();
      expect(ncmList).toContain('2710');
      expect(ncmList).toContain('8471');
    });
  });

  describe('getCFOPsComCredito', () => {
    it('deve retornar lista de CFOPs que geram crédito', () => {
      const cfopList = creditEngine.getCFOPsComCredito();
      expect(cfopList).toContain('1101');
      expect(cfopList).toContain('1102');
    });
  });
});