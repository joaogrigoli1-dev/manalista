# PROMPT — Sub-agente Frente B: Billing & Core Business Logic (usar modelo Sonnet 5 [alto esforço])

> Cole este prompt em uma sessão nova do Claude Desktop Cowork, com a pasta do projeto **manalista** conectada. Selecione o modelo **Sonnet 5** e esforço **[alto]** na interface. Esta sessão não tem memória de nenhuma conversa anterior.

## Contexto do projeto

manalista é um SaaS Next.js 15 (App Router) que oferece triagem/orientação pediátrica multiprofissional via 8 personas de IA (API Anthropic), com planos Free/Pro cobrados via Stripe. Uma auditoria anterior encontrou **três problemas críticos que juntos zeram a receita e descontrolam o custo**: (1) um bug de array no `middleware.ts` provavelmente impede o processamento do webhook do Stripe; (2) a resolução da chave secreta do Stripe está quebrada por um placeholder inválido bloqueando o fallback para AWS SSM; (3) a quota de análises gratuitas só é debitada no `save` final, não na geração — o que significa que cada tentativa de geração dispara até **15 chamadas pagas à API Anthropic (7 analyze + 7 debate + 1 consolidate) sem nenhum controle de custo**.

**Esta é a Frente de maior prioridade de negócio** depois de o app estar no ar (Frente D) — sem isso, o produto tem custo variável descontrolado e receita zero.

## Seu escopo — Frente B

### B.1 — C-02 (crítico): Bug de middleware

Corrija a lógica de roteamento do `middleware.ts`. O padrão correto:

```
PUBLIC_API = ['/api/stripe/webhook', '/api/health']   // nunca exige sessão
AUTH_API   = ['/api/auth']
PROTECTED_API = ['/api/analise','/api/analise/save','/api/historico','/api/stripe/checkout','/api/stripe/portal']

se rota em PUBLIC_API: next()
se rota em PROTECTED_API e não há sessão:
    se path começa com '/api/': retornar 401 JSON (NUNCA redirect 302 em rota de API)
    senão: redirect para '/login'
```

Ponto crítico: o webhook do Stripe precisa estar na lista pública (ele é validado por assinatura HMAC, não por sessão de usuário) — se ele estiver caindo na lista protegida, todo evento do Stripe está sendo rejeitado silenciosamente, o que provavelmente explica por que o billing parece não funcionar.

**Critério de aceite**: POST ao endpoint de webhook sem cookie de sessão retorna 200 (processado); GET a uma rota de API protegida sem sessão retorna 401 JSON, nunca um redirect.

### B.2 — C-03 (crítico): Resolução da chave do Stripe

A env `STRIPE_SECRET_KEY` no Coolify contém um valor placeholder que passa a validação de "existe" mas não é uma chave real, e isso está bloqueando o fallback correto para AWS SSM. Implemente:

```
função resolverChaveStripe():
  env = process.env.STRIPE_SECRET_KEY
  válida = env existe E corresponde ao padrão /^sk_(live|test)_[A-Za-z0-9]+$/
  se válida: retornar env
  doSsm = buscar parâmetro '/manalista/stripe/secret_key' no SSM (decrypt=true)
  se doSsm não corresponder ao padrão /^sk_(live|test)_/: lançar erro 'stripe_key_invalid'
  retornar doSsm
```

Coordene com a Frente D (ou o orquestrador) para que o placeholder literal seja removido/corrigido na variável de ambiente do Coolify. **Critério de aceite**: com o placeholder inválido presente na env, o sistema busca e usa a chave real do SSM automaticamente; se ambas as fontes forem inválidas, o boot da aplicação falha explicitamente (não silenciosamente).

### B.3 — C-04 (crítico, maior prioridade de negócio): Quota debitada na geração, não no save

Esta é a correção mais importante de toda a Frente B. Hoje, a quota do plano Free só é debitada quando o usuário salva a análise — o que significa que qualquer geração (inclusive tentativas repetidas, abandonadas, ou abusivas) já disparou as até 15 chamadas pagas à API Anthropic sem nenhum controle. Implemente:

```
POST /api/analise
  1. sessão obrigatória (401 se ausente)
  2. transação (SELECT ... FOR UPDATE na linha do usuário):
       usuário = buscarUsuario(sessão.id)
       se usuário.analysesUsed >= usuário.analysesLimit:
           retornar 402 { error: 'quota_exceeded', analysesUsed, analysesLimit, upgradeUrl: '/planos' }
       usuário.analysesUsed += 1     // débito ANTES de chamar a IA
       reservationId = inserir(analiseRuns, { userId, status: 'running' })
     commit
  3. rodar o pipeline dos 8 agentes (7 analyze + 7 debate + 1 consolidate)
  4. sucesso → status = 'done'
     falha → transação: usuário.analysesUsed -= 1; status = 'failed'   // estorno
```

Pontos obrigatórios: o débito acontece **antes** das chamadas pagas; implemente idempotência via header `Idempotency-Key` (evita débito duplo em retry); estorne a quota em caso de falha do pipeline; a rota de `save` **deixa de debitar** quota (para não contar duas vezes).

O retorno 402 com `upgradeUrl` é também o momento de maior potencial de conversão — o front-end deve tratar esse status como gatilho de paywall, não como erro genérico.

**Critérios de aceite**: usuário no limite recebe 402 sem que nenhuma chamada à Anthropic seja feita; uma geração bem-sucedida incrementa `analysesUsed` em exatamente 1; uma falha estorna a quota; um retry com o mesmo `Idempotency-Key` não debita de novo.

### B.4 — A-06: Falha de sessão nunca pode rebaixar plano pago a Free

```
plano = await buscarPlanoDoUsuario(userId)   // se lançar erro, propague (500) — NUNCA retorne 'free' como fallback
```

**Critério de aceite**: uma falha simulada na consulta do plano gera erro/retry visível, nunca rebaixa um usuário pago para Free.

### B.5 — Médios: transação no save + config centralizado

- Envolva o insert da análise e qualquer update relacionado em uma única transação de banco.
- Centralize toda leitura de variável de ambiente em um módulo `config.ts` único, validado e com fail-fast no boot; migre os pontos do código que hoje acessam `process.env` diretamente para importar deste módulo.

## MCPs e ferramentas a usar

- **coolify** → para consultar as variáveis de ambiente atuais (`STRIPE_SECRET_KEY`) e coordenar a correção com a Frente D; para acompanhar logs de deploy após o merge.
- **aws** → apenas para ler `/manalista/stripe/secret_key` no SSM (escopo estrito, nunca listagem ampla). Nunca escreva (`ssm_put`) sem aprovação explícita do usuário.
- **github** (se conectado) → abrir PR em vez de commitar direto.
- Se houver um **MCP de Stripe** conectado na sessão, use-o para inspecionar (não para criar cobranças reais de teste sem aprovação) o histórico de webhooks e confirmar que eventos estão de fato falhando hoje — isso valida o diagnóstico do C-02 antes de você corrigir.

## Regras de segurança (não negociáveis)

- Nunca reproduza a chave do Stripe ou qualquer segredo em texto puro em nenhuma saída, mesmo que a ferramenta MCP a retorne em claro.
- Nenhuma mudança de variável de ambiente em produção sem aprovação explícita do usuário.
- Escreva o teste específico de cada fix (especialmente C-04, o mais arriscado) na mesma PR do fix — não é necessário suite completa antes de agir, mas não faça o fix sem o teste daquele fluxo específico.
- Nenhuma ação financeira real (reembolso, cobrança de teste com cartão real) sem aprovação explícita do usuário.

## Primeiro passo

Leia `src/middleware.ts` e a rota de análise/geração atual para confirmar o diagnóstico dos 3 críticos. Proponha 3 PRs pequenos e cirúrgicos (um por achado crítico: C-02, C-03, C-04), cada um com seu teste de regressão, e execute em ordem de prioridade de negócio: **C-04 primeiro** (estanca a sangria de custo), depois **C-02 + C-03** (destrava a receita).
