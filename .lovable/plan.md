

## Configurar credenciais do Cloudflare R2

Vou cadastrar as 5 secrets necessárias para que a Edge Function `r2-upload` consiga gerar URLs assinadas e fazer upload dos arquivos no seu bucket `lovableana`.

### Secrets a configurar

| Secret | Valor esperado | Origem |
|---|---|---|
| `R2_ACCOUNT_ID` | `40a361e92a2b833b5232247c1eea01f9` | Já fornecido por você |
| `R2_ACCESS_KEY_ID` | (token criado no Cloudflare) | Você cola no formulário |
| `R2_SECRET_ACCESS_KEY` | (token criado no Cloudflare) | Você cola no formulário |
| `R2_BUCKET` | `lovableana` | Já definido |
| `R2_PUBLIC_BASE` | URL pública do bucket (ex: `https://pub-xxxxx.r2.dev`) | Opcional — só se ativou Public Access |

### Como vai funcionar

1. Abro um formulário seguro com os 5 campos
2. Você cola os valores (ficam criptografados, nunca expostos no frontend)
3. A Edge Function `r2-upload` passa a ler via `Deno.env.get(...)`
4. Faço um teste invocando a função para confirmar que retorna uma `uploadUrl` válida
5. Você testa anexando um arquivo em um evento do calendário

### Detalhes técnicos

- As secrets ficam disponíveis apenas no runtime das Edge Functions do Supabase
- A função já está deployada e usa `aws4fetch` para assinar PUT URLs com TTL de 5 minutos
- O upload acontece **direto do browser para o R2** (a Edge só assina, não trafega o arquivo)
- Caminho dos arquivos no bucket: `{user_id}/{uuid}/{nome_arquivo}` — isolamento por usuário

Após sua aprovação, abro o formulário de secrets.

