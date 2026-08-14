// Catalog Loader - C04: Carregamento de catálogos externalizados
// Carrega catálogos NCM, Imposto Seletivo, Cashback, CFOP, Créditos

import type {
  NCMConfig,
  ImpostoSeletivoConfig,
  CFOPConfig,
  CreditoConfig,
  AliquotasAno,
} from '../types';

export interface CatalogosCarregados {
  ncms: Map<string, NCMConfig>;
  impostoSeletivo: Map<string, ImpostoSeletivoConfig>;
  cashback: Map<string, number>;
  cfops: Map<string, CFOPConfig>;
  creditos: Map<string, any>;
  aliquotasAno: Map<number, any>;
  versoes: Map<string, string>;
  dataCarregamento: Date;
}

class CatalogLoader {
  private cache: CatalogosCarregados | null = null;
  private promiseCarregamento: Promise<CatalogosCarregados> | null = null;
  private basePath = '/catalogos';

  /**
   * Carrega todos os catálogos para um ano específico
   */
  async carregarCatalogos(ano: number = 2026): Promise<CatalogosCarregados> {
    if (this.cache && this.cache.versoes.get('ano') === ano.toString()) {
      return this.cache;
    }

    if (this.promiseCarregamento) {
      return this.promiseCarregamento;
    }

    this.promiseCarregamento = this.carregarTodosCatalogos(ano);
    const resultado = await this.promiseCarregamento;
    this.promiseCarregamento = null;
    return resultado;
  }

  private async carregarTodosCatalogos(ano: number): Promise<CatalogosCarregados> {
    const anoStr = ano.toString();
    const pastaAno = `${this.basePath}/${anoStr}`;

    try {
      const [
        ncmsRes,
        seletivoRes,
        cashbackRes,
        cfopsRes,
        creditosRes,
        aliquotasRes,
      ] = await Promise.allSettled([
        fetch(`${this.basePath}/${anoStr}/ncm-cbs-ibs-${anoStr}.json`),
        fetch(`${this.basePath}/${anoStr}/ncm-imposto-seletivo.json`),
        fetch(`${this.basePath}/${anoStr}/ncm-cashback.json`),
        fetch(`${this.basePath}/${anoStr}/cfop.json`),
        fetch(`${this.basePath}/${anoStr}/creditos.json`),
        fetch(`${this.basePath}/${anoStr}/aliquotas-ano.json`),
      ]);

      const ncmsData = ncmsRes.status === 'fulfilled' && ncmsRes.value.ok 
        ? await ncmsRes.value.json() 
        : { categorias: [] };
      const seletivoData = seletivoRes.status === 'fulfilled' && seletivoRes.value.ok
        ? await seletivoRes.value.json()
        : { itens: [] };
      const cashbackData = cashbackRes.status === 'fulfilled' && cashbackRes.value.ok
        ? await cashbackRes.value.json()
        : { cashback: {} };
      const cfopsData = cfopsRes.status === 'fulfilled' && cfopsRes.value.ok
        ? await cfopsRes.value.json()
        : { cfops: [] };
      const creditosData = creditosRes.status === 'fulfilled' && creditosRes.value.ok
        ? await creditosRes.value.json()
        : { creditos: [] };
      const aliquotasData = aliquotasRes.status === 'fulfilled' && aliquotasRes.value.ok
        ? await aliquotasRes.value.json()
        : { anos: {} };

      const ncmsMap = new Map<string, any>();
      for (const cat of ncmsData.categorias || []) {
        ncmsMap.set(cat.ncmPrefix, cat);
      }

      const seletivoMap = new Map<string, any>();
      for (const item of seletivoData.itens || []) {
        seletivoMap.set(item.ncmPrefix, item);
      }

      const cashbackMap = new Map<string, number>();
      for (const [prefixo, valor] of Object.entries(cashbackData.cashback || {})) {
        cashbackMap.set(prefixo, valor as number);
      }

      const cfopsMap = new Map<string, any>();
      for (const cfop of cfopsData.cfops || []) {
        cfopsMap.set(cfop.cfop, cfop);
      }

      const creditosMap = new Map<string, any>();
      for (const credito of creditosData.creditos || []) {
        const key = `${credito.ncmPrefix || 'DEFAULT'}_${credito.cfop || 'DEFAULT'}_${credito.tipoOperacao || 'DEFAULT'}`;
        creditosMap.set(key, credito);
      }

      const aliquotasMap = new Map<number, any>();
      for (const [anoKey, dados] of Object.entries(aliquotasData.anos || {})) {
        aliquotasMap.set(parseInt(anoKey), dados);
      }

      const versoes = new Map<string, string>();
      versoes.set('ano', ncmsData.ano?.toString() || '2026');
      versoes.set('versaoNCM', ncmsData.versao || '1.0');
      versoes.set('versaoSeletivo', seletivoData.versao || '1.0');
      versoes.set('versaoCashback', cashbackData.versao || '1.0');
      versoes.set('versaoCFOP', cfopsData.versao || '1.0');
      versoes.set('versaoCreditos', creditosData.versao || '1.0');
      versoes.set('versaoAliquotas', aliquotasData.versao || '1.0');

      const resultado: CatalogosCarregados = {
        ncms: ncmsMap,
        impostoSeletivo: seletivoMap,
        cashback: cashbackMap,
        cfops: cfopsMap,
        creditos: creditosMap,
        aliquotasAno: aliquotasMap,
        versoes,
        dataCarregamento: new Date(),
      };

      return resultado;
    } catch (err) {
      console.error('Erro ao carregar catálogos:', err);
      return this.getFallbackCatalogos();
    }
  }

  private getFallbackCatalogos(): CatalogosCarregados {
    return {
      ncms: new Map([
        ['0000', { ncmPrefix: '0000', cbs: 0, ibs: 0, ibsEstadual: 0, ibsMunicipal: 0, descricao: 'Alíquota Zero', tipo: 'zero', cashback: 0 }],
        ['0001', { ncmPrefix: '0001', cbs: 0, ibs: 0, ibsEstadual: 0, ibsMunicipal: 0, descricao: 'Cesta Básica Zero', tipo: 'zero', cashback: 100 }],
        ['DEFAULT', { ncmPrefix: 'DEFAULT', cbs: 9.65, ibs: 9.65, ibsEstadual: 4.825, ibsMunicipal: 4.825, descricao: 'Padrão', tipo: 'padrao', cashback: 0 }],
      ]),
      impostoSeletivo: new Map(),
      cashback: new Map([
        ['01', 100], ['02', 100], ['03', 100], ['04', 100], ['07', 100],
        ['08', 100], ['09', 100], ['10', 100], ['11', 100], ['15', 100],
        ['16', 100], ['17', 100], ['30', 50], ['90', 50], ['48', 100],
        ['49', 100], ['95', 100],
      ]),
      cfops: new Map(),
      creditos: new Map(),
      aliquotasAno: new Map(),
      versoes: new Map([['ano', '2026'], ['versao', 'fallback']]),
      dataCarregamento: new Date(),
    };
  }

  /**
   * Busca configuração NCM por prefixo (4 dígitos)
   */
  buscarNCM(catalogos: CatalogosCarregados, ncm: string): any {
    const prefixo = ncm.replace(/\D/g, '').substring(0, 4);
    
    // Busca exata
    if (catalogos.ncms.has(prefixo)) {
      return { ...catalogos.ncms.get(prefixo), ncmEncontrado: true, tipoBusca: 'exato' };
    }

    // Busca por capítulo (2 dígitos)
    const capitulo = prefixo.substring(0, 2);
    const porCapitulo = Array.from(catalogos.ncms.entries()).find(
      ([key]) => key.startsWith(capitulo) && key.length === 2
    );
    if (porCapitulo) {
      return { ...porCapitulo[1], ncmEncontrado: true, tipoBusca: 'capitulo', prefixoBuscado: prefixo, prefixoEncontrado: porCapitulo[0] };
    }

    // Fallback
    const fallback = catalogos.ncms.get('DEFAULT') || { cbs: 9.65, ibs: 9.65, ibsEstadual: 4.825, ibsMunicipal: 4.825, descricao: 'Padrão (fallback)', tipo: 'padrao', cashback: 0 };
    return { ...fallback, ncmEncontrado: false, tipoBusca: 'fallback', prefixoBuscado: prefixo };
  }

  /**
   * Busca Imposto Seletivo por NCM
   */
  buscarImpostoSeletivo(catalogos: CatalogosCarregados, ncm: string): any | null {
    const prefixo = ncm.replace(/\D/g, '').substring(0, 4);
    
    if (catalogos.impostoSeletivo.has(prefixo)) {
      return { ...catalogos.impostoSeletivo.get(prefixo), encontrado: true, tipoBusca: 'exato' };
    }

    const capitulo = prefixo.substring(0, 2);
    const porCapitulo = Array.from(catalogos.impostoSeletivo.entries()).find(
      ([key]) => key.startsWith(capitulo) && key.length === 2
    );
    if (porCapitulo) {
      return { ...porCapitulo[1], encontrado: true, tipoBusca: 'capitulo', prefixoEncontrado: porCapitulo[0] };
    }

    return null;
  }

  /**
   * Busca CFOP
   */
  buscarCFOP(catalogos: CatalogosCarregados, cfop: string): any | null {
    if (catalogos.cfops.has(cfop)) {
      return { ...catalogos.cfops.get(cfop), encontrado: true };
    }
    return null;
  }

  /**
   * Busca Cashback por capítulo NCM
   */
  buscarCashback(catalogos: CatalogosCarregados, ncm: string): number {
    const prefixo = ncm.replace(/\D/g, '').substring(0, 2);
    return catalogos.cashback.get(prefixo) || 0;
  }

  /**
   * Busca parâmetros do ano
   */
  getAliquotasAno(catalogos: CatalogosCarregados, ano: number): any {
    return catalogos.aliquotasAno.get(ano) || catalogos.aliquotasAno.get(2026) || {};
  }

  /**
   * Invalida cache (força recarregamento)
   */
  invalidarCache(): void {
    this.cache = null;
    this.promiseCarregamento = null;
  }
}

/**
 * Busca Imposto Seletivo por NCM nos catálogos carregados
 */
export function buscarImpostoSeletivo(
  catalogos: CatalogosCarregados,
  ncm: string
): any | null {
  const prefixo = ncm.replace(/\D/g, '').substring(0, 4);
  
  if (catalogos.impostoSeletivo.has(prefixo)) {
    return { ...catalogos.impostoSeletivo.get(prefixo), encontrado: true, tipoBusca: 'exato' };
  }

  const capitulo = prefixo.substring(0, 2);
  const porCapitulo = Array.from(catalogos.impostoSeletivo.entries()).find(
    ([key]) => key.startsWith(capitulo) && key.length === 2
  );
  if (porCapitulo) {
    return { ...porCapitulo[1], encontrado: true, tipoBusca: 'capitulo', prefixoEncontrado: porCapitulo[0] };
  }

  return null;
}

/**
 * Calcula Imposto Seletivo para um item
 */
export function calcularImpostoSeletivo(
  item: { valorTotal: number; quantidade: number; unidade: string; ncm: string },
  catalogoSeletivo: any[]
): { valor: number; detalhe: string } | null {
  const regra = buscarImpostoSeletivo(
    { ncms: new Map(), impostoSeletivo: new Map(catalogoSeletivo.map(c => [c.ncmPrefix, c])), cashback: new Map(), cfops: new Map(), creditos: new Map(), aliquotasAno: new Map(), versoes: new Map(), dataCarregamento: new Date() } as CatalogosCarregados,
    item.ncm
  );
  if (!regra) return null;

  let valor = 0;
  const detalhes: string[] = [];

  if (regra.aliquotaAdValorem && regra.aliquotaAdValorem > 0) {
    const v = (item.valorTotal * regra.aliquotaAdValorem) / 100;
    valor += v;
    detalhes.push(`Ad valorem ${regra.aliquotaAdValorem}%: ${v.toFixed(2)}`);
  }

  if (regra.aliquotaEspecifica && regra.aliquotaEspecifica > 0) {
    const qtd = item.quantidade || 0;
    const v = qtd * regra.aliquotaEspecifica;
    valor += v;
    detalhes.push(`Específica ${regra.aliquotaEspecifica}/${regra.unidade}: ${v.toFixed(2)}`);
  }

  return valor > 0 ? { valor, detalhe: detalhes.join(' + ') } : null;
}

/**
 * Busca configuração NCM por prefixo (4 dígitos)
 */
export function buscarNCM(catalogos: CatalogosCarregados, ncm: string): any {
  const prefixo = ncm.replace(/\D/g, '').substring(0, 4);
  
  // Busca exata
  if (catalogos.ncms.has(prefixo)) {
    return { ...catalogos.ncms.get(prefixo), ncmEncontrado: true, tipoBusca: 'exato' };
  }

  // Busca por capítulo (2 dígitos)
  const capitulo = prefixo.substring(0, 2);
  const porCapitulo = Array.from(catalogos.ncms.entries()).find(
    ([key]) => key.startsWith(capitulo) && key.length === 2
  );
  if (porCapitulo) {
    return { ...porCapitulo[1], ncmEncontrado: true, tipoBusca: 'capitulo', prefixoBuscado: prefixo, prefixoEncontrado: porCapitulo[0] };
  }

  // Fallback
  const fallback = catalogos.ncms.get('DEFAULT') || { cbs: 9.65, ibs: 9.65, ibsEstadual: 4.825, ibsMunicipal: 4.825, descricao: 'Padrão (fallback)', tipo: 'padrao', cashback: 0 };
  return { ...fallback, ncmEncontrado: false, tipoBusca: 'fallback', prefixoBuscado: prefixo };
}

/**
 * Busca Cashback por capítulo NCM
 */
export function buscarCashback(catalogos: CatalogosCarregados, ncm: string): number {
  const prefixo = ncm.replace(/\D/g, '').substring(0, 2);
  return catalogos.cashback.get(prefixo) || 0;
}

/**
 * Busca CFOP
 */
export function buscarCFOP(catalogos: CatalogosCarregados, cfop: string): any | null {
  if (catalogos.cfops.has(cfop)) {
    return { ...catalogos.cfops.get(cfop), encontrado: true };
  }
  return null;
}

/**
 * Busca parâmetros do ano
 */
export function getAliquotasAno(catalogos: CatalogosCarregados, ano: number): any {
  return catalogos.aliquotasAno.get(ano) || catalogos.aliquotasAno.get(2026) || {};
}

// Singleton
export const catalogLoader = new CatalogLoader();
export { CatalogLoader };

// Função helper para uso direto
export async function carregarCatalogos(ano: number = 2026) {
  return catalogLoader.carregarCatalogos(ano);
}

export default catalogLoader;