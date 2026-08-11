// Test setup file
import { vi } from 'vitest';

// Mock fetch globally
global.fetch = vi.fn();

// Mock fetch para catálogos
global.fetch = vi.fn((url: string) => {
  if (url.includes('ncm-cbs-ibs-2026.json')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        versao: '2026.1',
        ano: 2026,
        aliquotaPadrao: { cbs: 9.65, ibs: 9.65 },
        categorias: [
          { ncmPrefix: '0000', descricao: 'Alíquota Zero', cbs: 0, ibs: 0, tipo: 'zero', cashback: 0 },
          { ncmPrefix: '0001', descricao: 'Cesta Básica Zero', cbs: 0, ibs: 0, tipo: 'zero', cashback: 100 },
          { ncmPrefix: '0201', descricao: 'Carnes Bovinas', cbs: 3.86, ibs: 3.86, tipo: 'reduzida', cashback: 100 },
          { ncmPrefix: '0401', descricao: 'Leite', cbs: 3.86, ibs: 3.86, tipo: 'reduzida', cashback: 100 },
          { ncmPrefix: '2710', descricao: 'Combustíveis', cbs: 9.65, ibs: 9.65, tipo: 'padrao', cashback: 0 },
          { ncmPrefix: '8471', descricao: 'Informática', cbs: 9.65, ibs: 9.65, tipo: 'padrao', cashback: 0 },
          { ncmPrefix: '2208', descricao: 'Destilados', cbs: 9.65, ibs: 9.65, tipo: 'padrao', cashback: 0 },
          { ncmPrefix: '2204', descricao: 'Vinhos', cbs: 9.65, ibs: 9.65, tipo: 'padrao', cashback: 0 },
          { ncmPrefix: '2203', descricao: 'Cervejas', cbs: 9.65, ibs: 9.65, tipo: 'padrao', cashback: 0 },
          { ncmPrefix: '2202', descricao: 'Refrigerantes', cbs: 9.65, ibs: 9.65, tipo: 'padrao', cashback: 0 },
          { ncmPrefix: '2402', descricao: 'Cigarros', cbs: 9.65, ibs: 9.65, tipo: 'padrao', cashback: 0 },
          { ncmPrefix: '8408', descricao: 'Motores', cbs: 9.65, ibs: 9.65, tipo: 'padrao', cashback: 0 },
          { ncmPrefix: '8703', descricao: 'Veículos', cbs: 9.65, ibs: 9.65, tipo: 'padrao', cashback: 0 },
          { ncmPrefix: 'DEFAULT', descricao: 'Padrão', cbs: 9.65, ibs: 9.65, tipo: 'padrao', cashback: 0 },
        ],
      }),
    });
  }

  if (url.includes('ncm-imposto-seletivo.json')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        versao: '2026.1',
        itens: [
          { ncmPrefix: '2402', descricao: 'Cigarros', aliquotaAdValorem: 15, aliquotaEspecifica: 150, unidade: 'MILHEIRO', tipo: 'fumo' },
          { ncmPrefix: '2208', descricao: 'Destilados', aliquotaAdValorem: 15, aliquotaEspecifica: 3.0, unidade: 'LITRO', tipo: 'bebida_alcoolica' },
          { ncmPrefix: '2204', descricao: 'Vinhos', aliquotaAdValorem: 8, aliquotaEspecifica: 1.0, unidade: 'LITRO', tipo: 'bebida_alcoolica' },
          { ncmPrefix: '2203', descricao: 'Cervejas', aliquotaAdValorem: 5, aliquotaEspecifica: 0.5, unidade: 'LITRO', tipo: 'bebida_alcoolica' },
          { ncmPrefix: '2202', descricao: 'Bebidas açucaradas', aliquotaAdValorem: 5, aliquotaEspecifica: 0.1, unidade: 'LITRO', tipo: 'bebida_acucarada' },
          { ncmPrefix: '8703', descricao: 'Veículos', aliquotaAdValorem: 10, aliquotaEspecifica: 0, unidade: null, tipo: 'veiculo' },
          { ncmPrefix: '9302', descricao: 'Revólveres', aliquotaAdValorem: 20, aliquotaEspecifica: 0, unidade: null, tipo: 'arma' },
          { ncmPrefix: '2710', descricao: 'Petróleo', aliquotaAdValorem: 5, aliquotaEspecifica: 0.1, unidade: 'LITRO', tipo: 'petroleo' },
        ],
      }),
    });
  }

  if (url.includes('ncm-cashback.json')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        cashback: {
          '01': 100, '02': 100, '03': 100, '04': 100, '07': 100,
          '08': 100, '09': 100, '10': 100, '11': 100, '15': 100,
          '16': 100, '17': 100, '30': 50, '90': 50, '48': 100,
          '49': 100, '95': 100,
        },
      }),
    });
  }

  if (url.includes('cfop.json')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        cfops: [],
      }),
    });
  }

  if (url.includes('creditos.json')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        creditos: [
          { ncmPrefix: '2710', geraCreditoCBS: true, geraCreditoIBS: true, percentualCreditoCBS: 9.65, percentualCreditoIBS: 9.65, tipoOperacao: 'entrada' },
          { ncmPrefix: '8471', geraCreditoCBS: true, geraCreditoIBS: true, percentualCreditoCBS: 9.65, percentualCreditoIBS: 9.65, tipoOperacao: 'entrada' },
          { ncmPrefix: '2202', geraCreditoCBS: false, geraCreditoIBS: false, percentualCreditoCBS: 0, percentualCreditoIBS: 0, tipoOperacao: 'entrada' },
          { tipoOperacao: 'entrada', geraCreditoCBS: true, geraCreditoIBS: true, percentualCreditoCBS: 4.825, percentualCreditoIBS: 4.825 },
        ],
      }),
    });
  }

  if (url.includes('ibs-uf.json')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        ufs: [],
      }),
    });
  }

  if (url.includes('transicao.json')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        cenarios: [],
      }),
    });
  }

  return Promise.resolve({ ok: false, status: 404 });
});

// Mock console.warn/error para não poluir output dos testes
const originalWarn = console.warn;
const originalError = console.error;

beforeAll(() => {
  console.warn = vi.fn();
  console.error = vi.fn();
});

afterAll(() => {
  console.warn = originalWarn;
  console.error = originalError;
});

// Polyfill para fetch em testes
if (!global.fetch) {
  global.fetch = vi.fn();
}