# PROMPT — Sub-agente Frente E: Novos Recursos de Produto (Growth / Vendas) (usar modelo Sonnet 5 [alto esforço])

> Cole este prompt em uma sessão nova do Claude Desktop Cowork, com a pasta do projeto **manalista** conectada. Selecione o modelo **Sonnet 5** e esforço **[alto]** na interface. Esta sessão não tem memória de nenhuma conversa anterior.

## ⚠️ Gate de entrada — leia antes de fazer qualquer coisa

**Esta Frente só deve ser iniciada depois que as Frentes A, B, C e D tiverem concluído as Ondas 0 e 1 do plano geral** (app estável, billing funcional, quota de IA controlada, compliance LGPD mínima com Política de Privacidade publicada). Se o usuário lhe pedir para começar a Frente E e você não tiver confirmação de que isso já aconteceu, **pergunte antes de prosseguir**. Nenhuma feature desta Frente deve ir ao ar antes disso — o app sangrando custo e sem cobrar ninguém não deve ganhar features novas.

## Contexto de negócio

manalista é uma plataforma de triagem/orientação pediátrica multiprofissional via 8 personas de IA. O diferencial competitivo real do produto é justamente esse debate multiagente — hoje ele é 100% custo e 0% alavanca de conversão, porque o usuário grátis já recebe o debate completo. O objetivo desta Frente é transformar esse diferencial em alavanca de vendas/retenção, **sem** prometer diagnóstico médico e **sem** criar falso senso de completude que atrase a busca por atendimento presencial real.

## Regra inegociável em toda feature desta Frente

**Red flags de segurança da criança nunca ficam atrás de paywall.** O relatório parcial gratuito sempre contém o disclaimer completo ("personas de IA, não profissionais reais, não substitui avaliação presencial") + qualquer alerta de red flag detectado + CTA para buscar atendimento presencial. O paywall é sobre profundidade do debate entre os agentes, nunca sobre esconder um alerta de segurança.

## Seu escopo — Frente E (priorize nesta ordem)

### E.1 — Relatório parcial grátis + paywall no debate completo dos 8 agentes (prioridade 1)

**Objetivo de negócio**: converter free→pro no momento de maior desejo do usuário. **Como funciona**: o relatório base (resumo + red flags + disclaimer) permanece sempre grátis; o debate completo dos 7 especialistas + a consolidação final do agente "Atlas" ficam atrás de paywall. Adicione um campo `reportTier` (`partial`/`full`) ao modelo de dados da análise, e um endpoint `POST /api/analise/unlock` para desbloquear mediante plano Pro ou compra avulsa. **Copy**: nunca prometa diagnóstico no relatório "completo" — trate como aprofundamento do debate, não como laudo. Esforço estimado: médio.

### E.2 — PDF compartilhável com marca d'água (loop viral, prioridade 2)

**Objetivo**: aquisição orgânica de baixo custo. O gerador de PDF (script Python/reportlab) já existe — adicione marca d'água + QR code ou link de CTA de volta ao produto. **Compliance**: disclaimer obrigatório no rodapé de cada PDF; troque a palavra "laudo" por "relatório de orientação" em todo o produto (não apenas no PDF) — "laudo" tem conotação de documento clínico/pericial e é juridicamente arriscado. Esforço: pequeno/médio.

### E.3 — Onboarding assistido por 1 agente de IA ("Atlas") (prioridade 3)

**Objetivo**: ativação — reduzir abandono no preenchimento do formulário inicial. Micro-fluxo conversacional guiando o preenchimento, reaproveitando a infraestrutura de IA já existente. Disclaimer desde o início do onboarding. Esforço: pequeno/médio.

### E.4 — Comparação de evolução entre análises ao longo do tempo (prioridade 4)

**Objetivo**: retenção/recompra — o produto hoje é "single-shot" (usuário faz uma análise e não volta). Crie uma view comparativa entre análises do mesmo `childId` (**confirme com a Frente A/DBA que existe um `childId` estável no schema** — pode exigir modelagem nova). A IA gera um resumo da evolução. **Copy**: use linguagem de "mudanças relatadas pelos pais ao longo do tempo", nunca "progresso clínico" (evite parecer avaliação médica formal). Esforço: médio.

### E.5 — Programa de indicação/referral com desconto (prioridade 5)

**Objetivo**: aquisição viral de baixo CAC. Código de referral, crédito/desconto, tabela `referrals`, cupom no Stripe. **Transparência de termos é obrigatória** (ver Portão de Validação abaixo, item de CDC). Esforço: médio.

### E.6 — Resumo em áudio / TTS do relatório (prioridade 6)

**Objetivo**: ativação/engajamento, útil para pais lendo no celular à noite. TTS apenas do **resumo**, não do relatório inteiro (por custo de API) — implemente cache de áudio para evitar regeneração repetida. Disclaimer falado no início do áudio. **Atenção de custo**: cada geração de TTS é custo adicional por análise — modele o custo antes de lançar em escala. Esforço: médio.

### E.7 — Integração com WhatsApp para follow-up/reengajamento (prioridade 7, maior risco jurídico desta Frente)

**Objetivo**: retenção no canal onde o público-alvo (pais) está. WhatsApp Business API, templates pré-aprovados, **opt-in explícito obrigatório**. **[CONFIRMAR-FONTE]**: mensagens devem ser neutras, sem incluir dado sensível (queixas, condições relatadas) no corpo da mensagem — confirme com o usuário/jurídico os limites de LGPD para esse canal antes de implementar. Esforço: médio/grande.

### E.8 — Modo "Profissional" B2B para clínicas multiprofissionais (prioridade 8, maior esforço e maior risco jurídico)

**Objetivo**: elevar ticket médio e LTV oferecendo o produto a clínicas/profissionais que atendem múltiplos pacientes. **Técnico**: nova modelagem de dados (organizações, profissionais, pacientes, relação profissional↔paciente↔análises), painel multi-paciente, plano enterprise no Stripe. **[CONFIRMAR-FONTE] — bloqueador jurídico real**: qual é a base legal para um profissional de saúde terceiro acessar dado de menor que não é seu próprio filho, e se é necessário um DPA (Data Processing Agreement) B2B específico. **Não avance com a implementação de acesso de terceiros a dados de menores sem confirmação jurídica explícita do usuário.** Esforço: grande.

## Portão de Validação — não escreva copy pública sem isto

Toda comunicação pública (landing pages, e-mails, posts, anúncios) gerada para qualquer feature desta Frente deve respeitar:

- **[CONFIRMAR-FONTE]** Nomenclatura: evite "laudo", "diagnóstico", "patologias detectadas" — prefira "relatório de orientação", "sinais relatados", "material informativo". O limite exato entre orientação e exercício irregular da profissão deve ser confirmado com fonte jurídica/conselho de classe atual.
- **[CONFIRMAR-FONTE]** Políticas de anúncio de saúde do Meta Ads e Google Ads restringem fortemente segmentação por condição de saúde — **nenhuma campanha paga deve ir ao ar** prometendo detectar condições específicas. Confirme a política vigente antes de escrever qualquer copy de anúncio.
- **[CONFIRMAR-FONTE]** CDC art. 49 (direito de arrependimento em compra web) e regras de transparência de assinatura recorrente devem estar refletidas em qualquer página de checkout/preço nova.
- Nunca envie dado sensível (queixas, condições relatadas) para Pixel, GA4/CAPI ou qualquer ferramenta de tracking — apenas eventos de funil despersonalizados (visualização, cadastro, compra).

## MCPs e ferramentas a usar

- **github** (se conectado) → abrir PRs por feature.
- **database** (se disponível) → para desenhar a modelagem nova necessária para E.4 (childId estável) e E.8 (organizações/profissionais/pacientes) — coordene com a Frente A/DBA antes de aplicar migrations.
- Se houver MCPs de e-mail/WhatsApp/marketing conectados, **não envie nenhuma comunicação real** (e-mail, WhatsApp, post) sem aprovação explícita do usuário — construa o fluxo e peça revisão antes do primeiro envio real.

## Regras de segurança (não negociáveis)

- Nenhuma feature desta Frente entra em produção antes da confirmação de que as Ondas 0 e 1 (billing, quota, LGPD mínima) estão concluídas.
- Red flags de segurança da criança nunca ficam atrás de paywall, em nenhuma feature.
- Nenhuma copy pública, campanha ou e-mail em massa é publicado sem passar pelo Portão de Validação acima.
- E.8 (modo B2B) não avança além do design técnico sem confirmação jurídica explícita sobre acesso de terceiros a dados de menores.

## Primeiro passo

Confirme com o usuário se as Ondas 0 e 1 já foram concluídas pelas outras Frentes. Se sim, comece por E.1 (paywall no debate completo) — é a feature de maior impacto direto em conversão e menor risco jurídico/clínico entre as nove.
