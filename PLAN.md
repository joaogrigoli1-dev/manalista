# MAnalista — Planejamento Técnico Completo

**Versão:** 2.0 | **Data:** 2026-04-11 | **Autor:** João Henrique + Claude Opus 4.6

---

## 1. VISÃO GERAL DO PRODUTO

**MAnalista** é uma plataforma SaaS de análise pediátrica multiprofissional com IA.
Uma equipe de 6 agentes especializados (personagens fictícios inspirados em pensadores reais)
analisa dados de crianças, debate entre si e gera relatórios diagnósticos fundamentados.

### Público-alvo
- Pais/responsáveis preocupados com o desenvolvimento dos filhos
- Clínicas pediátricas como ferramenta de pré-triagem
- Escolas especiais para orientação inicial

### Modelo de negócio
- Landing page marketing → captação → assinatura → acesso ao painel de análise
- Planos: Básico (1 análise/mês), Pro (5/mês), Clínica (ilimitado)

---

## 2. DECISÕES TECNOLÓGICAS

### Frontend
| Tecnologia | Justificativa |
|---|---|
| **Next.js 15 (App Router)** | SSR, streaming, API routes, SEO, já em uso |
| **Tailwind CSS v4** | Utility-first, responsivo, performance, alinhado com /high-end-visual-design |
| **Framer Motion** | Animações premium GPU-safe (transform + opacity only) |
| **Plus Jakarta Sans** | Fonte premium permitida pelo skill, já em uso |
| **Phosphor Icons (Light)** | Ícones ultra-light premium (substitui emoji pesado) |

### Backend / IA
| Tecnologia | Justificativa |
|---|---|
| **Claude Opus 4.6** | Modelo mais capaz para análise clínica profunda |
| **API key via AWS SSM** | `/IA_Equipe_P/claude-api-key` — já configurado |
| **Server-Sent Events** | Streaming em tempo real, já funcional |
| **ReportLab (Python)** | PDF profissional dark-themed, já funcional |

### Infraestrutura
| Tecnologia | Justificativa |
|---|---|
| **GitHub** | Repositório `jhgm/manalista` |
| **Coolify** | Container Docker no VPS 62.72.63.18 |
| **Cloudflare** | DNS + CDN + SSL para manalista.com.br |
| **Docker** | Dockerfile multi-stage (Node + Python) |

### Escala Futura
| Tecnologia | Quando |
|---|---|
| **Supabase (PostgreSQL)** | Quando auth + histórico de análises |
| **Redis** | Rate limiting + cache de sessões |
| **React Native / Expo** | App iOS + Android nativo (Fase futura) |
| **Vercel Edge** | Se migrar de Coolify para escala global |

### Remover
- **Ícone N do Next.js**: `devIndicators: false` no `next.config.ts`
- **Emojis como avatares**: substituir por ilustrações AI (Gemini)


---

## 3. FASES DE IMPLEMENTAÇÃO

### FASE 1 — Infraestrutura e CI/CD (Prioridade: CRÍTICA)

**Objetivo:** Repositório, container, domínio, pipeline dev>git>prod

**Tarefas:**
1. Criar repositório GitHub `jhgm/manalista` (privado)
2. Commit inicial com código atual
3. Criar `Dockerfile` multi-stage:
   - Stage 1: Node.js 20 Alpine → build Next.js
   - Stage 2: Node.js 20 + Python 3.11 → runtime com reportlab
4. Criar `docker-compose.yml` para Coolify
5. Configurar Coolify no srv 62.72.63.18:
   - Novo projeto "manalista"
   - Source: GitHub repo
   - Build: Dockerfile
   - Porta: 3000 → domínio
6. Cloudflare: zona manalista.com.br
   - A record → 62.72.63.18
   - CNAME www → manalista.com.br
   - SSL Full (Strict)
7. Remover ícone N: `devIndicators: false` no next.config
8. Armazenar credenciais no AWS SSM:
   - `/MAnalista/github-token`
   - `/MAnalista/cloudflare-api-token`
   - Usar existente: `/IA_Equipe_P/claude-api-key`

**Teste:** `curl https://manalista.com.br` retorna HTML da landing

---

### FASE 2 — Redesign UI Premium (Prioridade: ALTA)

**Objetivo:** Interface Awwwards-tier seguindo /high-end-visual-design

**Decisão de arquétipo:**
- Vibe: **Ethereal Glass** (OLED black, mesh gradients, glass cards)
- Layout: **Asymmetrical Bento** para painel de análise

**2.1 — Layout do Painel de Análise (NOVA ARQUITETURA)**
```
┌─────────────────────────────────────────────────────────┐
│ [Navbar flutuante pill — glass blur]                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │
│  │ Agent 1  │  │ Agent 2  │  │                      │  │
│  │ Avatar   │  │ Avatar   │  │   PAINEL CENTRAL     │  │
│  │ [diálogo]│  │ [diálogo]│  │   Resultado em       │  │
│  └──────────┘  └──────────┘  │   construção +       │  │
│  ┌──────────┐  ┌──────────┐  │   KPIs patologias    │  │
│  │ Agent 3  │  │ Agent 4  │  │   detectadas         │  │
│  │ Avatar   │  │ [diálogo]│  │                      │  │
│  └──────────┘  └──────────┘  │                      │  │
│  ┌──────────┐  ┌──────────┐  │                      │  │
│  │ Agent 5  │  │ Mediador │  │                      │  │
│  │ [diálogo]│  │ [diálogo]│  └──────────────────────┘  │
│  └──────────┘  └──────────┘                             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Mobile (< 768px):**
```
┌─────────────────┐
│ Agent cards      │ ← horizontal scroll
│ [1][2][3][4][5]  │
├─────────────────┤
│ Painel Central  │ ← full width
│ Resultado +     │
│ KPIs            │
└─────────────────┘
```

**2.2 — Card do Profissional (redesign)**
- Double-Bezel architecture (outer shell → inner core)
- Avatar AI (ilustração realista, não emoji)
- Nome + especialidade
- Mini caixa de diálogo com streaming word-by-word
- Botão ⓘ para backstory do personagem (modal com história)
- Indicador de status (dot pulsante quando ativo)
- Texto LEVE para pais (resumo simplificado)
- Backend mantém texto completo técnico para PDF

**2.3 — Componentes a criar:**
- `AgentPanel.tsx` — grid de 6 agentes
- `AgentMiniCard.tsx` — card compacto com avatar + diálogo
- `CharacterModal.tsx` — modal com história do personagem
- `ResultsPanel.tsx` — painel central com KPIs
- `PathologyKPI.tsx` — indicador % de patologia detectada
- `QualityGate.tsx` — verificação de qualidade (>70%)

**Teste:** Responsivo em Chrome DevTools (iPhone 14, iPad, Desktop)


---

### FASE 3 — Avatares AI + Backstory (Prioridade: ALTA)

**Objetivo:** Ilustrações realistas dos personagens + história narrativa

**3.1 — Geração de avatares via Gemini API**

Cada personagem tem descrição física narrativa para gerar ilustração:

| Personagem | Descrição para geração |
|---|---|
| Coord. Atlas | Homem 45a, cabelo grisalho curto, óculos finos, terno escuro, expressão serena e autoritativa, fundo neutro escuro |
| Dra. Sofia Vygotski | Mulher 38a, cabelo castanho ondulado, jaleco branco, colar delicado, expressão calorosa e acolhedora |
| Dr. Victor Winnicott | Homem 42a, barba curta ruiva, camisa social sem gravata, expressão empática e paternal |
| Dra. Helena Luria | Mulher 50a, cabelo curto grisalho, óculos redondos, expressão analítica e precisa |
| Dr. Marco Cajal | Homem 35a, cabelo escuro, jaleco branco, estetoscópio, expressão confiante e técnica |
| Dra. Íris Skinner | Mulher 32a, cabelo liso preto, blusa moderna, tablet na mão, expressão focada e metódica |

**3.2 — Backstory de cada personagem**
- Por que o nome? (referência ao pensador real)
- Formação fictícia detalhada
- Por que está na equipe? (o que sua especialidade agrega)
- Referências científicas que domina (livros, artigos reais)
- Abordagem clínica preferida

**Formato:** JSON em `src/lib/agents/backstories.ts` + imagens em `public/avatars/`

**Teste:** Imagens carregam em <1s, modal backstory funcional

---

### FASE 4 — Backend Opus 4.6 + Qualidade (Prioridade: CRÍTICA)

**Objetivo:** Migrar para Opus 4.6, implementar gate de qualidade

**4.1 — Atualizar modelo na API route**
- `src/app/api/analise/route.ts` → modelo `claude-opus-4-6`
- System prompt revisado com instruções mais profundas
- Texto duplo: versão técnica (PDF) + versão simplificada (frontend pais)

**4.2 — Gate de qualidade (mínimo 70%)**
- Cada agente retorna `confidence: number` (0-100)
- Mediador calcula média ponderada
- Se < 70%: NÃO apresenta resultado
- Em vez disso: pergunta ao pai informações específicas que faltam
- Loop: pai responde → agentes re-analisam → nova avaliação
- Máximo 3 rodadas de perguntas adicionais

**4.3 — Prompts revisados para cada agente**
- Saída estruturada: JSON com campos `technicalAnalysis` + `parentFriendlyText`
- `parentFriendlyText`: linguagem simples, sem jargão, empática
- `technicalAnalysis`: completo, com CID-11, DSM-5, refs, embasamento

**4.4 — Novas especialidades (se necessário)**
- Avaliação: se dados indicarem necessidade (ex: fonoaudiologia, TO)
- Template pronto para adicionar novo agente ao debate

**Teste:** Análise com dados incompletos → sistema pede mais info
         Análise com dados ricos → resultado com >70% confiança

---

### FASE 5 — Painel Central + KPIs (Prioridade: ALTA)

**Objetivo:** Painel central mostra resultado sendo construído em tempo real

**5.1 — KPIs de patologias detectadas**
- Cards com gauge/progress circular
- Ex: "TEA: 82%", "TDAH: 45%", "Ansiedade: 67%"
- Cores: verde (>70%, alta confiança), amarelo (50-70%), vermelho (<50%)
- Apenas mostrar patologias com >30% de indicação

**5.2 — Resultado estruturado**
- Patologias detectadas (com % e embasamento)
- Fatos que levaram à conclusão (bullets objetivos)
- Profissional que o pai deve procurar + por quê
- Ex: "Procure um Neuropediatra para avaliação formal de TDAH porque..."
- Indicação de urgência (normal, prioritário, urgente)

**5.3 — Componentes:**
- `KPIGauge.tsx` — gauge circular animado
- `PathologyCard.tsx` — patologia + % + embasamento resumido
- `ActionRecommendation.tsx` — "procure este profissional"
- `CentralPanel.tsx` — orquestra tudo

**Teste:** KPIs atualizam em tempo real conforme agentes analisam


---

### FASE 6 — Landing Page Marketing (Prioridade: MÉDIA)

**Objetivo:** Landing page premium que vende o produto antes de dar acesso ao painel

**Rota:** `/` → landing marketing | `/app` ou `/analise` → painel (autenticado)

**Seções da landing (high-end visual design):**
1. Hero cinematográfico com gradiente mesh + título "MAnalista"
2. Problema: "Seu filho precisa de ajuda. O SUS demora 18 meses."
3. Solução: Como funciona (animação de 5 steps)
4. Equipe: Preview dos 6 agentes com avatares
5. Demo: Screenshot/vídeo do painel em ação
6. Depoimentos (placeholder para futuro)
7. Preços/Planos
8. FAQ
9. Footer com LGPD, termos, contato

**Design:** Ethereal Glass, Double-Bezel cards, Framer Motion scroll reveals
**Mobile:** Single column, CTAs grandes, touch-friendly

**Teste:** Lighthouse > 90 (performance, accessibility, SEO)

---

### FASE 7 — PDF Report Premium (Prioridade: ALTA)

**Objetivo:** Relatório PDF segue mesmo visual high-end

**7.1 — Estrutura do relatório:**
1. **Capa:** Logo + nome criança + data + equipe
2. **Índice:** Links internos
3. **Equipe:** Cada profissional com:
   - Avatar (miniatura)
   - Nome + especialidade
   - Por que participa da análise
   - Currículo resumido (formação, referências que domina)
   - NÃO diz que escreveu livros — diz "especialista em [livro] de [autor]"
4. **Análise por agente:** Texto técnico completo com embasamento
5. **Debate consolidado:** Pontos de acordo e divergência
6. **Diagnóstico sugerido:**
   - Patologias + CID-11 + DSM-5
   - % de confiança + embasamento
   - Fatos que sustentam a conclusão
7. **Recomendações:**
   - Profissional a procurar + por quê
   - Tratamentos sugeridos + nível de evidência
8. **Referências científicas:** APA format
9. **Disclaimer legal**

**Teste:** PDF abre corretamente, visual consistente, <3s geração

---

### FASE 8 — Deploy Completo (Prioridade: CRÍTICA)

**Pipeline obrigatório: DEV → GIT → PROD**
1. DEV: Desenvolvimento local (localhost:3000)
2. GIT: Push para main no GitHub
3. PROD: Coolify detecta push → build → deploy automático

**8.1 — Checklist de deploy:**
- [ ] Dockerfile funcional (Node + Python + reportlab)
- [ ] Variáveis de ambiente no Coolify (AWS_REGION, etc.)
- [ ] SSL ativo via Cloudflare
- [ ] DNS propagado
- [ ] Health check endpoint `/api/health`
- [ ] Smoke test: formulário → análise → PDF download

---

## 4. ORDEM DE EXECUÇÃO

Execução paralela quando possível:

```
FASE 1 (Infra) ─────────────────────────┐
                                          ├──→ FASE 8 (Deploy)
FASE 2 (UI) + FASE 3 (Avatares) ────────┤
         em paralelo                      │
FASE 4 (Backend) ───────────────────────┤
                                          │
FASE 5 (KPIs) ──────────────────────────┤
                                          │
FASE 6 (Landing) ───────────────────────┤
                                          │
FASE 7 (PDF) ───────────────────────────┘
```

**Estimativa:** 4-6 horas de execução com agentes paralelos

---

## 5. REGRA GLOBAL

> **DEV > GIT > PROD — NUNCA INVERTER OU ALTERAR SEQUÊNCIA**
> **NUNCA EDITAR ARQUIVO DIRETAMENTE NO SRV PROD**
