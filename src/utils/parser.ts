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
}

function getCategoriaTributaria(ncm: string): CategoriaConfig {
  const n = ncm.replace(/\D/g, '').substring(0, 4);

  // Tabela simplificada - categorias com alíquotas específicas
  const categorias: Record<string, CategoriaConfig> = {
    // Alíquota zero - item 1 do Anexo I da Lei 14.988/2024
    '0000': { cbs: 0, ibs: 0, descricao: 'Alíquota Zero (Anexo I)' },
    // Cesta básica - redução (item 2 do Anexo I)
    '0001': { cbs: 0, ibs: 0, descricao: 'Cesta Básica de Alimentos (Redução)' },
    // Carnes frescas
    '0101': { cbs: 1.45, ibs: 1.45, descricao: 'Carnes Frescas' },
    '0201': { cbs: 1.45, ibs: 1.45, descricao: 'Carnes Frescas' },
    '0202': { cbs: 1.45, ibs: 1.45, descricao: 'Carnes Frescas' },
    '0203': { cbs: 1.45, ibs: 1.45, descricao: 'Carnes Frescas' },
    // Leite e laticínios
    '0401': { cbs: 1.45, ibs: 1.45, descricao: 'Leite e Laticínios' },
    '0402': { cbs: 1.45, ibs: 1.45, descricao: 'Leite e Laticínios' },
    '0403': { cbs: 1.45, ibs: 1.45, descricao: 'Leite e Laticínios' },
    '0406': { cbs: 1.45, ibs: 1.45, descricao: 'Leite e Laticínios' },
    // Hortifruti
    '0701': { cbs: 1.45, ibs: 1.45, descricao: 'Produtos Hortícolas' },
    '0702': { cbs: 1.45, ibs: 1.45, descricao: 'Produtos Hortícolas' },
    '0703': { cbs: 1.45, ibs: 1.45, descricao: 'Produtos Hortícolas' },
    '0712': { cbs: 1.45, ibs: 1.45, descricao: 'Produtos Hortícolas' },
    '0808': { cbs: 1.45, ibs: 1.45, descricao: 'Frutas Frescas' },
    // Farinhas
    '1101': { cbs: 1.45, ibs: 1.45, descricao: 'Farinhas e Cereais' },
    '1102': { cbs: 1.45, ibs: 1.45, descricao: 'Farinhas e Cereais' },
    '1901': { cbs: 1.45, ibs: 1.45, descricao: 'Farinhas e Cereais' },
    // Medicamentos e produtos farmacêuticos
    '3001': { cbs: 1.45, ibs: 1.45, descricao: 'Medicamentos' },
    '3002': { cbs: 1.45, ibs: 1.45, descricao: 'Medicamentos' },
    '3003': { cbs: 1.45, ibs: 1.45, descricao: 'Medicamentos' },
    '3004': { cbs: 1.45, ibs: 1.45, descricao: 'Medicamentos' },
    '3005': { cbs: 1.45, ibs: 1.45, descricao: 'Medicamentos' },
    '3006': { cbs: 1.45, ibs: 1.45, descricao: 'Medicamentos' },
    // Produtos industrializados (alíquota padrão)
    '8408': { cbs: 9.65, ibs: 9.65, descricao: 'Motores Industrializados' },
    '8703': { cbs: 9.65, ibs: 9.65, descricao: 'Veículos Automóveis' },
    '8708': { cbs: 9.65, ibs: 9.65, descricao: 'Partes de Veículos' },
    // Eletrônicos
    '8471': { cbs: 9.65, ibs: 9.65, descricao: 'Equipamentos Eletrônicos' },
    '8517': { cbs: 9.65, ibs: 9.65, descricao: 'Equipamentos Eletrônicos' },
    '8528': { cbs: 9.65, ibs: 9.65, descricao: 'Equipamentos Eletrônicos' },
    // Bebidas
    '2201': { cbs: 9.65, ibs: 9.65, descricao: 'Águas e Bebidas' },
    '2202': { cbs: 9.65, ibs: 9.65, descricao: 'Bebidas Não Alcoólicas' },
    '2203': { cbs: 9.65, ibs: 9.65, descricao: 'Cervejas' },
    '2204': { cbs: 19.3, ibs: 19.3, descricao: 'Vinhos' },
    '2208': { cbs: 19.3, ibs: 19.3, descricao: 'Bebidas Destiladas' },
    // Combustíveis
    '2710': { cbs: 9.65, ibs: 9.65, descricao: 'Combustíveis' },
    '2711': { cbs: 9.65, ibs: 9.65, descricao: 'Gás de Petróleo' },
    // Roupas e têxteis
    '6109': { cbs: 9.65, ibs: 9.65, descricao: 'Vestuário e Têxteis' },
    '6201': { cbs: 9.65, ibs: 9.65, descricao: 'Vestuário e Têxteis' },
    '6203': { cbs: 9.65, ibs: 9.65, descricao: 'Vestuário e Têxteis' },
    '6204': { cbs: 9.65, ibs: 9.65, descricao: 'Vestuário e Têxteis' },
  };

  if (categorias[n]) return categorias[n];

  // Alíquota padrão (CBS 9.65% + IBS 9.65% = 19.3% total)
  return { cbs: 9.65, ibs: 9.65, descricao: 'Alíquota Padrão' };
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
  const valorTotal = num(get(prod, ['vProd']));
  const valorDesconto = num(get(prod, ['vDesc']) || get(prod, ['vDesc']));

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

  // Calcular CBS + IBS (reforma tributária)
  const categoria = getCategoriaTributaria(ncm);
  const baseCalculo = valorTotal - valorDesconto;
  const cbsValor = (baseCalculo * categoria.cbs) / 100;
  const ibsValor = (baseCalculo * categoria.ibs) / 100;
  const cbsIbsTotal = cbsValor + ibsValor;

  // Carga tributária atual vs nova
  const cargaTributariaAtual = icmsValor + ipiValor + pisValor + cofinsValor;
  const cargaTributariaNova = cbsIbsTotal;
  const diferencialCarga = cargaTributariaNova - cargaTributariaAtual;

  const cashbackPct = getCashback(ncm);
  const descricaoCategoria = cashbackPct > 0
    ? `${categoria.descricao} (Cashback: ${cashbackPct}%)`
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
    valorTotal,
    desconto: valorDesconto,
    icmsBase,
    icmsAliquota,
    icmsValor,
    ipiAliquota,
    ipiValor,
    pisAliquota,
    pisValor,
    cofinsAliquota,
    cofinsValor,
    cbsAliquota: categoria.cbs,
    cbsValor,
    ibsAliquota: categoria.ibs,
    ibsValor,
    cbsIbsTotal,
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
