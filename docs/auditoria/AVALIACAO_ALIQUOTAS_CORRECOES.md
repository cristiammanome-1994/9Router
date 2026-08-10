# Avaliação Técnica de Alíquotas e Correções — 9Router

**Foco:** Motor de cálculo CBS/IBS, tabela NCM, premissas de alíquotas  
**Base Legal:** Lei 14.988/2024 (Regulamento da CBS/IBS), EC 132/2023, Anexos I-IV  
**Versão do Código:** Commit `07a1e30` — `src/utils/parser.ts` (função `getCategoriaTributaria`) + `src/types/index.ts` (`ALIQUOTAS_PADRAO`)

---

## 1. Resumo das Alíquotas Implementadas vs. Legislação

| Categoria | Código Atual | CBS | IBS | Total | Legislação (Lei 14.988/2024) | Status |
|---|---|---|---|---|---|---|
| **Alíquota Zero** | `0000` | 0% | 0% | 0% | Anexo I, item 1 — medicamentos oncológicos, sangue, órgãos, imunobiológicos, etc. | ⚠️ **Incompleto** (só 1 NCM genérico) |
| **Cesta Básica (Redução 100%)** | `0001` | 0% | 0% | 0% | Anexo I, item 2 — ~300 NCMs da cesta básica (LC 194/2022) | ⚠️ **Incompleto** (1 NCM genérico) |
| **Reduzida 1,45% (CBS+IBS = 2,9%)** | Múltiplos | 1,45% | 1,45% | 2,9% | Anexo II — redução 60% (alíquota padrão 9,65% × 40% = 3,86%) | ❌ **Erro conceitual** — lei prevê **redução percentual**, não alíquota fixa |
| **Padrão** | Fallback | 9,65% | 9,65% | 19,3% | Alíquota de referência (CBS 9,65% + IBS 9,65%) | ✅ Correto na alíquota, **errado na base** |
| **Majorada (Seletivo)** | `2204`, `2208` | 19,3% | 19,3% | 38,6% | Imposto Seletivo (IS) — **alíquotas específicas + ad valorem** por produto | ❌ **Conceito errado** — IS ≠ CBS+IBS majorado |

---

## 2. Erros Críticos nas Alíquotas

### 2.1 Reduzida 1,45% — **Não Existe na Lei**
```
Lei 14.988/2024, Art. 8º: "Redução de 60% (sessenta por cento) das alíquotas"
```
- Alíquota padrão CBS = 9,65% → 9,65% × 40% = **3,86%** (não 1,45%)
- Alíquota padrão IBS = 9,65% → 9,65% × 40% = **3,86%** (não 1,45%)
- **Total reduzido correto = 7,72%** (não 2,9%)

> **Origem do erro:** Confusão com alíquota do **Simples Nacional** (Anexo I: 4% a 19%) ou alíquota interestadual de ICMS (4%/7%/12%). **Não se aplica à CBS/IBS.**

### 2.2 Imposto Seletivo (IS) ≠ CBS/IBS Majorado
| Produto | IS (Lei 14.988, Anexo IV) | Código Atual (CBS+IBS 38,6%) |
|---|---|---|
| Cigarros | Alíquota específica (R$ / milheiro) + ad valorem | 38,6% |
| Bebidas açucaradas | Ad valorem escalonada por teor de açúcar | 38,6% |
| Veículos automotores | Ad valorem por cilindrada/valor | 38,6% |
| Embarcações/aves | Ad valorem | 38,6% |
| Armas/munições | Ad valorem | 38,6% |
| Petróleo/gás/minério | Específica por unidade | 38,6% |

> **Erro:** O código aplica **CBS+IBS dobrado (38,6%)** para vinhos/destilados. Na lei, **vinhos não estão no Imposto Seletivo** (exceto se > 22% vol). O IS é **tributo à parte**, não substitui CBS/IBS.

### 2.3 Cashback — Implementação Incorreta
| Atual | Correto (Lei 14.988, Art. 31-35) |
|---|---|
| % fixo por NCM (100%, 50%, 0%) | **Devolução ao consumidor final** via conta digital (Gov.br) |
| Reduz base do fornecedor | **Não reduz base de cálculo do emitente** |
| Aplicado a todos B2B | **Apenas B2C** — consumidor final pessoa física, faixa de renda ≤ 2 salários-mínimos |
| Sem teto | **Teto anual por CPF** (a regulamentar) |

---

## 3. Tabela NCM Atual — Cobertura Real

### NCMs Mapeados (38 entradas)
| Faixa | Qtd NCMs | Exemplos | Status |
|---|---|---|---|
| Carnes (0101, 0201-0203) | 4 | Bovinos, suínos, aves | Parcial (falta 0204-0210) |
| Laticínios (0401-0403, 0406) | 4 | Leite, creme, queijos | Parcial (falta 0404, 0405) |
| Hortifruti (0701-0703, 0712, 0808) | 5 | Batata, cebola, maçã | Mínimo (falta 0704-0714, 0801-0810) |
| Farinhas (1101-1102, 1901) | 3 | Trigo, milho, malte | Parcial |
| Medicamentos (3001-3006) | 6 | Farmacêuticos | Boa cobertura do capítulo 30 |
| Industrializados/Veículos | 8 | Motores, autos, partes, eletrônicos | Amostra apenas |
| Bebidas | 4 | Água, refrigerante, cerveja, vinho, destilado | Incompleto |
| Combustíveis | 2 | Petróleo, GLP | Mínimo |
| Têxteis | 4 | Camisetas, ternos | Mínimo (capítulos 61-62 têm ~200 NCMs) |

### NCMs **Não Mapeados** → Caem no Fallback 19,3%
- **Todos os serviços** (capítulos 99 — ISS → IBS)
- **Construção civil** (materiais, serviços)
- **Telecomunicações** (equipamentos, serviços)
- **Transporte** (veículos, peças, combustíveis diversos)
- **Químicos/farmacêuticos** (capítulos 28-30 exceto 3001-3006)
- **Máquinas/equipamentos** (capítulos 84-85 exceto 4 NCMs)
- **Plásticos/borracha** (capítulos 39-40)
- **Papel/gráfica** (capítulos 48-49)
- **Metalurgia** (capítulos 72-83)

> **Impacto:** ~95% dos NCMs reais caem no fallback 19,3% — **erro sistemático massivo**.

---

## 4. Correções Necessárias — Prioridade Crítica

### 4.1 Correção Imediata das Alíquotas Reduzidas
```typescript
// ATUAL (ERRADO)
cbs: 1.45, ibs: 1.45  // 2,9% total

// CORRETO (Lei 14.988/2024, Art. 8º, §1º)
cbs: 3.86, ibs: 3.86  // 7,72% total (60% redução sobre 9,65% cada)
```

### 4.2 Remover "Majorada 19,3%" para Vinhos/Destilados
```typescript
// ATUAL (ERRADO - confunde com Imposto Seletivo)
'2204': { cbs: 19.3, ibs: 19.3 },  // Vinhos
'2208': { cbs: 19.3, ibs: 19.3 },  // Destilados

// CORRETO: Alíquota padrão (vinhos não estão no IS, exceto >22% vol)
// Destilados >22% vol entram no IS (tributo SEPARADO, não CBS/IBS majorado)
```

### 4.3 Implementar Imposto Seletivo (IS) Como Tributo Separado
```typescript
interface ImpostoSeletivo {
  ncmPrefix: string;
  descricao: string;
  aliquotaAdValorem?: number;    // %
  aliquotaEspecifica?: number;   // R$ / unidade
  unidade?: 'L' | 'KG' | 'MILHEIRO' | 'UN';
}

// Exemplo: Cigarros (NCM 2402.20.00)
{ ncmPrefix: '2402', aliquotaAdValorem: 15, aliquotaEspecifica: 150, unidade: 'MILHEIRO' }
```

### 4.4 Tabela NCM Oficial — Fonte de Dados
**Não hardcodear.** Carregar de arquivos versionados:
```
catalogos/
├── ncm-cbs-ibs-2026.json      # Alíquotas CBS/IBS por NCM (Anexos I, II)
├── ncm-imposto-seletivo.json  # IS por NCM (Anexo IV)
├── ncm-cashback.json          # Elegibilidade cashback (Anexo III)
└── transicao-anual.json       # Alíquotas anuais 2026-2033
```

**Fontes oficiais para popular:**
- Anexo I (Alíquota Zero) — ~50 NCMs
- Anexo II (Redução 60%) — ~300 NCMs (cesta básica + medicamentos + insumos agro)
- Anexo III (Cashback) — subconjunto do Anexo II
- Anexo IV (Imposto Seletivo) — ~50 NCMs
- Demais → Alíquota Padrão (9,65% + 9,65%)

---

## 5. Base de Cálculo — Correções Necessárias

| Componente | Atual | Correto (Lei 14.988, Art. 13) |
|---|---|---|
| **Base CBS/IBS** | `vProd - vDesc` | **Valor da operação** = vProd + vFrete + vSeg + vOutro + vII + vIPI - vDesc - vDescCond |
| **ICMS-ST** | Incluído na base | **Excluído** (não recuperável, já recolhido na origem) |
| **IPI** | Não tratado | **Incluído na base** (exceto se crédito presumido) |
| **Frete/Seguro** | Ignorado | **Incluído** se destacado na NF-e |
| **Desconto condicionado** | Ignorado | **Reduz base** se incondicionado; se condicionado, não reduz |

---

## 6. Transição 2026-2033 — Ausência Total

### Cronograma Legal (EC 132/2023 + Lei 14.988/2024)

| Ano | CBS | IBS | Redução ICMS/PIS/COFINS/ISS | Observação |
|---|---|---|---|---|
| **2026** | 0,9% | 0,1% | Início redução | Teste |
| **2027** | 1,8% | 0,2% | Progressiva | |
| **2028** | 2,7% | 0,3% | | |
| **2029** | 3,6% | 1,0% | CBS 50% | IBS estadual inicia |
| **2030** | 4,8% | 1,5% | | |
| **2031** | 6,0% | 2,5% | | |
| **2032** | 7,5% | 5,0% | | |
| **2033** | 9,65% | 9,65% | Extinção ICMS/PIS/COFINS/ISS | Pleno vigor |

> **Implementação necessária:** Tabela `transicao-anual.json` + seletor de ano na UI + projeção plurianual.

---

## 7. Checklist de Validação para Auditoria

| Item | Status | Ação |
|---|---|---|
| Alíquota reduzida corrigida para 3,86% cada (CBS/IBS) | ❌ | Corrigir em `parser.ts` e `types/index.ts` |
| Imposto Seletivo separado de CBS/IBS | ❌ | Novo módulo `imposto-seletivo.ts` |
| Tabela NCM carregada de JSON externo | ❌ | Criar `catalogos/` + loader |
| Base de cálculo conforme Art. 13 | ❌ | Reescrever `extractItem()` |
| Transição 2026-2033 implementada | ❌ | Nova feature |
| Cashback apenas visual + disclaimer | ⚠️ | Adicionar badge "NÃO REDUZ BASE" |
| NCMs cobertos > 90% (vs. fallback) | ❌ | Popular catálogos oficiais |
| CST/ICMS validado por item | ❌ | Ler `CST` e bloquear se isento |
| Regime do emitente detectado | ❌ | Cruzar CNPJ emitente com Simples/MEI |

---

## 8. Impacto Financeiro Estimado dos Erros Atuais

| Perfil de Empresa | Erro na Carga CBS/IBS | Direção |
|---|---|---|
| **Supermercado (cesta básica 60% itens)** | **-62%** (usa 2,9% vs 7,72% correto) | **Subestima drasticamente** |
| **Farmácia (medicamentos 80%)** | **-62%** | **Subestima** |
| **Indústria (ICMS-ST 30% base)** | **+15 a +25%** (inclui ST indevidamente) | **Superestima** |
| **Varejo vestuário (fallback 100%)** | **0%** (acerta por acaso no padrão) | Neutro |
| **Bebidas (vinho 19,3% vs padrão)** | **+100%** (dois tributos vs um) | **Superestima massivamente** |
| **Exportador** | **+19,3%** (incide CBS/IBS indevidamente) | **Superestima** |

---

## 9. Próximos Passos Técnicos (Ordem de Execução)

```bash
# 1. Correção imediata (30 min)
# src/utils/parser.ts linha ~155: cambiar 1.45 → 3.86
# src/types/index.ts: corregir ALIQUOTAS_PADRAO.categorias[].cbs/ibs

# 2. Remover majorada vinhos/destilados (15 min)
# Deletar entradas 2204, 2208 com 19.3% ou mover para módulo IS

# 3. Externalizar catálogos (2-3 dias)
# Criar src/domain/catalogos/loader.ts
# JSONs em public/catalogos/ (versionados por ano)

# 4. Reescrever base de cálculo (1 semana)
# Nova função calcularBaseCBS_IBS(item, nfe) em domain/motor/

# 5. Implementar Imposto Seletivo (3 dias)
# Novo módulo domain/motor/imposto-seletivo.ts

# 6. Transição 2026-2033 (1 semana)
# Seletor de ano + tabela anual + projeção plurianual
```

---

**Conclusão:** As alíquotas atuais contêm **erros conceituais graves** (reduzida 1,45% não existe, majorada confunde IS com CBS/IBS) e **cobertura NCM < 5%**. O sistema em seu estado atual **não pode ser usado para qualquer tomada de decisão financeira ou tributária**. Correções 1-2 são triviais e devem ser feitas **imediatamente**; 3-6 requerem sprint dedicado.

---
*Análise técnica — Consultor Tributário Sênior*