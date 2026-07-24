
# Plano técnico — API JSON pública do Portal da Transparência

> Somente análise e plano. Nada será implementado até aprovação.

---

## 1. Estrutura atual identificada

- **Tabela `public.transparency_configs`** (Supabase) — fonte da verdade dos portais/unidades. Colunas em uso: `id` (uuid), `folder_id` (Google Drive folder), `label` (nome exibido), `original_folder_name` (nome real da pasta no Drive), timestamps. Hoje NÃO possui `slug`, `description`, `order`, nem `is_public`.
- **RLS:** admins gerenciam; `anon` tem `SELECT` (leitura pública já habilitada via GRANT + policy "Public can view").
- **Página administrativa/embed:** `src/pages/TransparencyPage.tsx` (~1106 linhas). Faz CRUD dos configs e renderiza o explorer via `DriveExplorer` / `BatchDriveExplorer` (mesma página serve como embed via querystring `?embed=true&id=...`).
- **Tabela `public.global_settings`** — armazena o `refresh_token` do Google Drive sob a chave `google_drive_refresh_token` (valor JSONB). É a integração global, não por usuário.
- **Edge Function:** `supabase/functions/google-drive-proxy/index.ts` — único ponto de contato com a API do Google. Ações: `get_auth_url`, `exchange_code`, `check_auth`, `disconnect`, `get_folder_name`, `list_files`. Está com `verify_jwt = false` (config.toml).
- **Secrets já configurados:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`.

## 2. Fluxo atual da integração com o Google Drive

```text
Browser (TransparencyPage/DriveExplorer)
   │  supabase.functions.invoke('google-drive-proxy', { action:'list_files', folderId })
   ▼
Edge Function google-drive-proxy  ← SERVICE ROLE
   │  1. lê global_settings.google_drive_refresh_token
   │  2. troca refresh_token → access_token em oauth2.googleapis.com/token
   │  3. chama https://www.googleapis.com/drive/v3/files?q='<id>' in parents ...
   ▼
Retorna { files: [...] } cru do Google para o browser
```

- A consulta ao Google acontece **100% no back-end** (Edge Function). O browser nunca vê tokens.
- Navegação em subpastas é **lazy**: cada expansão dispara nova `list_files`.
- Nenhum cache. Cada render do embed = N chamadas à API do Google.

## 3. Dados que podem ser disponibilizados publicamente

Por portal (baseado em `transparency_configs` + Drive):
- `slug`, `label` (nome do portal), `description` (novo campo opcional), `order`.
- Árvore de pastas/subpastas: `name`, `path`, `modified_time`, `children_count`.
- Documentos: `name`, `mime_type`, `size`, `modified_time`, `view_url` (`https://drive.google.com/file/d/<id>/view`), `download_url` (`https://drive.google.com/uc?export=download&id=<id>`), `icon_hint` (pdf/doc/sheet/etc.), posição de exibição.
- Metadados de resposta: `generated_at`, `cache_ttl`, `source: "google-drive"`.

## 4. Dados que devem permanecer privados

- `refresh_token` / `access_token` do Google (em `global_settings`).
- `GOOGLE_CLIENT_SECRET` e demais secrets da Edge Function.
- `folder_id` cru do Google Drive (opcional — pode ser mascarado por um `id` hash/opaque para não expor a árvore raiz a scraping).
- Coluna `original_folder_name` se ela expuser nomenclatura interna.
- Qualquer campo administrativo futuro (auditoria, criador, notas internas).
- Row do `transparency_configs` marcada como `is_public = false` (ex.: rascunhos).

## 5. Proposta conceitual do endpoint

Nova Edge Function dedicada, isolada da atual `google-drive-proxy`:

- `supabase/functions/public-transparencia/index.ts`
- `verify_jwt = false` (público), CORS liberado (`Access-Control-Allow-Origin: *` ou restrito ao domínio `anabrasil.org`).
- Roteamento por path/query:

```text
GET /functions/v1/public-transparencia
      → lista portais públicos (slug + label + description)
GET /functions/v1/public-transparencia/<slug>
      → metadados do portal + raiz (1 nível)
GET /functions/v1/public-transparencia/<slug>/tree?path=/2024/Balancetes&depth=1
      → conteúdo de uma pasta específica (lazy load no WordPress)
```

Alternativamente expor via Vercel-like rewrite no WordPress:
`https://sistema.anabrasil.org/api/public/transparencia/<slug>` (mesmo endpoint).

Regras internas:
1. Ler `transparency_configs` filtrando `is_public = true` (novo bool).
2. Resolver `slug → folder_id` server-side.
3. Reusar internamente a mesma lógica de refresh_token da `google-drive-proxy` (extrair helper compartilhado em `_shared/drive.ts` para não duplicar).
4. Sanitizar resposta (whitelist de campos).
5. Retornar JSON + `Cache-Control` + `ETag`.

## 6. Exemplo da resposta JSON

`GET /public-transparencia/ana-brasil`

```json
{
  "portal": {
    "slug": "ana-brasil",
    "name": "ANA Brasil — Sede",
    "description": "Documentos institucionais e prestação de contas.",
    "order": 1,
    "updated_at": "2026-07-24T12:00:00Z"
  },
  "tree": [
    {
      "type": "folder",
      "id": "f_9c1a",
      "name": "2024",
      "modified_time": "2026-06-30T18:22:11Z",
      "children_count": 4,
      "path": "/2024"
    },
    {
      "type": "file",
      "id": "d_2b77",
      "name": "Estatuto Social.pdf",
      "mime_type": "application/pdf",
      "size": 482113,
      "modified_time": "2026-05-11T10:05:00Z",
      "view_url": "https://drive.google.com/file/d/<hash>/view",
      "download_url": "https://drive.google.com/uc?export=download&id=<hash>",
      "order": 2
    }
  ],
  "meta": {
    "generated_at": "2026-07-24T13:15:00Z",
    "cache_ttl": 900,
    "source": "google-drive"
  }
}
```

## 7. Estratégia de autenticação e segurança

- **Sem auth para o cliente** (endpoint público read-only), mas:
  - CORS restrito a `https://anabrasil.org` (+ preview/staging) em vez de `*`.
  - Rate limit por IP na própria função (in-memory + KV/`global_settings` counter) — ex.: 60 req/min.
  - Whitelist de campos + nunca vazar `refresh_token`, `client_secret`, `original_folder_name` sensível.
  - Opcional: header `X-Api-Key` compartilhado com o WordPress (secret `WORDPRESS_API_KEY`) para bloquear scraping direto — mantém "somente leitura" mas evita abuso.
  - Somente `GET` (rejeitar POST/PUT/DELETE explicitamente).
  - Nunca aceitar `folder_id` cru na URL — apenas `slug` (evita usar o endpoint para varrer qualquer pasta do Drive conectado).
- Manter `google-drive-proxy` **inalterada e privada** (admin only). A nova função é a única fachada pública.

## 8. Estratégia de cache

Três camadas complementares:
1. **HTTP:** `Cache-Control: public, s-maxage=900, stale-while-revalidate=3600` + `ETag` baseado em hash da resposta. Cloudflare/Vercel na frente do WordPress cacheia.
2. **Aplicação (Edge Function):** cache in-memory por instância (Map<slug+path, {expiresAt,payload}>), TTL 5–15 min. Como Edge Functions são efêmeras, complementar com:
3. **Persistente (Supabase):** nova tabela `transparency_cache (key text pk, payload jsonb, expires_at timestamptz)` — leitura antes de bater no Google; escrita após consulta. Invalidação:
   - por TTL;
   - manual via botão "Revalidar cache" no admin;
   - trigger opcional em `transparency_configs` UPDATE.

## 9. Arquivos e componentes que precisariam ser alterados futuramente

Somente lista prospectiva (não será tocado agora):

- **Novo:** `supabase/functions/public-transparencia/index.ts`
- **Novo:** `supabase/functions/_shared/drive.ts` (helper extraído do `google-drive-proxy` para reuso do refresh_token + `list_files`).
- **Novo (opcional):** tabela `transparency_cache` + migration.
- **Alteração leve:** `transparency_configs` ganha `slug` (unique), `description`, `display_order`, `is_public` (default false).
- **Alteração:** `supabase/config.toml` — registrar a nova função com `verify_jwt = false`.
- **Alteração UI (admin):** `src/pages/TransparencyPage.tsx` — editar slug/descrição/ordem/is_public e botão "Revalidar cache".
- **WordPress:** template/plugin que consome o JSON (fora deste repositório).
- **Nada** na `google-drive-proxy` atual, nada no fluxo OAuth, nada no embed atual.

## 10. Riscos e cuidados

- **Quota do Google Drive API:** sem cache adequado o endpoint público pode estourar a cota. Cache persistente é obrigatório antes do go-live.
- **Refresh_token único e global:** se for revogado, a API pública quebra junto com o admin. Monitorar `check_auth` periodicamente.
- **Vazamento indireto de estrutura interna:** listar recursivamente toda a árvore pode expor pastas não destinadas ao público. Solução: só publicar portais com `is_public = true` e permitir marcar subpastas como ocultas (prefixo `_` ou coluna futura).
- **IDs do Drive nas URLs:** `view_url`/`download_url` expõem o `fileId`. Isso é aceitável (é o mecanismo padrão do Drive), mas as permissões do arquivo no Drive precisam ser "qualquer pessoa com o link" — validar antes de publicar.
- **CORS mal configurado (`*`) permite embed hostil.** Restringir por origin.
- **Rate limit em Edge Function stateless** é aproximado. Reforçar com Cloudflare no WordPress.
- **Compatibilidade:** manter o embed atual funcionando em paralelo até o WordPress migrar 100%.

## 11. Critérios de aceite para uma implementação futura

1. `GET /public-transparencia` retorna 200 com lista de portais `is_public=true` em < 300 ms (cache hit).
2. `GET /public-transparencia/<slug>` devolve árvore no formato do §6, sem nenhum campo sensível (auditar diff contra whitelist).
3. Chamar `POST` no endpoint retorna 405.
4. Nenhuma resposta contém `refresh_token`, `client_secret`, `folder_id` cru sensível, ou registros com `is_public=false`.
5. Cache: 2ª chamada em < 60s não gera request ao `oauth2.googleapis.com` (verificado por log).
6. Invalidar cache no admin reflete em ≤ 1 req seguinte.
7. Fluxo OAuth atual (`get_auth_url`/`exchange_code`) e o embed continuam funcionando sem alteração.
8. WordPress consegue renderizar o portal nativamente consumindo apenas o JSON público, sem iframe.
9. Rate limit devolve 429 após o limite configurado.
10. CORS bloqueia origens não listadas em pré-flight.

---

**Aguardando aprovação** para iniciar qualquer alteração de código, schema ou configuração.
