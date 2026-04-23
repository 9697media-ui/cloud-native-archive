

## Reset de senha pelo admin + Login como usuário (impersonação)

### O que vai existir na tela `/usuarios`

Na lista "Usuários Cadastrados na Plataforma" (visível só para admins), cada linha ganha **dois novos botões** ao lado do badge de role:

- 🔑 **Redefinir senha** — abre modal, admin digita nova senha, sistema atualiza
- 👤 **Entrar como** — admin loga na conta do usuário sem precisar de senha

### Fluxo 1 — Redefinir senha

1. Admin clica em 🔑 ao lado do usuário
2. Modal abre: *"Redefinir senha de {nome}"* com campo "Nova senha" + "Confirmar senha" + botão **Salvar**
3. Sistema chama Edge Function `admin-reset-user-password` com `{ userId, newPassword }`
4. Edge Function valida que o caller é admin (via `has_role`), depois usa `supabase.auth.admin.updateUserById(userId, { password })`
5. Toast de sucesso. Admin entrega a senha ao funcionário pelo canal interno.

### Fluxo 2 — Entrar como usuário (impersonação)

1. Admin clica em 👤 ao lado do usuário
2. Confirmação: *"Entrar como {nome}? Você será deslogado da sua conta atual."*
3. Sistema chama Edge Function `admin-impersonate-user` com `{ userId }`
4. Edge Function valida admin, gera magic link via `supabase.auth.admin.generateLink({ type: 'magiclink', email })`, extrai o token e retorna
5. Frontend salva o ID do admin original em `sessionStorage` (`impersonator_id`), faz logout e usa o token para logar como o alvo
6. **Banner fixo no topo** aparece em todas as páginas: *"Você está logado como {nome do alvo}. [Voltar para minha conta]"*
7. Ao clicar **Voltar**, faz logout do alvo, limpa sessionStorage e redireciona para `/login` (admin loga manualmente de volta — limitação técnica, magic link de volta exigiria re-autenticação)

### Componentes / arquivos

| Arquivo | Mudança |
|---|---|
| `supabase/functions/admin-reset-user-password/index.ts` | Criar — valida admin via JWT + service role para trocar senha |
| `supabase/functions/admin-impersonate-user/index.ts` | Criar — valida admin + gera magic link do alvo |
| `supabase/config.toml` | Registrar 2 novas funções (`verify_jwt = false`, validação manual no código) |
| `src/pages/UsersPage.tsx` | Adicionar botões + modais de reset e impersonação na lista `dbUsers` |
| `src/components/ImpersonationBanner.tsx` | Criar — banner amarelo fixo no topo quando `sessionStorage.impersonator_id` existe |
| `src/components/AppLayout.tsx` | Renderizar `<ImpersonationBanner />` no topo |

### Segurança

- Ambas as Edge Functions **validam no início** se o caller é admin (`is_admin(auth.uid())`); se não for, retornam 403
- Senha do admin nunca trafega
- Service role usada só dentro das functions
- Impersonação registrada em `console.log` da function para auditoria nos logs

### Observação sobre impersonação

A solução mais limpa (Supabase ainda não tem "session swap" nativo) usa magic link sob o capô. O admin precisa logar de novo manualmente ao sair da impersonação — esse é o trade-off técnico aceito para não complicar o fluxo. Se quiser uma solução mais sofisticada (manter sessão dupla), posso planejar à parte.

