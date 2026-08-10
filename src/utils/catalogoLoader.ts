import type { AliquotaCustomizada } from '../types';

// Cache em memória
let catalogoCbsIbsCache: AliquotaCustomizada[] = [];
let catalogoSeletivoCache: any[] = [];
let cbsIbsLoaded = false;
let seletivoLoaded = false;

export async function carregarCatalogoCbsIbs(ano: number = 2026): Promise<AliquotaCustomizada[]> {
  if (cbsIbsLoaded) return catalogoCbsIbsCache;

  try {
    const response = await fetch(`/catalogos/ncm-cbs-ibs-${ano}.json`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    catalogoCbsIbsCache = data.categorias || [];
    cbsIbsLoaded = true;
    return catalogoCbsIbsCache;
  } catch (err) {
    console.warn('Falha ao carregar catálogo CBS/IBS, usando fallback:', err);
    return getFallbackCatalogo();
  }
}

export async function carregarCatalogoSeletivo(): Promise<any[]> {
  if (seletivoLoaded) return catalogoSeletivoCache;

  try {
    const response = await fetch('/catalogos/ncm-imposto-seletivo.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    catalogoSeletivoCache = data.itens || [];
    seletivoLoaded = true;
    return catalogoSeletivoCache;
  } catch (err) {
    console.warn('Falha ao carregar catálogo Imposto Seletivo:', err);
    return [];
  }
}

function getFallbackCatalogo(): AliquotaCustomizada[] {
  return [
    { ncmPrefix: '0000', descricao: 'Alíquota Zero', cbs: 0, ibs: 0, cashback: 0 },
    { ncmPrefix: '0001', descricao: 'Cesta Básica Zero', cbs: 0, ibs: 0, cashback: 100 },
    { ncmPrefix: 'DEFAULT', descricao: 'Padrão', cbs: 9.65, ibs: 9.65, cashback: 0 },
  ];
}

export function buscarAliquotaPorNcm(
  catalogo: AliquotaCustomizada[],
  ncm: string,
  padraoCbs: number = 9.65,
  padraoIbs: number = 9.65
): { cbs: number; ibs: number; cashback: number; descricao: string; tipo?: string } {
  const n = ncm.replace(/\D/g, '').substring(0, 4);

  // Busca exata por prefixo de 4 dígitos
  const exato = catalogo.find(c => c.ncmPrefix === n);
  if (exato) {
    return {
      cbs: exato.cbs,
      ibs: exato.ibs,
      cashback: exato.cashback || 0,
      descricao: exato.descricao,
      tipo: (exato as any).tipo
    };
  }

  // Busca por prefixo de 2 dígitos (capítulo)
  const capitulo = n.substring(0, 2);
  const porCapitulo = catalogo.find(c => c.ncmPrefix.startsWith(capitulo) && c.ncmPrefix.length === 2);
  if (porCapitulo) {
    return {
      cbs: porCapitulo.cbs,
      ibs: porCapitulo.ibs,
      cashback: porCapitulo.cashback || 0,
      descricao: porCapitulo.descricao + ' (capítulo)',
      tipo: (porCapitulo as any).tipo
    };
  }

  // Fallback padrão
  return {
    cbs: padraoCbs,
    ibs: padraoIbs,
    cashback: 0,
    descricao: 'Alíquota Padrão (fallback)',
    tipo: 'padrao'
  };
}

export function buscarImpostoSeletivo(
  catalogo: any[],
  ncm: string
): { aliquotaAdValorem: number; aliquotaEspecifica: number; unidade: string | null; descricao: string; tipo: string } | null {
  const n = ncm.replace(/\D/g, '').substring(0, 4);

  const exato = catalogo.find(c => c.ncmPrefix === n);
  if (exato) return exato;

  // Busca por capítulo
  const capitulo = n.substring(0, 2);
  const porCapitulo = catalogo.find(c => c.ncmPrefix.startsWith(capitulo) && c.ncmPrefix.length === 2);
  if (porCapitulo) return porCapitulo;

  return null;
}

export function calcularImpostoSeletivo(
  item: { valorTotal: number; quantidade: number; unidade: string; ncm: string },
  catalogoSeletivo: any[]
): { valor: number; detalhe: string } | null {
  const regra = buscarImpostoSeletivo(catalogoSeletivo, item.ncm);
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