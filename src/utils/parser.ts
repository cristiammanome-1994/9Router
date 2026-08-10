import { XMLParser } from 'fast-xml-parser';
import type { NFeData, NFeItem, ParseResult } from '../types';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name) => name === 'det' || name === 'DI' || name === 'adi',
});

function get(obj: unknown, ...paths: (string | number)[][]): unknown {
  for (const path of paths) {
    let current: unknown = obj;
    let found = true;
    for (const key of path) {
      if (current && typeof current === 'object' && key in (current as Record<string, unknown>)) {
        current = (current as Record<string, unknown>)[key];
      } else {
        found = false;
        break;
      }
    }
    if (found && current !== undefined && current !== '') return current;
  }
  return undefined;
}

function num(value: unknown): number {
  if (value === undefined || value === null || value === '') return 0;
  const n = parseFloat(String(value).replace(',', '.'));
  return isNaN(n) ? 0 : n;
}

function str(value: unknown): string {
  if (value === undefined || value === null) return '';
  return String(value);
}

// Categorias tributárias segundo a Reforma Tributária (Lei 14.988/2024)
interface CategoriaConfig {
  cbs: number; // alíquota CBS (%)
  ibs: number; // alíquota IBS (%)
  descricao: string;
  isReduzida?: boolean; // Anexo II - redução 60%
  isZero?: boolean; // Anexo I - alíquota zero
  isSeletivo?: boolean; // Anexo IV - Imposto Seletivo (tratado separadamente)
}

function getCategoriaTributaria(ncm: string): CategoriaConfig {
  const n = ncm.replace(/\D/g, '').substring(0, 4);

  // Alíquotas conforme Lei 14.988/2024:
  // - Padrão: CBS 9.65% + IBS 9.65% = 19.3%
  // - Reduzida (Anexo II, red. 60%): CBS 3.86% + IBS 3.86% = 7.72%
  // - Zero (Anexo I): 0%
  // - Seletivo (Anexo IV): tratado em módulo separado

  const ALIQ_PADRAO_CBS = 9.65;
  const ALIQ_PADRAO_IBS = 9.65;
  const ALIQ_REDUZIDA_CBS = 3.86; // 9.65 * 0.4
  const ALIQ_REDUZIDA_IBS = 3.86; // 9.65 * 0.4
  const ALIQ_ZERO = 0;

  // Tabela simplificada - categorias com alíquotas específicas
  const categorias: Record<string, CategoriaConfig> = {
    // Alíquota zero - item 1 do Anexo I da Lei 14.988/2024
    '0000': { cbs: ALIQ_ZERO, ibs: ALIQ_ZERO, descricao: 'Alíquota Zero (Anexo I)', isZero: true },
    // Cesta básica - alíquota zero (item 2 do Anexo I)
    '0001': { cbs: ALIQ_ZERO, ibs: ALIQ_ZERO, descricao: 'Cesta Básica (Alíquota Zero - Anexo I)', isZero: true },
    // Carnes frescas - REDUZIDA 60% (Anexo II)
    '0101': { cbs: ALIQ_REDUZIDA_CBS, ibs: ALIQ_REDUZIDA_IBS, descricao: 'Carnes Frescas (Red. 60%)', isReduzida: true },
    '0201': { cbs: ALIQ_REDUZIDA_CBS, ibs: ALIQ_REDUZIDA_IBS, descricao: 'Carnes Frescas (Red. 60%)', isReduzida: true },
    '0202': { cbs: ALIQ_REDUZIDA_CBS, ibs: ALIQ_REDUZIDA_IBS, descricao: 'Carnes Frescas (Red. 60%)', isReduzida: true },
    '0203': { cbs: ALIQ_REDUZIDA_CBS, ibs: ALIQ_REDUZIDA_IBS, descricao: 'Carnes Frescas (Red. 60%)', isReduzida: true },
    // Leite e laticínios - REDUZIDA 60% (Anexo II)
    '0401': { cbs: ALIQ_REDUZIDA_CBS, ibs: ALIQ_REDUZIDA_IBS, descricao: 'Leite e Laticínios (Red. 60%)', isReduzida: true },
    '0402': { cbs: ALIQ_REDUZIDA_CBS, ibs: ALIQ_REDUZIDA_IBS, descricao: 'Leite e Laticínios (Red. 60%)', isReduzida: true },
    '0403': { cbs: ALIQ_REDUZIDA_CBS, ibs: ALIQ_REDUZIDA_IBS, descricao: 'Leite e Laticínios (Red. 60%)', isReduzida: true },
    '0406': { cbs: ALIQ_REDUZIDA_CBS, ibs: ALIQ_REDUZIDA_IBS, descricao: 'Queijos (Red. 60%)', isReduzida: true },
    // Hortifruti - REDUZIDA 60% (Anexo II)
    '0701': { cbs: ALIQ_REDUZIDA_CBS, ibs: ALIQ_REDUZIDA_IBS, descricao: 'Batatas (Red. 60%)', isReduzida: true },
    '0702': { cbs: ALIQ_REDUZIDA_CBS, ibs: ALIQ_REDUZIDA_IBS, descricao: 'Tomates (Red. 60%)', isReduzida: true },
    '0703': { cbs: ALIQ_REDUZIDA_CBS, ibs: ALIQ_REDUZIDA_IBS, descricao: 'Cebolas/Alhos (Red. 60%)', isReduzida: true },
    '0712': { cbs: ALIQ_REDUZIDA_CBS, ibs: ALIQ_REDUZIDA_IBS, descricao: 'Hortícolas Secos (Red. 60%)', isReduzida: true },
    '0808': { cbs: ALIQ_REDUZIDA_CBS, ibs: ALIQ_REDUZIDA_IBS, descricao: 'Maçãs/Pêras (Red. 60%)', isReduzida: true },
    // Farinhas - REDUZIDA 60% (Anexo II)
    '1101': { cbs: ALIQ_REDUZIDA_CBS, ibs: ALIQ_REDUZIDA_IBS, descricao: 'Farinha de Trigo (Red. 60%)', isReduzida: true },
    '1102': { cbs: ALIQ_REDUZIDA_CBS, ibs: ALIQ_REDUZIDA_IBS, descricao: 'Outras Farinhas (Red. 60%)', isReduzida: true },
    '1901': { cbs: ALIQ_REDUZIDA_CBS, ibs: ALIQ_REDUZIDA_IBS, descricao: 'Prep. de Cereais (Red. 60%)', isReduzida: true },
    // Medicamentos - REDUZIDA 60% (Anexo II)
    '3001': { cbs: ALIQ_REDUZIDA_CBS, ibs: ALIQ_REDUZIDA_IBS, descricao: 'Medicamentos (Red. 60%)', isReduzida: true },
    '3002': { cbs: ALIQ_REDUZIDA_CBS, ibs: ALIQ_REDUZIDA_IBS, descricao: 'Sangue/Vacinas (Red. 60%)', isReduzida: true },
    '3003': { cbs: ALIQ_REDUZIDA_CBS, ibs: ALIQ_REDUZIDA_IBS, descricao: 'Medicamentos (Red. 60%)', isReduzida: true },
    '3004': { cbs: ALIQ_REDUZIDA_CBS, ibs: ALIQ_REDUZIDA_IBS, descricao: 'Medicamentos (Red. 60%)', isReduzida: true },
    '3005': { cbs: ALIQ_REDUZIDA_CBS, ibs: ALIQ_REDUZIDA_IBS, descricao: 'Curativos (Red. 60%)', isReduzida: true },
    '3006': { cbs: ALIQ_REDUZIDA_CBS, ibs: ALIQ_REDUZIDA_IBS, descricao: 'Farm. Diversos (Red. 60%)', isReduzida: true },
    // Produtos industrializados (alíquota padrão)
    '8408': { cbs: ALIQ_PADRAO_CBS, ibs: ALIQ_PADRAO_IBS, descricao: 'Motores Diesel' },
    '8703': { cbs: ALIQ_PADRAO_CBS, ibs: ALIQ_PADRAO_IBS, descricao: 'Veículos Automóveis' },
    '8708': { cbs: ALIQ_PADRAO_CBS, ibs: ALIQ_PADRAO_IBS, descricao: 'Partes de Veículos' },
    // Eletrônicos
    '8471': { cbs: ALIQ_PADRAO_CBS, ibs: ALIQ_PADRAO_IBS, descricao: 'Equip. Informática' },
    '8517': { cbs: ALIQ_PADRAO_CBS, ibs: ALIQ_PADRAO_IBS, descricao: 'Telefones/Comunicação' },
    '8528': { cbs: ALIQ_PADRAO_CBS, ibs: ALIQ_PADRAO_IBS, descricao: 'Monitores/TV' },
    // Bebidas - Água/Refrigerante/Cerveja = PADRÃO
    '2201': { cbs: ALIQ_PADRAO_CBS, ibs: ALIQ_PADRAO_IBS, descricao: 'Águas' },
    '2202': { cbs: ALIQ_PADRAO_CBS, ibs: ALIQ_PADRAO_IBS, descricao: 'Refrigerantes/Sucos' },
    '2203': { cbs: ALIQ_PADRAO_CBS, ibs: ALIQ_PADRAO_IBS, descricao: 'Cervejas' },
    // Vinhos e Destilados = PADRÃO (Imposto Seletivo é tratado em módulo separado)
    '2204': { cbs: ALIQ_PADRAO_CBS, ibs: ALIQ_PADRAO_IBS, descricao: 'Vinhos (IS separado)' },
    '2208': { cbs: ALIQ_PADRAO_CBS, ibs: ALIQ_PADRAO_IBS, descricao: 'Destilados (IS separado)' },
    // Combustíveis
    '2710': { cbs: ALIQ_PADRAO_CBS, ibs: ALIQ_PADRAO_IBS, descricao: 'Combustíveis Líquidos' },
    '2711': { cbs: ALIQ_PADRAO_CBS, ibs: ALIQ_PADRAO_IBS, descricao: 'Gás Natural/GLP' },
    // Roupas e têxteis
    '6109': { cbs: ALIQ_PADRAO_CBS, ibs: ALIQ_PADRAO_IBS, descricao: 'Camisetas (Malha)' },
    '6201': { cbs: ALIQ_PADRAO_CBS, ibs: ALIQ_PADRAO_IBS, descricao: 'Sobretudos (Tecido)' },
    '6203': { cbs: ALIQ_PADRAO_CBS, ibs: ALIQ_PADRAO_IBS, descricao: 'Ternos (Tecido)' },
    '6204': { cbs: ALIQ_PADRAO_CBS, ibs: ALIQ_PADRAO_IBS, descricao: 'Tailleurs (Tecido)' },
  };

  if (categorias[n]) return categorias[n];

  // Alíquota padrão (CBS 9.65% + IBS 9.65% = 19.3% total)
  return { cbs: ALIQ_PADRAO_CBS, ibs: ALIQ_PADRAO_IBS, descricao: 'Alíquota Padrão' };
}

// Configuração de cashback (item 4 do Anexo I da Lei 14.988/2024)
function getCashback(ncm: string): number {
  const n = ncm.replace(/\D/g, '').substring(0, 2);
  // Alimentos da cesta básica - cashback 100%
  const cestaBasica = ['01', '02', '03', '04', '07', '08', '09', '10', '11', '15', '16', '17'];
  if (cestaBasica.includes(n)) return 100;
  // Saúde e medicamentos - cashback parcial
  const saude = ['30', '90'];
  if (saude.includes(n)) return 50;
  // Educação e livros
  const educacao = ['48', '49', '95'];
  if (educacao.includes(n)) return 100;
  return 0;
}

function extractItem(det: unknown): NFeItem {
  const prod = get(det, ['prod']) as Record<string, unknown> | undefined;
  const imposto = get(det, ['imposto']) as Record<string, unknown> | undefined;
  const icms = imposto ? get(imposto, ['ICMS']) as Record<string, unknown> | undefined : undefined;
  const icmsTipo = icms ? (Object.values(icms)[0] as Record<string, unknown>) : undefined;
  const ipi = imposto ? get(imposto, ['IPI']) as Record<string, unknown> | undefined : undefined;
  const pis = imposto ? get(imposto, ['PIS']) as Record<string, unknown> | undefined : undefined;
  const cofins = imposto ? get(imposto, ['COFINS']) as Record<string, unknown> | undefined : undefined;
  const pisTipo = pis ? (Object.values(pis)[0] as Record<string, unknown>) : undefined;
  const cofinsTipo = cofins ? (Object.values(cofins)[0] as Record<string, unknown>) : undefined;

  const numero = str(get(det, ['@_nItem']) || get(det, ['nItem']));
  const ncm = str(get(prod, ['NCM']));
  const valorProd = num(get(prod, ['vProd']));
  const valorFrete = num(get(prod, ['vFrete']));
  const valorSeguro = num(get(prod, ['vSeg']));
  const valorOutros = num(get(prod, ['vOutro']));
  const valorII = num(get(prod, ['vII'])); // Imposto de Importação
  const valorIPI = num(get(prod, ['vIPI'])); // IPI (já incluso em vIPI do grupo IPI)
  const valorDesconto = num(get(prod, ['vDesc']));
  const valorDescCond = num(get(prod, ['vDescCond'])); // Desconto condicionado

  // Impostos atuais
  const icmsBase = num(get(icmsTipo, ['vBC']));
  const icmsAliquota = num(get(icmsTipo, ['pICMS']));
  const icmsValor = num(get(icmsTipo, ['vICMS']));
  const ipiAliquota = num(get(ipi, ['IPITrib', 'pIPI']) || get(ipi, ['pIPI']));
  const ipiValor = num(get(ipi, ['IPITrib', 'vIPI']) || get(ipi, ['vIPI']));
  const pisAliquota = num(get(pisTipo, ['pPIS']));
  const pisValor = num(get(pisTipo, ['vPIS']));
  const cofinsAliquota = num(get(cofinsTipo, ['pCOFINS']));
  const cofinsValor = num(get(cofinsTipo, ['vCOFINS']));

  // Calcular CBS + IBS (reforma tributária) - Base conforme Art. 13 Lei 14.988/2024
  // Base = vProd + vFrete + vSeg + vOutro + vII + vIPI - vDesc - vDescCond
  const categoria = getCategoriaTributaria(ncm);
  const baseCalculo = valorProd + valorFrete + valorSeguro + valorOutros + valorII + valorIPI - valorDesconto - valorDescCond;
  const baseCalculoPositiva = Math.max(0, baseCalculo);

  const cbsValor = (baseCalculoPositiva * categoria.cbs) / 100;
  const ibsValor = (baseCalculoPositiva * categoria.ibs) / 100;
  const cbsIbsTotal = cbsValor + ibsValor;

  // Imposto Seletivo (calculado separadamente, não incluso na base CBS/IBS)
  const isSeletivo = categoria.isSeletivo === true;

  // Carga tributária atual vs nova
  const cargaTributariaAtual = icmsValor + ipiValor + pisValor + cofinsValor;
  const cargaTributariaNova = cbsIbsTotal;
  const diferencialCarga = cargaTributariaNova - cargaTributariaAtual;

  // Cashback: apenas informativo (NÃO reduz base de cálculo do emitente)
  // Cashback é devolução ao consumidor final (B2C), não crédito do emitente
  const cashbackPct = getCashback(ncm);
  const descricaoCategoria = cashbackPct > 0
    ? `${categoria.descricao} | Cashback consumidor: ${cashbackPct}% (não reduz base emitente)`
    : categoria.descricao;

  return {
    numero,
    codigo: str(get(prod, ['cProd'])),
    descricao: str(get(prod, ['xProd'])),
    ncm,
    cfop: str(get(prod, ['CFOP'])),
    quantidade: num(get(prod, ['qCom']) || get(prod, ['qTrib'])),
    unidade: str(get(prod, ['uCom']) || get(prod, ['uTrib'])),
    valorUnitario: num(get(prod, ['vUnCom']) || get(prod, ['vUnTrib'])),
    valorTotal: valorProd,
    desconto: valorDesconto,
    // Novos campos para base CBS/IBS
    valorFrete,
    valorSeguro,
    valorOutros,
    valorII,
    valorIPI,
    valorDescCond,
    baseCalculoCBSIBS: baseCalculoPositiva,
    // Impostos atuais
    icmsBase,
    icmsAliquota,
    icmsValor,
    ipiAliquota,
    ipiValor,
    pisAliquota,
    pisValor,
    cofinsAliquota,
    cofinsValor,
    // Reforma tributária
    cbsAliquota: categoria.cbs,
    cbsValor,
    ibsAliquota: categoria.ibs,
    ibsValor,
    cbsIbsTotal,
    isSeletivo,
    cargaTributariaAtual,
    cargaTributariaNova,
    diferencialCarga,
    categoriaTributaria: descricaoCategoria,
  };
}

export function parseNFeXml(xmlContent: string, fileName?: string): ParseResult {
  try {
    const parsed = parser.parse(xmlContent);

    // Procurar nfeProc ou NFe em diferentes níveis
    const nfeProc = get(parsed, ['nfeProc']) || get(parsed, ['NFe']);
    if (!nfeProc) {
      return { success: false, error: 'NFe não encontrada no XML. Verifique o formato do arquivo.', fileName, rawXml: xmlContent };
    }

    const infNFe = get(nfeProc, ['NFe', 'infNFe']) || get(nfeProc, ['infNFe']) || get(parsed, ['NFe', 'infNFe']);
    if (!infNFe) {
      return { success: false, error: 'infNFe não encontrado no XML.', fileName, rawXml: xmlContent };
    }

    const ide = get(infNFe, ['ide']) as Record<string, unknown> | undefined;
    const emit = get(infNFe, ['emit']) as Record<string, unknown> | undefined;
    const dest = get(infNFe, ['dest']) as Record<string, unknown> | undefined;
    const detArray = get(infNFe, ['det']);
    const total = get(infNFe, ['total']) as Record<string, unknown> | undefined;
    void total;

    const chave = str(get(infNFe, ['@_Id'])).replace('NFe', '');

    // Processar itens
    let itens: NFeItem[] = [];
    if (Array.isArray(detArray)) {
      itens = detArray.map(extractItem);
    } else if (detArray) {
      itens = [extractItem(detArray)];
    }

    // Calcular totais
    const valorProdutos = itens.reduce((s, i) => s + i.valorTotal, 0);
    const valorDesconto = itens.reduce((s, i) => s + i.desconto, 0);
    const valorTotal = valorProdutos - valorDesconto;
    const icmsValor = itens.reduce((s, i) => s + (i.icmsValor || 0), 0);
    const icmsBase = itens.reduce((s, i) => s + (i.icmsBase || 0), 0);
    const ipiValor = itens.reduce((s, i) => s + (i.ipiValor || 0), 0);
    const pisValor = itens.reduce((s, i) => s + (i.pisValor || 0), 0);
    const cofinsValor = itens.reduce((s, i) => s + (i.cofinsValor || 0), 0);
    const cbsTotal = itens.reduce((s, i) => s + (i.cbsValor || 0), 0);
    const ibsTotal = itens.reduce((s, i) => s + (i.ibsValor || 0), 0);
    const cargaTributariaAtual = icmsValor + ipiValor + pisValor + cofinsValor;
    const cargaTributariaNova = cbsTotal + ibsTotal;
    const diferencialTotal = cargaTributariaNova - cargaTributariaAtual;

    const data: NFeData = {
      chave,
      numero: str(get(ide, ['nNF'])),
      serie: str(get(ide, ['serie'])),
      dataEmissao: str(get(ide, ['dhEmi'])),
      emitente: {
        nome: str(get(emit, ['xNome'])),
        cnpj: str(get(emit, ['CNPJ'])),
        inscricaoEstadual: str(get(emit, ['IE'])),
        uf: str(get(emit, ['enderEmit', 'UF'])),
        municipio: str(get(emit, ['enderEmit', 'xMun'])),
      },
      destinatario: {
        nome: str(get(dest, ['xNome'])),
        cnpj: str(get(dest, ['CNPJ'])),
        uf: str(get(dest, ['enderDest', 'UF'])),
        municipio: str(get(dest, ['enderDest', 'xMun'])),
      },
      itens,
      totais: {
        valorProdutos,
        valorDesconto,
        valorTotal,
        icmsBase,
        icmsValor,
        ipiValor,
        pisValor,
        cofinsValor,
        cargaTributariaAtual,
        cargaTributariaNova,
        cbsTotal,
        ibsTotal,
        diferencialTotal,
      },
    };

    return { success: true, data, rawXml: xmlContent, fileName };
  } catch (err) {
    return {
      success: false,
      error: `Erro ao analisar o XML: ${err instanceof Error ? err.message : String(err)}`,
      rawXml: xmlContent,
      fileName,
    };
  }
}
