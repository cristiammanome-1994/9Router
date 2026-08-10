# 9Router — Analisador XML da Reforma Tributária

> Aplicação web para análise comparativa de NF-e: tributação atual (ICMS/IPI/PIS/COFINS) vs. Reforma Tributária (CBS + IBS).

---

## 🚀 Início Rápido

```bash
# Instalar dependências
npm install

# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Preview do build
npm run preview

# Type check
npx tsc -b --noEmit
```

**Requisitos:** Node.js 18+ (testado com v24.15.0)

---

## 📁 Estrutura do Projeto

```
9Router/
├── docs/                          # Documentação
│   ├── auditoria/
│   │   └── RELATORIO_AUDITORIA_TRIBUTARIA.md
│   ├── arquitetura/
│   │   └── ARQUITETURA_MOTOR_TRIBUTARIO.md
│   └── regime-tributario/
│       └── TABELAS_NCM_CBS_IBS.md
├── public/
│   └── vite.svg
├── src/
│   ├── components/                # UI Components (React)
│   │   ├── FileUpload.tsx         # Drag-and-drop upload XML
│   │   ├── SummaryCards.tsx       # Cards de totais
│   │   ├── ItemTable.tsx          # Tabela detalhada por item
│   │   └── DocumentTabs.tsx       # Abas multi-documento + erros
│   ├── utils/
│   │   ├── parser.ts              # Parser XML + Motor tributário (ATUAL)
│   │   └── format.ts              # Formatação moeda/data/%
│   ├── types/
│   │   └── index.ts               # Tipos TypeScript (NFeItem, NFeTotais, etc.)
│   ├── App.tsx                    # Componente principal
│   ├── App.css                    # Estilos (tema dark)
│   ├── main.tsx                   # Entry point
│   └── index.css                  # Reset + variáveis CSS
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
└── vite.config.ts
```

---

## 🎯 Funcionalidades

| Funcionalidade | Status |
|---|---|
| Upload múltiplo de XMLs NF-e (drag-and-drop / clique) | ✅ |
| Parsing de `nfeProc` / `NFe` / `infNFe` | ✅ |
| Extração de itens: NCM, CFOP, quantidades, valores | ✅ |
| Leitura de ICMS, IPI, PIS, COFINS do XML | ✅ |
| Classificação por NCM → alíquotas CBS/IBS | ⚠️ Tabela embrionária |
| Cálculo CBS (federal) | ✅ Fórmula implementada |
| Cálculo IBS (estadual+municipal) | ❌ Tratada como alíquota única nacional |
| Cashback por NCM | ⚠️ Apenas descritivo |
| Comparativo carga atual vs. nova | ✅ |
| Dashboard com cards + tabela detalhada | ✅ |
| Múltiplos documentos com abas | ✅ |
| Tema dark responsivo | ✅ |

---

## ⚠️ Limitações Conhecidas (v0.1.0)

> **IMPORTANTE:** Esta versão é um **protótipo técnico**. Não use para decisões fiscais reais.

1. **Tabela NCM incompleta** — ~30 entradas; fallback silencioso 9,65%
2. **IBS incorreto** — não modela divisão Estadual + Municipal + alíquota CFC
3. **Período de transição 2026–2033 não implementado**
4. **Cashback apenas descritivo** — sem efeito monetário
5. **Não-cumulatividade (créditos) não modelada**
6. **Regimes especiais ausentes** (Simples, Imune, ZFM, Exportação)
7. **ISS / Serviços não suportados**
8. **Operações interestaduais / partilha IBS não tratadas**

📋 Ver [Relatório Completo de Auditoria](docs/auditoria/RELATORIO_AUDITORIA_TRIBUTARIA.md)

---

## 🏗️ Arquitetura Alvo (Refatoração Planejada)

```
src/
├── domain/                        # Motor puro (sem React)
│   ├── tipos/
│   ├── parsers/
│   ├── motor/
│   │   ├── classificador-ncm.ts
│   │   ├── tabela-cbs-ibs.ts
│   │   ├── calculadora-carga-atual.ts
│   │   ├── calculadora-reforma.ts
│   │   ├── diferencial.ts
│   │   └── regimes/
│   └── catalogos/                 # JSON/CSV versionados
├── services/                      # Use cases
├── hooks/                         # React adapters
└── components/                    # UI pura
```

📋 Ver [ADR — Arquitetura do Motor Tributário](docs/arquitetura/ARQUITETURA_MOTOR_TRIBUTARIO.md)

---

## 📊 Tabelas de Referência

- [NCM → CBS/IBS (2026)](docs/regime-tributario/TABELAS_NCM_CBS_IBS.md)
- [NCM → Cashback](docs/regime-tributario/TABELAS_NCM_CBS_IBS.md#cashback)
- [Transição Anual 2026–2033](docs/regime-tributario/TABELAS_NCM_CBS_IBS.md#transição-anual)

---

## 🔧 Scripts Disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia Vite dev server (HMR) |
| `npm run build` | Type check + build produção (`dist/`) |
| `npm run preview` | Preview local do build |
| `npm run lint` | Oxlint (rápido) |
| `npx tsc -b --noEmit` | Type check apenas |

---

## 📦 Dependências Principais

| Pacote | Versão | Uso |
|---|---|---|
| `react` / `react-dom` | 19.x | UI |
| `vite` | 8.x | Build / Dev server |
| `fast-xml-parser` | 5.10.x | Parsing XML NF-e |
| `clsx` | 2.1.x | Utilitário classNames condicionais |
| `typescript` | 6.x | Tipagem estática |
| `oxlint` | 1.75.x | Lint rápido |

---

## 🧪 Testes

> Ainda não implementados. Planejado: Vitest (unitário motor) + Playwright (E2E UI).

```bash
# Futuro
npm run test          # Unitários (domain/motor)
npm run test:e2e      # E2E (UI)
```

---

## 📝 Licença

Proprietário — Uso interno GMASTER.

---

## 📞 Contato

Desenvolvido para **9Router** — Análise de impacto da Reforma Tributária em NF-e.