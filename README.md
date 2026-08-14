# 9Router — Motor de Cálculo Tributário (CBS/IBS)

Implementação de referência para cálculo da nova tributação brasileira (CBS/IBS/Imposto Seletivo) conforme LC 214/2025. Foco em precisão, auditoria e conformidade com a legislação.

## Stack

- React 19 + TypeScript + Vite 8
- Vitest + Testing Library (145 testes)
- Oxlint para linting rápido
- fast-xml-parser + jszip para processamento NF-e

## Domínio (src/domain/tax-engine)

| Módulo | Responsabilidade |
|--------|------------------|
| `calculators/BaseCalculator` | Base CBS/IBS (Art. 13) — inclui frete/seguro/II/IPI, exclui ICMS-ST/DIFAL/FCP |
| `calculators/TaxCalculator` | Orquestra CBS, IBS Dual, Imposto Seletivo, créditos PIS/COFINS, cashback |
| `calculators/IBSDualCalculator` | IBS dual (municipal + estadual) com transição 2026-2032 |
| `calculators/ImpostoSeletivoCalculator` | IS ad valorem + específico (fumo, bebidas, veículos, petróleo, armas) |
| `calculators/CreditEngine` | Créditos CBS/IBS (entrada, uso/consumo, insumos) |
| `calculators/CreditoPISCOFINSEngine` | Créditos PIS/COFINS não cumulativo |
| `calculators/TransitionCalculator` | Simulador regimes (Simples, Presumido, Real) 2026-2032 |
| `validators/CashbackValidator` | Validação cashback por UF/CFOP/NCM |
| `classifiers/CFOPClassifier` | Classificação CFOP para crédito/débito |
| `catalogs/CatalogLoader` | Carrega catálogos NCM, CFOP, alíquotas, cashback, IBS-UF, transição |

## Como rodar

```bash
npm install
npm run dev          # servidor dev
npm run build        # build produção
npm run typecheck    # type-check TypeScript
npm run lint         # oxlint
npm run test         # 145 testes unitários
npm run test:coverage # relatório cobertura (coverage/index.html)
npm run preview      # preview build
```

## Estrutura

```
src/
├── domain/tax-engine/
│   ├── calculators/      # Base, Tax, IBS Dual, IS, Créditos, Transição
│   ├── catalogs/         # Loader catálogos JSON
│   ├── classifiers/      # CFOP classifier
│   ├── credits/          # Cashback, CreditEngine, PIS/COFINS
│   ├── scenarios/        # Simulador regimes
│   ├── validators/       # CashbackValidator
│   └── __tests__/        # 145 testes (BaseCalculator, ImpostoSeletivo, etc.)
├── components/           # UI React (mínima)
├── types/                # Types centrais
├── utils/                # Utilitários
├── App.tsx               # Demo UI
└── main.tsx              # Entry point
```

## Testes

```bash
npm run test              # roda todos
npm run test:watch        # watch mode
npm run test:coverage     # html em coverage/index.html
```

Cobertura alvo: ≥80% no domínio (calculators, validators, classifiers).

## Catálogos esperados (pasta `public/` ou URL)

- `ncm-cbs-ibs-2026.json` — alíquotas CBS/IBS por NCM
- `ncm-imposto-seletivo.json` — alíquotas IS
- `ncm-cashback.json` — % cashback por capítulo NCM
- `cfop.json` — tabela CFOP
- `creditos.json` — regras crédito CBS/IBS
- `ibs-uf.json` — alíquotas IBS municipal/estadual
- `transicao.json` — parâmetros transição 2026-2032

## Licença

MIT — veja [LICENSE](LICENSE).