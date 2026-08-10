import type {
  UploadResult,
  ConsolidadoTotais,
  ConsolidadoCategoria,
  ConsolidadoNcm,
  RelatorioCompilado,
} from '../types';

export function gerarId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

export function verificarDuplicados(resultados: UploadResult[]): UploadResult[] {
  const chaves = new Map<string, UploadResult>();
  const resultado: UploadResult[] = [];

  for (const r of resultados) {
    // Criar cópia para não mutar o original
    const item = { ...r, result: { ...r.result } };
    if (!item.result.success || !item.result.data?.chave) {
      resultado.push(item);
      continue;
    }
    const chave = item.result.data.chave;
    if (chaves.has(chave)) {
      item.result.isDuplicate = true;
    } else {
      chaves.set(chave, item);
    }
    resultado.push(item);
  }

  return resultado;
}

export function gerarRelatorioCompilado(resultados: UploadResult[]): RelatorioCompilado {
  // Não chamar verificarDuplicados novamente - assume que já foi chamado
  const notasValidas = resultados.filter(
    (r) => r.result.success && r.result.data && !r.result.isDuplicate && r.selected,
  );

  const duplicados = resultados.filter((r) => r.result.isDuplicate);

  const totais: ConsolidadoTotais = {
    quantidadeNotas: notasValidas.length,
    quantidadeItens: 0,
    valorTotal: 0,
    cargaTributariaAtual: 0,
    cargaTributariaNova: 0,
    diferencialTotal: 0,
    cbsTotal: 0,
    ibsTotal: 0,
    icmsTotal: 0,
    ipiTotal: 0,
    pisTotal: 0,
    cofinsTotal: 0,
  };

  const categoriasMap = new Map<string, ConsolidadoCategoria>();
  const ncmsMap = new Map<string, ConsolidadoNcm>();

  for (const upload of notasValidas) {
    if (!upload.result.data) continue;
    const data = upload.result.data;

    totais.valorTotal += data.totais.valorTotal;
    totais.cargaTributariaAtual += data.totais.cargaTributariaAtual;
    totais.cargaTributariaNova += data.totais.cargaTributariaNova;
    totais.diferencialTotal += data.totais.diferencialTotal;
    totais.cbsTotal += data.totais.cbsTotal;
    totais.ibsTotal += data.totais.ibsTotal;
    totais.icmsTotal += data.totais.icmsValor;
    totais.ipiTotal += data.totais.ipiValor;
    totais.pisTotal += data.totais.pisValor;
    totais.cofinsTotal += data.totais.cofinsValor;

    for (const item of data.itens) {
      totais.quantidadeItens++;

      const catKey = item.categoriaTributaria || 'Sem categoria';
      const cat = categoriasMap.get(catKey) ?? {
        categoriaTributaria: catKey,
        quantidadeItens: 0,
        valorTotal: 0,
        cargaTributariaAtual: 0,
        cargaTributariaNova: 0,
        diferencial: 0,
        cbsTotal: 0,
        ibsTotal: 0,
      };
      cat.quantidadeItens++;
      cat.valorTotal += item.valorTotal;
      cat.cargaTributariaAtual += item.cargaTributariaAtual || 0;
      cat.cargaTributariaNova += item.cargaTributariaNova || 0;
      cat.diferencial += item.diferencialCarga || 0;
      cat.cbsTotal += item.cbsValor || 0;
      cat.ibsTotal += item.ibsValor || 0;
      categoriasMap.set(catKey, cat);

      const ncmKey = item.ncm;
      const ncm = ncmsMap.get(ncmKey) ?? {
        ncm: ncmKey,
        descricao: item.descricao,
        quantidadeItens: 0,
        valorTotal: 0,
        cargaTributariaAtual: 0,
        cargaTributariaNova: 0,
        diferencial: 0,
      };
      ncm.quantidadeItens++;
      ncm.valorTotal += item.valorTotal;
      ncm.cargaTributariaAtual += item.cargaTributariaAtual || 0;
      ncm.cargaTributariaNova += item.cargaTributariaNova || 0;
      ncm.diferencial += item.diferencialCarga || 0;
      ncmsMap.set(ncmKey, ncm);
    }
  }

  const categorias = Array.from(categoriasMap.values()).sort((a, b) => b.valorTotal - a.valorTotal);
  const ncms = Array.from(ncmsMap.values()).sort((a, b) => b.valorTotal - a.valorTotal);

  return {
    totais,
    categorias,
    ncms,
    duplicados,
    notas: notasValidas,
  };
}