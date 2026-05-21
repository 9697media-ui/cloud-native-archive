# Plano: Sistema de Beta Agnóstico de Hospedagem

Objetivo: fazer o sistema de Beta/Snapshot funcionar identicamente no Lovable e na Cloudflare Pages, com o Supabase como fonte única da verdade.

## 1. Migration no Supabase

Adicionar campos na tabela `ui_versions`:
- `commit_sha` (text) — hash do commit do Git
- `environment` (text) — `lovable` | `cloudflare-preview` | `cloudflare-production`
- `is_active_beta` (boolean) — versão ativa para beta testers
- `is_active_production` (boolean) — versão ativa para usuários finais
- `deployed_at` (timestamp)
- `deployed_by` (text)

Criar índices para busca rápida por `is_active_beta` e `is_active_production`.

## 2. Detecção de versão no frontend

Criar `src/lib/version.ts`:
- Lê `__APP_VERSION__` injetado pelo Vite no build
- Lê `__APP_ENV__` (lovable/cloudflare/local)
- Configurar `vite.config.ts` para injetar `VITE_COMMIT_SHA` e `VITE_ENVIRONMENT`

Cloudflare Pages já expõe `CF_PAGES_COMMIT_SHA` automaticamente. No Lovable, usar fallback timestamp.

## 3. Hook `useActiveVersion`

Criar `src/hooks/useActiveVersion.ts`:
- Consulta `ui_versions` pelo `is_active_beta` ou `is_active_production`
- Cruza com `profile.is_beta_tester` para decidir qual versão o usuário deve ver
- Compara com `__APP_VERSION__` atual e mostra aviso se houver mismatch

## 4. Edge Function `register-deploy`

Cria `supabase/functions/register-deploy/index.ts`:
- Recebe: `{ commit_sha, environment, deployed_by }`
- Insere nova linha em `ui_versions`
- Marca automaticamente como `is_active_beta = true` no ambiente correspondente
- Protegida por token (secret `DEPLOY_WEBHOOK_TOKEN`)

## 5. Painel admin de Versões

Atualizar a aba de Histórico em `UsersPage.tsx`:
- Mostrar coluna `environment` (badge colorido: Lovable/Cloudflare)
- Mostrar `commit_sha` (7 chars)
- Botões: "Ativar como Beta" e "Promover para Produção"
- Filtros por ambiente

## 6. GitHub Action para Cloudflare

Criar `.github/workflows/register-deploy.yml`:
- Roda após deploy do Cloudflare Pages
- Chama a edge function `register-deploy` com o `CF_PAGES_COMMIT_SHA`

## 7. Documentação

Adicionar `docs/DEPLOY.md` explicando:
- Como publicar no Lovable (continua igual)
- Como configurar Cloudflare Pages
- Como o fluxo Beta → Snapshot funciona em ambos

## Detalhes técnicos

```text
┌──────────────────────────────────────────────┐
│           SUPABASE (ui_versions)             │
│  ┌────────────────────────────────────────┐  │
│  │ commit_sha │ env      │ beta │ prod    │  │
│  │ a3f9...    │ lovable  │ ✓    │         │  │
│  │ b8c2...    │ cf-prod  │      │ ✓       │  │
│  └────────────────────────────────────────┘  │
└──────────────────┬───────────────────────────┘
                   │ Frontend consulta
        ┌──────────┴──────────┐
        │                     │
   Beta tester?           Usuário comum?
   → mostra beta          → mostra prod
```

## Notas

- Não há quebra do fluxo atual no Lovable — apenas adicionamos campos opcionais.
- Mantém o campo `is_beta_tester` em `profiles` (já existe).
- Cloudflare Pages é opcional: o sistema funciona 100% sem ele.