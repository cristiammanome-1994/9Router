// Testes para CreditoPISCOFINSEngine - A04: Créditos PIS/COFINS por CNAE
import { CreditoPISCOFINSEngine } from '../credits/CreditoPISCOFINSEngine';

describe('CreditoPISCOFINSEngine - A04: Creditos PIS/COFINS por CNAE', () => {
  let engine: CreditoPISCOFINSEngine;

  beforeEach(() => {
    engine = new CreditoPISCOFINSEngine();
  });

  describe('calcularCreditos', () => {
    it('deve calcular credito integral para combustiveis (NCM 2710)', () => {
      const resultado = engine.calcularCreditos('27101921', '1101', 10000, 'lucro-real', 'lucro-real');

      expect(resultado.elegivel).toBe(true);
      expect(resultado.creditoPIS).toBe(165);
      expect(resultado.creditoCOFINS).toBe(760);
      expect(resultado.detalhePIS).toContain('1.65%');
      expect(resultado.detalheCOFINS).toContain('7.6%');
    });

    it('deve calcular credito integral para informatica (NCM 8471)', () => {
      const resultado = engine.calcularCreditos('84713012', '1101', 5000, 'lucro-real', 'lucro-real');

      expect(resultado.elegivel).toBe(true);
      expect(resultado.creditoPIS).toBe(82.5);
      expect(resultado.creditoCOFINS).toBe(380);
    });

    it('deve NÃO gerar credito para refrigerante (NCM 2202) - bebida acucarada', () => {
      const resultado = engine.calcularCreditos('22021000', '1101', 1000, 'lucro-real', 'lucro-real');

      expect(resultado.elegivel).toBe(false);
      expect(resultado.creditoPIS).toBe(0);
      expect(resultado.creditoCOFINS).toBe(0);
    });

    it('não deve gerar credito para CFOP de venda (5101)', () => {
      const resultado = engine.calcularCreditos('27101921', '5101', 10000, 'lucro-real', 'lucro-real');

      expect(resultado.elegivel).toBe(false);
      expect(resultado.creditoPIS).toBe(0);
      expect(resultado.creditoCOFINS).toBe(0);
    });

    it('não deve gerar credito para CFOP de devolucao (1201)', () => {
      const resultado = engine.calcularCreditos('27101921', '1201', 10000, 'lucro-real', 'lucro-real');

      expect(resultado.elegivel).toBe(false);
      expect(resultado.creditoPIS).toBe(0);
      expect(resultado.creditoCOFINS).toBe(0);
    });

    it('deve retornar zero quando creditos desativados nos parametros', () => {
      const resultado = engine.calcularCreditos('27101921', '1101', 10000, 'lucro-real', 'lucro-real', false);

      expect(resultado.creditoPIS).toBe(0);
      expect(resultado.creditoCOFINS).toBe(0);
    });

    it('deve usar credito presumido 30% para NCM sem configuracao especifica (DEFAULT)', () => {
      // Usa NCM com prefixo '00' que nao existe no catalogo para forcar uso do DEFAULT
      const resultado = engine.calcularCreditos('00000000', '1101', 10000, 'lucro-real', 'lucro-real');

      // DEFAULT = 30% de 1.65% = 0.495% PIS, 30% de 7.6% = 2.28% COFINS
      expect(resultado.creditoPIS).toBeCloseTo(49.5, 1); // 0.495% de 10000
      expect(resultado.creditoCOFINS).toBeCloseTo(228, 1); // 2.28% de 10000
    });

    it('deve retornar true para NCM com credito configurado', () => {
      const resultado = engine.ncmGeraCredito('27101921');
      expect(resultado.cbs).toBe(true);
      expect(resultado.ibs).toBe(true);
    });

    it('deve retornar false para NCM sem credito (servicos financeiros - NCM 64)', () => {
      const resultado = engine.ncmGeraCredito('64010000');
      expect(resultado.cbs).toBe(false);
      expect(resultado.ibs).toBe(false);
    });

    it('deve retornar true para CFOP de entrada', () => {
      expect(engine.cfopGeraCredito('1101').cbs).toBe(true);
      expect(engine.cfopGeraCredito('1101').ibs).toBe(true);
    });

    it('deve retornar false para CFOP de venda', () => {
      expect(engine.cfopGeraCredito('5101').cbs).toBe(false);
      expect(engine.cfopGeraCredito('5101').ibs).toBe(false);
    });

    it('deve retornar false para CFOP nao cadastrado', () => {
      expect(engine.cfopGeraCredito('9999').cbs).toBe(false);
      expect(engine.cfopGeraCredito('9999').ibs).toBe(false);
    });

    it('deve retornar lista de NCMs que geram credito', () => {
      const ncmList = engine.getNCMsComCredito();
      expect(ncmList).toContain('2710');
      expect(ncmList).toContain('84');
    });

    it('deve retornar lista de CFOPs que geram credito', () => {
      const cfopList = engine.getCFOPsComCredito();
      expect(cfopList).toContain('1101');
      expect(cfopList).toContain('1102');
    });
  });
});