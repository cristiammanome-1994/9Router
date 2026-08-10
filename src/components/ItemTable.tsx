import type { NFeItem, NFeData } from '../types';
import { formatCurrency, formatPercent, formatNumber, formatDate } from '../utils/format';

interface ItemTableProps {
  data: NFeData;
}

export function ItemTable({ data }: ItemTableProps) {
  const itens = data.itens;

  return (
    <div className="table-container">
      <div className="nfe-header">
        <div>
          <h2>Itens da Nota Fiscal</h2>
          <p className="nfe-info">
            NFe #{data.numero || '-'} &middot; Série {data.serie || '-'} &middot; {formatDate(data.dataEmissao)}
          </p>
        </div>
        <div className="nfe-parties">
          {data.emitente?.nome && (
            <div>
              <span className="party-label">Emitente</span>
              <span className="party-name">{data.emitente.nome}</span>
              <span className="party-doc">{data.emitente.cnpj ? `CNPJ: ${data.emitente.cnpj}` : ''}</span>
            </div>
          )}
          {data.destinatario?.nome && (
            <div>
              <span className="party-label">Destinatário</span>
              <span className="party-name">{data.destinatario.nome}</span>
              <span className="party-doc">{data.destinatario.cnpj ? `CNPJ: ${data.destinatario.cnpj}` : ''}</span>
            </div>
          )}
        </div>
      </div>

      <div className="table-scroll">
        <table className="items-table">
          <thead>
            <tr>
              <th rowSpan={2}>#</th>
              <th rowSpan={2}>Código</th>
              <th rowSpan={2}>Descrição</th>
              <th rowSpan={2}>NCM</th>
              <th rowSpan={2}>CFOP</th>
              <th rowSpan={2}>Qtde</th>
              <th rowSpan={2}>Vl. Unit.</th>
              <th rowSpan={2}>Vl. Total</th>
              <th colSpan={4} className="group-header group-atual">Tributação Atual</th>
              <th colSpan={4} className="group-header group-nova">Reforma Tributária</th>
              <th rowSpan={2}>Categoria</th>
              <th rowSpan={2}>Difer.</th>
            </tr>
            <tr>
              <th className="group-atual">ICMS</th>
              <th className="group-atual">IPI</th>
              <th className="group-atual">PIS</th>
              <th className="group-atual">COFINS</th>
              <th className="group-nova">CBS</th>
              <th className="group-nova">IBS</th>
              <th className="group-nova">CBS+IBS</th>
              <th className="group-nova">% CBS+IBS</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((item: NFeItem, idx: number) => (
              <tr key={idx} className={item.diferencialCarga !== undefined && item.diferencialCarga > 0 ? 'row-increase' : ''}>
                <td>{item.numero || idx + 1}</td>
                <td className="mono">{item.codigo}</td>
                <td className="desc-col">{item.descricao}</td>
                <td className="mono">{item.ncm}</td>
                <td className="mono">{item.cfop}</td>
                <td className="num">{formatNumber(item.quantidade)}</td>
                <td className="num">{formatCurrency(item.valorUnitario)}</td>
                <td className="num"><strong>{formatCurrency(item.valorTotal)}</strong></td>
                <td className="num group-atual">{formatCurrency(item.icmsValor || 0)}</td>
                <td className="num group-atual">{formatCurrency(item.ipiValor || 0)}</td>
                <td className="num group-atual">{formatCurrency(item.pisValor || 0)}</td>
                <td className="num group-atual">{formatCurrency(item.cofinsValor || 0)}</td>
                <td className="num group-nova">{formatCurrency(item.cbsValor || 0)}</td>
                <td className="num group-nova">{formatCurrency(item.ibsValor || 0)}</td>
                <td className="num group-nova"><strong>{formatCurrency(item.cbsIbsTotal || 0)}</strong></td>
                <td className="num group-nova">{item.cbsAliquota !== undefined ? formatPercent((item.cbsAliquota || 0) + (item.ibsAliquota || 0)) : '-'}</td>
                <td className="small">{item.categoriaTributaria || '-'}</td>
                <td className={`num ${item.diferencialCarga !== undefined && item.diferencialCarga > 0 ? 'text-negative' : 'text-positive'}`}>
                  {formatCurrency(item.diferencialCarga || 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
