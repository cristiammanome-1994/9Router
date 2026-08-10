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
  // Base CBS/IBS (Art. 13 Lei 14.988/2024)
  valorFrete?: number;
  valorSeguro?: number;
  valorOutros?: number;
  valorII?: number;
  valorIPI?: number;
  valorDescCond?: number;
  baseCalculoCBSIBS?: number;
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
  isSeletivo?: boolean;
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

export type ViewMode = 'individual' | 'compilado' | 'simulacao' | 'fornecedores';

export interface FornecedorResumo {
  cnpj: string;
  nome: string;
  uf: string;
  municipio: string;
  quantidadeNotas: number;
  quantidadeItens: number;
  valorTotal: number;
  cargaTributariaAtual: number;
  cargaTributariaNova: number;
  diferencial: number;
  cbsTotal: number;
  ibsTotal: number;
  icmsTotal: number;
  ipiTotal: number;
  pisTotal: number;
  cofinsTotal: number;
  cargaPercentualAtual: number;
  cargaPercentualNova: number;
  ncms: string[];
  categorias: string[];
}

export interface AnaliseFornecedores {
  fornecedores: FornecedorResumo[];
  totaisGeral: {
    quantidadeFornecedores: number;
    quantidadeNotas: number;
    quantidadeItens: number;
    valorTotal: number;
    cargaTributariaAtual: number;
    cargaTributariaNova: number;
    diferencial: number;
  };
}

export interface AliquotaCustomizada {
  ncmPrefix: string;
  descricao: string;
  cbs: number;
  ibs: number;
  cashback: number;
}

export interface AliquotasSimulacao {
  padrao: { cbs: number; ibs: number };
  categorias: AliquotaCustomizada[];
}

export const ALIQUOTAS_PADRAO: AliquotasSimulacao = {
  padrao: { cbs: 9.65, ibs: 9.65 },
  categorias: [
    { ncmPrefix: '0000', descricao: 'Alíquota Zero (Anexo I)', cbs: 0, ibs: 0, cashback: 0 },
    { ncmPrefix: '0001', descricao: 'Cesta Básica (Alíquota Zero - Anexo I)', cbs: 0, ibs: 0, cashback: 100 },
    { ncmPrefix: '0101', descricao: 'Carnes Frescas (Red. 60%)', cbs: 3.86, ibs: 3.86, cashback: 100 },
    { ncmPrefix: '0201', descricao: 'Carnes Frescas (Red. 60%)', cbs: 3.86, ibs: 3.86, cashback: 100 },
    { ncmPrefix: '0202', descricao: 'Carnes Frescas (Red. 60%)', cbs: 3.86, ibs: 3.86, cashback: 100 },
    { ncmPrefix: '0203', descricao: 'Carnes Frescas (Red. 60%)', cbs: 3.86, ibs: 3.86, cashback: 100 },
    { ncmPrefix: '0401', descricao: 'Leite (Red. 60%)', cbs: 3.86, ibs: 3.86, cashback: 100 },
    { ncmPrefix: '0402', descricao: 'Leite Condensado/Em Pó (Red. 60%)', cbs: 3.86, ibs: 3.86, cashback: 100 },
    { ncmPrefix: '0403', descricao: 'Iogurtes (Red. 60%)', cbs: 3.86, ibs: 3.86, cashback: 100 },
    { ncmPrefix: '0406', descricao: 'Queijos (Red. 60%)', cbs: 3.86, ibs: 3.86, cashback: 100 },
    { ncmPrefix: '0701', descricao: 'Batatas (Red. 60%)', cbs: 3.86, ibs: 3.86, cashback: 100 },
    { ncmPrefix: '0702', descricao: 'Tomates (Red. 60%)', cbs: 3.86, ibs: 3.86, cashback: 100 },
    { ncmPrefix: '0703', descricao: 'Cebolas/Alhos (Red. 60%)', cbs: 3.86, ibs: 3.86, cashback: 100 },
    { ncmPrefix: '0712', descricao: 'Hortícolas Secos (Red. 60%)', cbs: 3.86, ibs: 3.86, cashback: 100 },
    { ncmPrefix: '0808', descricao: 'Maçãs/Pêras (Red. 60%)', cbs: 3.86, ibs: 3.86, cashback: 100 },
    { ncmPrefix: '1101', descricao: 'Farinha de Trigo (Red. 60%)', cbs: 3.86, ibs: 3.86, cashback: 100 },
    { ncmPrefix: '1102', descricao: 'Outras Farinhas (Red. 60%)', cbs: 3.86, ibs: 3.86, cashback: 100 },
    { ncmPrefix: '1901', descricao: 'Prep. de Cereais (Red. 60%)', cbs: 3.86, ibs: 3.86, cashback: 100 },
    { ncmPrefix: '3001', descricao: 'Órgãos/Hormônios (Red. 60%)', cbs: 3.86, ibs: 3.86, cashback: 50 },
    { ncmPrefix: '3002', descricao: 'Sangue/Vacinas (Red. 60%)', cbs: 3.86, ibs: 3.86, cashback: 50 },
    { ncmPrefix: '3003', descricao: 'Medicamentos (Red. 60%)', cbs: 3.86, ibs: 3.86, cashback: 50 },
    { ncmPrefix: '3004', descricao: 'Medicamentos (Red. 60%)', cbs: 3.86, ibs: 3.86, cashback: 50 },
    { ncmPrefix: '3005', descricao: 'Curativos (Red. 60%)', cbs: 3.86, ibs: 3.86, cashback: 50 },
    { ncmPrefix: '3006', descricao: 'Farm. Diversos (Red. 60%)', cbs: 3.86, ibs: 3.86, cashback: 50 },
    { ncmPrefix: '8408', descricao: 'Motores Diesel', cbs: 9.65, ibs: 9.65, cashback: 0 },
    { ncmPrefix: '8703', descricao: 'Veículos Automóveis', cbs: 9.65, ibs: 9.65, cashback: 0 },
    { ncmPrefix: '8708', descricao: 'Partes de Veículos', cbs: 9.65, ibs: 9.65, cashback: 0 },
    { ncmPrefix: '8471', descricao: 'Equipamentos Eletrônicos', cbs: 9.65, ibs: 9.65, cashback: 0 },
    { ncmPrefix: '8517', descricao: 'Equipamentos Eletrônicos', cbs: 9.65, ibs: 9.65, cashback: 0 },
    { ncmPrefix: '8528', descricao: 'Equipamentos Eletrônicos', cbs: 9.65, ibs: 9.65, cashback: 0 },
    { ncmPrefix: '2201', descricao: 'Águas', cbs: 9.65, ibs: 9.65, cashback: 0 },
    { ncmPrefix: '2202', descricao: 'Refrigerantes/Sucos', cbs: 9.65, ibs: 9.65, cashback: 0 },
    { ncmPrefix: '2203', descricao: 'Cervejas', cbs: 9.65, ibs: 9.65, cashback: 0 },
    { ncmPrefix: '2204', descricao: 'Vinhos (IS separado)', cbs: 9.65, ibs: 9.65, cashback: 0 },
    { ncmPrefix: '2208', descricao: 'Destilados (IS separado)', cbs: 9.65, ibs: 9.65, cashback: 0 },
    { ncmPrefix: '2710', descricao: 'Combustíveis Líquidos', cbs: 9.65, ibs: 9.65, cashback: 0 },
    { ncmPrefix: '2711', descricao: 'Gás Natural/GLP', cbs: 9.65, ibs: 9.65, cashback: 0 },
    { ncmPrefix: '6109', descricao: 'Camisetas (Malha)', cbs: 9.65, ibs: 9.65, cashback: 0 },
    { ncmPrefix: '6201', descricao: 'Sobretudos (Tecido)', cbs: 9.65, ibs: 9.65, cashback: 0 },
    { ncmPrefix: '6203', descricao: 'Ternos (Tecido)', cbs: 9.65, ibs: 9.65, cashback: 0 },
    { ncmPrefix: '6204', descricao: 'Tailleurs (Tecido)', cbs: 9.65, ibs: 9.65, cashback: 0 },
  ],
};

export type RegimeTributario = 'simples' | 'simples-hibrido' | 'lucro-presumido' | 'lucro-real';

export interface AliquotasRegime {
  irpj: number;
  csll: number;
  pis: number;
  cofins: number;
  cpp: number;
  icms: number;
  iss: number;
  ipi: number;
}

export interface ParametrosEmpresa {
  faturamentoAnual: number;
  folhaPagamento: number;
  regimeAtual: RegimeTributario;
  uf: string;
  municipio: string;
  atividadePrincipal: 'comercio' | 'industria' | 'servicos' | 'misto';
  anexoSimples?: 'I' | 'II' | 'III' | 'IV' | 'V';
  // Alíquotas manuais para simulação (opcional - sobrescreve catálogo)
  aliquotaCbsManual?: number; // % CBS
  aliquotaIbsManual?: number; // % IBS
  usarAliquotasManuais?: boolean; // Flag para usar valores manuais
}

export interface SimulacaoRegime {
  regime: RegimeTributario;
  nome: string;
  descricao: string;
  cargas: {
    irpj: number;
    csll: number;
    pis: number;
    cofins: number;
    cpp: number;
    icms: number;
    iss: number;
    ipi: number;
    total: number;
  };
  cargaEfetivaPercentual: number;
  economiaVsAtual: number;
  viavel: boolean;
  observacoes: string[];
}

export interface ComparativoRegimes {
  empresa: ParametrosEmpresa;
  simulacoes: SimulacaoRegime[];
  recomendado: SimulacaoRegime;
  economiaMaxima: number;
}
