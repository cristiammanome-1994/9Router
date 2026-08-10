export interface NFeItem {
  numero: string;
  codigo: string;
  descricao: string;
  ncm: string;
  cfop: string;
  quantidade: number;
  unidade: string;
  valorUnitario: number;
  valorTotal: number;
  desconto: number;
  // Impostos atuais
  icmsBase?: number;
  icmsAliquota?: number;
  icmsValor?: number;
  ipiAliquota?: number;
  ipiValor?: number;
  pisAliquota?: number;
  pisValor?: number;
  cofinsAliquota?: number;
  cofinsValor?: number;
  // Reforma tributária
  cbsAliquota?: number;
  cbsValor?: number;
  ibsAliquota?: number;
  ibsValor?: number;
  cbsIbsTotal?: number;
  cargaTributariaAtual?: number;
  cargaTributariaNova?: number;
  diferencialCarga?: number;
  categoriaTributaria?: string;
}

export interface NFeTotais {
  valorProdutos: number;
  valorDesconto: number;
  valorTotal: number;
  icmsBase: number;
  icmsValor: number;
  ipiValor: number;
  pisValor: number;
  cofinsValor: number;
  cargaTributariaAtual: number;
  cargaTributariaNova: number;
  cbsTotal: number;
  ibsTotal: number;
  diferencialTotal: number;
}

export interface NFeData {
  chave?: string;
  numero?: string;
  serie?: string;
  dataEmissao?: string;
  emitente?: {
    nome?: string;
    cnpj?: string;
    inscricaoEstadual?: string;
    uf?: string;
    municipio?: string;
  };
  destinatario?: {
    nome?: string;
    cnpj?: string;
    uf?: string;
    municipio?: string;
  };
  itens: NFeItem[];
  totais: NFeTotais;
}

export interface ParseResult {
  success: boolean;
  error?: string;
  data?: NFeData;
  rawXml?: string;
  fileName?: string;
  isDuplicate?: boolean;
}

export interface UploadResult {
  id: string;
  fileName: string;
  source: 'file' | 'zip';
  zipName?: string;
  result: ParseResult;
  selected: boolean;
}

export interface ConsolidadoTotais {
  quantidadeNotas: number;
  quantidadeItens: number;
  valorTotal: number;
  cargaTributariaAtual: number;
  cargaTributariaNova: number;
  diferencialTotal: number;
  cbsTotal: number;
  ibsTotal: number;
  icmsTotal: number;
  ipiTotal: number;
  pisTotal: number;
  cofinsTotal: number;
}

export interface ConsolidadoCategoria {
  categoriaTributaria: string;
  quantidadeItens: number;
  valorTotal: number;
  cargaTributariaAtual: number;
  cargaTributariaNova: number;
  diferencial: number;
  cbsTotal: number;
  ibsTotal: number;
}

export interface ConsolidadoNcm {
  ncm: string;
  descricao: string;
  quantidadeItens: number;
  valorTotal: number;
  cargaTributariaAtual: number;
  cargaTributariaNova: number;
  diferencial: number;
}

export interface RelatorioCompilado {
  totais: ConsolidadoTotais;
  categorias: ConsolidadoCategoria[];
  ncms: ConsolidadoNcm[];
  duplicados: UploadResult[];
  notas: UploadResult[];
}

export type ViewMode = 'individual' | 'compilado';
