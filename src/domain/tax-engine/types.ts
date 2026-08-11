// Domain Tax Engine - Core Types
// Tipos fundamentais do motor tributário

export interface NCMConfig {
  ncmPrefix: string;
  descricao: string;
  cbs: number;
  ibs: number;
  ibsEstadual: number;
  ibsMunicipal: number;
  cashback: number;
  tipo: 'zero' | 'reduzida' | 'padrao' | 'seletivo';
  anexo?: string;
  icmsSt?: boolean; // Se o NCM geralmente tem ICMS-ST
}

export interface ImpostoSeletivoConfig {
  ncmPrefix: string;
  descricao: string;
  aliquotaAdValorem: number;
  aliquotaEspecifica: number;
  unidade: string | null;
  tipo: 'fumo' | 'bebida_alcoolica' | 'bebida_acucarada' | 'veiculo' | 'embarcacao' | 'arma' | 'petroleo' | 'minerio' | 'outro';
}

export interface CFOPConfig {
  cfop: string;
  descricao: string;
  tipoOperacao: 'venda_interna' | 'venda_interestadual' | 'exportacao' | 'devolucao' | 'transferencia' | 'entrada' | 'saida' | 'outra';
  geraCreditoCBS: boolean;
  geraCreditoIBS: boolean;
  incideCBS: boolean;
  incideIBS: boolean;
  incideIS: boolean;
  regimeEspecial?: 'exportacao' | 'devolucao' | 'transferencia' | 'zona_franca' | 'simples' | 'imune';
}

export interface AliquotasAno {
  ano: number;
  cbs: number;
  ibsEstadual: number;
  ibsMunicipal: number;
  ibsTotal: number; // ibsEstadual + ibsMunicipal
  icms: number;
  iss: number;
  pis: number;
  cofins: number;
  ipi: number;
  // Reduções progressivas dos tributos atuais
  reducaoICMS?: number;
  reducaoISS?: number;
  reducaoPIS?: number;
  reducaoCOFINS?: number;
  reducaoIPI?: number;
}

export interface CreditoConfig {
  ncmPrefix: string;
  cfop?: string;
  tipoOperacao?: string;
  geraCreditoCBS: boolean;
  geraCreditoIBS: boolean;
  percentualCreditoCBS: number; // % sobre o valor do insumo
  percentualCreditoIBS: number; // % sobre o valor do insumo
  descricao: string;
  // Condições para aplicação do crédito
  condicoes?: {
    destinatarioRegime?: string[]; // regimes do destinatário que permitem crédito
    emitenteRegime?: string[]; // regimes do emitente que permitem crédito
    ufOrigem?: string[];
    ufDestino?: string[];
  };
}

export interface BaseCalculoItem {
  valorProduto: number;
  frete: number;
  seguro: number;
  outrasDespesas: number;
  ii: number;
  ipi: number;
  descontoIncondicionado: number;
  descontoCondicionado: number;
  icmsSt: number;
  difal: number;
  fcp: number;
  // Valor da operação (base CBS/IBS)
  valorOperacao: number;
  // Componentes separados para auditoria
  componentes: {
    incluiFrete: boolean;
    incluiSeguro: boolean;
    incluiOutrasDespesas: boolean;
    incluiII: boolean;
    incluiIPI: boolean;
    excluiDescontoIncondicionado: boolean;
    excluiDescontoCondicionado: boolean;
    excluiICMSST: boolean;
    excluiDIFAL: boolean;
    excluiFCP: boolean;
  };
}

export interface ResultadoCalculoItem {
  // Identificação
  ncm: string;
  cfop: string;
  descricao: string;
  
  // Base de cálculo
  baseCalculo: BaseCalculoItem;
  
  // Alíquotas aplicadas
  aliquotaCBS: number;
  aliquotaIBS: number;
  aliquotaIBS_Estadual: number;
  aliquotaIBS_Municipal: number;
  aliquotaIS: number;
  
  // Valores brutos (sem créditos)
  cbsBruta: number;
  ibsBruta: number;
  ibsEstadualBruta: number;
  ibsMunicipalBruta: number;
  isBruta: number;
  
  // Créditos
  creditoCBS: number;
  creditoIBS: number;
  creditoCBSDetalhe: string;
  creditoIBSDetalhe: string;
  
  // Valores líquidos
  cbsLiquida: number;
  ibsLiquida: number;
  ibsEstadualLiquida: number;
  ibsMunicipalLiquida: number;
  isLiquida: number;
  
  // Totais
  totalCBS_IBS: number; // cbsLiquida + ibsLiquida
  totalComIS: number; // totalCBS_IBS + isLiquida
  
  // Classificação
  tipoOperacao: string;
  regimeEspecial?: string;
  isSeletivo: boolean;
  
  // Cashback (apenas informativo)
  cashbackPercentual: number;
  cashbackObservacao: string;
  
  // Auditoria
  auditoria: {
    ncmEncontrado: boolean;
    cfopClassificado: boolean;
    baseCalculoDetalhada: string;
    creditosAplicados: string[];
    alertas: string[];
  };
}

export interface ParametrosSimulacao {
  ano: number;
  ufOrigem: string;
  ufDestino: string;
  municipioOrigem: string;
  municipioDestino: string;
  regimeEmitente: 'simples' | 'lucro-presumido' | 'lucro-real' | 'mei' | 'imune' | 'nao-identificado';
  regimeDestinatario: 'simples' | 'lucro-presumido' | 'lucro-real' | 'mei' | 'imune' | 'nao-identificado';
  aliquotaCbsManual?: number;
  aliquotaIbsManual?: number;
  usarAliquotasManuais: boolean;
  incluirCreditos: boolean;
}

export interface CenarioTributario {
  ano: number;
  parametros: ParametrosSimulacao;
  resultados: ResultadoCalculoItem[];
  totais: {
    cbsBrutaTotal: number;
    ibsBrutaTotal: number;
    isBrutaTotal: number;
    creditoCBSTotal: number;
    creditoIBSTotal: number;
    cbsLiquidaTotal: number;
    ibsLiquidaTotal: number;
    isLiquidaTotal: number;
    totalGeral: number;
  };
  alertas: string[];
  metadata: {
    versaoMotor: string;
    versaoCatalogos: string;
    dataCalculo: string;
    parametrosUtilizados: ParametrosSimulacao;
  };
}