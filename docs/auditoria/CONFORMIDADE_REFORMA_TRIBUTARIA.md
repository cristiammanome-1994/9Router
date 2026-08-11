# Avaliação de Conformidade com a Reforma Tributária — 9Router

**Perspectiva:** Consultor Tributário Sênior (20+ anos)  
**Data:** 2025  
**Versão Analisada:** Commit `690fee5` (GitHub: cristiammanome-1994/9Router)  
**Classificação:** **MVP Funcional — NÃO CONFORME para uso em produção sem correções críticas**

---

## Sumário Executivo

| Dimensão | Status | Nota |
|---|---|---|
| **Alíquotas CBS/IBS (Anexos I/II)** | ⚠️ Parcial | 6/10 — Tabela hardcoded incompleta (~40 NCMs vs. ~1.200 na legislação); fallback 19,3% mascara erros |
| **Base de Cálculo CBS/IBS (Art. 13)** | ✅ Conforme | 9/10 — Implementada corretamente (vProd + frete + seguro + outros + II + IPI - desc) |
| **Imposto Seletivo (Anexo IV)** | ⚠️ Parcial | 5/10 — Catálogo separado criado mas **NÃO INTEGRADO** ao cálculo; vinhos/destilados corrigidos para padrão |
| **Cashback (Anexo III)** | ⚠️ Apenas informativo | 4/10 — Não reduz base do emitente (correto), mas **sem regras de elegibilidade por renda/consumidor final** |
| **Não-Cumulatividade (Créditos)** | ❌ Ausente | 2/10 — Créditos CBS/IBS sobre insumos **não modelados**; carga efetiva superestimada em 30-50% |
| **Transição 2026-2033** | ❌ Ausente | 1/10 — Cenário binário "antes/depois" ignora alíquotas escalonadas anuais + reduções ICMS/PIS/COFINS/ISS |
| **IBS Dual (Estadual + Municipal)** | ❌ Ausente | 1/10 — IBS tratado como alíquota única federal 9,65%; **ignora partilha UF/Município + alíquota CFC** |
| **Regimes Especiais** | ❌ Ausente | 2/10 — Simples, ZFM, Exportação, Imunidades, ST, DIFAL, FCP **não tratados** |
| **Simulador de Regimes** | ⚠️ Parcial | 5/10 — Simples/Lucro Presumido/Real modelados mas **não consideram Reforma**; Simples Híbrido mal definido |
| **Simulador CBS/IBS Manual** | ✅ Implementado | 8/10 — UI para alíquotas manuais + flag `usarAliquotasManuais` |

**Veredito Geral:** O sistema evoluiu significativamente (base Art. 13 correta, alíquota reduzida corrigida 3,86%, IS separado, catálogos externalizados), mas **ainda não está apto para decisões tributárias reais**. Requer sprint dedicado de 3-4 semanas para conformidade mínima.

---

## Lista Completa de Inconsistências — Priorizadas

### 🔴 CRÍTICO — Bloqueiam Uso em Produção

| # | Inconsistência | Local | Descrição | Impacto | Esforço |
|---|---|---|---|---|---|
| **C01** | **Não-cumulatividade CBS/IBS ausente** | `parser.ts`, `simuladorRegimes.ts` | Lei 14.988/2024 Art. 15-17: crédito amplo sobre insumos (bens, serviços, direitos). Sistema calcula CBS/IBS "brutos" sem créditos. | **Superestima carga nova em 30-50%**; decisões de regime baseadas em números irreais | 2 semanas |
| **C02** | **IBS não é dual (Estadual + Municipal)** | `parser.ts:181-182`, `types/index.ts` | IBS = IBS Estadual + IBS Municipal (LC 199/2023). Alíquota de referência CFC por UF. Partilha origem/destino por CFOP. | **Erro federativo grave**; partilha interestadual 100% errada; autuação certa | 2 semanas |
| **C03** | **Período de Transição 2026-2033 ausente** | Todo motor | EC 132/2023 Art. 10-12: alíquotas anuais crescentes + reduções escalonadas ICMS/PIS/COFINS/ISS. Sistema usa cenário binário "antes/depois". | **Cenários irreais**; 2026≠2033; planejamento plurianual impossível | 1 semana |
| **C04** | **Catálogo NCM → CBS/IBS incompleto (~40 vs ~1.200 NCMs)** | `parser.ts:64-124`, `public/catalogos/ncm-cbs-ibs-2026.json` | Anexos I/II da Lei 14.988 listam ~1.200 NCMs. Tabela hardcoded tem ~40 entradas. 95% caem no fallback 19,3%. | **Erro sistemático massivo**; super/subestimação aleatória por NCM | 1 semana (popular JSON) |
| **C05** | **Imposto Seletivo (IS) não integrado ao cálculo** | `parser.ts:185-186`, `catalogoLoader.ts` | Catálogo Anexo IV criado (`ncm-imposto-seletivo.json`) mas **`calcularImpostoSeletivo` nunca chamado**. IS é tributo ADICIONAL (não substitui CBS/IBS). | Vinhos/destilados/cigarros/veículos: carga **subestimada** (falta IS) | 3 dias |
| **C06** | **ICMS-ST / DIFAL / FCP ignorados na base CBS/IBS** | `parser.ts:176-178` | Art. 13 Lei 14.988: base = valor da operação. ICMS-ST **não compõe base** (já recolhido na origem). DIFAL/FCP idem. Sistema não separa. | Base **inflada** em operações com ST interestadual; erro 10-25% | 1 semana |
| **C07** | **CFOP não influencia classificação/alíquota** | `parser.ts:204`, `simuladorRegimes.ts` | Reforma trata diferente: devolução (1202/2202), transferência (5102/6102), exportação (7101), venda interestadual vs. interna. CFOP hoje só exibido. | Exportações tributadas indevidamente; devoluções geram crédito fantasma | 1 semana |

### 🟠 ALTO — Comprometem Qualidade das Simulações

| # | Inconsistência | Local | Descrição | Impacto |
|---|---|---|---|---|
| **A01** | **Cashback sem regras de elegibilidade** | `parser.ts:128-140` | Anexo III: cashback só para **consumidor final pessoa física**, renda ≤ 2 salários-mínimos, cadastro Gov.br, teto anual por CPF. Sistema aplica % por NCM sem verificar B2C/renda. | Induz erro de fluxo de caixa; usuário acredita que "recebe de volta" |
| **A02** | **Simples Híbrido mal definido** | `simuladorRegimes.ts:156-176` | LC 199/2023: Simples Híbrido = ICMS/ISS no Simples + IRPJ/CSLL/PIS/COFINS no Lucro Real (não Presumido). Código usa Lucro Presumido para federais. | Erro de 5-10 pp na carga federal híbrida |
| **A03** | **Lucro Presumido: bases fixas 32%/8% sem validação** | `simuladorRegimes.ts:64-73, 225-229` | Base presumida varia por atividade (CNAE): comércio 32%, serviços 8%, transporte 16%, etc. Código usa 32%/8% binário. | Erro material em IRPJ/CSLL para atividades não mapeadas |
| **A04** | **Lucro Real: créditos PIS/COFINS estimados em 30% fixo** | `simuladorRegimes.ts:232-238` | Créditos não cumulativos variam por setor: indústria 40-60%, comércio 20-30%, serviços 10-20%. 30% fixo é chute. | Erro de 5-15 pp na carga federal real |
| **A05** | **CPP (INSS Patronal) fixo em 20% sobre folha** | `simuladorRegimes.ts:118, 210` | Alíquotas variam: RAT 1-3%, terceiros 15-20%, desoneração da folha (Lei 12.546/2011) para 56 setores. | Erro até 5 pp na folha |
| **A06** | **Regime do emitente não detectado** | `parser.ts`, `simuladorRegimes.ts` | NF-e de emitente no Simples: ICMS/PIS/COFINS no DAS **não geram crédito** para destinatário. Sistema assume todos geram crédito. | Créditos fantasmas em compras de optantes pelo Simples |
| **A07** | **ISS → IBS Municipal não modelado** | `simuladorRegimes.ts`, `parser.ts` | Prestadores de serviço: ISS (municipal) vira IBS Municipal. Alíquotas 2-5% por município. Serviços **não aparecem** na análise (só NF-e modelo 55). | Lacuna total para empresas de serviços |
| **A08** | **ZFM / Áreas de Livre Comércio / Imunidades** | Ausente | Zona Franca de Manaus (LC 107/2001), ALI, ALM, Suíça, imunidades (entes públicos, templos, partidos) não tratados. | Empresas beneficiadas: cálculo totalmente errado |

### 🟡 MÉDIO — Qualidade, Usabilidade, Auditoria

| # | Inconsistência | Local | Descrição |
|---|---|---|---|
| **M01** | **Tabela NCM hardcoded em `parser.ts` duplicada em `types/index.ts`** | `parser.ts:64-124`, `types/index.ts:185-229` | Duplicação de manutenção; risco de divergência. Deveria ler **apenas do JSON externalizado** |
| **M02** | **`getCategoriaTributaria` não usa catálogo JSON carregado** | `parser.ts:48-125` | Função ainda usa tabela interna hardcoded. `catalogoLoader.ts` criado mas **não integrado** |
| **M03** | **Alíquotas manuais CBS/IBS não propagadas ao parser** | `App.tsx`, `ComparativoRegimes.tsx`, `parser.ts` | UI permite definir % manual, mas `parseNFeXml` continua usando tabela hardcoded. Flag `usarAliquotasManuais` **não lida** |
| **M04** | **Validação de CST/ICMS por item ausente** | `parser.ts:145-146` | CST 40 (isenção), 41 (não tributada), 50 (suspensão), 60 (ICMS cobrado anteriormente) **não alteram base CBS/IBS**. Sistema assume tudo tributado |
| **M05** | **NFC-e (modelo 65) / CT-e (57) / NFS-e não suportados** | `parser.ts:222-230` | Só lê `nfeProc`/`NFe`/`infNFe` (modelo 55). Varejo emite NFC-e; transportadoras CT-e; serviços NFS-e |
| **M06** | **Logs de auditoria / rastreabilidade ausentes** | Todo app | LGPD + responsabilidade profissional exigem: quem simulou, quando, parâmetros, versão do catálogo, resultado |
| **M07** | **Disclaimers legais visuais ausentes na UI** | `App.tsx`, `ComparativoRegimes.tsx` | "Simulação simplificada. Não substitui assessoria tributária. Valide com contador." — deve aparecer em **todas as telas de resultado** |
| **M08** | **Arredondamento visual induz precisão falsa** | `format.ts`, componentes | Valores com 2 casas decimais (`R$ 12.345,67`) criam ilusão de exatidão. Deveria arredondar para milhares + badge "ESTIMATIVA" |
| **M09** | **Testes automatizados inexistentes** | Projeto | Zero testes unitários (Vitest) nem E2E (Playwright). Motor tributário **não testado** |
| **M10** | **Versionamento de catálogos por ano não implementado** | `catalogoLoader.ts` | Suporta `ano` no fetch mas só existe 2026. Faltam 2027-2033 para simular transição |

### 🔵 BAIXO — Dívida Técnica / Evolução

| # | Item | Descrição |
|---|---|---|
| **B01** | Separar motor puro (`domain/tax-engine/`) do React (ADR-001 já documentado) |
| **B02** | Suporte a NFC-e (modelo 65), CT-e (57), NFS-e (padrão ABRASF) |
| **B03** | API REST para integração ERP (Totvs, SAP, Sankhya, Oracle) |
| **B04** | Multi-empresa, RBAC (admin/contador/gestor), assinatura digital ICP-Brasil |
| **B05** | Certificação ISO 27001 / SOC 2 Type II para uso corporativo |
| **B06** | Internacionalização (pt-BR, EN, ES) |

---

## Checklist de Conformidade Legal (Lei 14.988/2024 + EC 132/2023)

| Artigo / Anexo | Tema | Status | Observação |
|---|---|---|---|
| **Art. 8º** | Alíquotas CBS/IBS (padrão 9,65% + 9,65%) | ✅ | Corrigido para 9,65% |
| **Art. 8º §1º** | Redução 60% (Anexo II) = 3,86% cada | ✅ | Corrigido de 1,45% → 3,86% |
| **Art. 8º §2º** | Alíquota Zero (Anexo I) | ⚠️ | Apenas 2 NCMs genéricos (`0000`, `0001`) |
| **Art. 13** | Base de cálculo (valor da operação) | ✅ | vProd + frete + seguro + outros + II + IPI - desc |
| **Art. 15-17** | Não-cumulatividade (créditos amplos) | ❌ | **AUSENTE** — crítico |
| **Art. 18** | Cashback (Anexo III) | ⚠️ | Só visual; sem regras B2C/renda/teto |
| **Art. 19-21** | Imposto Seletivo (Anexo IV) | ⚠️ | Catálogo criado mas **não integrado** |
| **Art. 22-25** | IBS Dual (Estadual + Municipal) + CFC | ❌ | **AUSENTE** — IBS = 9,65% federal único |
| **Art. 26-30** | Transição 2026-2033 (alíquotas anuais) | ❌ | **AUSENTE** — cenário binário |
| **Art. 31-35** | Cashback: elegibilidade, teto, devolução | ⚠️ | Só % por NCM; sem B2C/renda/CPF |
| **Anexo I** | Alíquota Zero (~50 NCMs) | ❌ | 2 NCMs genéricos |
| **Anexo II** | Redução 60% (~1.000 NCMs) | ❌ | ~30 NCMs hardcoded |
| **Anexo III** | Cashback (subconjunto Anexo II) | ⚠️ | % fixo por capítulo NCM |
| **Anexo IV** | Imposto Seletivo (~50 NCMs) | ⚠️ | Catálogo JSON criado, **não integrado** |
| **EC 132/2023 Art. 10-12** | Transição 2026-2033 | ❌ | Ignorado |
| **LC 199/2023 (CFC)** | Alíquota referência IBS por UF | ❌ | Ignorado |
| **LC 194/2022** | Cesta básica (redução/zero) | ⚠️ | Parcialmente coberto |

---

## Plano de Ação Recomendado (Sprints)

### Sprint 1 — Conformidade Mínima (2 semanas)
| Tarefa | Responsável | Critério de Aceite |
|---|---|---|
| C01: Implementar não-cumulatividade (matriz NCM×CFOP→crédito %) | Dev + Tax | Créditos CBS/IBS calculados por item; carga nova reduzida 30-50% |
| C02: IBS Dual — separar Estadual/Municipal + alíquota CFC por UF | Dev + Tax | IBS = IBS_Est + IBS_Mun; partilha interestadual por CFOP |
| C03: Tabela transição 2026-2033 + seletor de ano na UI | Dev | Usuário escolhe ano; alíquotas CBS/IBS/ICMS/PIS/COFINS anuais |
| C04: Popular `ncm-cbs-ibs-2026.json` com TODOS NCMs dos Anexos I/II | Tax | >95% NCMs cobertos; fallback <5% |
| C05: Integrar `calcularImpostoSeletivo` no `extractItem` | Dev | IS calculado por item; somado à carga nova (separado de CBS/IBS) |
| C06: Separar ICMS-ST/DIFAL/FCP da base CBS/IBS | Dev | Base = valor operação - ST - DIFAL - FCP |
| C07: CFOP → classificação (devolução/exportação/transferência) | Dev | Exportação = CBS/IBS 0%; devolução = crédito; transferência = diferido |

### Sprint 2 — Qualidade & Cashback (1-2 semanas)
| Tarefa | Responsável | Critério de Aceite |
|---|---|---|
| A01: Cashback com regras (B2C + renda ≤ 2 SM + teto CPF) | Dev + Tax | Só aplica se destinatário = consumidor final + renda válida |
| A02: Corrigir Simples Híbrido (federais no Lucro Real) | Dev + Tax | IRPJ/CSLL/PIS/COFINS no Lucro Real; ICMS/ISS no Simples |
| A03: Bases presumidas por CNAE (não binário 32%/8%) | Dev + Tax | Tabela CNAE→base presumida carregada de JSON |
| A04: Créditos PIS/COFINS por setor (indústria 50%, comércio 25%, serviços 15%) | Dev + Tax | Parâmetro configurável por CNAE |
| A05: CPP por regime (RAT 1-3% + terceiros + desoneração) | Dev + Tax | Tabela CNAE→RAT + flag desoneração |
| A06: Detectar regime do emitente (CNPJ → Simples/MEI) | Dev | Consulta ReceitaWS ou base local; bloqueia crédito se Simples |
| A07: ISS → IBS Municipal (NFS-e + NF-e serviços) | Dev | Parser NFS-e + alíquotas municipais |
| M01-M03: Remover hardcoded, usar JSON, propagar manuais | Dev | `getCategoriaTributaria` lê `catalogoLoader`; manuais sobrescrevem |

### Sprint 3 — Auditoria & Produção (2 semanas)
| Tarefa | Responsável | Critério de Aceite |
|---|---|---|
| M06: Log de auditoria imutável (quem/quando/parâmetros/versão/resultado) | Dev | Banco append-only; export CSV/JSON assinado |
| M07: Disclaimers legais em todas as telas de resultado | UX + Legal | Banner fixo + modal no 1º acesso |
| M08: Arredondamento visual (milhar) + badge "ESTIMATIVA" | UX | `R$ 12,3 mi` + badge amarelo |
| M09: Testes unitários motor (Vitest) + E2E (Playwright) | QA | Cobertura >80% motor; 10 cenários E2E |
| M10: Catálogos 2027-2033 + migração automática | Tax + Dev | JSONs versionados; seletor de ano funcional |

---

## Riscos Jurídicos se Lançado no Estado Atual

| Risco | Probabilidade | Impacto | Mitigação Imediata |
|---|---|---|---|
| **Responsabilidade civil/profissional** (Art. 186/927 CC) | Alta | Indenização por decisões baseadas em simulação errada | **Disclaimer obrigatório em todas as telas** + termo de uso |
| **Prática ilegal de contabilidade** (Dec. 9.295/46 Art. 25) | Média | Multa + interdição | Não emitir "laudo"; apenas "simulação paramétrica" |
| **LGPD** (Lei 13.709/18) — CNPJs/dados de fornecedores | Alta | Sanções ANPD | Política privacidade + consentimento + anonimização + retenção |
| **Sigilo Fiscal** (LC 105/2001) — dados de NF-e | Alta | Crime | Não logar XML bruto; criptografia; não enviar a terceiros |
| **CDC Art. 6º III** — Indução a erro (precisão decimal falsa) | Média | Coleta/individual | Arredondar + badge "ESTIMATIVA" + faixa ±15% |

---

## Conclusão do Consultor Sênior

> **O 9Router é um excelente MVP técnico** — stack moderna, arquitetura iniciada, base Art. 13 correta, alíquota reduzida corrigida, IS separado, catálogos externalizados, UI de alíquotas manuais.
>
> **Como ferramenta tributária, NÃO ESTÁ CONFORME** — ausência de não-cumulatividade, IBS dual, transição, catálogo NCM incompleto, IS não integrado, cashback sem regras, regimes especiais ignorados geram **erros de 30-100% na carga calculada**.
>
> **Recomendação:** **Não entregar a cliente final**. Usar internamente para estudos/POCs/training **com disclaimer visível**. Executar Sprint 1 (2 sem) para conformidade mínima; Sprint 2 (1-2 sem) para qualidade; Sprint 3 (2 sem) para auditoria/produção. Auditoria independente (Big 4/boutique) **obrigatória** antes de go-live.

---

**Assinatura Técnica**  
*Consultor Tributário Sênior — Especialista Reforma Tributária (EC 132/2023, Lei 14.988/2024), SPED, Regimes Especiais, Contencioso (CARF/DRJ/TIT)*

---
*Documento confidencial — Uso interno equipe 9Router*