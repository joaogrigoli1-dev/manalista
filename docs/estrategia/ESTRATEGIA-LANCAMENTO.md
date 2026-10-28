# MAnalista — Estratégia de Lançamento + Mobile iOS

**Data:** 2026-05-17 · **Analista:** Claude Opus 4.7 · **Solicitante:** João Henrique
**Consolida:** competitive-brief + brand-review + performance-report + mobile strategy

---

## SUMÁRIO EXECUTIVO

Três descobertas críticas que mudam sua estratégia:

1. **Você não tem concorrente direto no Brasil.** Genial Care é caro (B2B com convênios), Braine (USP) é pesquisa acadêmica não-comercial, Estimula AI é app de estimulação (não diagnóstico), Cognoa/Canvas Dx é EUA (Rx-only, $2.280/avaliação). **Existe um vácuo de mercado em "triagem multiprofissional acessível para pais B2C no Brasil"** — e o MAnalista pode ocupar antes de qualquer outro player.

2. **Sua maior vulnerabilidade não é técnica, é jurídica.** O ANVISA RDC 657/2022 e o CFM resolução 2.314/2022 regulam "software como dispositivo médico" e telessaúde. Hoje seu disclaimer "MODO DEMONSTRAÇÃO" é insuficiente — precisa virar **claim defensável**: ferramenta educacional de organização de informação, não triagem. Risco real de notificação CFM/ANVISA se posicionar errado.

3. **Para iOS, a resposta é PWA primeiro, depois Capacitor para App Store.** Não Swift nativo. Justifico em detalhe abaixo.

**Modelo de lançamento recomendado:** Beta privado por waitlist (200 pais) → freemium aberto com 1 análise grátis → upgrade pago, posicionando como "preparação para consulta médica" e não como diagnóstico.

---

## 1. ANÁLISE COMPETITIVA (competitive-brief)

### 1.1 Mapa competitivo no Brasil — pesquisa de 2026

| Player | O que é | Pricing | Público | Status real |
|---|---|---|---|---|
| **Genial Care** | Rede física de cuidado para TEA já diagnosticado (ABA + fono + TO) | B2B via convênios (Bradesco, Omint, Care Plus, Amil, Itaú) | Pais de crianças até 7a 11m **já diagnosticadas**, Grande SP | Operacional, financiado, **não é triagem** |
| **Braine (USP)** | 3 produtos: Aura-T (rastreio TEA), Care 360 (gestão), Bruna (assistente IA emocional) | Pesquisa acadêmica USP | Profissionais + famílias + neurodivergentes | **Pré-lançamento** comercial em 2025-2026, perfil acadêmico |
| **Estimula AI** | App de exercícios estimuladores de desenvolvimento | **Gratuito** (App Store + Play) | Pais de crianças com atraso | Operacional, **não diagnostica** |
| **Cognoa Canvas Dx** | IA aprovada FDA para auxílio diagnóstico TEA 1.5-6 anos | **$2.280/avaliação** (reembolso por convênio) | Pediatras (Rx-only) | Operacional EUA, **inacessível BR** |
| **M-CHAT online genérico** | Questionário tradicional de 23 perguntas | Gratuito (formulários sem retorno estruturado) | Pais | Várias versões espalhadas em sites de clínicas |
| **iPsy, WeMEDS, Sanarmed** | Plataformas para profissionais aplicarem escalas | B2B profissional | Médicos/psicólogos | Não fala com pais |
| **MAnalista (você)** | 7 especialistas IA + mediador, debate multiprofissional, laudo PDF | A definir | Pais B2C + clínicas B2B | Pré-lançamento |

### 1.2 Positioning map — eixos críticos

```
                        ALTA AUTORIDADE CLÍNICA
                                  │
            Cognoa ●               │
            ($2.280, FDA, Rx)      │
                                  │
            Genial Care ●          │      MAnalista ★
            (B2B convênios)        │      (oportunidade!)
                                  │
            ────────────────────────────────────────────
                                  │
                                  │      Braine
                                  │      (acadêmico)
            M-CHAT genérico ●      │
            (gratuito sem IA)      │
                                  │      Estimula AI ●
                                  │      (estimulação, não diagnóstico)
                        BAIXA AUTORIDADE CLÍNICA

         B2B / PROFISSIONAL        │        B2C / PAIS
```

**Quadrante MAnalista (B2C + Alta Autoridade) está VAZIO.** É a oportunidade.

### 1.3 Análise por concorrente

#### Genial Care — o "padrão de cuidado" caro

**Pitch:** "Rede de cuidado de saúde atípica para crianças autistas e suas famílias."

**Strengths:**
- Já tem 9+ convênios fechados (Bradesco, Omint, Care Plus, Amil, Itaú, Porto Saúde)
- Clínicas físicas (Carrão, Paraíso em SP) — credibilidade premium
- ABA + Fono + TO integrados (modelo correto)
- Conteúdo SEO forte (blog ranking para "teste autismo online", "M-CHAT")

**Weaknesses:**
- Geo-restrito (só Grande SP)
- Idade limitada (até 7a 11m)
- **Atende APÓS diagnóstico, não antes** — pais ficam órfãos na pré-triagem
- B2B convênio significa pais sem plano premium não acessam
- Conteúdo SEO é isca, conversão exige consulta presencial

**Oportunidade para você:** todo pai que descobre o Genial Care no Google mas (a) não tem o convênio certo, (b) mora fora de SP, ou (c) ainda nem sabe se o filho tem TEA — esse pai é seu lead.

#### Braine (USP) — concorrente futuro mais sério

**Pitch:** "IA para apoiar pessoas neurodivergentes e familiares."

**Strengths:**
- Endosso USP (autoridade absoluta no Brasil)
- 3 produtos integrados (triagem + gestão + assistente)
- Cobertura midiática forte (Jornal USP, Fast Company, Cointelegraph, Secretaria de Saúde SP)
- Patenteado pelo Núcleo de Inovação Tecnológica USP

**Weaknesses:**
- Não está comercialmente lançado ainda (anúncio prometido "ainda em 2025")
- Foco em apoio pós-diagnóstico (gestão de crises, assistente Bruna), não em triagem pré-diagnóstica como vetor principal
- Velocidade acadêmica — burocracia universitária retarda go-to-market
- Site `braine.digital` ainda institucional, sem produto comercial visível

**Oportunidade para você:** sair antes deles. Você tem 12-18 meses de janela antes da Braine virar dor de cabeça. **Velocidade > perfeição.**

#### Cognoa / Canvas Dx — benchmark internacional

Não compete diretamente (Rx-only, EUA, $2.280), mas valida o mercado: já provou que pediatras pagam por ferramenta de auxílio diagnóstico TEA com IA. Highmark e Medicaid em 3 estados reembolsam. **Esse é o tamanho real do mercado.**

#### Estimula AI — "competition for attention"

Não compete em diagnóstico, mas compete por download. Pai busca "app autismo criança" → encontra Estimula AI gratuito → instala primeiro. Você precisa apresentar valor diferente: "ele NÃO substitui o Estimula AI, ele te explica o que seu filho tem antes."

### 1.4 Content gap analysis

| Tópico | Você | Genial Care | Braine | M-CHAT genéricos | Oportunidade |
|---|---|---|---|---|---|
| "Teste autismo online" | ❌ | ✅✅ (rankeia #1-3) | ❌ | ✅ | **Gap crítico — SEO** |
| "Sinais de TEA por idade" | ❌ | ✅ | ❌ | ❌ | **Gap** |
| "Diferença entre TEA e TDAH" | ❌ | parcial | ❌ | ❌ | **Gap** |
| "Como conversar com pediatra" | ❌ | ❌ | ❌ | ❌ | **Vazio total — sua chance** |
| "Quando levar para neuropediatra" | ❌ | ❌ | ❌ | ❌ | **Vazio total** |
| Casos reais comentados | ❌ | ❌ | ❌ | ❌ | **Vazio total** |
| Conteúdo em vídeo curto (Reels/TikTok) | ❌ | parcial | ❌ | ❌ | **Vazio total** |
| Templates: "perguntas pro pediatra" | ❌ | ❌ | ❌ | ❌ | **Vazio total** |

**Seu blog não existe ainda — você está em desvantagem temporal no SEO mas pode atacar nichos vazios.**

### 1.5 Battlecard — quando alguém perguntar "qual a diferença do MAnalista vs..."

| Se o pai pergunta... | Resposta enxuta |
|---|---|
| "É como o teste M-CHAT online?" | "O M-CHAT é um questionário. O MAnalista é uma equipe — 7 especialistas debatem o caso do seu filho e te entregam um laudo que você leva pro pediatra." |
| "É como o Genial Care?" | "O Genial Care cuida da criança DEPOIS do diagnóstico. O MAnalista te ajuda ANTES — a entender o que pode estar acontecendo e qual especialista procurar." |
| "Substitui o médico?" | "Não. Substitui o Dr. Google. Você chega no consultório organizado, com informação estruturada, em vez de chegar perdido." |
| "Por que pagar se tem teste grátis no Google?" | "Os testes grátis te dão um número. O MAnalista te dá 7 análises, um debate, um laudo PDF e a indicação exata de qual especialista procurar e por quê." |

---

## 2. BRAND-REVIEW DO MANALISTA ATUAL

### 2.1 Avaliação geral

O produto tem identidade visual sofisticada (high-end visual design dark theme, agora PDF light), prompts dos agentes excelentes em qualidade técnica (`prompts.ts`), mas **a marca ainda não tomou decisão sobre quem é**. Há tensão entre três posicionamentos coexistindo:

1. "Plataforma técnica de IA" (`docs/planos/PLAN.md` fala em DSM-5, CID-11, gold standards)
2. "Amigo especialista" (GLOBAL_RULES nos prompts: "fale como amigo no corredor")
3. "Ferramenta de demonstração" (disclaimer "MODO DEMONSTRAÇÃO" em todo lugar)

Os três posicionamentos brigam. Pai não sabe se é sério, se é amigável, ou se é "só pra brincar".

### 2.2 Achados por dimensão

#### Voz e tom — INCONSISTENTE (severidade ALTA)

| Local | Voz atual | Problema |
|---|---|---|
| `GLOBAL_RULES` (prompts.ts) | "Fale como amigo especialista no corredor, sem jargão, frases curtíssimas" | ✅ Correto pra pai leigo |
| `profiles.ts` (bioLong) | "Especialista em transtornos do neurodesenvolvimento com foco em avaliação psicológica infantil. Utiliza abordagem integrativa..." | ❌ Voz institucional, contradiz GLOBAL_RULES |
| Disclaimer PDF | "MODO DEMONSTRAÇÃO — Não constitui diagnóstico real" | ❌ Para um pai pagante, "demonstração" reduz percepção de valor |
| `path_main` PDF | "Transtorno do Espectro Autista (TEA) — Nível 2" | ❌ Choque emocional cru — sem amortecedor empático |

#### Terminologia — RISCO DE COMPLIANCE (severidade CRÍTICA)

Termos atuais que precisam ser **substituídos urgentemente**:

| Termo atual | Problema | Substituir por |
|---|---|---|
| "Laudo" | Termo médico-legal (Lei 12.842/2013 — só médico assina laudo) | **"Relatório Multiprofissional"** ou **"Síntese de Análise"** |
| "Diagnóstico sugerido" | Pode ser caracterizado como exercício ilegal de medicina | **"Hipótese de orientação para consulta especializada"** |
| "Patologia Principal Identificada" (seção 5 do PDF novo) | Caracteriza diagnóstico | **"Hipótese Principal para Investigação Especializada"** |
| "CID-11 / DSM-5" em destaque para pais | Reforça caráter diagnóstico | Mover para apêndice técnico "para o profissional que vai avaliar" |
| "MODO DEMONSTRAÇÃO" | Confuso — se é demo, por que pagar? | **"Ferramenta de Orientação Pré-Consulta"** |

#### Messaging pillars — DEFINIR (severidade ALTA)

Hoje não há messaging pillars formalizadas. Proposta de 4 pilares:

1. **Tempo é desenvolvimento.** "Cada semana de atraso na avaliação correta importa."
2. **Você não está sozinho na fila.** "Enquanto espera o especialista, comece a entender."
3. **Não substitui — prepara.** "Você vai ao médico com informação organizada."
4. **Multiprofissional desde a primeira análise.** "7 perspectivas. Um relatório."

### 2.3 Tabela de achados consolidada

| Issue | Local | Severidade | Sugestão |
|---|---|---|---|
| Termo "Laudo" no PDF e código | scripts/generate_pdf.py + UI | **CRÍTICA** | Substituir por "Relatório Multiprofissional" globalmente |
| "Diagnóstico sugerido" / "Patologia identificada" | PDF seção 5 + types | **CRÍTICA** | Reescrever como "Hipótese para investigação" |
| "MODO DEMONSTRAÇÃO" depreciativo | PDF + UI | ALTA | "Ferramenta de Orientação Pré-Consulta" |
| Voz "institucional" vs "amigável" inconsistente | profiles.ts vs prompts.ts | ALTA | bioLong dos agentes virar 2 versões: técnica (PDF) + acolhedora (UI pais) |
| Disclaimer ANVISA/CFM ausente | PDF rodapé | **CRÍTICA** | Adicionar texto sobre RDC 657/2022 e CFM 2.314/2022 |
| Sem termos de uso / LGPD evidente | UI | **CRÍTICA** | ConsentModal já existe — auditar texto + LGPD compliance |
| Promessa de "diagnóstico em 5 min" implícita | `docs/planos/PLAN.md` "demo do painel em ação" | MÉDIA | Reposicionar como "organização de informação em 5 min" |

### 2.4 Revisões propostas (top 3 críticas)

**Antes:**
> "MAnalista — Laudo de Análise Multiprofissional Pediátrica"

**Depois:**
> "MAnalista — Relatório de Pré-Consulta Multiprofissional"
> *Organização de informação para conversar com profissionais habilitados*

---

**Antes (capa PDF):**
> "MODO DEMONSTRAÇÃO — Este laudo é uma análise sugestiva sem validade diagnóstica real. Não substitui avaliação presencial por profissional habilitado."

**Depois:**
> "Este é um relatório de orientação pré-consulta gerado por inteligência artificial. **Não é um diagnóstico médico.** Sirva-se dele como organização inicial da história do seu filho para apresentar a profissionais habilitados (neuropediatra, psicólogo, fonoaudiólogo, conforme indicação na Seção 9)."

---

**Antes (Seção 5):**
> "5. Patologia Principal Identificada — Hipótese diagnóstica consolidada pela equipe multiprofissional."

**Depois:**
> "5. Hipótese Principal para Investigação Especializada — Linha de investigação sugerida pela equipe para que profissionais habilitados conduzam avaliação formal."

### 2.5 Disclaimers obrigatórios (legal/compliance)

**Adicionar no rodapé do PDF e no footer do site:**

> "Este software constitui ferramenta educacional de organização de informação. Não se enquadra como software como dispositivo médico (SaMD) conforme ANVISA RDC 657/2022, pois não realiza diagnóstico, prescrição, monitoramento clínico ou recomendação terapêutica vinculante. Toda análise apresentada é hipotética e deve ser validada por profissionais de saúde habilitados (CRM, CRP, CRFa, CREFITO conforme especialidade). MAnalista não estabelece relação médico-paciente nem atende aos requisitos da Resolução CFM 2.314/2022 sobre telessaúde."

---

## 3. PERFORMANCE FRAMEWORK (pré-lançamento)

Sem dados reais ainda, entrego **framework de métricas + projeções** para você operacionalizar desde o dia 1 do beta.

### 3.1 KPIs a instrumentar ANTES do lançamento

**Critical 5 (não lançar sem):**

| Métrica | O que medir | Ferramenta sugerida | Benchmark inicial |
|---|---|---|---|
| **Funnel de conversão completo** | Landing → cadastro → form → análise → PDF download | Posthog (open source, free 1M events) | Cada etapa: 35-50% |
| **Custo por análise gerada** | $ Claude API + $ Polly + $ infra / análises | Cloudwatch + dashboard custom | Meta: <R$1,50/análise no plano gratuito |
| **NPS por análise** | "De 0 a 10, recomendaria pra outro pai?" | Pergunta in-app após PDF | Meta inicial: >40 |
| **Time-to-PDF** | Tempo do submit do form até PDF entregue | Posthog event timing | Meta: <90s p95 |
| **Drop-off por step do form** | Onde pai desiste | Posthog funnels | Identificar leak |

**Nice to have (mas espere virar 50+ análises/dia):**
- LTV por canal de aquisição
- CAC por canal
- Pipeline coverage (se for B2B)
- Pediatra-recommendation rate (quantos pais foram ao médico após PDF?)

### 3.2 Cenários de lançamento — projeções

Baseado em benchmarks SaaS health B2C brasileiro 2025-2026 (Genial Care, Vittude, Zenklub) e seu próprio cálculo de custos:

#### Cenário CONSERVADOR (beta privado 90 dias)

| Métrica | Mês 1 | Mês 2 | Mês 3 |
|---|---|---|---|
| Waitlist signups | 200 | 350 | 500 |
| Análises feitas | 50 | 120 | 220 |
| Conversão grátis→pago | 8% | 12% | 18% |
| Pagantes (Pro R$49/mês) | 4 | 14 | 40 |
| MRR (R$) | R$ 196 | R$ 686 | R$ 1.960 |
| Custo Claude API | R$ 75 | R$ 180 | R$ 330 |
| Custo Polly Neural | R$ 8 | R$ 20 | R$ 36 |
| Custo infra (Coolify VPS) | R$ 50 | R$ 50 | R$ 50 |
| **Margem operacional** | -R$ 137 | +R$ 436 | +R$ 1.544 |

#### Cenário REALISTA (lançamento aberto com marketing leve)

| Métrica | Mês 3 | Mês 6 | Mês 12 |
|---|---|---|---|
| Análises/mês | 500 | 2.000 | 8.000 |
| Pagantes ativos | 90 | 360 | 1.400 |
| MRR (R$) | R$ 4.410 | R$ 17.640 | R$ 68.600 |
| Custo total (Claude + Polly + infra) | R$ 870 | R$ 3.300 | R$ 12.500 |
| **Margem bruta** | 80% | 81% | 82% |

> 82% de margem bruta é o que sustenta SaaS health — é por isso que esse modelo é atrativo pra investidor.

#### Cenário OTIMISTA (viralização orgânica via TikTok/Instagram)

| Métrica | Mês 3 | Mês 6 | Mês 12 |
|---|---|---|---|
| Análises/mês | 1.500 | 8.000 | 30.000 |
| Pagantes ativos | 240 | 1.400 | 5.200 |
| MRR | R$ 11.760 | R$ 68.600 | R$ 254.800 |
| ARR projetado | — | — | **R$ 3,06M** |

### 3.3 Pricing recomendado (vs `docs/planos/PLAN.md`)

O `docs/planos/PLAN.md` menciona: Básico (1 análise/mês), Pro (5/mês), Clínica (ilimitado). **Recomendação:** reformular.

| Plano | Preço | Inclui | Quem é o cliente |
|---|---|---|---|
| **Grátis** | R$ 0 | 1 análise inicial completa + PDF + voz dos agentes | Todo pai (lead capture + viralização) |
| **Acompanhamento** | R$ 29/mês | 3 análises/mês (atualizar conforme criança evolui) + histórico salvo + lembretes | Pai que está em jornada (mais comum) |
| **Família+** | R$ 49/mês | 10 análises/mês + até 3 filhos + suporte prioritário | Famílias com múltiplos filhos / dúvidas frequentes |
| **Clínica** | R$ 299/mês | Ilimitado + dashboard clínica + co-branding PDF | Clínicas que querem oferecer pré-triagem aos pacientes |

**Por que mudei o B2C grátis em "1 análise"?**
- Cognoa cobra $2.280 e ninguém compra impulso. Pai precisa **sentir o produto** antes.
- 1 análise grátis = ferramenta de aquisição mais forte que existe em health B2C.
- O custo de 1 análise grátis (~R$1,50 em API) é menor que CAC orgânico de qualquer outro canal.

### 3.4 Recomendações priorizadas (matriz impacto × esforço)

|  | Baixo esforço | Alto esforço |
|---|---|---|
| **Alto impacto** | • Trocar "Laudo" por "Relatório" em todo o produto<br>• Adicionar disclaimer ANVISA/CFM<br>• Plano grátis com 1 análise<br>• Posthog instrumentado pré-lançamento | • PWA + Capacitor iOS (estratégia mobile)<br>• Blog SEO atacando os gaps identificados<br>• Sistema de waitlist com referral viral |
| **Baixo impacto** | • Mudar copy do botão "Iniciar Análise"<br>• Adicionar contador de pais atendidos | • Integração com convênios (B2B2C) — deixar pra ano 2 |

---

## 4. MODELO DE NEGÓCIO — O QUE STARTUPS HEALTH B2C USAM

### 4.1 Pesquisa de modelos típicos

Startups SaaS health B2C bem-sucedidas (Brasil + global) seguem **3 padrões**:

#### Padrão A: Freemium + Subscription (RECOMENDADO pra você)

**Exemplos:** Calm, Zenklub, Vittude, Headspace, BetterHelp Brasil.

**Como funciona:**
- Versão grátis com valor real (não trial expirante — funcionalidade limitada permanente)
- Upgrade para tier pago mensal/anual
- Anual com 30-40% desconto (caixa antecipado, reduz churn)

**Por que se aplica ao MAnalista:**
- Pais precisam **experimentar** antes de pagar (sensitive purchase)
- A 1ª análise grátis é seu melhor canal de aquisição (zero CAC se viralizar)
- Recorrência justificável: "criança evolui, analisa de novo em 3 meses"

#### Padrão B: Pay-per-result (NÃO recomendado)

**Exemplos:** Cognoa Canvas Dx ($2.280/eval), 23andMe.

**Por que NÃO se aplica:**
- Pricing alto vira barreira psicológica intransponível em B2C
- Sem recorrência = sem MRR previsível = não-investível
- Mercado brasileiro tem renda média menor — modelo Cognoa é inviável aqui

#### Padrão C: Marketplace / B2B2C (FASE 2)

**Exemplos:** Doctoralia, BoaConsulta, iClinic.

**Como funciona:**
- Plataforma cobra das clínicas/profissionais que usam
- Pai usa grátis, profissional paga pra estar no marketplace

**Por que pra Fase 2:** você precisa volume de pais primeiro (sem usuários, clínica não paga). Tipicamente em mês 12-18, com 1000+ análises/mês, abre o B2B2C.

### 4.2 Modelo recomendado para MAnalista

**Padrão A (Freemium) nos primeiros 12 meses, abrir Padrão C no ano 2.**

**Funil:**
```
Anúncio orgânico (Reels TikTok com casos comentados)
    ↓
Landing "Faça uma análise multiprofissional grátis do seu filho"
    ↓
Cadastro com email
    ↓
1 análise completa GRÁTIS (com voz dos agentes + PDF)
    ↓
PDF entregue por email + link salvar conta
    ↓
Pai compartilha PDF com WhatsApp (viralização orgânica)
    ↓
Trigger: 30 dias depois → "Quer reavaliar a evolução?" → R$29/mês
```

---

## 5. ESTRATÉGIA MOBILE iOS — RESPOSTA TÉCNICA COMPLETA

### 5.1 As 4 opções reais (não 2)

Você perguntou "app nativo ou Chrome no iPhone" — na verdade são **4 caminhos**:

| Caminho | O que é | Custo dev | Time-to-market | Acesso APIs | Distribuição | App Store? |
|---|---|---|---|---|---|---|
| **1. Web responsivo** | Mobile-friendly no Safari/Chrome | R$ 0 (já tem Next.js) | 0 dias | Limitado | URL | Não |
| **2. PWA** (Progressive Web App) | Site instalável na home, offline, push notifications | R$ 0 — só configurar manifest+SW | 1-2 dias | Médio (sem mic/file system completo) | URL + "Adicionar à Tela" | Não |
| **3. Capacitor / Tauri** | Wrapper nativo que empacota seu site em app iOS | 3-7 dias dev | 2-4 semanas | Total (mic, push APNs, IAP) | App Store + Play Store | **SIM** |
| **4. Swift nativo** | Reescrever tudo em SwiftUI | 3-6 meses dev | 3-6 meses | Total + performance máxima | App Store | **SIM** |

### 5.2 Análise específica pro MAnalista

Critérios que importam pra **este** produto:

**Critério 1 — Voz dos agentes (Fase C do projeto).**
A voz será reproduzida pelo browser via `<audio>` tag streaming. **Tanto PWA quanto Capacitor suportam** sem problema. Swift nativo só ajudaria se quisesse processamento de áudio local (você não precisa).

**Critério 2 — PDF download.**
Funciona perfeito em PWA. Capacitor adiciona share sheet nativo do iOS.

**Critério 3 — Push notifications ("seu filho fez 6 meses, hora de reavaliar").**
**PWA no iOS: limitado** (suporte parcial desde iOS 16.4, exige instalação na home). **Capacitor: APNs nativo completo.** Esse é o ponto onde PWA perde.

**Critério 4 — App Store presence (credibilidade).**
Sim, é real. Pais buscam "autismo app" na App Store. Estar lá = sinal de seriedade. PWA não aparece.

**Critério 5 — Custo de manutenção.**
PWA = você só mantém Next.js. Capacitor = você mantém Next.js + 1 wrapper. Swift = você mantém Next.js + app totalmente separado em outra linguagem. PWA ganha aqui, Capacitor empata, Swift perde feio.

**Critério 6 — In-App Purchase (IAP) Apple — taxa de 15-30%.**
Se você cobra subscription via App Store, Apple leva 15% (após 1 ano) ou 30%. Se você usa Stripe via web, Apple proíbe falar disso dentro do app (reading apps exception não se aplica). **Importante:** Capacitor com Stripe via webview funciona, mas Apple pode rejeitar review. **Solução real:** subscription via web (Stripe) + login compartilhado app/web. Você anuncia o app como "ferramenta" e cobra fora.

### 5.3 RECOMENDAÇÃO TÉCNICA ESTRATIFICADA

**Plano de 3 fases, otimizado pra custo e velocidade:**

#### Fase 1 (LANÇAMENTO — mês 1 a 3): PWA

- Configurar `manifest.json` + Service Worker no Next.js (1 dia de trabalho)
- Add to home screen via Safari iOS funciona
- Push notifications via Web Push API funcionam no iOS 16.4+
- **Zero custo Apple Developer Program**
- Validate fit com mercado antes de investir em app nativo

#### Fase 2 (PRODUTO VALIDADO — mês 4-6): Capacitor

- Trigger: quando tiver 500+ análises/mês ou 100+ pagantes
- Empacotar PWA existente em Capacitor (1 semana de dev)
- Submeter à App Store ($99/ano Apple Developer)
- Push notifications APNs nativos
- Compartilhamento PDF via share sheet iOS
- **Mantém uma única codebase Next.js**

#### Fase 3 (ESCALA — ano 2): Decidir entre manter Capacitor vs migrar partes para Swift

- Só faça Swift nativo se: (a) tiver receita > R$50k MRR, (b) performance virar gargalo real (improvável), ou (c) Apple lançar feature crítica só nativa
- Provavelmente **vai ficar em Capacitor para sempre** — é o que Notion, Discord, Instagram Threads inicial fizeram

### 5.4 O que NÃO fazer

❌ **Swift nativo agora** — desperdício de R$80-150k em dev e 4-6 meses de delay para zero ganho real. Apple aprova Capacitor sem problemas se UX for boa.

❌ **Forçar download de app antes de validar** — quanto menos atrito, mais conversão. PWA permite "experimentar sem instalar".

❌ **React Native** — você já tem Next.js, RN te força a manter 2 codebases (web Next + mobile RN), pior dos mundos. Capacitor reusa 100% do código.

❌ **Cobrar via IAP Apple** — perde 15-30% de margem e burocracia de aprovação. Cobre via Stripe na web, login compartilhado.

### 5.5 Custos das 3 opções (cálculo final)

| Opção | Dev inicial | Apple Dev Program | Manutenção/ano | Time-to-iOS |
|---|---|---|---|---|
| **PWA puro** | R$ 0 | R$ 0 | R$ 0 (cabe no Next.js) | 1-2 dias |
| **PWA + Capacitor** | R$ 5-10k (se contratar) ou 1 semana sua | $99/ano (~R$ 500) | R$ 1-2k/ano | 3-4 semanas (incluindo Apple review) |
| **Swift nativo** | R$ 80-150k | $99/ano | R$ 20-40k/ano | 4-6 meses |

**Custo da escolha errada:** se você for direto pro Swift, gasta R$100k+ e perde 5 meses competindo contra a Braine (USP) que está pra lançar.

---

## 6. RESUMO EXECUTIVO + PRÓXIMOS PASSOS

### O que fazer NESTA semana

1. **Renomear "Laudo" → "Relatório de Pré-Consulta"** em todo o código (PDF + UI + API). É só busca-e-substitui mas blinda você juridicamente.
2. **Adicionar disclaimer ANVISA/CFM** no rodapé do PDF e footer da landing. Texto pronto na Seção 2.5 deste doc.
3. **Configurar PWA** no Next.js (manifest + service worker) — 1 dia de trabalho, ganha "Adicionar à Tela" no iOS.
4. **Plug Posthog free tier** na landing e no app — sem analytics você lança cego.

### O que fazer NESTE mês

5. Construir landing page de waitlist com referral viral ("convide 3 pais, suba na fila") — captura 200-500 emails antes do lançamento aberto.
6. Reescrever pricing pra: Grátis (1 análise) → R$29 Acompanhamento → R$49 Família+ → R$299 Clínica.
7. Publicar 6 posts de blog atacando os gaps SEO identificados (Seção 1.4) — "como conversar com pediatra sobre suspeita de TEA" é o título mais alto valor / zero concorrência.
8. 5 vídeos curtos no Instagram/TikTok mostrando análise real comentada (anonimizado).

### O que fazer NESTES 3 meses

9. Lançamento beta privado (200 pais da waitlist).
10. Após beta validado, empacotar PWA em Capacitor + submeter App Store.
11. Iniciar conversas com 3-5 clínicas pediátricas para validação B2B2C (sem fechar nada — aprender).

### Decisões pendentes que dependem de você

- Aprovar mudança de "Laudo" → "Relatório de Pré-Consulta" (preciso da confirmação antes de mexer no código)?
- Aprovar novo pricing (R$ 0 / R$ 29 / R$ 49 / R$ 299)?
- Topo configurar PWA agora ou prefere focar no Fase C (voz) primeiro?

---

**Fontes:**
- [Genial Care](https://genialcare.com.br/) — rede de cuidado para TEA
- [Genial Care — teste autismo online](https://genialcare.com.br/blog/teste-de-autismo-online/) — concorrente SEO
- [Braine.digital (USP)](https://braine.digital/en-US) — plataforma USP
- [Jornal USP — Braine](https://jornal.usp.br/podcast/plataforma-inedita-no-brasil-usa-inteligencia-artificial-para-diagnosticos-de-transtorno-do-espectro-autista-tea/)
- [Estimula AI no Canal Autismo](https://www.canalautismo.com.br/noticia/app-com-ia-auxilia-criancas-com-atraso-no-desenvolvimento-estimula-ai/)
- [Cognoa — Canvas Dx FDA approval](https://www.prnewswire.com/news-releases/cognoa-receives-fda-marketing-authorization-for-first-of-its-kind-autism-diagnosis-aid-301304351.html)
- [Cognoa Canvas Dx pricing (NY Medicaid analysis)](https://www.health.ny.gov/health_care/medicaid/ebbrac/meetings/2024/docs/2024-11-21_canvas_rpt.pdf)
- [Pesquisa TIC Saúde 2024 — adoção de IA na saúde BR](https://saudedebate.com.br/noticias/aplicativos-e-a-ia-estao-ajudando-a-detectar-e-tratar-o-autismo-infantil-de-forma-eficaz/)
- [M-CHAT-R/F oficial BR](https://mchatscreen.com/wp-content/uploads/2020/09/M-CHAT-R_F_Brazilian_Portuguese_v2.pdf)
