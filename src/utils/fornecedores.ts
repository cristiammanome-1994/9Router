import type { UploadResult, FornecedorResumo, AnaliseFornecedores } from '../types';

export function analisarFornecedores(resultados: UploadResult[]): AnaliseFornecedores {
  const fornecedoresMap = new Map<string, FornecedorResumo>();

  const notasValidas = resultados.filter(
    (r) => r.result.success && r.result.data && !r.result.isDuplicate && r.selected,
  );

  for (const upload of notasValidas) {
    if (!upload.result.data) continue;
    const data = upload.result.data;
    const emitente = data.emitente;
    if (!emitente) continue;

    const cnpj = emitente.cnpj || emitente.nome || 'DESCONHECIDO';
    const chave = cnpj.replace(/\D/g, '') || emitente.nome || '';

    const existente = fornecedoresMap.get(chave);
    if (existente) {
      existente.quantidadeNotas++;
      existente.quantidadeItens += data.itens.length;
      existente.valorTotal += data.totais.valorTotal;
      existente.cargaTributariaAtual += data.totais.cargaTributariaAtual;
      existente.cargaTributariaNova += data.totais.cargaTributariaNova;
      existente.diferencial += data.totais.diferencialTotal;
      existente.cbsTotal += data.totais.cbsTotal;
      existente.ibsTotal += data.totais.ibsTotal;
      existente.icmsTotal += data.totais.icmsValor;
      existente.ipiTotal += data.totais.ipiValor;
      existente.pisTotal += data.totais.pisValor;
      existente.cofinsTotal += data.totais.cofinsValor;

      for (const item of data.itens) {
        if (!existente.ncms.includes(item.ncm)) existente.ncms.push(item.ncm);
        if (item.categoriaTributaria && !existente.categorias.includes(item.categoriaTributaria)) {
          existente.categorias.push(item.categoriaTributaria);
        }
      }
    } else {
      const novo: FornecedorResumo = {
        cnpj: emitente.cnpj || '-',
        nome: emitente.nome || 'Desconhecido',
        uf: emitente.uf || '-',
        municipio: emitente.municipio || '-',
        quantidadeNotas: 1,
        quantidadeItens: data.itens.length,
        valorTotal: data.totais.valorTotal,
        cargaTributariaAtual: data.totais.cargaTributariaAtual,
        cargaTributariaNova: data.totais.cargaTributariaNova,
        diferencial: data.totais.diferencialTotal,
        cbsTotal: data.totais.cbsTotal,
        ibsTotal: data.totais.ibsTotal,
        icmsTotal: data.totais.icmsValor,
        ipiTotal: data.totais.ipiValor,
        pisTotal: data.totais.pisValor,
        cofinsTotal: data.totais.cofinsValor,
        cargaPercentualAtual: 0,
        cargaPercentualNova: 0,
        ncms: [],
        categorias: [],
      };

      for (const item of data.itens) {
        if (!novo.ncms.includes(item.ncm)) novo.ncms.push(item.ncm);
        if (item.categoriaTributaria && !novo.categorias.includes(item.categoriaTributaria)) {
          novo.categorias.push(item.categoriaTributaria);
        }
      }

      fornecedoresMap.set(chave, novo);
    }
  }

  const fornecedores = Array.from(fornecedoresMap.values());
  for (const f of fornecedores) {
    f.cargaPercentualAtual = f.valorTotal > 0 ? (f.cargaTributariaAtual / f.valorTotal) * 100 : 0;
    f.cargaPercentualNova = f.valorTotal > 0 ? (f.cargaTributariaNova / f.valorTotal) * 100 : 0;
  }

  fornecedores.sort((a, b) => b.valorTotal - a.valorTotal);

  const totaisGeral = {
    quantidadeFornecedores: fornecedores.length,
    quantidadeNotas: fornecedores.reduce((s, f) => s + f.quantidadeNotas, 0),
    quantidadeItens: fornecedores.reduce((s, f) => s + f.quantidadeItens, 0),
    valorTotal: fornecedores.reduce((s, f) => s + f.valorTotal, 0),
    cargaTributariaAtual: fornecedores.reduce((s, f) => s + f.cargaTributariaAtual, 0),
    cargaTributariaNova: fornecedores.reduce((s, f) => s + f.cargaTributariaNova, 0),
    diferencial: fornecedores.reduce((s, f) => s + f.diferencial, 0),
  };

  return { fornecedores, totaisGeral };
}