## Objetivo

Cada unidade passa a ter seus próprios informativos, salvos automaticamente. Um usuário vinculado a uma unidade só enxerga e edita o que é da sua unidade. Sem fluxo de aprovação.

## Regras de acesso

- `admin_geral` / admin: vê e edita todas as unidades, e mantém o seletor de unidade livre.
- Gestor / usuário de unidade: vê apenas os informativos da sua unidade (mais unidades delegadas, se houver). O campo Unidade fica fixo, exibido como etiqueta, sem seletor.
- A restrição é aplicada no banco (não só na tela), então nem uma requisição manual consegue ler informativos de outra unidade.

## Banco de dados

Nova tabela `news_bulletins`:

- `unit_id` — unidade dona do informativo (slug do catálogo, ex. `ana-dic`)
- `profile_unit` — unidade no formato usado nos perfis (ex. `DIC`), usada pelas regras de acesso
- `title`, `category`, `header_data`, `blocks`, `status` (`rascunho` / `publicado`)
- `created_by`, `created_at`, `updated_at`, `deleted_at`

Regras de acesso da tabela: administradores acessam tudo; demais usuários acessam apenas registros cuja unidade seja a sua unidade ou uma unidade delegada (reaproveitando a função `has_unit_access` já existente no projeto).

## Mapeamento de unidades

Hoje os perfis guardam `DIC` e o editor usa `ana-dic`. Vou acrescentar o campo `profileUnit` a cada unidade em `src/lib/news/units.ts` para casar os dois mundos, e uma função `newsUnitForProfileUnit()`. Só `DIC` e `Administração` existem hoje nos perfis; conforme novas unidades forem cadastradas, basta o valor bater com o catálogo.

## Editor

- Ao abrir, a unidade é resolvida a partir do perfil. Não-admin não pode trocá-la.
- Autosave: grava o rascunho de forma automática ~2s após parar de digitar, com indicador discreto ("Salvando…" / "Salvo às HH:MM"). O primeiro autosave cria o registro; os seguintes atualizam.
- A unidade gravada vem sempre do perfil (ou do seletor, para admin), nunca de um campo manipulável.

## Lista "Meus informativos"

Nova aba na página Notícias listando os informativos da unidade do usuário: título, categoria, status, data de atualização. Ações: abrir, duplicar, excluir (exclusão suave). Ao abrir, o editor recarrega o conteúdo salvo e a geração de PDF continua funcionando igual.

## Detalhes técnicos

- Migração cria a tabela com GRANTs, RLS habilitada, políticas por unidade e gatilho de `updated_at`.
- Novo hook `src/hooks/useNewsBulletins.ts` (listar, criar, atualizar com debounce, excluir).
- `src/lib/news/units.ts` ganha `profileUnit` e o resolvedor perfil → unidade.
- `src/pages/NewsGeneratorPage.tsx`: campo Unidade condicional (seletor para admin, etiqueta para os demais), autosave e abas Editor / Meus informativos.
- Nada muda na renderização do preview nem na exportação em PDF.
