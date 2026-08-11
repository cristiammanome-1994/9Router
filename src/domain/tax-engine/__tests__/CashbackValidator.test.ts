// Testes para CashbackValidator - A01: Validação de cashback
import { CashbackValidator } from '../credits/CashbackValidator';

describe('CashbackValidator - A01: Validação de cashback', () => {
  let validator: CashbackValidator;

  beforeEach(() => {
    validator = new CashbackValidator();
  });

  describe('validarCashback', () => {
    it('deve validar cashback 100% para carnes (NCM 0201) consumidor final PF renda 1 SM', () => {
      const resultado = validator.validarCashback('02011000', 1000, {
        cpf: '12345678901',
        pessoaFisica: true,
        rendaMensal: 1,
        consumidorFinal: true,
      });

      expect(resultado.elegivel).toBe(true);
      expect(resultado.percentual).toBe(100);
      expect(resultado.valorCashback).toBe(1000);
      expect(resultado.detalhes.consumidorFinal).toBe(true);
      expect(resultado.detalhes.pessoaFisica).toBe(true);
      expect(resultado.detalhes.rendaValida).toBe(true);
      expect(resultado.detalhes.ncmElegivel).toBe(true);
    });

    it('deve validar cashback 50% para medicamentos (NCM 3004)', () => {
      const resultado = validator.validarCashback('30049099', 500, {
        cpf: '12345678901',
        pessoaFisica: true,
        rendaMensal: 1.5,
        consumidorFinal: true,
      });

      expect(resultado.elegivel).toBe(true);
      expect(resultado.percentual).toBe(50);
      expect(resultado.valorCashback).toBe(250);
    });

    it('deve REJEITAR cashback para pessoa jurídica', () => {
      const resultado = validator.validarCashback('02011000', 1000, {
        cpf: '12345678901',
        pessoaFisica: false, // PJ
        rendaMensal: 1,
        consumidorFinal: true,
      });

      expect(resultado.elegivel).toBe(false);
      expect(resultado.percentual).toBe(0);
      expect(resultado.alertas).toContainEqual(expect.stringContaining('pessoa física'));
    });

    it('deve REJEITAR cashback para não consumidor final (B2B)', () => {
      const resultado = validator.validarCashback('02011000', 1000, {
        cpf: '12345678901',
        pessoaFisica: true,
        rendaMensal: 1,
        consumidorFinal: false, // B2B
      });

      expect(resultado.elegivel).toBe(false);
      expect(resultado.percentual).toBe(0);
      expect(resultado.alertas).toContainEqual(expect.stringContaining('consumidor final'));
    });

    it('deve REJEITAR quando renda excede 2 salários-mínimos', () => {
      const resultado = validator.validarCashback('02011000', 1000, {
        cpf: '12345678901',
        pessoaFisica: true,
        rendaMensal: 3, // 3 SM > 2 SM
        consumidorFinal: true,
      });

      expect(resultado.elegivel).toBe(false);
      expect(resultado.percentual).toBe(0);
      expect(resultado.alertas).toContainEqual(expect.stringContaining('excede limite'));
      expect(resultado.detalhes.rendaValida).toBe(false);
    });

    it('deve REJEITAR NCM não elegível', () => {
      const resultado = validator.validarCashback('84713012', 5000, { // Informática
        cpf: '12345678901',
        pessoaFisica: true,
        rendaMensal: 1,
        consumidorFinal: true,
      });

      expect(resultado.elegivel).toBe(false);
      expect(resultado.percentual).toBe(0);
      expect(resultado.detalhes.ncmElegivel).toBe(false);
    });

    it('deve REJEITAR quando limite anual por CPF atingido', () => {
      const validatorComLimite = new CashbackValidator([
        {
          ncmPrefix: '02',
          descricao: 'Teste limite',
          percentual: 100,
          elegibilidade: {
            consumidorFinal: true,
            pessoaFisica: true,
            rendaMaximaSalariosMinimos: 2,
            limiteAnualPorCpf: 100, // limite baixo para teste
            ncmElegiveis: ['0201'],
          },
        },
      ]);

      // Primeira compra - deve passar
      const resultado1 = validatorComLimite.validarCashback('02011000', 50, {
        cpf: '12345678901',
        pessoaFisica: true,
        rendaMensal: 1,
        consumidorFinal: true,
      });
      expect(resultado1.elegivel).toBe(true);

      // Segunda compra - deve exceder limite (50 + 60 = 110 > 100)
      const resultado2 = validatorComLimite.validarCashback('02011000', 60, {
        cpf: '12345678901',
        pessoaFisica: true,
        rendaMensal: 1,
        consumidorFinal: true,
      });
      expect(resultado2.elegivel).toBe(false);
      expect(resultado2.detalhes.limiteAnualAtingido).toBe(true);
    });

    it('deve aceitar renda não informada com alerta', () => {
      const resultado = validator.validarCashback('02011000', 1000, {
        cpf: '12345678901',
        pessoaFisica: true,
        rendaMensal: undefined, // não informada
        consumidorFinal: true,
      });

      // Deve ser elegível mas com alerta de renda não informada
      expect(resultado.elegivel).toBe(true);
      expect(resultado.alertas).toContainEqual(expect.stringContaining('Renda não informada'));
    });
  });

  describe('getConfig', () => {
    it('deve retornar configuração para NCM com cashback', () => {
      const config = validator.getConfig('02011000');
      expect(config).not.toBeNull();
      expect(config?.percentual).toBe(100);
    });

    it('deve retornar null para NCM sem cashback', () => {
      const config = validator.getConfig('84713012');
      expect(config).toBeNull();
    });
  });

  describe('getNCMsComCashback', () => {
    it('deve retornar lista de NCMs com cashback', () => {
      const ncmList = validator.getNCMsComCashback();
      expect(ncmList.length).toBeGreaterThan(0);
      expect(ncmList).toContain('01');
      expect(ncmList).toContain('02');
      expect(ncmList).toContain('30');
    });
  });

  describe('resetarLimiteAnual', () => {
    it('deve resetar limite de CPF específico', () => {
      const validatorComLimite = new CashbackValidator([
        {
          ncmPrefix: '02',
          descricao: 'Teste',
          percentual: 100,
          elegibilidade: {
            consumidorFinal: true,
            pessoaFisica: true,
            rendaMaximaSalariosMinimos: 2,
            limiteAnualPorCpf: 100,
            ncmElegiveis: ['0201'],
          },
        },
      ]);

      validatorComLimite.validarCashback('02011000', 50, {
        cpf: '12345678901',
        pessoaFisica: true,
        rendaMensal: 1,
        consumidorFinal: true,
      });

      expect(validatorComLimite.getConsumoAnual('12345678901')).toBe(50);

      validatorComLimite.resetarLimiteAnual('12345678901');
      expect(validatorComLimite.getConsumoAnual('12345678901')).toBe(0);
    });

    it('deve resetar todos os limites quando chamado sem CPF', () => {
      const validatorComLimite = new CashbackValidator([
        {
          ncmPrefix: '02',
          descricao: 'Teste',
          percentual: 100,
          elegibilidade: {
            consumidorFinal: true,
            pessoaFisica: true,
            rendaMaximaSalariosMinimos: 2,
            limiteAnualPorCpf: 100,
            ncmElegiveis: ['0201'],
          },
        },
      ]);

      validatorComLimite.validarCashback('02011000', 50, {
        cpf: '12345678901',
        pessoaFisica: true,
        rendaMensal: 1,
        consumidorFinal: true,
      });

      validatorComLimite.resetarLimiteAnual();
      expect(validatorComLimite.getConsumoAnual('12345678901')).toBe(0);
    });
  });

  describe('carregarDeCatalogo', () => {
    it('deve criar instância padrão quando catálogo falha', async () => {
      const validator = await CashbackValidator.carregarDeCatalogo('/caminho/inexistente.json');
      expect(validator).toBeInstanceOf(CashbackValidator);
    });
  });
});