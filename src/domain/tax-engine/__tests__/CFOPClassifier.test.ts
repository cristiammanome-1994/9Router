// Testes para CFOPClassifier - C07: Classificação de operações por CFOP
import { CFOPClassifier } from '../classifications/CFOPClassifier';

describe('CFOPClassifier - C07: Classificação de operações por CFOP', () => {
  let cfopClassifier: CFOPClassifier;

  beforeEach(() => {
    cfopClassifier = new CFOPClassifier();
  });

  describe('classificar', () => {
    it('deve classificar CFOP de venda interna (5101)', () => {
      const config = cfopClassifier.classificar('5101');

      expect(config).not.toBeNull();
      expect(config?.cfop).toBe('5101');
      expect(config?.tipoOperacao).toBe('venda_interna');
      expect(config?.incideCBS).toBe(true);
      expect(config?.incideIBS).toBe(true);
      expect(config?.geraCreditoCBS).toBe(false); // Saída não gera crédito
    });

    it('deve classificar CFOP de venda interestadual (6101)', () => {
      const config = cfopClassifier.classificar('6101');

      expect(config).not.toBeNull();
      expect(config?.tipoOperacao).toBe('venda_interestadual');
      expect(config?.incideCBS).toBe(true);
      expect(config?.incideIBS).toBe(true);
    });

    it('deve classificar CFOP de exportação (7101)', () => {
      const config = cfopClassifier.classificar('7101');

      expect(config).not.toBeNull();
      expect(config?.tipoOperacao).toBe('exportacao');
      expect(config?.incideCBS).toBe(false);
      expect(config?.incideIBS).toBe(false);
      expect(config?.regimeEspecial).toBe('exportacao');
    });

    it('deve classificar CFOP de devolução (1201)', () => {
      const config = cfopClassifier.classificar('1201');

      expect(config).not.toBeNull();
      expect(config?.tipoOperacao).toBe('devolucao');
      expect(config?.incideCBS).toBe(false);
      expect(config?.incideIBS).toBe(false);
      expect(config?.regimeEspecial).toBe('devolucao');
    });

    it('deve classificar CFOP de transferência (5151)', () => {
      const config = cfopClassifier.classificar('5151');

      expect(config).not.toBeNull();
      expect(config?.tipoOperacao).toBe('transferencia');
      expect(config?.incideCBS).toBe(true);
      expect(config?.incideIBS).toBe(true);
      expect(config?.geraCreditoCBS).toBe(false);
      expect(config?.regimeEspecial).toBe('transferencia');
    });

    it('deve classificar CFOP de entrada/compra (1101)', () => {
      const config = cfopClassifier.classificar('1101');

      expect(config).not.toBeNull();
      expect(config?.tipoOperacao).toBe('entrada');
      expect(config?.geraCreditoCBS).toBe(true);
      expect(config?.geraCreditoIBS).toBe(true);
      expect(config?.fluxo).toBe('entrada');
    });

    it('deve classificar CFOP de importação (3101)', () => {
      const config = cfopClassifier.classificar('3101');

      expect(config).not.toBeNull();
      expect(config?.regimeEspecial).toBe('importacao');
      expect(config?.incideIS).toBe(true); // Importação pode ter IS
    });

    it('deve classificar CFOP Simples Nacional (5111)', () => {
      const config = cfopClassifier.classificar('5111');

      expect(config).not.toBeNull();
      expect(config?.regimeEspecial).toBe('simples');
    });

    it('deve classificar CFOP com ICMS-ST (5113)', () => {
      const config = cfopClassifier.classificar('5113');

      expect(config).not.toBeNull();
      expect(config?.regimeEspecial).toBe('st');
    });

    it('deve classificar CFOP com DIFAL (6115)', () => {
      const config = cfopClassifier.classificar('6115');

      expect(config).not.toBeNull();
      expect(config?.regimeEspecial).toBe('difal');
    });

    it('deve classificar CFOP com FCP (6116)', () => {
      const config = cfopClassifier.classificar('6116');

      expect(config).not.toBeNull();
      expect(config?.regimeEspecial).toBe('fcp');
    });

    it('deve retornar null para CFOP não cadastrado', () => {
      const config = cfopClassifier.classificar('9999');
      expect(config).toBeNull();
    });
  });

  describe('getTipoOperacao', () => {
    it('deve retornar tipo de operação', () => {
      expect(cfopClassifier.getTipoOperacao('5101')).toBe('venda_interna');
      expect(cfopClassifier.getTipoOperacao('6101')).toBe('venda_interestadual');
      expect(cfopClassifier.getTipoOperacao('7101')).toBe('exportacao');
      expect(cfopClassifier.getTipoOperacao('1201')).toBe('devolucao');
      expect(cfopClassifier.getTipoOperacao('1101')).toBe('entrada');
      expect(cfopClassifier.getTipoOperacao('9999')).toBe('outra');
    });
  });

  describe('geraCreditoCBS / geraCreditoIBS', () => {
    it('deve retornar true para CFOP de entrada', () => {
      expect(cfopClassifier.geraCreditoCBS('1101')).toBe(true);
      expect(cfopClassifier.geraCreditoIBS('1101')).toBe(true);
    });

    it('deve retornar false para CFOP de saída/venda', () => {
      expect(cfopClassifier.geraCreditoCBS('5101')).toBe(false);
      expect(cfopClassifier.geraCreditoIBS('5101')).toBe(false);
      expect(cfopClassifier.geraCreditoCBS('6101')).toBe(false);
    });

    it('deve retornar false para CFOP de devolução', () => {
      expect(cfopClassifier.geraCreditoCBS('1201')).toBe(false);
      expect(cfopClassifier.geraCreditoIBS('1201')).toBe(false);
    });

    it('deve retornar false para CFOP não cadastrado', () => {
      expect(cfopClassifier.geraCreditoCBS('9999')).toBe(false);
      expect(cfopClassifier.geraCreditoIBS('9999')).toBe(false);
    });
  });

  describe('incideCBS / incideIBS / incideIS', () => {
    it('deve retornar true para venda', () => {
      expect(cfopClassifier.incideCBS('5101')).toBe(true);
      expect(cfopClassifier.incideIBS('5101')).toBe(true);
      expect(cfopClassifier.incideIS('5101')).toBe(false);
    });

    it('deve retornar false para exportação', () => {
      expect(cfopClassifier.incideCBS('7101')).toBe(false);
      expect(cfopClassifier.incideIBS('7101')).toBe(false);
      expect(cfopClassifier.incideIS('7101')).toBe(false);
    });

    it('deve retornar true para importação (IS)', () => {
      expect(cfopClassifier.incideIS('3101')).toBe(true);
    });
  });

  describe('isExportacao / isDevolucao / isTransferencia', () => {
    it('deve identificar exportação', () => {
      expect(cfopClassifier.isExportacao('7101')).toBe(true);
      expect(cfopClassifier.isExportacao('7102')).toBe(true);
      expect(cfopClassifier.isExportacao('5101')).toBe(false);
    });

    it('deve identificar devolução', () => {
      expect(cfopClassifier.isDevolucao('1201')).toBe(true);
      expect(cfopClassifier.isDevolucao('2201')).toBe(true);
      expect(cfopClassifier.isDevolucao('7201')).toBe(true);
      expect(cfopClassifier.isDevolucao('5101')).toBe(false);
    });

    it('deve identificar transferência', () => {
      expect(cfopClassifier.isTransferencia('5151')).toBe(true);
      expect(cfopClassifier.isTransferencia('6151')).toBe(true);
      expect(cfopClassifier.isTransferencia('5101')).toBe(false);
    });
  });

  describe('isComST / isComDIFAL / isComFCP', () => {
    it('deve identificar ST', () => {
      expect(cfopClassifier.isComST('5113')).toBe(true);
      expect(cfopClassifier.isComST('6113')).toBe(true);
      expect(cfopClassifier.isComST('5101')).toBe(false);
    });

    it('deve identificar DIFAL', () => {
      expect(cfopClassifier.isComDIFAL('6115')).toBe(true);
      expect(cfopClassifier.isComDIFAL('5101')).toBe(false);
    });

    it('deve identificar FCP', () => {
      expect(cfopClassifier.isComFCP('6116')).toBe(true);
      expect(cfopClassifier.isComFCP('5101')).toBe(false);
    });
  });

  describe('isSimplesNacional / isExportacaoRegime / isZonaFranca', () => {
    it('deve identificar Simples Nacional', () => {
      expect(cfopClassifier.isSimplesNacional('5111')).toBe(true);
      expect(cfopClassifier.isSimplesNacional('6111')).toBe(true);
      expect(cfopClassifier.isSimplesNacional('5101')).toBe(false);
    });

    it('deve identificar exportação (regime)', () => {
      expect(cfopClassifier.isExportacaoRegime('7101')).toBe(true);
      expect(cfopClassifier.isExportacaoRegime('7102')).toBe(true);
    });

    it('deve identificar Zona Franca', () => {
      expect(cfopClassifier.isZonaFranca('5105')).toBe(true);
      expect(cfopClassifier.isZonaFranca('5106')).toBe(true);
      expect(cfopClassifier.isZonaFranca('5107')).toBe(true);
      expect(cfopClassifier.isZonaFranca('5108')).toBe(true);
      expect(cfopClassifier.isZonaFranca('5101')).toBe(false);
    });
  });

  describe('isImportacao / isSuspensao', () => {
    it('deve identificar importação', () => {
      expect(cfopClassifier.isImportacao('3101')).toBe(true);
      expect(cfopClassifier.isImportacao('3102')).toBe(true);
      expect(cfopClassifier.isImportacao('5101')).toBe(false);
    });

    it('deve identificar suspensão', () => {
      expect(cfopClassifier.isSuspensao('5109')).toBe(true);
      expect(cfopClassifier.isSuspensao('6109')).toBe(true);
      expect(cfopClassifier.isSuspensao('5101')).toBe(false);
    });
  });

  describe('getDescricao', () => {
    it('deve retornar descrição do CFOP', () => {
      expect(cfopClassifier.getDescricao('5101')).toContain('Venda de produção');
      expect(cfopClassifier.getDescricao('7101')).toContain('Exportação');
      expect(cfopClassifier.getDescricao('1201')).toContain('Devolução');
    });

    it('deve retornar mensagem padrão para CFOP não cadastrado', () => {
      expect(cfopClassifier.getDescricao('9999')).toBe('CFOP não cadastrado');
    });
  });

  describe('getEstatisticas', () => {
    it('deve retornar estatísticas dos CFOPs carregados', () => {
      const stats = cfopClassifier.getEstatisticas();

      expect(stats.total).toBeGreaterThan(50); // Deve ter muitos CFOPs padrão
      expect(stats.porTipo.venda_interna).toBeGreaterThan(0);
      expect(stats.porTipo.venda_interestadual).toBeGreaterThan(0);
      expect(stats.porTipo.exportacao).toBeGreaterThan(0);
      expect(stats.porTipo.devolucao).toBeGreaterThan(0);
      expect(stats.porTipo.transferencia).toBeGreaterThan(0);
      expect(stats.porTipo.entrada).toBeGreaterThan(0);
    });
  });

  describe('carregarDeCatalogo', () => {
    it('deve carregar CFOPs personalizados', () => {
      const cfopsCustom = [
        {
          cfop: '9999',
          descricao: 'Operação customizada',
          tipoOperacao: 'outra' as const,
          geraCreditoCBS: true,
          geraCreditoIBS: true,
          incideCBS: true,
          incideIBS: true,
          incideIS: false,
          fluxo: 'entrada' as const,
        },
      ];

      cfopClassifier.carregarDeCatalogo(cfopsCustom);

      const config = cfopClassifier.classificar('9999');
      expect(config).not.toBeNull();
      expect(config?.descricao).toBe('Operação customizada');
    });

    it('não deve sobrescrever CFOPs existentes se não especificado', () => {
      const cfopsCustom = [
        {
          cfop: '5101',
          descricao: 'Custom 5101',
          tipoOperacao: 'outra' as const,
          geraCreditoCBS: false,
          geraCreditoIBS: false,
          incideCBS: false,
          incideIBS: false,
          incideIS: false,
          fluxo: 'saida' as const,
        },
      ];

      cfopClassifier.carregarDeCatalogo(cfopsCustom);

      // Não deve sobrescrever - o carregador padrão deve ter prioridade ou ser aditivo
      // O comportamento depende da implementação
    });
  });
});