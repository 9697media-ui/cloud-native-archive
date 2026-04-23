

## Reset emergencial de senha (sem e-mail)

Bypass temporário enquanto o domínio de e-mail não está configurado: se o usuário digitar **o mesmo valor no campo e-mail e no campo senha** na tela de login, o sistema abre um formulário para ele definir uma nova senha imediatamente.

### Como vai funcionar (UX)

1. Usuário vai em `/login`, digita `joao@email.com` no campo **E-mail** E também `joao@email.com` no campo **Senha**
2. Ao clicar em **Entrar**, o sistema detecta que email == senha
3. Em vez de tentar autenticar, abre uma nova tela: **"Definir nova senha para joao@email.com"** com 2 campos (nova senha + confirmar)
4. Backend valida que o e-mail existe na tabela `profiles`, troca a senha via Edge Function (admin API) e faz login automático
5. Usuário entra direto no app já com a senha nova

### Componentes necessários

**1. Edge Function `emergency-password-reset`** (nova)
- Recebe `{ email, newPassword }`
- Verifica se o e-mail existe em `auth.users` via service role
- Atualiza a senha com `supabase.auth.admin.updateUserById(id, { password })`
- Retorna sucesso/erro (sem expor se o e-mail existe ou não, por segurança básica)

**2. `LoginPage.tsx`** (modificar)
- Em `handleLogin`, antes de chamar `signIn`, comparar `email === password`
- Se igual → mudar para novo modo `reset_emergency` (não chama Supabase)
- Novo modo renderiza formulário com: e-mail (readonly), nova senha, confirmar senha, botão "Definir senha e entrar"
- Ao submeter: invoca a Edge Function, depois faz `signIn(email, novaSenha)` automaticamente

**3. Aviso visual discreto na tela de login**
- Pequeno texto cinza abaixo do "Esqueceu a senha?": *"Sem acesso ao e-mail? Digite seu e-mail nos dois campos."*

### Considerações de segurança

- Bypass é **temporário** — adicionar comentário `// TODO: remover após configurar domínio de e-mail` na Edge Function e no LoginPage
- Função usa service role apenas no backend (nunca exposta ao frontend)
- Qualquer pessoa que souber o e-mail de um usuário pode redefinir a senha dele — **isso é um risco aceito enquanto o domínio não está pronto**, conforme sua decisão
- Vou registrar tentativas em `console.log` da Edge Function para você auditar nos logs

### Arquivos afetados

| Arquivo | Mudança |
|---|---|
| `supabase/functions/emergency-password-reset/index.ts` | Criar |
| `supabase/config.toml` | Registrar função (verify_jwt = false) |
| `src/pages/LoginPage.tsx` | Adicionar modo `reset_emergency` + detecção email==password |

### Após configurar o domínio

Quando o e-mail oficial estiver funcionando, basta remover a Edge Function e o bloco `if (email === password)` do LoginPage — sinalizado com TODO.

