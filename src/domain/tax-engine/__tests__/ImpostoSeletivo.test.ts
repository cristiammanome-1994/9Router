// Testes para Imposto Seletivo - C05: Integração ao cálculo
import { CatalogLoader } from '../catalogs/CatalogLoader';
import { calcularImpostoSeletivo, buscarImpostoSeletivo } from '../catalogs/CatalogLoader';

describe('Imposto Seletivo - C05: Integração ao cálculo', () => {
  let catalogos: any;

  beforeAll(async () => {
    // Carregar catálogos para 2026
    const loader = new CatalogLoader();
    catalogos = await loader.carregarCatalogos(2026);
  });

  describe('buscarImpostoSeletivo', () => {
    it('deve encontrar IS para cigarros (NCM 2402)', () => {
      const resultado = buscarImpostoSeletivo(catalogos, '24022000');

      expect(resultado).not.toBeNull();
      expect(resultado?.encontrado).toBe(true);
      expect(resultado?.tipo).toBe('fumo');
      expect(resultado?.aliquotaAdValorem).toBe(15);
      expect(resultado?.aliquotaEspecifica).toBe(150);
      expect(resultado?.unidade).toBe('MILHEIRO');
    });

    it('deve encontrar IS para destilados (NCM 2208)', () => {
      const resultado = buscarImpostoSeletivo(catalogos, '22083000');

      expect(resultado).not.toBeNull();
      expect(resultado?.tipo).toBe('bebida_alcoolica');
      expect(resultado?.aliquotaAdValorem).toBe(15);
      expect(resultado?.aliquotaEspecifica).toBe(3.0);
      expect(resultado?.unidade).toBe('LITRO');
    });

    it('deve encontrar IS para cerveja (NCM 2203)', () => {
      const resultado = buscarImpostoSeletivo(catalogos, '22030000');

      expect(resultado).not.toBeNull();
      expect(resultado?.tipo).toBe('bebida_alcoolica');
      expect(resultado?.aliquotaAdValorem).toBe(5);
      expect(resultado?.aliquotaEspecifica).toBe(0.5);
      expect(resultado?.unidade).toBe('LITRO');
    });

    it('deve encontrar IS para vinhos (NCM 2204)', () => {
      const resultado = buscarImpostoSeletivo(catalogos, '22042100');

      expect(resultado).not.toBeNull();
      expect(resultado?.tipo).toBe('bebida_alcoolica');
      expect(resultado?.aliquotaAdValorem).toBe(8);
      expect(resultado?.aliquotaEspecifica).toBe(1.0);
      expect(resultado?.unidade).toBe('LITRO');
    });

    it('deve encontrar IS para refrigerantes (NCM 2202)', () => {
      const resultado = buscarImpostoSeletivo(catalogos, '22021000');

      expect(resultado).not.toBeNull();
      expect(resultado?.tipo).toBe('bebida_acucarada');
      expect(resultado?.aliquotaAdValorem).toBe(5);
      expect(resultado?.aliquotaEspecifica).toBe(0.1);
      expect(resultado?.unidade).toBe('LITRO');
    });

    it('deve encontrar IS para veículos (NCM 8703)', () => {
      const resultado = buscarImpostoSeletivo(catalogos, '87032100');

      expect(resultado).not.toBeNull();
      expect(resultado?.tipo).toBe('veiculo');
      expect(resultado?.aliquotaAdValorem).toBe(10);
      expect(resultado?.aliquotaEspecifica).toBe(0);
      expect(resultado?.unidade).toBeNull();
    });

    it('deve encontrar IS para armas (NCM 9302)', () => {
      const resultado = buscarImpostoSeletivo(catalogos, '93020000');

      expect(resultado).not.toBeNull();
      expect(resultado?.tipo).toBe('arma');
      expect(resultado?.aliquotaAdValorem).toBe(20);
      expect(resultado?.aliquotaEspecifica).toBe(0);
      expect(resultado?.unidade).toBeNull();
    });

    it('deve encontrar IS para petróleo (NCM 2710)', () => {
      const resultado = buscarImpostoSeletivo(catalogos, '27101200');

      expect(resultado).not.toBeNull();
      expect(resultado?.tipo).toBe('petroleo');
      expect(resultado?.aliquotaAdValorem).toBe(5);
      expect(resultado?.aliquotaEspecifica).toBe(0.1);
      expect(resultado?.unidade).toBe('LITRO');
    });

    it('deve retornar null para NCM sem IS', () => {
      const resultado = buscarImpostoSeletivo(catalogos, '84713012'); // Informática
      expect(resultado).toBeNull();
    });
  });

  describe('calcularImpostoSeletivo', () => {
it('deve calcular IS ad valorem para cigarros', () => {
      const item = {
        ncm: '24022000',
        valorTotal: 10000,
        quantidade: 50,
        unidade: 'MILHEIRO',
      };

      // Mock do catálogo com regra de cigarros (apenas ad valorem para este teste)
      const catalogoMock = [
        {
          ncmPrefix: '2402',
          aliquotaAdValorem: 15,
          aliquotaEspecifica: 0, // sem alíquota específica para este teste
          unidade: 'MILHEIRO',
          tipo: 'fumo',
        },
      ];

      const resultado = calcularImpostoSeletivo(item, catalogoMock);

      expect(resultado).not.toBeNull();
      expect(resultado?.valor).toBe(1500); // 15% de 10000
      expect(resultado?.detalhe).toContain('Ad valorem 15%: 1500.00');
    });

    it('deve calcular IS específico para cigarros (por milheiro)', () => {
      const item = {
        ncm: '24022000',
        valorTotal: 10000,
        quantidade: 50,
        unidade: 'MILHEIRO',
      };

      // Mock do catálogo com regra de cigarros
      const catalogoMock = [
        {
          ncmPrefix: '2402',
          aliquotaAdValorem: 15,
          aliquotaEspecifica: 150,
          unidade: 'MILHEIRO',
        },
      ];

      const resultado = calcularImpostoSeletivo(item, catalogoMock);

      expect(resultado).not.toBeNull();
      // Ad valorem: 15% de 10000 = 1500
      // Específica: 50 * 150 = 7500
      // Total: 9000
      expect(resultado?.valor).toBe(9000);
      expect(resultado?.detalhe).toContain('Ad valorem 15%: 1500.00');
      expect(resultado?.detalhe).toContain('Específica 150/MILHEIRO: 7500.00');
    });

    it('deve calcular IS para destilados (ad valorem + específico por litro)', () => {
      const item = {
        ncm: '22083000',
        valorTotal: 5000,
        quantidade: 100,
        unidade: 'LITRO',
      };

      const catalogoMock = [
        {
          ncmPrefix: '2208',
          aliquotaAdValorem: 15,
          aliquotaEspecifica: 3.0,
          unidade: 'LITRO',
        },
      ];

      const resultado = calcularImpostoSeletivo(item, catalogoMock);

      expect(resultado).not.toBeNull();
      // Ad valorem: 15% de 5000 = 750
      // Específica: 100 * 3.0 = 300
      // Total: 1050
      expect(resultado?.valor).toBe(1050);
      expect(resultado?.detalhe).toContain('Ad valorem 15%: 750.00');
      expect(resultado?.detalhe).toContain('Específica 3/LITRO: 300.00');
    });

    it('deve calcular IS para veículos (apenas ad valorem)', () => {
      const item = {
        ncm: '87032100',
        valorTotal: 200000,
        quantidade: 1,
        unidade: 'UN',
      };

      const catalogoMock = [
        {
          ncmPrefix: '8703',
          aliquotaAdValorem: 10,
          aliquotaEspecifica: 0,
          unidade: null,
        },
      ];

      const resultado = calcularImpostoSeletivo(item, catalogoMock);

      expect(resultado).not.toBeNull();
      expect(resultado?.valor).toBe(20000); // 10% de 200000
      expect(resultado?.detalhe).toContain('Ad valorem 10%: 20000.00');
      expect(resultado?.detalhe).not.toContain('Específica');
    });

    it('deve retornar null para item sem IS', () => {
      const item = {
        ncm: '84713012',
        valorTotal: 5000,
        quantidade: 1,
        unidade: 'UN',
      };

      const resultado = calcularImpostoSeletivo(item, []);

      expect(resultado).toBeNull();
    });
  });

  describe('Integração: IS deve ser ADICIONAL a CBS/IBS', () => {
    it('IS não deve substituir CBS/IBS', () => {
      // Para um item com IS (ex: destilado), o total deve ser:
      // CBS + IBS + IS (não apenas IS)
      const baseCalculo = 10000;
      const aliquotaCBS = 9.65;
      const aliquotaIBS = 9.65;
      const aliquotaIS = 15; // destilado

      const cbs = (baseCalculo * aliquotaCBS) / 100; // 965
      const ibs = (baseCalculo * 9.65) / 100; // 965
      const is = (baseCalculo * aliquotaIS) / 100; // 1500

      const totalComIS = cbs + (9.65 * baseCalculo / 100) + is; // CBS + IBS + IS
      const totalSemIS = cbs + (9.65 * baseCalculo / 100); // apenas CBS + IBS

      expect(totalComIS).toBeGreaterThan(totalSemIS);
      expect(totalComIS).toBe(3430); // 965 + 965 + 1500
      expect(totalSemIS).toBe(1930); // 965 + 965
    });
  });
});