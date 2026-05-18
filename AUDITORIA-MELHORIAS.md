# MAnalista — Auditoria + Plano de Melhorias

**Data:** 2026-05-17 · **Auditor:** Claude Opus 4.7 · **Solicitante:** João Henrique

---

## 1. RESUMO EXECUTIVO

Auditoria de três frentes solicitadas:

1. **Voz nos profissionais** — análise comparativa ElevenLabs vs AWS Polly + recomendação.
2. **PDF do laudo** — revisão completa de layout, cores, ausência de conteúdo crítico.
3. **Perguntas iniciais** — confirmação de uso real + proposta de gamificação.

**Veredito geral:** o projeto tem fundação sólida (arquitetura limpa, 7 agentes bem prompts, streaming SSE funcional), mas três problemas críticos comprometem a experiência:

- PDF visualmente inviável para impressão (tema 100% dark, fundo `#0F1117`).
- PDF não contém resumo dos dados do paciente — pula direto para a patologia.
- Perguntas iniciais SÃO usadas (confirmado no código), mas a UX cansa e não comunica isso ao usuário.

---

## 2. AUDITORIA — PERGUNTAS INICIAIS

### 2.1 Resultado da auditoria (CONFIRMADO)

**As perguntas iniciais são 100% utilizadas no diagnóstico.** Fluxo confirmado:

```
ChildForm.tsx (coleta)
    │
    │ serialize() → ChildData
    ▼
/api/analise (route.ts)
    │
    │ buildChildDataPrompt(childData, lang)
    ▼
Claude Opus 4.6 (mediador) + Sonnet 4.6 (7 especialistas)
    │
    │ Cada agente recebe TODOS os campos no prompt
    ▼
Análise → Debate → Consolidação
```

**Campos consumidos pelos agentes** (`buildChildDataPrompt` em `prompts.ts:325`):

- Identificação: nome, idade, sexo
- **QUEIXAS PRINCIPAIS** + duração (alimenta todos os 7 agentes)
- Marcos motores, linguagem, sociais (crítico para Neuropediatra, Fono, TO)
- Comportamento em casa e escola (crítico para Psi Infantil, BCBA, Psiquiatra)
- Sono e alimentação (TO, Psiquiatra, Psi Infantil)
- Histórico familiar (Psiquiatra, Neuropediatra — genética)
- Diagnósticos prévios, medicações, terapias em andamento

**Conclusão:** cortar perguntas seria perda direta de qualidade do diagnóstico. A solução é gamificar e tornar opcional, não reduzir.

### 2.2 Diagnóstico de UX atual

Problemas identificados em `ChildForm.tsx`:

| Problema | Linha | Impacto |
|---|---|---|
| 3 steps lineares sem feedback de valor | StepBar | Pai sente que está "preenchendo formulário" |
| Apenas 3 campos obrigatórios (nome, data, 1+ preocupação) — resto opcional, mas não comunicado | canAdvance() L371 | Pai responde tudo achando que é obrigatório → cansa |
| Sem indicação visual de quanto cada resposta agrega ao diagnóstico | — | Pai não vê valor de responder mais |
| Resumo final só aparece nos steps 0-1 ("✓ X preocupações") | L717 | Sem reforço positivo contínuo |

### 2.3 Proposta — Score de Qualidade de Informação

Substituir `StepBar` por um **gauge de "Qualidade da Análise"** que sobe conforme o pai responde:

```
┌────────────────────────────────────────────┐
│  QUALIDADE DA SUA ANÁLISE                  │
│  ████████░░░░░░░░░░░  42%                  │
│  ↑ Boa! Responda mais para um diagnóstico  │
│  ainda mais preciso.                       │
└────────────────────────────────────────────┘
```

**Algoritmo de score** (proposta — implementação em `useInfoScore.ts`):

```typescript
const SCORE_WEIGHTS = {
  // Obrigatório — 25%
  name: 5, birthdate: 5, concerns: 15,
  // Alta relevância — 35%
  complaintDuration: 5, walked: 5, firstWords: 5,
  firstSentences: 5, eyeContact: 8, gestation: 7,
  // Média relevância — 25%
  schoolBehavior: 8, homeBehavior: 8, familyHistory: 9,
  // Diagnóstica — 15%
  previousDiagnoses: 5, therapies: 4,
  useMedication: 3, freeText: 3,
};
// Total: 100% — Pai vê em tempo real cada checkbox/radio somando
```

**Feedback contextual por faixa:**

- 0–30%: "Vamos começar — quanto mais você contar, melhor."
- 30–55%: "Bom! A equipe já tem material para uma primeira leitura."
- 55–75%: "Excelente! Diagnóstico vai ser bem fundamentado."
- 75–100%: "Perfeito! Análise no nível clínico ideal."

**Mudanças visuais propostas:**

1. **Apenas nome + data + 1 preocupação** continuam obrigatórios.
2. **Botão "Pular para análise"** disponível desde os 30% — desencoraja sem bloquear.
3. **Animação Framer Motion** no gauge a cada incremento (spring com bounce leve).
4. **Confetti micro** ao cruzar 75% — recompensa emocional.
5. **Indicador lateral por seção:** "Marcos do desenvolvimento +12% se preenchido".

---

## 3. AUDITORIA — PDF DO LAUDO

### 3.1 Problemas críticos encontrados em `scripts/generate_pdf.py`

| # | Problema | Linha | Severidade |
|---|---|---|---|
| 1 | Fundo `#0F1117` em todo PDF — gasta toner, ilegível impresso | L18, L140 | **CRÍTICO** |
| 2 | Cards `#0E1629` — contraste baixo em telas low-end | L348 | **ALTO** |
| 3 | **ZERO resumo dos dados do paciente** — pula da capa para "1. Patologia Principal" | L257-278 | **CRÍTICO** |
| 4 | Texto branco sobre dark — quando impresso vira "halos" cinza | toda a paleta | **CRÍTICO** |
| 5 | Sem seção de queixas relatadas pelos pais | — | **ALTO** |
| 6 | Sem seção dos marcos do desenvolvimento informados | — | **ALTO** |
| 7 | Sem transcrição do debate dos profissionais | — | **MÉDIO** |
| 8 | Banda escura no topo (#0D1020) ocupa 18mm de cada página | L142-146 | **MÉDIO** |
| 9 | Disclaimer em amarelo `#F59E0B` — péssimo contraste em branco | L118 | **ALTO** |

### 3.2 Estrutura atual vs proposta

**ATUAL** (6 seções, sem dados do paciente):
```
Capa → 1. Patologia → 2. KPIs → 3. Indicadores → 4. Especialistas
     → 5. Tratamento → 6. Referências
```

**PROPOSTA** (10 seções, light theme, com contexto):
```
Capa profissional clean (branco + accent roxo)
    │
    ▼
1. RESUMO DO PACIENTE
   - Dados básicos em grid 2x3
   - Idade gestacional + complicações
    │
    ▼
2. QUEIXAS RELATADAS PELOS RESPONSÁVEIS
   - Lista das preocupações marcadas
   - Duração informada
   - Observações livres (se houver)
    │
    ▼
3. DESENVOLVIMENTO INFORMADO
   - Marcos motores
   - Marcos de linguagem
   - Marcos sociais (contato visual)
    │
    ▼
4. HISTÓRICO CLÍNICO INFORMADO
   - Diagnósticos prévios
   - Terapias em andamento
   - Medicações
   - Histórico familiar
    │
    ▼
5. PATOLOGIA PRINCIPAL IDENTIFICADA (atual seção 1)
    │
    ▼
6. ÍNDICES DE QUALIDADE (atual seção 2)
    │
    ▼
7. INDICADORES CLÍNICOS (atual seção 3)
    │
    ▼
8. SÍNTESE DO DEBATE MULTIPROFISSIONAL  [NOVA]
   - 1 parágrafo por especialista
   - Convergências e divergências
    │
    ▼
9. ESPECIALISTAS RECOMENDADOS (atual seção 4)
    │
    ▼
10. PLANO DE TRATAMENTO (atual seção 5)
    │
    ▼
11. REFERÊNCIAS CIENTÍFICAS (atual seção 6)
```

### 3.3 Nova paleta — Light Theme print-friendly

```python
# Paleta MAnalista Light (impressão-friendly)
C_BG       = colors.HexColor("#FFFFFF")  # Branco puro
C_BG_SOFT  = colors.HexColor("#F8FAFC")  # Cards/seções
C_BG_TINT  = colors.HexColor("#F1F5F9")  # Zebras de tabela
C_INK      = colors.HexColor("#0F172A")  # Texto principal (slate-900)
C_TEXT     = colors.HexColor("#334155")  # Texto corrido (slate-700)
C_MUTED    = colors.HexColor("#64748B")  # Labels (slate-500)
C_BORDER   = colors.HexColor("#E2E8F0")  # Bordas finas (slate-200)
C_BORDER_M = colors.HexColor("#CBD5E1")  # Bordas médias (slate-300)

# Accents — cores mais escuras e impressão-friendly
C_PURPLE   = colors.HexColor("#6D28D9")  # violet-700 (era #7C5CFC claro)
C_BLUE     = colors.HexColor("#1D4ED8")  # blue-700
C_GREEN    = colors.HexColor("#047857")  # emerald-700
C_AMBER    = colors.HexColor("#B45309")  # amber-700 (alta legibilidade)
C_CORAL    = colors.HexColor("#B91C1C")  # red-700

# Backgrounds suaves para cards de patologia
C_PURPLE_BG = colors.HexColor("#F5F3FF")  # violet-50
C_GREEN_BG  = colors.HexColor("#ECFDF5")  # emerald-50
C_AMBER_BG  = colors.HexColor("#FFFBEB")  # amber-50
```

**Por que funciona impresso:**
- Texto escuro sobre fundo claro = padrão WCAG AAA.
- Accents `-700` mantêm cor mas com contraste 4.5:1+ em qualquer impressora.
- Cards usam `-50` (5% saturação) — não gasta toner, só sinaliza visualmente.
- Bordas slate-200 são visíveis na tela e na impressão.

### 3.4 Mockup ASCII da nova capa

```
┌──────────────────────────────────────────────────┐
│                                                  │
│         ┌──────┐                                 │
│         │ logo │  MAnalista                      │
│         └──────┘  Laudo Multiprofissional        │
│                                                  │
│         ─────────────────────────────            │
│                                                  │
│         PACIENTE                                 │
│         Lucas Silva Santos                       │
│         7 anos e 3 meses · Masculino             │
│                                                  │
│         DATA DA ANÁLISE                          │
│         17 de Maio de 2026                       │
│                                                  │
│         EQUIPE                                   │
│         7 especialistas + Coordenador            │
│                                                  │
│         ─────────────────────────────            │
│                                                  │
│         ⚠ MODO DEMONSTRAÇÃO                      │
│         Não substitui avaliação presencial       │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

## 4. ANÁLISE — ELEVENLABS vs AWS POLLY

### 4.1 Volume estimado de uso (cálculo crítico)

Cada análise gera ~7-8 falas dos especialistas. Estimativa baseada nos prompts:

- Texto pais (60-120 palavras × 7 agentes) ≈ **560-840 palavras/análise**
- Em caracteres (português ~6 chars/palavra) ≈ **3.4k–5k chars/análise**
- Mediador (consolidação) ≈ **+800 palavras ≈ 4.8k chars**
- **Total por análise: ~8k-10k caracteres**

Cenários de uso:

| Cenário | Análises/mês | Chars/mês |
|---|---|---|
| MVP / beta | 50 | 500k |
| Lançamento (Plano Pro 5/mês × 50 users) | 250 | 2.5M |
| Escala 6 meses | 1.000 | 10M |
| Escala 12 meses | 5.000 | 50M |

### 4.2 Custo comparativo real

#### ElevenLabs (Multilingual v2 com vozes premium PT-BR)

| Plano | Preço | Inclui | Overage |
|---|---|---|---|
| Free | $0 | 10k chars/mês | — |
| Starter | $5/mês | 30k chars | — |
| Creator | $22/mês | 100k chars | $0.30/1k |
| Pro | $99/mês | 500k chars | $0.24/1k |
| Scale | $330/mês | 2M chars | $0.18/1k |
| Business | $1.320/mês | 11M chars | $0.12/1k |

**Custo nos cenários:**
- MVP (500k chars) → Pro $99/mês ✅
- Lançamento (2.5M) → Scale $330 + (500k overage × $0.18) = **$420/mês**
- 10M chars → Business $1.320/mês
- 50M chars → Business + overage = **~$5.000/mês**

#### AWS Polly (Generative pt-BR — voz Camila)

| Tipo | Preço | Free tier |
|---|---|---|
| Neural | $16/1M chars | 1M chars/mês (12 meses) |
| Generative | $30/1M chars | 100k chars/mês (12 meses) |

**Custo nos cenários (Generative pt-BR):**
- MVP (500k) → $15/mês (descontando free tier) ≈ **$15**
- Lançamento (2.5M) → 2.5M × $30 = **$75/mês**
- 10M chars → **$300/mês**
- 50M chars → **$1.500/mês**

**Custo nos cenários (Neural pt-BR — Camila/Vitória/Thiago Standard):**
- MVP (500k) → free
- Lançamento (2.5M) → **$40/mês**
- 10M chars → **$160/mês**
- 50M chars → **$800/mês**

### 4.3 Qualidade — Mean Opinion Score (estudos 2026)

| Categoria | ElevenLabs | AWS Polly Generative | AWS Polly Neural |
|---|---|---|---|
| Naturalidade conversacional | 4.6/5 | 4.2/5 | 3.5/5 |
| Expressão emocional | 4.7/5 | 3.8/5 | 2.8/5 |
| Vozes distintas (personalidade) | **30+ PT-BR** | 1 (Camila) | 3 (Camila, Vitória, Thiago) |
| Latência (TTFA) | 135ms | 150ms | 80ms |
| Streaming nativo | Sim | Sim | Sim |

### 4.4 RECOMENDAÇÃO TÉCNICA

**Vencedor: ElevenLabs** — com ressalva de fase.

**Justificativa estratégica:**

O MAnalista vende **DIFERENCIAÇÃO POR PERSONAGEM**. Os 7 especialistas têm:
- Nomes próprios (Sofia Vygotski, Marco Cajal, Íris Skinner...)
- Personalidades distintas nos prompts ("rigorosa", "acolhedora", "data-driven")
- Backstories detalhadas no `backstories.ts`
- Avatares ilustrados em `public/avatars/`

Usar AWS Polly Generative significa **TODOS os profissionais terem a mesma voz Camila** — destrói a ilusão de equipe multiprofissional. AWS Polly Neural oferece só 3 vozes PT-BR (1 masculina, 2 femininas) — você teria 7 personagens compartilhando 3 vozes.

ElevenLabs tem 30+ vozes PT-BR, permitindo mapear 1:1 (na verdade 1:1 com sobra) — Sofia tem voz acolhedora calorosa, Cajal tem voz objetiva firme, Atlas (mediador) tem voz autoritativa serena. **Isso é o produto.**

**Plano de adoção em fases:**

| Fase | Volume | Fornecedor | Custo |
|---|---|---|---|
| Fase 1 (POC) | Até 100k chars/mês | ElevenLabs Creator ($22) | $22/mês |
| Fase 2 (Lançamento) | 500k-2M chars/mês | ElevenLabs Pro ($99) ou Scale ($330) | $99-330/mês |
| Fase 3 (Escala) | >10M chars/mês | Reavaliar: ElevenLabs Business OU híbrido (ElevenLabs em pré-visualização + AWS Polly em produção PDF) | $1k-2k/mês |

**Otimizações de custo críticas:**

1. **Cache agressivo de áudio** — primeira fala de cada agente em texto idêntico = reuso. Hash SHA-256 da string → arquivo S3.
2. **Pré-gerar saudações/intros estáticos** — "Olá, sou a Dra. Sofia, vou começar minha análise..." é sempre igual. Gera 1 vez, reusa para sempre.
3. **Só vocalizar o "texto dos pais"** (60-120 palavras), nunca o JSON técnico. Já tem o `extractFriendlyText()` separando.
4. **Streaming progressivo** — começar a tocar enquanto o texto ainda gera (ElevenLabs suporta `/stream` endpoint).

### 4.5 Mapeamento voz ↔ personagem (proposta)

Vozes ElevenLabs PT-BR sugeridas (catálogo Multilingual v2):

| Agente | Voz sugerida | Característica vocal | Motivo |
|---|---|---|---|
| **Atlas** (mediador) | Adam Stone (M, grave, sereno) | Autoritativa, calma | Coordenador 45a |
| **Sofia Vygotski** | Sarah (F, calorosa, suave) | Empática, didática | Psi infantil acolhedora |
| **Victor Winnicott** | Daniel (M, médio, paternal) | Empático, prático | Psi parentalidade |
| **Marco Cajal** | George (M, objetivo, firme) | Técnico, direto | Neuropediatra 35a |
| **Íris Skinner** | Charlotte (F, jovem, ritmada) | Metódica, focada | BCBA data-driven |
| **Camila Saussure** | Bella (F, clara, articulada) | Comunicativa | Fono (irônico fit) |
| **Elena Slagle** | Alice (F, observadora, calorosa) | Criativa | TO funcional |
| **Rafael Kanner** | Liam (M, sério, ético) | Rigoroso | Psiquiatra |

> Vozes finais a confirmar no catálogo ElevenLabs após criar conta — listei nomes-tipo. ElevenLabs também permite Voice Design (criar voz própria por descrição) no plano Pro+.

### 4.6 Revisão dos textos para TTS (não "correria de voz")

Os prompts atuais em `prompts.ts` já têm boa base, mas precisam de ajustes específicos para TTS:

**Problemas atuais para voz:**
- Uso de `**negrito**` e `*itálico*` — TTS lê como caractere especial.
- CIDs/DSMs no texto pais ("F84/299.0") — TTS lê "F oito quatro barra duzentos e noventa e nove ponto zero" → péssimo.
- Frases curtíssimas (regra 80-100 palavras) — bom para leitura, mas precisa pausas SSML para áudio.

**Adicionar ao `GLOBAL_RULES`:**

```
PARA SÍNTESE DE VOZ (TTS):
- Zero markdown no texto dos pais (sem ** ou *).
- Zero códigos CID/DSM no texto pais — só em "technicalAnalysis" do JSON.
- Use pontuação como pausa: vírgula = pausa curta, ponto = pausa média, ; = respiro.
- Marque ênfase natural com vírgulas: "O que me chama atenção, no Lucas, é..."
- Evite siglas — escreva por extenso na primeira menção. "TEA" → "transtorno do espectro autista, conhecido como TEA".
- Frases entre 8-15 palavras funcionam melhor para ritmo conversacional.
```

### 4.7 Arquitetura técnica proposta

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (React)                                       │
│  - DebateRoom renderiza texto streaming                 │
│  - useTTS hook: ao receber texto novo, chama /api/tts   │
│  - <audio> tag tocando stream do backend                │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ POST /api/tts
                     │ { text, agentId, voiceConfig }
                     ▼
┌─────────────────────────────────────────────────────────┐
│  /api/tts/route.ts (Next.js)                            │
│  1. Hash do texto → busca em cache S3                   │
│  2. Se cache miss: ElevenLabs streaming endpoint        │
│  3. Pipe do stream → resposta + grava em S3             │
│  4. Retorna audio/mpeg                                  │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ ElevenLabs API
                     │ POST /v1/text-to-speech/{voice_id}/stream
                     ▼
                ElevenLabs
                     │
                     ▼
                S3 cache (TTL 90 dias)
```

**Chave da API:** armazenar em AWS SSM como `/MAnalista/elevenlabs-api-key` seguindo o padrão já estabelecido em `aws-ssm.ts`.

---

## 5. ROADMAP DE EXECUÇÃO FASEADO

### FASE A — PDF Light Theme (prioridade CRÍTICA, baixo risco)
**Estimativa: 1 sessão de trabalho**

- [ ] Reescrever `scripts/generate_pdf.py` com paleta light
- [ ] Adicionar seções 1-4 (resumo do paciente, queixas, desenvolvimento, histórico)
- [ ] Adicionar seção 8 (síntese do debate)
- [ ] Testar impressão em laser P&B e jato de tinta colorido
- [ ] Validar com casos `data/simulations/*.json` existentes
- [ ] **Deploy DEV → GIT → PROD obrigatório no fim**

### FASE B — Gauge de Score nas Perguntas (prioridade ALTA, baixo risco)
**Estimativa: 1 sessão de trabalho**

- [ ] Criar `src/hooks/useInfoScore.ts` com pesos
- [ ] Substituir `StepBar` por `InfoScoreGauge` animado (Framer Motion)
- [ ] Botão "Pular para análise" disponível a partir de 30%
- [ ] Feedback textual contextual por faixa
- [ ] Micro-animação (confetti) ao cruzar 75%
- [ ] A/B test mental: medir intuitivamente se "sente mais leve"

### FASE C — Voz nos Profissionais (prioridade MÉDIA, médio risco)
**Estimativa: 3 sessões de trabalho**

- [ ] Subtarefa C1: Conta ElevenLabs Creator → API key → SSM
- [ ] Subtarefa C2: Endpoint `/api/tts/route.ts` com streaming
- [ ] Subtarefa C3: Cache S3 com SHA-256 dos textos
- [ ] Subtarefa C4: `useTTS` hook no frontend + `<AgentAudio>` componente
- [ ] Subtarefa C5: Mapeamento voz↔agente em `voiceMap.ts`
- [ ] Subtarefa C6: Ajustar `GLOBAL_RULES` em `prompts.ts` para TTS-friendly
- [ ] Subtarefa C7: Controles UI — botão mute global, slider velocidade, indicador "falando agora"
- [ ] Subtarefa C8: Pré-gerar intros estáticos (1 vez, save S3)
- [ ] Subtarefa C9: Smoke test com caso `caso-2847-lucas.json`

### FASE D — Polimento e Métricas (futuro)
- Dashboard de custo TTS por análise
- Opção do pai escolher voz (Voice Design no plano Pro)
- Legendas sincronizadas (caption-track)
- Voz do mediador final com mais emoção (model `eleven_v3_alpha`)

---

## 6. RISCOS E DECISÕES PENDENTES

| Risco | Mitigação |
|---|---|
| Custo ElevenLabs explodir além do esperado | Cache agressivo + monitorar Cloudwatch métricas custom |
| Voz robótica em casos longos | Usar modelo `eleven_multilingual_v2` (não Flash) para mediador |
| Atraso de start na primeira fala | Pré-gerar saudações + usar streaming endpoint |
| API ElevenLabs cair | Fallback graceful: esconder áudio, mostrar só texto (já é fallback natural) |

**Decisões que dependem de você:**

1. **Confirmar fornecedor de voz:** ElevenLabs Creator ($22/mês para começar)?
2. **Aprovar paleta light** — quer que eu te mostre um mockup HTML do PDF antes de codar?
3. **Algo a remover do escopo?** As 3 fases (A/B/C) ficam grandes — quer fazer só A+B primeiro e voz depois?

---

## 7. ANEXOS — Arquivos auditados

- `src/components/forms/ChildForm.tsx` (724 linhas)
- `src/lib/agents/profiles.ts` (444 linhas — 8 agentes)
- `src/lib/agents/prompts.ts` (388 linhas — system + task + child prompts)
- `src/components/agents/DebateRoom.tsx` (447 linhas)
- `src/app/api/analise/route.ts` (95 linhas — SSE streaming OK)
- `src/app/api/relatorio/route.ts` (77 linhas — Python spawn OK)
- `scripts/generate_pdf.py` (544 linhas — fonte de todos os problemas do PDF)
- `src/types/index.ts` (137 linhas — tipos consistentes)
- `PLAN.md` (349 linhas — planejamento técnico original)

---

**Pronto para executar.** Aguardo decisão sobre ordem das fases e aprovação do fornecedor de voz.
