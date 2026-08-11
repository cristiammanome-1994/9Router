import type {
  RegimeTributario,
  AliquotasRegime,
  ParametrosEmpresa,
  SimulacaoRegime,
  ComparativoRegimes,
} from '../types';

// Tabelas do Simples Nacional 2024 (valores anuais)
const SIMPLES_ANEXOS = {
  I: { // Comércio
    faixas: [
      { ate: 180000, aliquota: 4.0, deducao: 0 },
      { ate: 360000, aliquota: 7.3, deducao: 5940 },
      { ate: 720000, aliquota: 9.5, deducao: 13860 },
      { ate: 1800000, aliquota: 10.7, deducao: 25200 },
      { ate: 3600000, aliquota: 14.3, deducao: 87300 },
      { ate: 4800000, aliquota: 19.0, deducao: 378000 },
    ],
  },
  II: { // Indústria
    faixas: [
      { ate: 180000, aliquota: 4.5, deducao: 0 },
      { ate: 360000, aliquota: 7.8, deducao: 5940 },
      { ate: 720000, aliquota: 10.0, deducao: 13860 },
      { ate: 1800000, aliquota: 11.2, deducao: 25200 },
      { ate: 3600000, aliquota: 14.7, deducao: 87300 },
      { ate: 4800000, aliquota: 20.0, deducao: 378000 },
    ],
  },
  III: { // Serviços (anexo III antigo - antes da reforma)
    faixas: [
      { ate: 180000, aliquota: 6.0, deducao: 0 },
      { ate: 360000, aliquota: 11.2, deducao: 9360 },
      { ate: 720000, aliquota: 13.5, deducao: 17640 },
      { ate: 1800000, aliquota: 16.0, deducao: 35640 },
      { ate: 3600000, aliquota: 21.0, deducao: 125640 },
      { ate: 4800000, aliquota: 33.0, deducao: 648000 },
    ],
  },
  IV: { // Serviços (anexo IV)
    faixas: [
      { ate: 180000, aliquota: 4.5, deducao: 0 },
      { ate: 360000, aliquota: 9.0, deducao: 8100 },
      { ate: 720000, aliquota: 10.2, deducao: 15660 },
      { ate: 1800000, aliquota: 14.0, deducao: 38160 },
      { ate: 3600000, aliquota: 22.0, deducao: 189360 },
      { ate: 4800000, aliquota: 33.0, deducao: 828000 },
    ],
  },
  V: { // Serviços (anexo V)
    faixas: [
      { ate: 180000, aliquota: 15.5, deducao: 0 },
      { ate: 360000, aliquota: 18.0, deducao: 4500 },
      { ate: 720000, aliquota: 19.5, deducao: 9900 },
      { ate: 1800000, aliquota: 20.5, deducao: 17100 },
      { ate: 3600000, aliquota: 23.0, deducao: 62100 },
      { ate: 4800000, aliquota: 30.5, deducao: 540000 },
    ],
  },
};

// Tabela de bases presumidas por atividade/CNAE (conforme IN RFB 1.700/2017)
const BASE_PRESUMIDA_IRPJ_CSLL: Record<string, { irpj: number; csll: number }> = {
  // Comércio
  'comercio': { irpj: 32, csll: 32 },
  'comercio-varejo': { irpj: 32, csll: 32 },
  'comercio-atacado': { irpj: 32, csll: 32 },
  
  // Indústria
  'industria': { irpj: 8, csll: 8 },
  'industria-alimentos': { irpj: 8, csll: 8 },
  'industria-textil': { irpj: 8, csll: 8 },
  'industria-quimica': { irpj: 8, csll: 8 },
  'industria-metalurgica': { irpj: 8, csll: 8 },
  
  // Serviços
  'servicos': { irpj: 8, csll: 8 },
  'servicos-transporte': { irpj: 8, csll: 8 },
  'servicos-comunicacao': { irpj: 8, csll: 8 },
  'servicos-financeiros': { irpj: 32, csll: 32 }, // Financeiras usam 32%
  'servicos-saude': { irpj: 8, csll: 8 },
  'servicos-educacao': { irpj: 8, csll: 8 },
  'servicos-tecnologia': { irpj: 8, csll: 8 },
  'servicos-profissionais': { irpj: 8, csll: 8 },
  'servicos-limpeza': { irpj: 8, csll: 8 },
  'servicos-seguranca': { irpj: 8, csll: 8 },
  
  // Construção
  'construcao': { irpj: 8, csll: 8 },
  'construcao-civil': { irpj: 8, csll: 8 },
  
  // Transporte
  'transporte-carga': { irpj: 8, csll: 8 },
  'transporte-passageiros': { irpj: 8, csll: 8 },
  
  // Agropecuária
  'agropecuaria': { irpj: 8, csll: 8 },
  
  // Padrão (fallback)
  'default': { irpj: 32, csll: 32 },
};

// Alíquotas Lucro Presumido (base variável conforme atividade)
const ALIQUOTAS_LUCRO_PRESUMIDO: AliquotasRegime = {
  irpj: 15, // sobre base presumida
  csll: 9,  // sobre base presumida
  pis: 0.65,
  cofins: 3.0,
  cpp: 20, // sobre folha
  icms: 18, // média interestadual
  iss: 5,   // média municipal
  ipi: 5,   // média industrial
};

// Alíquotas Lucro Real
const ALIQUOTAS_LUCRO_REAL: AliquotasRegime = {
  irpj: 15, // + adicional 10% acima de 240k/ano
  csll: 9,
  pis: 1.65, // não cumulativo
  cofins: 7.6, // não cumulativo
  cpp: 20, // sobre folha
  icms: 18,
  iss: 5,
  ipi: 5,
};

// Função para obter base presumida por atividade/CNAE
function getBasePresumida(atividade: string, cnae?: string): { irpj: number; csll: number } {
  // Se tiver CNAE, tentar buscar por código
  if (cnae) {
    const cnaePrefix = cnae.replace(/\D/g, '').substring(0, 4);
    // TODO: Implementar lookup por CNAE específico quando catálogo estiver disponível
  }
  
  // Buscar por atividade principal
  const key = atividade.toLowerCase().replace(/\s+/g, '-');
  return BASE_PRESUMIDA_IRPJ_CSLL[key] || BASE_PRESUMIDA_IRPJ_CSLL['default'];
}

function calcularAliquotaSimplesEfetiva(faturamentoAnual: number, anexo: keyof typeof SIMPLES_ANEXOS): number {
  const tabela = SIMPLES_ANEXOS[anexo];
  for (const faixa of tabela.faixas) {
    if (faturamentoAnual <= faixa.ate) {
      return faixa.aliquota - (faixa.deducao / faturamentoAnual) * 100;
    }
  }
  // Ultima faixa
  const ultima = tabela.faixas[tabela.faixas.length - 1];
  return ultima.aliquota - (ultima.deducao / faturamentoAnual) * 100;
}

function decomporSimples(aliquotaEfetiva: number, atividade: string): AliquotasRegime {
  // Distribuição aproximada da alíquota do Simples por tributo
  // Comércio: ICMS ~60%, ISS ~0%, IRPJ~12%, CSLL~7%, PIS~0.65%, COFINS~3%, CPP~20% (sobre folha)
  // Indústria: ICMS~40%, IPI~15%, IRPJ~12%, CSLL~7%, PIS~0.65%, COFINS~3%, CPP~20%
  // Serviços: ISS~40%, IRPJ~12%, CSLL~7%, PIS~0.65%, COFINS~3%, CPP~20%

  const distribuicoes: Record<string, Partial<AliquotasRegime>> = {
    comercio: { icms: 0.60, iss: 0, ipi: 0, irpj: 0.12, csll: 0.07, pis: 0.0065, cofins: 0.03, cpp: 0.20 },
    industria: { icms: 0.40, iss: 0, ipi: 0.15, irpj: 0.12, csll: 0.07, pis: 0.0065, cofins: 0.03, cpp: 0.20 },
    servicos: { icms: 0, iss: 0.40, ipi: 0, irpj: 0.12, csll: 0.07, pis: 0.0065, cofins: 0.03, cpp: 0.20 },
    misto: { icms: 0.30, iss: 0.20, ipi: 0.05, irpj: 0.12, csll: 0.07, pis: 0.0065, cofins: 0.03, cpp: 0.20 },
  };

  const dist = distribuicoes[atividade] || distribuicoes.misto;
  const result: AliquotasRegime = {
    irpj: aliquotaEfetiva * (dist.irpj || 0),
    csll: aliquotaEfetiva * (dist.csll || 0),
    pis: aliquotaEfetiva * (dist.pis || 0),
    cofins: aliquotaEfetiva * (dist.cofins || 0),
    cpp: 20, // sobre folha, não sobre faturamento
    icms: aliquotaEfetiva * (dist.icms || 0),
    iss: aliquotaEfetiva * (dist.iss || 0),
    ipi: aliquotaEfetiva * (dist.ipi || 0),
  };
  return result;
}

export function calcularCargaRegime(
  regime: RegimeTributario,
  params: ParametrosEmpresa,
  totaisNFe: { valorTotal: number; icmsTotal: number; ipiTotal: number; pisTotal: number; cofinsTotal: number }
): SimulacaoRegime {
  const faturamento = params.faturamentoAnual || totaisNFe.valorTotal * 12; // projeta anual
  const folha = params.folhaPagamento || faturamento * 0.15; // estimativa 15%
  const anexo = params.anexoSimples || (params.atividadePrincipal === 'comercio' ? 'I' : params.atividadePrincipal === 'industria' ? 'II' : 'III');

  let aliquotas: AliquotasRegime;
  let nome = '';
  let descricao = '';
  let viavel = true;
  const observacoes: string[] = [];

  switch (regime) {
    case 'simples': {
      if (faturamento > 4800000) {
        viavel = false;
        observacoes.push('Faturamento excede limite do Simples Nacional (R$ 4,8M)');
      }
      const aliquotaEfetiva = calcularAliquotaSimplesEfetiva(faturamento, anexo);
      aliquotas = decomporSimples(aliquotaEfetiva, params.atividadePrincipal);
      nome = 'Simples Nacional';
      descricao = `Anexo ${anexo} - Alíquota efetiva: ${aliquotaEfetiva.toFixed(2)}%`;
      if (params.atividadePrincipal === 'servicos') {
        observacoes.push('Verificar se atividade permite Simples (vedações: financeiras, factoring, etc.)');
      }
      break;
    }
    case 'simples-hibrido': {
      if (faturamento > 4800000) {
        viavel = false;
        observacoes.push('Faturamento excede limite do Simples para ICMS/ISS (R$ 4,8M)');
      }
      const aliquotaEfetiva = calcularAliquotaSimplesEfetiva(faturamento, anexo);
      const simplesDecomposto = decomporSimples(aliquotaEfetiva, params.atividadePrincipal);
      
      // Simples Híbrido: ICMS/ISS no Simples + Federais no Lucro REAL (conforme LC 199/2023)
      // IRPJ/CSLL: base real (lucro contábil) - alíquotas do Lucro Real
      // PIS/COFINS: regime não cumulativo (Lucro Real)
      // CPP: 20% sobre folha (com RAT/terceiros)
      aliquotas = {
        irpj: ALIQUOTAS_LUCRO_REAL.irpj,      // 15% + adicional 10% > 240k
        csll: ALIQUOTAS_LUCRO_REAL.csll,      // 9%
        pis: ALIQUOTAS_LUCRO_REAL.pis,        // 1,65% não cumulativo
        cofins: ALIQUOTAS_LUCRO_REAL.cofins,  // 7,6% não cumulativo
        cpp: ALIQUOTAS_LUCRO_REAL.cpp,        // 20% sobre folha
        icms: simplesDecomposto.icms,         // do Simples
        iss: simplesDecomposto.iss,           // do Simples
        ipi: ALIQUOTAS_LUCRO_REAL.ipi,        // 5% média
      };
      nome = 'Simples Híbrido';
      descricao = `ICMS/ISS no Simples (Anexo ${anexo}) + Federais no Lucro Real`;
      observacoes.push('ICMS/ISS recolhidos via DAS; IRPJ/CSLL/PIS/COFINS no Lucro Real (DARF)');
      observacoes.push('PIS/COFINS não cumulativos - créditos sobre insumos');
      break;
    }
    case 'lucro-presumido': {
      if (faturamento > 78000000) {
        viavel = false;
        observacoes.push('Faturamento excede limite do Lucro Presumido (R$ 78M)');
      }
      
      // Obter base presumida por atividade/CNAE (A03)
      const basePresumida = getBasePresumida(params.atividadePrincipal, params.cnaePrincipal);
      
      aliquotas = { ...ALIQUOTAS_LUCRO_PRESUMIDO };
      nome = 'Lucro Presumido';
      descricao = `Base presumida IRPJ/CSLL: ${basePresumida.irpj}% (conforme atividade ${params.atividadePrincipal})`;
      
      // Aplicar base presumida específica
      if (params.atividadePrincipal === 'servicos' || basePresumida.irpj === 8) {
        observacoes.push(`Base IRPJ/CSLL reduzida para ${basePresumida.irpj}% na atividade ${params.atividadePrincipal}`);
      } else {
        observacoes.push(`Base IRPJ/CSLL padrão ${basePresumida.irpj}% para ${params.atividadePrincipal}`);
      }
      break;
    }
    case 'lucro-real': {
      aliquotas = { ...ALIQUOTAS_LUCRO_REAL };
      nome = 'Lucro Real';
      descricao = 'Tributação sobre lucro contábil ajustado; créditos de PIS/COFINS não cumulativos';
      observacoes.push('Obrigatório para faturamento > R$ 78M ou atividades vedadas ao Presumido');
      observacoes.push('Permite aproveitamento de prejuízos fiscais e créditos de PIS/COFINS');
      break;
    }
  }

  // Calcular valores absolutos
  const baseFaturamento = faturamento;
  const baseFolha = folha;

  const cargas = {
    irpj: baseFaturamento * (aliquotas.irpj / 100),
    csll: baseFaturamento * (aliquotas.csll / 100),
    pis: baseFaturamento * (aliquotas.pis / 100),
    cofins: baseFaturamento * (aliquotas.cofins / 100),
    cpp: baseFolha * (aliquotas.cpp / 100),
    icms: baseFaturamento * (aliquotas.icms / 100),
    iss: baseFaturamento * (aliquotas.iss / 100),
    ipi: baseFaturamento * (aliquotas.ipi / 100),
    total: 0,
  };

  cargas.total = cargas.irpj + cargas.csll + cargas.pis + cargas.cofins + cargas.cpp + cargas.icms + cargas.iss + cargas.ipi;

  // Comparar com regime atual (extraído das NF-es)
  const cargaAtualNFe = totaisNFe.icmsTotal + totaisNFe.ipiTotal + totaisNFe.pisTotal + totaisNFe.cofinsTotal;
  const cargaAtualProjetada = cargaAtualNFe * 12; // anualizado
  const economiaVsAtual = cargaAtualProjetada - cargas.total;

  // Ajustes específicos por regime
  // Obter base presumida para lucro-presumido
  let basePresumidaIRPJ = 32;
  let basePresumidaCSLL = 32;
  
  if (regime === 'lucro-presumido') {
    const basePresumida = getBasePresumida(params.atividadePrincipal, params.cnaePrincipal);
    basePresumidaIRPJ = basePresumida.irpj;
    basePresumidaCSLL = basePresumida.csll;
    
    // IRPJ/CSLL sobre base presumida (não sobre faturamento total)
    cargas.irpj = baseFaturamento * (basePresumidaIRPJ / 100) * (aliquotas.irpj / 100);
    cargas.csll = baseFaturamento * (basePresumidaCSLL / 100) * (aliquotas.csll / 100);
    
    // PIS/COFINS não cumulativos mesmo no Presumido (opcional - depende da atividade)
    // Para simplificação, mantemos cumulativos no Presumido, não cumulativos no Real
    // TODO: Implementar não-cumulatividade parcial para Presumido conforme atividade
    
  } else if (regime === 'lucro-real') {
    // No lucro real, PIS/COFINS são não cumulativos - estimamos crédito de ~30% sobre compras
    const creditoEstimado = baseFaturamento * 0.3 * 0.0925; // 30% do faturamento * 9.25% (PIS+COFINS)
    cargas.pis = Math.max(0, cargas.pis - creditoEstimado * 0.178); // proporcional PIS
    cargas.cofins = Math.max(0, cargas.cofins - creditoEstimado * 0.822); // proporcional COFINS
  }
  
  // Recalcular total após ajustes
  cargas.total = cargas.irpj + cargas.csll + cargas.pis + cargas.cofins + cargas.cpp + cargas.icms + cargas.iss + cargas.ipi;

  return {
    regime,
    nome,
    descricao,
    cargas,
    cargaEfetivaPercentual: (cargas.total / baseFaturamento) * 100,
    economiaVsAtual,
    viavel,
    observacoes,
  };
}

export function compararRegimes(params: ParametrosEmpresa, totaisNFe: { valorTotal: number; icmsTotal: number; ipiTotal: number; pisTotal: number; cofinsTotal: number }): ComparativoRegimes {
  const regimes: RegimeTributario[] = ['simples', 'simples-hibrido', 'lucro-presumido', 'lucro-real'];
  
  const simulacoes = regimes.map(r => calcularCargaRegime(r, params, totaisNFe));
  
  // Filtrar apenas viáveis e ordenar por economia
  const viaveis = simulacoes.filter(s => s.viavel);
  const recomendado = viaveis.reduce((best, current) => 
    current.economiaVsAtual > best.economiaVsAtual ? current : best
  , viaveis[0] || simulacoes[0]);
  
  const economiaMaxima = Math.max(...simulacoes.map(s => s.economiaVsAtual));

  return {
    empresa: params,
    simulacoes,
    recomendado,
    economiaMaxima,
  };
}

export function getRegimeAtualFromNFes(totais: { icmsTotal: number; ipiTotal: number; pisTotal: number; cofinsTotal: number }): string {
  const total = totais.icmsTotal + totais.ipiTotal + totais.pisTotal + totais.cofinsTotal;
  if (total === 0) return 'Não identificado';
  
  const pctICMS = (totais.icmsTotal / total) * 100;
  const pctIPI = (totais.ipiTotal / total) * 100;
  const pctPIS = (totais.pisTotal / total) * 100;
  const pctCOFINS = (totais.cofinsTotal / total) * 100;
  
  // Heurística simples
  if (pctICMS > 60) return 'Provável Simples Nacional (ICMS dominante)';
  if (pctIPI > 10) return 'Provável Lucro Presumido/Real Industrial (IPI presente)';
  if (pctPIS + pctCOFINS > 20) return 'Provável Lucro Presumido/Real (PIS/COFINS relevantes)';
  return 'Regime misto ou não identificado';
}