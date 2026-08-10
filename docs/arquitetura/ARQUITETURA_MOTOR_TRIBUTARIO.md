# ADR 001 — Separação do Motor Tributário da Interface

**Status:** Proposto (não implementado)  
**Data:** 2025  
**Autor:** Auditoria Técnica

---

## Contexto

O código atual (`src/utils/parser.ts`) mistura três responsabilidades:

1. **Parsing XML** — extração de dados brutos da NF-e
2. **Regras tributárias** — classificação NCM, alíquotas CBS/IBS, cashback, fórmulas
3. **Orquestração** — soma totais, monta objeto de resposta

Isso gera:
- Dificuldade de testar regras isoladamente
- Impossibilidade de auditar o motor sem carregar React/Vite
- Acoplamento que impede reuso em CLI, API, batch
- Dificuldade de versionar tabelas de alíquotas anuais

---

## Decisão

Separar em **três camadas distintas**:

| Camada | Responsabilidade | Tecnologia | Testes |
|---|---|---|---|
| **domain/** | Regras puras, tipos, motor de cálculo | TypeScript puro (sem React, sem IO) | Unitários 100% (Vitest) |
| **services/** | Casos de uso, orquestração, IO | TypeScript + Node APIs | Integração |
| **components/** | UI React pura (recebe dados, não XML) | React + Vite | E2E (Playwright) |

---

## Estrutura de Pastas (domain/)

```
domain/
├── tipos/
│   ├── nfe.ts                 # NFeItem, NFeTotais, NFeData, ParseResult
│   └── tributario.ts          # CategoriaTributaria, Aliquota, RegimeTributario, Cashback
├── parsers/
│   ├── nfe-xml-parser.ts      # XML string → NFeBruto (estrutura crua)
│   └── nfe-bruto-para-dominio.ts  # NFeBruto → NFeItem[] (sem cálculo)
├── motor/
│   ├── classificador-ncm.ts   # NCM → CategoriaTributaria (puro)
│   ├── catalogo-alicoes.ts    # Carrega/consulta tabelas JSON/CSV
│   ├── calculadora-carga-atual.ts   # Soma ICMS+IPI+PIS+COFINS do XML
│   ├── calculadora-reforma.ts       # Aplica CBS/IBS por categoria
│   ├── cashback.ts            # Calcula valor de cashback monetário
│   ├── diferencial.ts         # Comparativo: nova - atual (com créditos)
│   └── regimes/
│       ├── regime-geral.ts
│       ├── regime-simples.ts
│       ├── regime-imune.ts
│       └── regime-zfm.ts
├── catalogos/                 # Dados versionados (JSON/CSV)
│   ├── ncm-cbs-ibs-2026.json
│   ├── ncm-cbs-ibs-2027.json
│   ├── ...
│   ├── ncm-cashback.json
│   ├── cfop-operacoes.json
│   └── transicao-anual.json
└── index.ts                   # Barrel export
```

---

## Contratos (Interfaces)

```typescript
// domain/tipos/tributario.ts
export interface CategoriaTributaria {
  codigo: string;           // ex: "REDUCIDA_1_45", "PADRAO_9_65", "MAJORADA_19_30", "ZERO"
  descricao: string;
  cbs: number;              // % (ex: 1.45)
  ibs: number;              // % (ex: 1.45)
  ibsEstadual?: number;     // % (futuro: split por UF)
  ibsMunicipal?: number;    // % (futuro: split por UF)
  cashback?: number;        // % (ex: 100, 50, 0)
  anexoLei?: string;        // "Anexo I item 1", "Anexo II", etc.
}

export interface AliquotaAnual {
  ano: number;              // 2026..2033
  cbs: number;
  ibs: number;
  reducaoIcms?: number;     // % de redução do ICMS naquele ano
  reducaoPisCofins?: number;
}

export interface RegimeTributario {
  identificar(item: NFeItem, nfe: NFeData): boolean;
  calcularCbsIbs(item: NFeItem, nfe: NFeData, catalogo: CatalogoAliquotas): ItemCalculado;
  calcularCreditos?(item: NFeItem, nfe: NFeData): CreditoCalculado;
}
```

---

## Fluxo de Dados (Use Case: Analisar NF-e)

```
Arquivo XML (.xml)
       │
       ▼
┌─────────────────────────────────────┐
│ services/analisar-nfe.ts            │
│ 1. nfeXmlParser.parse(xml)          │  → NFeBruto
│ 2. nfeBrutoParaDominio.convert()    │  → NFeItem[] (sem impostos calculados)
│ 3. Para cada item:                  │
│    a. classificadorNcm.classificar()│  → CategoriaTributaria
│    b. catalogoAliquotas.buscar()    │  → AliquotaAnual (ano da nota)
│    c. calculadoraCargaAtual.calc()  │  → { icms, ipi, pis, cofins, total }
│    d. calculadoraReforma.calc()     │  → { cbs, ibs, total, cashback }
│    e. diferencial.calc()            │  → { diferencial, creditos, liquido }
│ 4. Agrega totais                    │
│ 5. Retorna NFeData                  │
└─────────────────────────────────────┘
       │
       ▼
React Hook (useAnaliseNfe) → Estado → Components
```

---

## Versionamento de Tabelas

| Arquivo | Formato | Frequência |
|---|---|---|
| `ncm-cbs-ibs-YYYY.json` | JSON array | Anual (2026–2033) |
| `ncm-cashback.json` | JSON array | Conforme legislação |
| `transicao-anual.json` | JSON object | Anual |

Exemplo `ncm-cbs-ibs-2026.json`:
```json
[
  { "ncmPrefix": "0101", "categoria": "REDUCIDA_1_45", "descricao": "Carnes frescas", "cbs": 1.45, "ibs": 1.45, "cashback": 100, "anexoLei": "Anexo I item 2" },
  { "ncmPrefix": "2204", "categoria": "MAJORADA_19_30", "descricao": "Vinhos", "cbs": 19.3, "ibs": 19.3, "cashback": 0, "anexoLei": "Anexo III" },
  { "ncmPrefix": "DEFAULT", "categoria": "PADRAO_9_65", "descricao": "Alíquota padrão", "cbs": 9.65, "ibs": 9.65, "cashback": 0 }
]
```

---

## Benefícios Esperados

| Métrica | Antes | Depois |
|---|---|---|
| Tempo teste unitário motor | N/A (impossível) | < 500ms (100% cobertura) |
| Deploy alteração alíquota | Build + Deploy | Hot-reload JSON (se externo) |
| Auditoria fiscal | Dias (ler JSX+parser) | Horas (ler `domain/motor/`) |
| Reuso em CLI/API/Batch | Impossível | Trivial (import `domain/`) |
| Simulação transição 2026–2033 | Código hardcoded | Troca `catalogoAliquotas` por ano |

---

## Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Complexidade inicial alta | Alta | Atraso 1-2 sprints | Spike técnico 2 dias; pair programming |
| Duplicação de tipos (domain vs UI) | Média | Manutenção | Barrel export único; `domain/tipos` como source of truth |
| Performance catálogo grande (10k+ NCMs) | Baixa | Latência | Índice em memória (Map prefixo→categoria); lazy load por ano |
| Migração quebrar UI | Média | Regressão | Testes E2E antes; feature flag `useNewEngine` |

---

## Próximos Passos

1. [ ] Criar spike `domain/tipos` + `classificador-ncm` + testes
2. [ ] Mover `parser.ts` → `domain/parsers/nfe-xml-parser.ts` (só extração)
3. [ ] Implementar `catalogo-alicoes.ts` + `ncm-cbs-ibs-2026.json`
4. [ ] Criar `calculadora-carga-atual.ts` + `calculadora-reforma.ts`
5. [ ] Implementar `services/analisar-nfe.ts`
6. [ ] Criar hook `useAnaliseNfe.ts`
7. [ ] Substituir `App.tsx` para usar hook (feature flag)
8. [ ] Rodar testes E2E comparando resultados old vs new
9. [ ] Remover código legado de `parser.ts`

---

## Referências

- [Relatório de Auditoria Completo](../auditoria/RELATORIO_AUDITORIA_TRIBUTARIA.md)
- [Tabelas NCM CBS/IBS](../regime-tributario/TABELAS_NCM_CBS_IBS.md)
- Lei 14.988/2024 (Reforma Tributária)
- EC 132/2023
- Convênio ICMS 199/2023 (CFC - Comitê Federativo)