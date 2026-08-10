# Relatório de Auditoria — Lógica Tributária do 9Router

**Projeto:** 9Router — Analisador XML da Reforma Tributária  
**Data da Auditoria:** 2025  
**Versão do Código Analisado:** Scaffold inicial (Vite + React + TypeScript)  
**Status:** **Somente leitura — nenhuma alteração realizada nos arquivos**

---

## Sumário

1. [Visão Geral do Projeto](#1-visão-geral-do-projeto)
2. [Mapa de Arquivos e Funções](#2-mapa-de-arquivos-e-funções)
3. [Detalhamento por Grandeza Tributária](#3-detalhamento-por-grandeza-tributária)
4. [Regras Tributárias Hardcoded](#4-regras-tributárias-hardcoded)
5. [Premissas Utilizadas](#5-premissas-utilizadas)
6. [Possíveis Inconsistências](#6-possíveis-inconsistências)
7. [Pontos que Precisam de Validação Tributária](#7-pontos-que-precisam-de-validação-tributária)
8. [Sugestões de Arquitetura](#8-sugestões-de-arquitetura---separar-motor-tributário-da-ui)
9. [Resumo Executivo](#9-resumo-executivo)

---

## 1. Visão Geral do Projeto

O **9Router** é uma aplicação web (React + Vite + TypeScript) que permite o upload de arquivos XML de NF-e (modelo 55) e apresenta um comparativo lado a lado entre:

- **Tributação atual:** ICMS, IPI, PIS, COFINS (valores extraídos diretamente do XML autorizado pela SEFAZ)
- **Reforma Tributária (Lei 14.988/2024 + EC 132/2023):** CBS (Contribuição sobre Bens e Serviços — federal) e IBS (Imposto sobre Bens e Serviços — estadual + municipal)

A interface exibe:
- Cards de resumo (valor total, carga atual, carga nova, diferencial, CBS total, IBS total)
- Tabela detalhada por item com todos os impostos
- Abas para múltiplos documentos
- Área de upload drag-and-drop

---

## 2. Mapa de Arquivos e Funções

| Responsabilidade | Arquivo | Função / Componente |
|---|---|---|
| Definição de tipos tributários | `src/types/index.ts` | Interfaces `NFeItem`, `NFeTotais`, `NFeData`, `ParseResult`, `UploadResult` |
| Parser XML principal | `src/utils/parser.ts` | `parseNFeXml()` |
| Extração de cada item | `src/utils/parser.ts` | `extractItem()` |
| Classificação por NCM | `src/utils/parser.ts` | `getCategoriaTributaria()` |
| Cálculo de cashback | `src/utils/parser.ts` | `getCashback()` |
| Helpers de extração | `src/utils/parser.ts` | `num()`, `str()`, `get()` |
| Renderização de totais | `src/components/SummaryCards.tsx` | `Card`, `SummaryCards` |
| Renderização por item | `src/components/ItemTable.tsx` | `ItemTable` |
| Abas de documentos / erros | `src/components/DocumentTabs.tsx` | `DocumentTabs`, `ErrorList` |
| Upload de arquivos | `src/components/FileUpload.tsx` | `FileUpload` |
| Formatação de exibição | `src/utils/format.ts` | `formatCurrency`, `formatPercent`, `formatNumber`, `formatDate` |
| Componente principal | `src/App.tsx` | `App` (estado, orquestração) |
| Estilos | `src/App.css`, `src/index.css` | Tema dark, layout responsivo |

---

## 3. Detalhamento por Grandeza Tributária

### 3.1 Leitura do XML

- **Arquivo:** `src/utils/parser.ts`
- **Função:** `parseNFeXml()` (linhas 215–284)
- **Biblioteca:** `fast-xml-parser` v5.10.1 (instanciado em `parser.ts:13–17` com `ignoreAttributes: false`, `attributeNamePrefix: '@_'`, `isArray` forçando array em `det`, `DI`, `adi`)
- **Caminhos XML aceitos:**
  - `nfeProc/NFe/infNFe` (NF-e autorizada, padrão)
  - `NFe/infNFe` (fallback)
  - `infNFe` direto (fallback adicional)
- **Nós lidos:**
  - `ide` → nNF, serie, dhEmi
  - `emit` / `dest` → xNome, CNPJ, IE, enderEmit/enderDest (UF, xMun)
  - `det[]` → cada item da nota
  - `total/ICMSTot` → **extraído mas não utilizado** (ver inconsistência #1)

---

### 3.2 Identificação dos Itens

- **Arquivo:** `src/utils/parser.ts`
- **Função:** `extractItem()` (linhas 153–213)
- **Campos extraídos do XML (`prod`):**
  | Campo XML | Propriedade no Objeto |
  |---|---|
  | `cProd` | `codigo` |
  | `xProd` | `descricao` |
  | `NCM` | `ncm` |
  | `CFOP` | `cfop` |
  | `qCom` / `qTrib` | `quantidade` |
  | `uCom` / `uTrib` | `unidade` |
  | `vUnCom` / `vUnTrib` | `valorUnitario` |
  | `vProd` | `valorTotal` |
  | `vDesc` | `desconto` |

- **Observação:** O parser assume 1 `det` = 1 linha de resultado. Sub-elementos como `rastro`, `med`, `arma`, `veicProd` são ignorados.

---

### 3.3 NCM e CFOP

| Campo | Origem | Uso no Cálculo |
|---|---|---|
| **NCM** | `prod/NCM` | **Chave primária de classificação** — define alíquotas CBS/IBS e cashback |
| **CFOP** | `prod/CFOP` | Apenas exibido na tabela; **não influencia nenhum cálculo** |

---

### 3.4 ICMS

- **Extração:** `extractItem()` linhas 158–163
- **XML lido:** `imposto/ICMS/<grupo>/vBC`, `pICMS`, `vICMS`
- **Heurística:** `Object.values(ICMS)[0]` assume o primeiro grupo encontrado
- **Grupos possíveis (não validados):** ICMS00, ICMS10, ICMS20, ICMS30, ICMS40, ICMS51, ICMS60, ICMS70, ICMS90, ICMSPart, ICMSSN101, ICMSSN102, ICMSUFDest, etc.
- **Fórmula:** **Nenhum recálculo** — lê `vICMS` direto do XML
- **Alíquota:** Lida do XML (`pICMS`), não aplicada
- **Valor final:** `item.icmsValor` → somado em `cargaTributariaAtual`

---

### 3.5 IPI

- **Extração:** `extractItem()` linhas 163–164
- **XML lido:** `imposto/IPI/IPITrib/pIPI`, `vIPI` (fallback para `pIPI`/`vIPI` direto)
- **Fórmula:** Lê `vIPI` direto do XML
- **Limitação:** Itens com `IPINT` (não tributado) podem retornar 0 silenciosamente

---

### 3.6 PIS

- **Extração:** `extractItem()` linhas 164–166
- **XML lido:** `imposto/PIS/<grupo>/pPIS`, `vPIS`
- **Heurística:** `Object.values(PIS)[0]` — grupos: PISAliq, PISQtde, PISNT, PISOutr, PISST, etc.
- **Fórmula:** Lê `vPIS` direto do XML

---

### 3.7 COFINS

- **Extração:** `extractItem()` linhas 166–168
- **XML lido:** `imposto/COFINS/<grupo>/pCOFINS`, `vCOFINS`
- **Heurística:** Idêntica ao PIS (`Object.values(COFINS)[0]`)
- **Fórmula:** Lê `vCOFINS` direto do XML

---

### 3.8 CBS (Contribuição sobre Bens e Serviços — Federal)

- **Cálculo:** `extractItem()` linhas 183–186
- **Dados do XML utilizados:** Apenas `NCM` (classificação) + `vProd` e `vDesc` (base)
- **Fórmula:**
  ```typescript
  baseCalculo = item.valorTotal - item.desconto          // parser.ts:183
  cbsValor    = baseCalculo * (categoria.cbs / 100)      // parser.ts:184
  ```
- **Alíquotas (vindas de `getCategoriaTributaria`):**
  | Categoria | CBS |
  |---|---|
  | Alíquota Zero | 0% |
  | Reduzida (carnes, laticínios, hortifruti, farinhas, medicamentos) | 1,45% |
  | Padrão (industrializados, eletrônicos, veículos, têxteis, combustíveis, bebidas não alcoólicas) | 9,65% |
  | Majorada (vinhos, destilados) | 19,30% |
- **Valor final por item:** `item.cbsValor`
- **Total da nota:** `cbsTotal = soma(item.cbsValor)` (`parseNFeXml()` linha 243)

---

### 3.9 IBS (Imposto sobre Bens e Serviços — Estadual + Municipal)

- **Cálculo:** `extractItem()` linhas 185–186
- **Fórmula:** Idêntica ao CBS, multiplicada por `categoria.ibs`
- **⚠️ Crítico:** O código trata IBS como **alíquota única nacional** idêntica à CBS. Na legislação real:
  - IBS = IBS Estadual + IBS Municipal
  - Alíquotas variam por UF e município
  - Existe **alíquota de referência do CONFAZ** (CFC — Comitê Federativo do IBS)
  - A partilha entre Estados/Municípios depende da operação (origem/destino, CFOP)
- **Valor final por item:** `item.ibsValor`
- **Total da nota:** `ibsTotal = soma(item.ibsValor)` (`parseNFeXml()` linha 244)

---

### 3.10 Classificação / Categoria Tributária

- **Arquivo:** `src/utils/parser.ts`
- **Função:** `getCategoriaTributaria()` (linhas 56–130)
- **Mecânica:** Tabela hardcoded indexada pelos **4 primeiros dígitos do NCM** (após remover não-dígitos)
- **Categorias implementadas (~30 entradas):**

| Prefixo NCM | Descrição | CBS | IBS |
|---|---|---|---|
| `0000` | Alíquota Zero (Anexo I, item 1) | 0% | 0% |
| `0001` | Cesta Básica (redução) | 0% | 0% |
| `0101`, `0201`, `0202`, `0203` | Carnes frescas | 1,45% | 1,45% |
| `0401`, `0402`, `0403`, `0406` | Leite e laticínios | 1,45% | 1,45% |
| `0701`, `0702`, `0703`, `0712`, `0808` | Hortifruti / frutas | 1,45% | 1,45% |
| `1101`, `1102`, `1901` | Farinhas e cereais | 1,45% | 1,45% |
| `3001`–`3006` | Medicamentos | 1,45% | 1,45% |
| `8408`, `8703`, `8708`, `8471`, `8517`, `8528` | Industrializados, veículos, eletrônicos | 9,65% | 9,65% |
| `2201`, `2202`, `2203` | Águas, bebidas não alcoólicas, cerveja | 9,65% | 9,65% |
| `2204`, `2208` | Vinhos, destilados | 19,30% | 19,30% |
| `2710`, `2711` | Combustíveis, GLP | 9,65% | 9,65% |
| `6109`, `6201`, `6203`, `6204` | Vestuário e têxteis | 9,65% | 9,65% |

- **Fallback (linha 130):** Qualquer NCM não mapeado → `{ cbs: 9.65, ibs: 9.65, descricao: 'Alíquota Padrão' }`
- **Cashback (apenas descritivo):** Adicionado à `descricao` da categoria se > 0 (linhas 196–198)

---

### 3.11 Cashback

- **Arquivo:** `src/utils/parser.ts`
- **Função:** `getCashback()` (linhas 134–145)
- **Lógica:** Verifica os **2 primeiros dígitos do NCM**:
  - `01, 02, 03, 04, 07, 08, 09, 10, 11, 15, 16, 17` → 100% (cesta básica)
  - `30, 90` → 50% (saúde/medicamentos)
  - `48, 49, 95` → 100% (educação/livros)
  - Demais → 0%
- **⚠️ Crítico:** O cashback **é apenas exibido na string `categoriaTributaria`** (ex.: `"Carnes Frescas (Cashback: 100%)"`). **Nenhum cálculo monetário é aplicado** — não reduz `cbsValor`, `ibsValor` nem `diferencialCarga`.

---

### 3.12 Diferencial de Carga

- **Por item** (`extractItem()` linhas 191–192):
  ```typescript
  cargaTributariaAtual = icmsValor + ipiValor + pisValor + cofinsValor
  cargaTributariaNova  = cbsValor + ibsValor
  diferencialCarga     = cargaTributariaNova - cargaTributariaAtual
  ```
- **Total da nota** (`parseNFeXml()` linhas 245–247):
  ```typescript
  cargaTributariaAtual = soma(icms + ipi + pis + cofins)
  cargaTributariaNova  = cbsTotal + ibsTotal
  diferencialTotal     = cargaTributariaNova - cargaTributariaAtual
  ```
- **Exibição:** Cards de resumo (`SummaryCards`) + coluna "Difer." na tabela (`ItemTable`)

---

### 3.13 Bases de Cálculo dos Cards de Resumo

| Card | Fórmula | Origem |
|---|---|---|
| **Valor Total da Nota** | `soma(vProd) - soma(vDesc)` | `parseNFeXml()` linhas 235–237 |
| **Carga Tributária Atual** | `ICMS + IPI + PIS + COFINS` | linhas 238–242, 245 |
| **Carga Nova (CBS + IBS)** | `cbsTotal + ibsTotal` | linhas 243–244, 246 |
| **Diferencial de Carga** | `Nova - Atual` | linha 247 |
| **CBS Total** | `soma(item.cbsValor)` | linha 243 |
| **IBS Total** | `soma(item.ibsValor)` | linha 244 |

---

## 4. Regras Tributárias Hardcoded

Todas localizadas em `src/utils/parser.ts`:

| Linha | Regra | Valor Hardcoded |
|---|---|---|
| 42 | Alíquota Zero (Anexo I, item 1) | `cbs: 0, ibs: 0` |
| 43 | Cesta Básica (redução) | `cbs: 0, ibs: 0` |
| 45–48 | Carnes frescas | 1,45% |
| 49–53 | Laticínios | 1,45% |
| 54–58 | Hortifruti / frutas | 1,45% |
| 59–62 | Farinhas e cereais | 1,45% |
| 63–69 | Medicamentos | 1,45% |
| 70–76 | Industrializados, eletrônicos, veículos | 9,65% |
| 77–80 | Bebidas não alcoólicas, cerveja | 9,65% |
| 81–82 | Vinhos, destilados | 19,30% |
| 83–84 | Combustíveis, GLP | 9,65% |
| 85–88 | Vestuário e têxteis | 9,65% |
| 89–90 | Cashback — cesta básica (NCM 01, 02, 03, 04, 07, 08, 09, 10, 11, 15, 16, 17) | 100% |
| 93–94 | Cashback — saúde (NCM 30, 90) | 50% |
| 95–96 | Cashback — educação (NCM 48, 49, 95) | 100% |
| 130 | **Fallback padrão para NCM não mapeado** | `cbs: 9.65, ibs: 9.65` |
| 183 | Base de cálculo CBS/IBS | `vProd - vDesc` (sem frete, seguro, IPI embutido, ICMS-ST, DIFAL) |
| 191–192 | Fórmula do diferencial | Subtração simples |

---

## 5. Premissas Utilizadas

1. **Modelo de documento:** Apenas NF-e modelo 55 (não lê NFC-e modelo 65, CT-e modelo 57, NFS-e, DI)
2. **Estrutura XML:** Espera `nfeProc` (XML autorizado pela SEFAZ). XMLs de contingência, cancelados ou denegados não têm a mesma estrutura.
3. **Base CBS/IBS:** `valor do produto - desconto` — não separa fretes, seguros, IPI embutido, ICMS-ST, DIFAL, FCP, fundo de pobreza.
4. **IBS unificado:** Trata IBS como alíquota única nacional idêntica à CBS. Ignora divisão IBS Estadual + IBS Municipal + alíquota de referência CFC.
5. **Alíquotas fixas:** Usa valores da Lei 14.988/2024 como se fossem definitivos. Não modela o **período de transição 2026–2033** (alíquotas escalonadas + reduções graduais dos tributos atuais).
6. **Cashback descritivo:** Apenas string na categoria; sem impacto monetário.
7. **Granularidade:** 1 `det` = 1 linha de cálculo. Não rateia despesas acessórias por item.
8. **CFOP neutro:** Não influencia classificação nem alíquota.
9. **Regime único:** Assume regime geral (não Simples Nacional, não imune, não isento, não Zona Franca).
10. **Não-cumulatividade:** Não modelada — no mundo real, CBS/IBS pagos em insumos geram crédito.

---

## 6. Possíveis Inconsistências

| # | Inconsistência | Local | Impacto |
|---|---|---|---|
| 1 | `ICMSTot` extraído mas **nunca utilizado** | `parser.ts:222` | Código morto; poderia validar totais |
| 2 | **IBS não é dual** (estadual + municipal) | `parser.ts:185` | Cálculo incorreto para operações interestaduais; partilha errada |
| 3 | **Alíquota IBS constante** — não varia por UF/destinatário | `getCategoriaTributaria()` | Resultado divergente da realidade federativa |
| 4 | **Fallback silencioso** 9,65% para NCM não mapeado | `parser.ts:130` | Mascara produtos com alíquota reduzida/zero sem aviso |
| 5 | **CFOP não participa** do cálculo | — | Operações de transferência, devolução, exportação tratadas igual a venda |
| 6 | **ISS não considerado** (vira IBS municipal na Reforma) | — | Serviços não aparecem; carga subestimada para prestadores |
| 7 | **ICMS-ST, DIFAL, FCP, Fundo Pobreza** ignorados | — | Carga "atual" subestimada em operações com ST |
| 8 | **Cashback fictício** — só string, sem efeito monetário | `parser.ts:196–198` | Usuário pode achar que haverá restituição que não existe no cálculo |
| 9 | **Não há créditos tributários** (não-cumulatividade) | — | Carga "nova" superestimada vs. efetiva para empresas |
| 10 | **Transição 2026–2033 ignorada** — troca binária instantânea | — | Cenário irreal; alíquotas reais variam anualmente |
| 11 | **Heurística `Object.values(ICMS)[0]` frágil** | `parser.ts:158` | Falha se houver ICMS + ICMSUFDest simultâneos |
| 12 | **NFS-e, DI, CT-e não suportados** | — | Escopo limitado a mercadorias (NF-e) |
| 13 | **Operações interestaduais** — partilha IBS não modelada | — | Resultado incorreto para vendas entre estados |
| 14 | **Imunidades, isenções, não-incidência** (CST específicos) não tratadas | — | Itens com CST 40, 41, 50, 60, etc. calculados como tributados |

---

## 7. Pontos que Precisam de Validação Tributária (Especialista / Contábil)

| # | Tópico | Por que Precisa de Validação |
|---|---|---|
| 1 | **Tabela completa NCM × alíquotas CBS/IBS** | Hoje ~30 entradas; Anexo da Lei lista centenas |
| 2 | **Lista de alíquota zero (Anexo I, item 1)** | Só 2 NCMs (`0000`, `0001`) — incompleta |
| 3 | **Lista de redução 50% (Anexo II)** | **Não existe no código** |
| 4 | **Lista de alíquota majorada** (bebidas alcoólicas, cigarros, armas, veículos de luxo, etc.) | Só vinhos/destilados cobertos |
| 5 | **Serviços que migram para IBS (LC 116/2003)** | Não há tratamento para ISS |
| 6 | **Cashback — produtos, percentuais, elegibilidade (renda do consumidor)** | Código aplica 100% em qualquer NCM "alimento"; lei tem teto de renda |
| 7 | **Não-cumulatividade — como tratar créditos de insumos** | Não modelado; afeta carga efetiva |
| 8 | **Período de transição 2026–2033** | Tabela temporal de alíquotas anuais + reduções ICMS/PIS/COFINS |
| 9 | **Operações interestaduais e partilha de IBS** | Regras de destino vs. origem |
| 10 | **Exportações e imunidades** | Não tratado |
| 11 | **Imunidade recíproca** (entes públicos, templos, partidos) | Não tratado |
| 12 | **Simples Nacional** — regime próprio com alíquotas diferenciadas | Não tratado |
| 13 | **Zona Franca de Manaus / Áreas de Livre Comércio** | Não tratado |

---

## 8. Sugestões de Arquitetura — Separar Motor Tributário da UI

### 8.1 Problema Atual
Toda regra tributária está misturada com parsing XML em `parser.ts` (≈300 linhas). Dificulta testes, auditoria, manutenção e evolução.

### 8.2 Estrutura Proposta

```
src/
├── domain/                          # Regras puras — ZERO dependências React/IO
│   ├── tipos/
│   │   ├── nfe.ts                   # Tipos de domínio (NFeItem, NFeTotais, etc.)
│   │   └── tributario.ts            # CBS, IBS, Alíquota, Categoria, Regime, Cashback
│   ├── parsers/
│   │   ├── nfe-parser.ts            # SOMENTE extração XML → estrutura crua
│   │   └── map-xml-para-item.ts     # Conversor: XML bruto → NFeItem (sem cálculo)
│   ├── motor/
│   │   ├── classificador-ncm.ts     # NCM → Categoria (puro, testável)
│   │   ├── tabela-cbs-ibs.ts        # Tabela de alíquotas (carrega de JSON/CSV)
│   │   ├── tabela-cashback.ts       # Tabela de cashback (carrega de JSON/CSV)
│   │   ├── calculadora-carga-atual.ts   # ICMS + IPI + PIS + COFINS (soma valores XML)
│   │   ├── calculadora-reforma.ts       # CBS + IBS (aplica alíquotas da tabela)
│   │   ├── diferencial.ts           # Comparativo: nova - atual
│   │   └── regimes/
│   │       ├── geral.ts
│   │       ├── simples-nacional.ts
│   │       ├── imune-isento.ts
│   │       └── zona-franca.ts
│   └── catalogos/                   # Dados versionados (JSON/CSV)
│       ├── ncm-cbs-ibs-2026.json
│       ├── ncm-cbs-ibs-2027.json
│       ├── ncm-cashback.json
│       ├── cfop-operacoes.json
│       └── transicao-anual.json
├── services/                        # Casos de uso — orquestra domain + IO
│   ├── analisar-nfe.ts              # Use case principal: arquivo → resultado
│   └── importar-tabelas.ts          # Carrega catalogos do disco/remote
├── hooks/                           # Adapters React
│   └── use-analise-nfe.ts           # Conecta FileUpload → service → estado
├── components/                      # UI PURA — recebe NFeData, NÃO XML
│   ├── upload/FileUpload.tsx
│   ├── resumo/SummaryCards.tsx
│   ├── tabela/ItemTable.tsx
│   ├── abas/DocumentTabs.tsx
│   └── classificacao/CategoriaBadge.tsx
└── utils/
    └── format.ts
```

### 8.3 Benefícios

| Benefício | Descrição |
|---|---|
| **Testabilidade** | `classificador-ncm.ts` vira função pura `ncm → Categoria`. Cobertura 100% unitária trivial. |
| **Manutenibilidade** | Atualizar alíquota = editar JSON/CSV versionado, não código. Deploy sem rebuild se tabelas externas. |
| **Auditabilidade** | Fisco/Contador audita `domain/motor/` isoladamente — sem JSX, sem parser XML. |
| **Reaproveitamento** | Mesmo motor serve para: upload web, API REST, CLI batch, job agendado, worker filas. |
| **Versionamento de tabelas** | `ncm-cbs-ibs-2026.json`, `…-2027.json`, `…-2033.json` — simula transição ano a ano. |
| **Troca de regime** | Implementar Simples Nacional = criar `regimes/simples-nacional.ts` e plugar no use case. |
| **Separação cálculo vs. crédito** | `calculadora-reforma.ts` (simulação) ≠ `calculadora-creditos.ts` (não-cumulatividade real). |
| **CI/CD** | Testes do motor rodam em segundos; UI testada separadamente (E2E). |

---

## 9. Resumo Executivo

| Aspecto | Status Atual | Risco |
|---|---|---|
| **Extração XML (atuais)** | ✅ Funcional — lê ICMS, IPI, PIS, COFINS direto do XML autorizado | Baixo |
| **Classificação NCM** | ⚠️ Embrionária (~30 NCMs) + fallback silencioso 9,65% | **Alto** — erro sistemático em massa |
| **CBS (federal)** | ⚠️ Fórmula simplificada, base `vProd - vDesc` | Médio |
| **IBS (estadual+municipal)** | ❌ **Incorreto** — tratado como alíquota única nacional idêntica à CBS | **Crítico** |
| **Cashback** | ❌ Apenas descritivo, sem efeito monetário | Médio |
| **Diferencial de carga** | ⚠️ Subtração simples, ignora créditos, ST, DIFAL, ISS, transição | **Alto** |
| **Período de transição** | ❌ Não modelado | **Alto** |
| **Regimes especiais** | ❌ Não tratados (Simples, Imune, ZFM, Exportação) | Médio/Alto |
| **Arquitetura** | ❌ Motor misturado com parser + UI | Técnico — dívida arquitetural |

### Próximos Passos Recomendados

1. **Isolar o motor** em `domain/motor/` (conforme seção 8) **antes de qualquer exposição a clientes**.
2. **Substituir tabela hardcoded** por arquivos `catalogos/ncm-cbs-ibs-YYYY.json` versionados anualmente.
3. **Implementar IBS dual** (estadual + municipal) com tabela de alíquotas de referência por UF (CFC).
4. **Modelar transição 2026–2033** com tabela temporal de alíquotas anuais + reduções graduais dos tributos atuais.
5. **Adicionar validação de NCM** — avisar usuário quando NCM cair no fallback ("não mapeado").
6. **Contratar validação tributária especializada** para os 13 pontos da seção 7.
7. **Criar suíte de testes** com XMLs de referência (golden masters) cobrindo: alíquota zero, reduzida, padrão, majorada, ST, interestadual, exportação, Simples.

---

**Fim do Relatório**  
*Documento gerado automaticamente a partir de análise estática do código-fonte. Nenhum arquivo do projeto foi modificado durante a auditoria.*