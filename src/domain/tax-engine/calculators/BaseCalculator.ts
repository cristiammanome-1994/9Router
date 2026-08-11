// Base Calculator - C06: Cálculo da base de CBS/IBS conforme Art. 13 Lei 14.988/2024
// Separa componentes da base e exclui ICMS-ST, DIFAL, FCP

import type { BaseCalculoItem, ResultadoCalculoItem, NCMConfig, CFOPConfig } from '../types';

export class BaseCalculator {
  /**
   * Calcula a base de CBS/IBS conforme Art. 13 Lei 14.988/2024
   * Base = valor da operação = vProd + frete + seguro + outras despesas + II + IPI - desconto incondicionado - desconto condicionado
   * EXCLUI: ICMS-ST, DIFAL, FCP
   */
  static calcularBaseCalculo(
    produto: {
      vProd: number;
      vFrete?: number;
      vSeg?: number;
      vOutro?: number;
      vII?: number;
      vIPI?: number;
      vDesc?: number;
      vDescCond?: number;
      vICMSST?: number; // ICMS Substituição Tributária
      vICMSDIFAL?: number; // DIFAL
      vFCP?: number; // Fundo de Combate à Pobreza
      vICMSSTRet?: number; // ICMS-ST Retido
    },
    ncmConfig: any,
    cfopConfig: any
  ): { baseCalculo: BaseCalculoItem; alertas: string[] } {
    const alertas: string[] = [];

    const valorProduto = produto.vProd || 0;
    const frete = produto.vFrete || 0;
    const seguro = produto.vSeg || 0;
    const outrasDespesas = produto.vOutro || 0;
    const ii = produto.vII || 0;
    const ipi = produto.vIPI || 0;
    const descontoIncondicionado = produto.vDesc || 0;
    const descontoCondicionado = produto.vDescCond || 0;
    const icmsSt = produto.vICMSST || 0;
    const difal = produto.vICMSDIFAL || 0;
    const fcp = produto.vFCP || 0;
    const icmsStRet = produto.vICMSSTRet || 0;

    // Componentes que COMPÕEM a base (Art. 13)
    const incluiFrete = frete > 0;
    const incluiSeguro = seguro > 0;
    const incluiOutrasDespesas = outrasDespesas > 0;
    const incluiII = ii > 0;
    const incluiIPI = ipi > 0;
    const excluiDescontoIncondicionado = descontoIncondicionado > 0;
    const excluiDescontoCondicionado = descontoCondicionado > 0;

    // Componentes que NÃO compõem a base (devem ser EXCLUÍDOS)
    const excluiICMSST = icmsSt > 0 || icmsStRet > 0;
    const excluiDIFAL = difal > 0;
    const excluiFCP = fcp > 0;

    // Cálculo da base
    let valorOperacao = valorProduto;
    if (incluiFrete) valorOperacao += frete;
    if (incluiSeguro) valorOperacao += seguro;
    if (incluiOutrasDespesas) valorOperacao += outrasDespesas;
    if (incluiII) valorOperacao += ii;
    if (incluiIPI) valorOperacao += ipi;
    if (excluiDescontoIncondicionado) valorOperacao -= descontoIncondicionado;
    if (excluiDescontoCondicionado) valorOperacao -= descontoCondicionado;

    // NÃO subtrair ICMS-ST, DIFAL, FCP da base (eles não compõem a base)
    // Mas alertar se presentes
    if (excluiICMSST) {
      alertas.push(`ICMS-ST (R$ ${icmsSt.toFixed(2)}${icmsStRet > 0 ? ` + ST Retido R$ ${icmsStRet.toFixed(2)}` : ''}) NÃO compõe base CBS/IBS (Art. 13)`);
    }
    if (excluiDIFAL) {
      alertas.push(`DIFAL (R$ ${difal.toFixed(2)}) NÃO compõe base CBS/IBS (Art. 13)`);
    }
    if (excluiFCP) {
      alertas.push(`FCP (R$ ${fcp.toFixed(2)}) NÃO compõe base CBS/IBS (Art. 13)`);
    }

    const baseCalculo: BaseCalculoItem = {
      valorProduto,
      frete,
      seguro,
      outrasDespesas,
      ii,
      ipi,
      descontoIncondicionado,
      descontoCondicionado,
      icmsSt,
      difal,
      fcp,
      valorOperacao: Math.max(0, valorOperacao),
      componentes: {
        incluiFrete,
        incluiSeguro,
        incluiOutrasDespesas,
        incluiII,
        incluiIPI,
        excluiDescontoIncondicionado,
        excluiDescontoCondicionado,
        excluiICMSST: excluiICMSST,
        excluiDIFAL: excluiDIFAL,
        excluiFCP: excluiFCP,
      },
    };

    return { baseCalculo, alertas };
  }

  /**
   * Extrai dados do XML para cálculo da base
   */
  static extrairDadosProduto(prod: any): {
    vProd: number;
    vFrete: number;
    vSeg: number;
    vOutro: number;
    vII: number;
    vIPI: number;
    vDesc: number;
    vDescCond: number;
    vICMSST: number;
    vICMSDIFAL: number;
    vFCP: number;
    vICMSSTRet: number;
  } {
    const getNum = (obj: any, path: string[]) => {
      let current = obj;
      for (const key of path) {
        if (current && typeof current === 'object' && key in current) {
          current = current[key];
        } else {
          return 0;
        }
      }
      const n = parseFloat(String(current).replace(',', '.'));
      return isNaN(n) ? 0 : n;
    };

    return {
      vProd: getNum(prod, ['vProd']),
      vFrete: getNum(prod, ['vFrete']),
      vSeg: getNum(prod, ['vSeg']),
      vOutro: getNum(prod, ['vOutro']),
      vII: getNum(prod, ['vII']),
      vIPI: getNum(prod, ['vIPI']),
      vDesc: getNum(prod, ['vDesc']),
      vDescCond: getNum(prod, ['vDescCond']),
      vICMSST: getNum(prod, ['vICMSST']) || getNum(prod, ['vICMSSTRet']),
      vICMSDIFAL: getNum(prod, ['vICMSDIFAL']),
      vFCP: getNum(prod, ['vFCP']),
      vICMSSTRet: getNum(prod, ['vICMSSTRet']),
    };
  }

  /**
   * Gera string de auditoria da base de cálculo
   */
  static gerarAuditoriaBase(base: BaseCalculoItem): string {
    const partes: string[] = [];
    partes.push(`Produto: ${base.valorProduto.toFixed(2)}`);
    if (base.frete > 0) partes.push(`+ Frete: ${base.frete.toFixed(2)}`);
    if (base.seguro > 0) partes.push(`+ Seguro: ${base.seguro.toFixed(2)}`);
    if (base.outrasDespesas > 0) partes.push(`+ Outras despesas: ${base.outrasDespesas.toFixed(2)}`);
    if (base.ii > 0) partes.push(`+ II: ${base.ii.toFixed(2)}`);
    if (base.ipi > 0) partes.push(`+ IPI: ${base.ipi.toFixed(2)}`);
    if (base.descontoIncondicionado > 0) partes.push(`- Desc. incond.: ${base.descontoIncondicionado.toFixed(2)}`);
    if (base.descontoCondicionado > 0) partes.push(`- Desc. cond.: ${base.descontoCondicionado.toFixed(2)}`);
    if (base.icmsSt > 0) partes.push(`(ICMS-ST ${base.icmsSt.toFixed(2)} excluído)`);
    if (base.difal > 0) partes.push(`(DIFAL ${base.difal.toFixed(2)} excluído)`);
    if (base.fcp > 0) partes.push(`(FCP ${base.fcp.toFixed(2)} excluído)`);
    partes.push(`= Base CBS/IBS: ${base.valorOperacao.toFixed(2)}`);
    return partes.join(' ');
  }
}

export default BaseCalculator;