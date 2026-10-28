# MAnalista — Mapa Global de Concorrentes

**Data:** 2026-05-18 · **Analista:** Claude Opus 4.7 · **Solicitante:** João Henrique
**Complementa:** `docs/estrategia/ESTRATEGIA-LANCAMENTO.md` (que tem o mapa Brasil)

---

## Resumo em uma linha

Existem concorrentes globais, mas **nenhum ocupa o mesmo quadrante do MAnalista** (B2C + Multiprofissional + IA generativa + PT-BR). Você tem "blue ocean" verdadeiro com janela de 12-24 meses antes que players grandes (OpenAI Health, Google, Hippocratic AI) percebam o espaço.

---

## 1. Mapeamento por camada

### Camada 1 — IA diagnóstica aprovada por agência reguladora

#### Cognoa / Canvas Dx (EUA)
- **Status:** único FDA-approved para auxílio diagnóstico TEA (De Novo clearance, junho 2021)
- **Modelo:** Rx-only (pediatra prescreve, pai não acessa direto)
- **Preço:** $2.280 por avaliação
- **Idade:** 1.5 a 6 anos
- **Cobertura:** convênio Highmark + Medicaid AZ/CA/WY
- **Limite:** só TEA, não é multiprofissional, inacessível fora dos EUA
- **Relevância pro MAnalista:** benchmark de **viabilidade comercial** ($2.280/eval prova que mercado paga). Validação acadêmica do conceito IA + diagnóstico TEA.

#### EarliPoint / EarliTec Dx (EUA)
- **Status:** FDA aprovado em 2022
- **Tecnologia:** **eye-tracking em tablet** (criança assiste vídeo, sensor captura padrão de olhar)
- **Idade:** 16-30 meses
- **Modelo:** Rx-only, ambulatório clínico
- **Limite:** sem versão consumer, hardware-dependente
- **Relevância pro MAnalista:** sinaliza que **eye-tracking será standard em 2-3 anos**. Considerar como expansão Fase 3+ quando tiver receita.

### Camada 2 — Plataformas B2B para clínicas (sem IA generativa)

#### Brain Power (EUA)
- **O que é:** Google Glass + IA para terapia social, foco adolescentes TEA
- **Limite:** hardware-dependente (Glass descontinuado), modelo nicho
- **Relevância:** baixa — caminho técnico errado

#### Floreo (EUA)
- **O que é:** VR therapy para TEA, sessões guiadas
- **Modelo:** vendido B2B para clínicas e escolas
- **Limite:** não é diagnóstico, é intervenção
- **Relevância:** parceria futura? Mostra que VR tem aceitação em terapia infantil.

#### Affectiva / SmartEye (EUA/Suécia)
- **O que é:** IA de detecção facial-emocional
- **Modelo:** B2B para pesquisadores e fabricantes automotivos
- **Limite:** não é produto end-user
- **Relevância:** baixa direta, mas tecnologia que poderia compor stack futuro.

### Camada 3 — Apps de triagem por questionário (sem debate multiprofissional)

#### Autism & Beyond (Duke University, EUA)
- **O que é:** app gratuito, criança assiste vídeo no iPad, câmera captura reação facial
- **Modelo:** pesquisa acadêmica, não comercial
- **Relevância:** prova viabilidade de captura passiva via câmera frontal, mas não tem produto.

#### ASDetect (La Trobe University, Austrália) ⚠️ **MAIS PRÓXIMO DO MANALISTA**
- **O que é:** app gratuito, perguntas + vídeos curtos para triagem 11-30 meses
- **Resultado:** "alta probabilidade / baixa probabilidade" para TEA
- **Adoção:** 100k+ downloads sem marketing pago (força do endosso acadêmico)
- **Limites versus MAnalista:**
  - Só TEA (você cobre TEA + TDAH + ansiedade + DCD + sensorial + parental)
  - Sem debate multiprofissional (você tem 7 agentes que conversam)
  - Sem relatório PDF estruturado pra médico (você gera)
  - Sem voz dos agentes (sua Fase C)
  - Inglês apenas
- **Relevância:** **principal benchmark global de UX consumer**. Estudar como eles fazem onboarding e gamificação.

#### Q-CHAT-10 online (Cambridge, UK)
- **O que é:** versão digital de questionário 10 perguntas
- **Limite:** resultado bruto sem interpretação
- **Relevância:** baixa — é só o questionário, não plataforma.

### Camada 4 — Plataformas de telessaúde mental infantil (humanos, não IA)

#### Brightline (EUA)
- **Captação:** $215M (Series C em 2022)
- **Modelo:** telessaúde mental pediátrica (terapia + psiquiatria com humanos)
- **Canal:** B2B2C via empregadores (benefício corporativo)
- **Limite:** não tem IA diagnóstica, é videochamada com profissional real
- **Relevância:** **modelo de canal empregador-benefício pode ser explorado pra MAnalista no ano 2**.

#### Little Otter (EUA)
- **Captação:** $44M
- **Modelo:** equivalente Brightline para 0-14 anos
- **Relevância:** mesmo do Brightline — humanos remotos, não IA.

#### Cerebral Kids (EUA)
- **Modelo:** psiquiatria infantil online
- **Limite:** sem IA diagnóstica, modelo controverso (Cerebral teve problemas regulatórios com adultos em 2022-2023)
- **Relevância:** baixa, mas mostra apetite do mercado.

### Camada 5 — Comunidade + educação (sem diagnóstico)

#### Autism Speaks (EUA, ONG)
- **O que é:** toolkit M-CHAT online + recursos educacionais
- **Modelo:** ONG, gratuito
- **Relevância:** parceria de conteúdo potencial pra credibilidade, não competidor direto.

#### Carecub / Tinybeans / Cradlewise
- **O que é:** apps de tracking de marcos do desenvolvimento
- **Limite:** não falam de TEA/TDAH especificamente
- **Relevância:** competição por atenção do pai novato, não diagnóstico.

---

## 2. Tabela diferencial — feature por feature

| Diferenciador do MAnalista | Cognoa | EarliPoint | ASDetect | Brightline | Genial Care (BR) | Braine (BR) |
|---|---|---|---|---|---|---|
| **7 agentes IA com personalidades distintas** | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠️ Parcial |
| **Debate multiprofissional simulado** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Cobertura além de TEA (TDAH, ansiedade, DCD, sensorial, parental)** | ❌ | ❌ | ❌ | ✅ humanos | ❌ | ❌ |
| **Relatório PDF estruturado pra levar ao pediatra** | ✅ clínico | ✅ clínico | ❌ | ❌ | ❌ | ❌ |
| **B2C direto (pai paga, não convênio)** | ❌ | ❌ | ✅ grátis | ❌ | ❌ | ⚠️ Indef. |
| **PT-BR + cenário SUS/convênio brasileiro** | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Voz dos agentes em áudio** | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠️ 1 voz |
| **Multiprofissional IA generativa** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

**Leitura:** somando todas as colunas, o MAnalista é a única plataforma a tentar ocupar TODAS as linhas simultaneamente.

---

## 3. Posição global do MAnalista — 3 eixos críticos

```
EIXO 1: Quem paga
  ├─ Pai direto (B2C)         ← VAZIO. ASDetect é grátis, Cognoa é Rx
  ├─ Convênio (B2B2C)         ← Genial Care, Brightline
  ├─ Empregador               ← Brightline, Little Otter
  └─ Médico/clínica           ← Cognoa, EarliPoint

EIXO 2: Escopo diagnóstico
  ├─ Só TEA                   ← Cognoa, EarliPoint, ASDetect, Genial Care, Braine
  ├─ Saúde mental ampla       ← Brightline, Little Otter (humanos, não IA)
  └─ MULTIPROFISSIONAL IA     ← VAZIO. Só o MAnalista propõe.

EIXO 3: Idioma + cultura
  ├─ Inglês                   ← Quase tudo
  ├─ PT-BR                    ← Genial Care, Braine
  └─ PT-BR + cenário SUS      ← VAZIO
```

**Conclusão:** mesmo no mundo, ninguém ataca a interseção "B2C + Multiprofissional + IA generativa + PT-BR". A coisa mais próxima é a combinação ASDetect (B2C grátis com IA simples) + Cognoa (relatório estruturado clínico) — mas ninguém faz os dois ao mesmo tempo.

---

## 4. Implicações estratégicas

### 4.1 Você tem blue ocean verdadeiro, não só vantagem local

- Se o MAnalista funcionar em PT-BR, **expansão para ES (Argentina, México, Espanha) e EN é viável** — ninguém ocupa o mesmo quadrante nesses mercados.
- **Cuidado com EUA:** regulação mais dura — precisa pelo menos FDA Class II ou wellness device classification.
- **Mercados abertos:** LATAM, Europa do Sul (Portugal, Itália, Espanha), parte da Ásia (Filipinas, Indonésia em inglês).

### 4.2 Risco de "alguém grande copiar" é real mas tem janela

Quem pode entrar nesse espaço:
- **OpenAI Health** (rumores de health vertical desde 2024)
- **Google Health** (já tem DeepMind Health + Verily)
- **Hippocratic AI** — startup que captou $141M em 2024 pra agentes médicos genéricos. Modelo arquiteturalmente similar ao seu (agentes especializados).

Sua proteção **não é tecnologia** — é:
1. **Velocidade** de execução
2. **Marca** (virar o "MAnalista" sinônimo de pré-triagem no Brasil)
3. **Comunidade** de pais que viralizam organicamente
4. **Dados** acumulados (cada análise melhora os prompts)

**Janela estimada:** 12-24 meses até players grandes olharem pra cá.

### 4.3 Modelo multiprofissional é fosso defensável

- **Cognoa** não vira multiprofissional sem nova aprovação FDA (~2-3 anos de processo)
- **Brightline** não vira IA-first — modelo deles é humanos
- **Genial Care** opera presencial — não vira IA sem canibalizar
- **Você** é a única arquitetura que naturalmente roda assim

---

## 5. Lições do que esses concorrentes fizeram bem

| Empresa | Lição aplicável ao MAnalista |
|---|---|
| **Cognoa** | Reembolso por convênio (Highmark) virou inflexão de receita — pensar B2B2C convênios brasileiros pro ano 2 |
| **Brightline** | Empregador é canal subestimado — "MAnalista incluído no benefício de saúde mental" pode ser receita corporativa significativa |
| **ASDetect (La Trobe)** | App gratuito acadêmico gerou 100k+ downloads sem marketing — credibilidade acadêmica acelera adoção. **Pensar parceria com USP, UNIFESP, UFRGS** pra validar |
| **EarliPoint** | Eye-tracking é o futuro próximo — eventualmente vale integrar (Fase 3+, quando tiver receita) |
| **Little Otter** | Foco em faixa etária específica (0-14a) ajuda a refinar persona — você cobre 0-12 hoje, dá pra estreitar foco inicial |

---

## 6. Concorrentes a monitorar mensalmente

Lista pra setar Google Alerts ou rodar `competitive-brief` quarterly:

| Empresa | URL | O que monitorar |
|---|---|---|
| Cognoa | cognoa.com | Expansão pra LATAM? Novos modelos? |
| Braine | braine.digital | **Lançamento comercial** (prometido pra 2025) |
| EarliPoint | earlitec.com | Aprovação em outros países |
| Brightline | hellobrightline.com | Expansão fora EUA |
| Hippocratic AI | hippocraticai.com | Vertical de pediatria? |
| Genial Care | genialcare.com.br | Expansão fora SP? Modelo B2C? |
| OpenAI Health | openai.com (health vertical) | Anúncios de produto pediátrico |

---

## 7. Próximos passos sugeridos

1. **Estudar ASDetect a fundo** — baixar o app, fazer screenshots, mapear UX onboarding. É seu benchmark global mais próximo.
2. **Pesquisar Hippocratic AI** — arquitetura de agentes similar. Estudar pricing e go-to-market deles.
3. **Considerar parceria acadêmica** — USP (concorrente direto Braine), UNIFESP ou UFRGS podem validar publicação científica do MAnalista. Lição do ASDetect.
4. **Monitorar Braine** — pingar no LinkedIn dos fundadores, ver quando lançam comercialmente. Sua janela de vantagem fecha quando eles entrarem.

---

**Fontes principais:**
- [Cognoa Canvas Dx — FDA approval](https://www.prnewswire.com/news-releases/cognoa-receives-fda-marketing-authorization-for-first-of-its-kind-autism-diagnosis-aid-301304351.html)
- [Canvas Dx pricing analysis — NY Medicaid](https://www.health.ny.gov/health_care/medicaid/ebbrac/meetings/2024/docs/2024-11-21_canvas_rpt.pdf)
- [Braine.digital (USP)](https://braine.digital/en-US)
- [Genial Care](https://genialcare.com.br/)
- [ASDetect — La Trobe University](https://asdetect.org/) (verificar antes de citar publicamente)
- [Brightline Health](https://www.hellobrightline.com/)
- [Hippocratic AI](https://www.hippocraticai.com/)
