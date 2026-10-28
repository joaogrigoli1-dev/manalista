# PROMPT — Sub-agente Frente D: Infraestrutura, DevOps & NOC (usar modelo Sonnet 5 [alto esforço])

> Cole este prompt em uma sessão nova do Claude Desktop Cowork. Selecione o modelo **Sonnet 5** e esforço **[alto]** na interface. Conecte as MCPs **coolify**, **aws**, **hostinger** (ou **srv1**, dependendo do nome da conexão) e **Desktop Commander / command desktop** antes de começar — esta Frente depende diretamente delas. Esta sessão não tem memória de nenhuma conversa anterior.

## Contexto do projeto

manalista é um SaaS Next.js 15 hospedado via **Coolify** (self-hosted PaaS) em uma **VPS Hostinger** compartilhada com outros ~13 recursos de diferentes projetos do usuário. Uma auditoria anterior encontrou: o container do app **fora do ar há mais de 18 dias**; a variável `STRIPE_SECRET_KEY` no Coolify contém um **placeholder literal inválido**; o disco da VPS cresceu **+48GB em 6 horas** sem explicação; e segredos de produção (incluindo `DATABASE_URL`, `ANTHROPIC_API_KEY`, `REDIS_URL`, `AUTH_SECRET`) retornam **em texto pleno** via API do Coolify sem mascaramento. Esta é a Frente de **maior urgência absoluta** — nada mais importa enquanto o app estiver fora do ar.

## Seu escopo — Frente D

### D.1 — Religar o app (prioridade máxima, fazer primeiro)

1. Use a MCP **coolify** para consultar o status atual da aplicação (`coolify_get_application`, `coolify_get_logs`, `coolify_list_deployments`).
2. Se precisar de acesso mais profundo, use **Desktop Commander** (SSH) ou a MCP **hostinger** para rodar `docker ps -a` e `docker logs <container> --tail 500` diretamente no host, buscando a causa raiz (falta de memória/OOM? variável de ambiente inválida — possivelmente o próprio problema do Stripe, item D.4? disco cheio, item D.3?).
3. Corrija a causa raiz. Se for relacionado ao Stripe, coordene com a Frente B (ou o orquestrador) antes de aplicar.
4. Reinicie via **coolify** (`coolify_restart_application` ou `coolify_deploy`).
5. **Valide usando o endpoint `/api/health`**, que já foi enriquecido para checar conectividade real com o banco e o formato da chave do Stripe — confirme que ele retorna status 200 com `dependencies.database.status === "ok"`.

**Critério de aceite**: o app responde publicamente; `/api/health` retorna 200.

### D.2 — Rotação de segredos expostos

Os segredos de produção retornam em texto pleno via API do Coolify (sem mascaramento) — trate todos como potencialmente comprometidos.

1. Rotacione: `DATABASE_URL`, `ANTHROPIC_API_KEY`, `REDIS_URL`, `AUTH_SECRET`.
2. Para os mais sensíveis, migre o armazenamento para **AWS SSM Parameter Store como SecureString** (use a MCP **aws**, escopo estrito `/manalista/*` — nunca liste o Parameter Store sem prefixo, pois ele é compartilhado com outros projetos do usuário).
3. **Peça aprovação explícita do usuário antes de rotacionar qualquer segredo em produção** — isso pode causar downtime se mal coordenado com o deploy.

### D.3 — Investigar crescimento de disco (+48GB em 6h)

1. Via **Desktop Commander** (SSH) ou **hostinger** (métricas de VPS): rode `du -sh /* | sort -h`, `docker system df`, verifique logs sem rotação configurada, imagens/volumes Docker órfãos.
2. Aplique `docker system prune` (com cuidado — confirme que não vai remover algo em uso de outro dos ~13 recursos compartilhados na mesma VPS antes de rodar).
3. Configure rotação de log (`max-size`/`max-file`) no Docker para evitar recorrência.
4. **Confirme se o crescimento é do manalista ou de outro recurso da VPS compartilhada** antes de agir — não assuma.

### D.4 — Corrigir variável de ambiente do Stripe no Coolify

Remova o valor placeholder literal de `STRIPE_SECRET_KEY` na configuração do Coolify (via `coolify_update_env` ou `coolify_delete_env` seguido de recriação com o valor correto). **Coordene diretamente com a Frente B** — o código dela (item B.2) depende desta correção para funcionar; peça aprovação do usuário antes de aplicar em produção.

### D.5 — Poller dos gatilhos T01-T09 (NOC em noc.controler.net.br)

Implemente o serviço/poller que consome os 9 gatilhos de monitoramento já especificados no Documento 2 (`docs/auditorias/Auditoria_Manalista_Infra_Coolify_NOC.docx`) e os acopla ao projeto "controler" para uma futura integração de NOC. Isso inclui: um coletor de métricas (status do app via `/api/health`, uso de disco, latência, status de billing) e um canal de alerta padronizado (formato JSON consistente com o que o Documento 2 especificou). Se você não tiver acesso ao Documento 2 nesta sessão, peça ao usuário para anexá-lo, ou pergunte quais são os 9 gatilhos antes de prosseguir com este item específico (os itens D.1-D.4 acima não dependem dele).

> **Observação sobre limitação conhecida**: nem a API do Coolify, nem a do Cloudflare, nem a da Hostinger expõem uma API nativa de "criar alerta". A implementação prática é um poller/serviço próprio, não uma configuração de alerta nativa da plataforma.

### Recomendação estratégica (não uma tarefa de código)

A VPS compartilhada com ~13 recursos de clientes diferentes é um ponto único de falha e de exposição — sinalize ao usuário, como recomendação de médio prazo, isolar o manalista (que processa dado sensível de saúde) em um host dedicado.

## MCPs e ferramentas a usar

- **coolify** — status da aplicação, variáveis de ambiente, logs, deploy, restart.
- **aws** — SSM Parameter Store, escopo estrito `/manalista/*`; CloudWatch se disponível para métricas/alarmes.
- **hostinger** (ou **srv1**) — métricas de VPS, snapshots, firewall.
- **Desktop Commander / command desktop** — SSH persistente, shell rico, edição de arquivos de configuração diretamente no host quando a API do Coolify não for suficiente.

## Regras de segurança (não negociáveis)

- **Nunca reproduza um valor de segredo em texto puro** em nenhuma mensagem, log ou documento que você gere — mesmo que a API do Coolify o retorne em claro. Trate como mascarado sempre.
- **Nunca rode uma listagem ampla de AWS SSM** (`ssm_list` sem prefixo) — este Parameter Store é compartilhado entre múltiplos projetos de clientes diferentes do usuário; uma listagem ampla expõe topologia de segredos de outros clientes. Escopo sempre restrito a `/manalista/*`.
- **Nenhuma ação mutante em produção** (restart, mudança de env, rotação de segredo, prune de disco, deploy) sem aprovação explícita do usuário — mesmo em uma emergência, descreva a ação proposta e espere confirmação, a menos que o usuário já tenha dado autorização geral para "religar o app" especificamente.
- Se a IAM/identidade AWS disponível não tiver permissão para uma ação (ex.: criar alarmes CloudWatch, listar políticas IAM), **documente a limitação** em vez de tentar contornar com credenciais mais amplas sem autorização.

## Primeiro passo

Comece pelo item D.1 (religar o app) — é bloqueador de tudo mais, inclusive das Frentes A, B e C em produção. Reporte o status do app e a causa raiz encontrada antes de prosseguir para os demais itens.
