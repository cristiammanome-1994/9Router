// Testes para IBSDualCalculator - C02: IBS Dual (Estadual + Municipal)
import { IBSDualCalculator } from '../calculators/IBSDualCalculator';

describe('IBSDualCalculator - C02: IBS Dual (Estadual + Municipal)', () => {
  let ibsDual: IBSDualCalculator;

  beforeEach(() => {
    ibsDual = new IBSDualCalculator();
  });

  describe('calcularIBSDual', () => {
    it('deve calcular IBS Estadual e Municipal para base R$ 10.000 em SP', () => {
      const resultado = ibsDual.calcularIBSDual(10000, 'SP', 'São Paulo', 9.65);

      expect(resultado.ibsEstadual).toBe(482.5); // 4.825% de 10000
      expect(resultado.ibsMunicipal).toBe(482.5); // 4.825% de 10000
      expect(resultado.ibsTotal).toBe(965); // 9.65% de 10000
      expect(resultado.aliquotaEstadual).toBe(4.825);
      expect(resultado.aliquotaMunicipal).toBe(4.825);
      expect(resultado.ufDestino).toBe('SP');
    });

    it('deve calcular IBS para base R$ 50.000 em RJ', () => {
      const resultado = ibsDual.calcularIBSDual(50000, 'RJ', 'Rio de Janeiro', 9.65);

      expect(resultado.ibsEstadual).toBe(2412.5); // 4.825% de 50000
      expect(resultado.ibsMunicipal).toBe(2412.5);
      expect(resultado.ibsTotal).toBe(4825);
    });

    it('deve usar alíquotas manuais quando fornecidas', () => {
      const resultado = ibsDual.calcularIBSDual(
        10000,
        'SP',
        'São Paulo',
        9.65,
        { aliquotaEstadual: 5.0, aliquotaMunicipal: 4.65 }
      );

      expect(resultado.aliquotaEstadual).toBe(5.0);
      expect(resultado.aliquotaMunicipal).toBe(4.65);
      expect(resultado.ibsEstadual).toBe(500); // 5% de 10000
      expect(resultado.ibsMunicipal).toBe(465); // 4.65% de 10000
      expect(resultado.ibsTotal).toBe(965);
    });

    it('deve usar configuração padrão para UF não cadastrada', () => {
      const resultado = ibsDual.calcularIBSDual(10000, 'XX', 'CidadeXX', 9.65);

      expect(resultado.aliquotaEstadual).toBe(4.825);
      expect(resultado.aliquotaMunicipal).toBe(4.825);
      expect(resultado.ufDestino).toBe('XX');
    });

    it('deve retornar zero para base zero', () => {
      const resultado = ibsDual.calcularIBSDual(0, 'SP', 'São Paulo', 9.65);

      expect(resultado.ibsEstadual).toBe(0);
      expect(resultado.ibsMunicipal).toBe(0);
      expect(resultado.ibsTotal).toBe(0);
    });
  });

  describe('calcularIBSInterestadual', () => {
    it('deve calcular IBS 100% para destino em operação interestadual', () => {
      const resultado = ibsDual.calcularIBSInterestadual(
        10000,
        'SP',
        'RJ',
        'Rio de Janeiro',
        9.65
      );

      // Origem: zero
      expect(resultado.ibsOrigem.ibsTotal).toBe(0);
      expect(resultado.ibsOrigem.ibsEstadual).toBe(0);
      expect(resultado.ibsOrigem.ibsMunicipal).toBe(0);

      // Destino: 100%
      expect(resultado.ibsDestino.ibsTotal).toBe(965);
      expect(resultado.ibsDestino.ibsEstadual).toBe(482.5);
      expect(resultado.ibsDestino.ibsMunicipal).toBe(482.5);
      expect(resultado.ibsDestino.ufDestino).toBe('RJ');
    });

    it('deve respeitar princípio do destino', () => {
      const resultado = ibsDual.calcularIBSInterestadual(
        20000,
        'MG',
        'SP',
        'São Paulo',
        9.65
      );

      // Todo IBS vai para destino (SP)
      expect(resultado.ibsDestino.ufDestino).toBe('SP');
      expect(resultado.ibsDestino.ibsTotal).toBe(1930); // 9.65% de 20000
      expect(resultado.ibsOrigem.ibsTotal).toBe(0);
    });
  });

  describe('getUFConfig', () => {
    it('deve retornar configuração para UF válida', () => {
      const config = ibsDual.getUFConfig('SP');
      expect(config).not.toBeNull();
      expect(config?.uf).toBe('SP');
      expect(config?.aliquotaEstadual).toBe(4.825);
      expect(config?.aliquotaMunicipal).toBe(4.825);
    });

    it('deve retornar null para UF inválida', () => {
      const config = ibsDual.getUFConfig('XX');
      expect(config).toBeNull();
    });

    it('deve ser case-insensitive', () => {
      const config1 = ibsDual.getUFConfig('sp');
      const config2 = ibsDual.getUFConfig('SP');
      expect(config1).toEqual(config2);
    });
  });

  describe('setUFConfig', () => {
    it('deve permitir atualizar configuração de UF', () => {
      ibsDual.setUFConfig('SP', {
        uf: 'SP',
        aliquotaEstadual: 5.0,
        aliquotaMunicipal: 4.65,
        aliquotaReferenciaCFC: 9.65,
      });

      const config = ibsDual.getUFConfig('SP');
      expect(config?.aliquotaEstadual).toBe(5.0);
      expect(config?.aliquotaMunicipal).toBe(4.65);

      const resultado = ibsDual.calcularIBSDual(10000, 'SP', 'São Paulo', 9.65);
      expect(resultado.ibsEstadual).toBe(500);
      expect(resultado.ibsMunicipal).toBe(465);
    });
  });

  describe('getAllUFS', () => {
    it('deve retornar todas as UFs configuradas', () => {
      const ufs = ibsDual.getAllUFS();
      expect(ufs.length).toBe(27); // 26 estados + DF
      expect(ufs.some(u => u.uf === 'SP')).toBe(true);
      expect(ufs.some(u => u.uf === 'RJ')).toBe(true);
    });
  });
});