## 1. Resumo executivo

A página Jornal Institucional já entrega o essencial (listagem, editor multipágina, miniaturas, canvas, propriedades, exportação). Falta contexto: nada na tela diz "esta é a sua unidade". A proposta é uma evolução — não redesign — que injeta a identidade da unidade em cinco pontos: cabeçalho da listagem, cards, estado vazio, modal de criação e topo do editor.

## 2. Análise da página atual

Funciona bem: listagem em cards, badges de status, busca por nome, ações rápidas (Editar/Duplicar/Excluir), editor em 3 colunas, autosave 2s, exportação PDF dupla.

Genérico demais:
- Cabeçalho "Jornal Institucional / Crie edições A4 multipágina e exporte em PDF" é linguagem de ferramenta, não de usuária.
- Seletor de unidade no modal aparece como campo livre com placeholder "Institucional geral" — sugere escolha manual e permite erro.
- Unidade aparece só como texto pequeno cinza dentro do card, misturada com mês de referência.
- Estado vazio diz apenas "Nenhum jornal criado ainda" — sem unidade, sem convite.
- Editor: barra superior tem Voltar, nome editável, status de salvamento e exportação. Nenhuma menção à unidade.
- Sem indicadores de quantidade por status, sem filtro por status/mês.
- Tela de acesso restrito fala em "setor de Marketing e Administração Geral" — texto administrativo, não fala com a diretora.

## 3. Principais problemas de percepção para diretoras

1. Ambiguidade de escopo: não fica claro se a lista mostra tudo ou só a unidade dela.
2. Falsa escolha: o campo Unidade parece opcional/editável.
3. Vinculação invisível: nada afirma "o jornal criado será desta unidade".
4. Nenhuma âncora de contexto no editor — a diretora pode perder a referência do que está editando.
5. Tom técnico ("A4 multipágina", "template", "bloco", "propriedades").

## 4. Objetivos da melhoria

Unidade sempre visível; vinculação percebida como fixa e segura; listagem lida como "minha área"; criação sem decisão de unidade; editor com âncora institucional permanente; zero complexidade nova.

## 5. Proposta de experiência centrada na unidade

Um componente único e reutilizável, o **Selo de Unidade**, com três tamanhos:
- **Banner** (listagem): faixa em `bg-card` com borda, ícone de prédio, rótulo "Minha unidade", nome oficial em destaque e botão discreto "Trocar unidade ▾".
- **Linha** (modal e editor): ícone + nome + seletor "Trocar unidade".
- **Chip** (cards e mobile): nome curto da unidade com ícone.

Regra de exibição: todos os perfis veem o selo com a unidade atual e podem abrir o seletor. Ao escolher outra unidade, abre um **popup de confirmação** ("Deseja realmente trocar a unidade?") explicando que o contexto da tela (jornais listados / vínculo do novo jornal) passará a ser da unidade escolhida. Confirmar aplica; cancelar mantém a unidade anterior. Nenhum cadeado é exibido em nenhuma tela.

## 6. Nova estrutura da página inicial

```text
┌───────────────────────────────────────────────────────────────┐
│ Olá, Diretora                       [ + Criar jornal da       │
│ Aqui ficam os jornais da sua unidade.   unidade ]             │
├───────────────────────────────────────────────────────────────┤
│ ▣ MINHA UNIDADE                        [ Trocar unidade ▾ ]   │
│   CEI Bem Querer Professor Pierre Weil                        │
│   Todos os jornais desta página pertencem a esta unidade.     │
├───────────────────────────────────────────────────────────────┤
│  [ 3 Rascunhos ]  [ 5 Finalizados ]  [ 1 Arquivado ]          │
├───────────────────────────────────────────────────────────────┤
│  🔎 Buscar edição        Status ▾        Mês/Ano ▾            │
├───────────────────────────────────────────────────────────────┤
│  SEUS JORNAIS                                                 │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐           │
│  │ [miniatura   │ │ [miniatura]  │ │ [miniatura]  │           │
│  │  da capa]    │ │              │ │              │           │
│  │ Julho/2026   │ │ Junho/2026   │ │ Maio/2026    │           │
│  │ 🏢 Pierre W. │ │ 🏢 Pierre W. │ │ 🏢 Pierre W. │           │
│  │ ● Rascunho   │ │ ● Finalizado │ │ ● Arquivado  │           │
│  │ 8 páginas ·  │ │ 12 páginas · │ │ 6 páginas ·  │           │
│  │ há 2 dias    │ │ 12/06        │ │ 03/05        │           │
│  │ [Abrir][⧉][🗑]│ │ ...          │ │ ...          │           │
│  └──────────────┘ └──────────────┘ └──────────────┘           │
└───────────────────────────────────────────────────────────────┘
```

Mudanças: saudação contextual; selo de unidade; três contadores clicáveis que filtram por status; busca + filtros de status e mês; cards com miniatura real da primeira página (reaproveita `JournalPageView` já usado nas thumbnails), chip de unidade, contagem de páginas e data relativa. Filtro por responsável fica de fora nesta etapa (uma diretora por unidade, ruído desnecessário).

## 7. Nova estrutura do estado vazio

```text
        ┌──────────────────────────────────────────┐
        │              [ ícone jornal ]            │
        │  Nenhum jornal criado para esta unidade  │
        │                                          │
        │  Comece o primeiro jornal de             │
        │  CEI Bem Querer Professor Pierre Weil    │
        │                                          │
        │     [ + Criar jornal da unidade ]        │
        │  A unidade já está definida — é só dar   │
        │  um nome à edição.                       │
        └──────────────────────────────────────────┘
```

Variante secundária para busca sem resultado: "Nenhuma edição encontrada com esse nome" + botão "Limpar busca" (não confundir com unidade sem jornais).

## 8. Nova estrutura do fluxo de criação

```text
┌── Criar jornal da unidade ─────────────────────────┐
│ Sua edição já nasce vinculada à sua unidade.       │
│                                                    │
│ ▣ Unidade                  [ Trocar unidade ▾ ]    │
│   CEI Bem Querer Professor Pierre Weil             │
│   preenchida automaticamente                       │
│                                                    │
│ Nome da edição                                     │
│ [ Jornal Pierre Weil — Julho/2026 ]                │
│                                                    │
│ Mês/Ano de referência    Modelo inicial            │
│ [ Julho/2026 ]           [ Padrão (capa+matérias)▾]│
│                                                    │
│ Páginas iniciais   [ − ] 4 [ + ]                   │
│                                                    │
│           [ Cancelar ]  [ Criar jornal ]           │
└────────────────────────────────────────────────────┘
```

**Popup de confirmação de troca de unidade**

```text
        ┌────────────────────────────────────────────┐
        │  Trocar a unidade deste jornal?            │
        │                                            │
        │  De:  CEI Bem Querer Pierre Weil           │
        │  Para: CEI Social DIC                      │
        │                                            │
        │  O jornal passará a pertencer à unidade    │
        │  escolhida e a listagem mostrará os        │
        │  jornais dessa unidade.                    │
        │                                            │
        │      [ Cancelar ]   [ Sim, trocar ]        │
        └────────────────────────────────────────────┘
```

A unidade vem preenchida automaticamente, mas continua trocável: o seletor abre a lista de unidades e, ao escolher uma diferente da atual, dispara o popup acima. "Cancelar" reverte a seleção; "Sim, trocar" aplica. Nome sugerido automaticamente a partir de unidade + mês (re-sugerido após a troca). Modelo inicial com 3 opções (Padrão, Enxuto, Em branco). Páginas iniciais com stepper.

## 9. Nova estrutura do editor

```text
┌────────────────────────────────────────────────────────────────┐
│ ← Voltar │ [Jornal Pierre Weil — Julho/2026]   ✓ Salvo 14:32   │
│           🏢 Jornal da unidade CEI Bem Querer Pierre Weil 🔒    │
│                                   [PDF digital] [PDF impressão]│
├──────────┬─────────────────────────────────┬───────────────────┤
│ PÁGINAS  │  Página 1 de 8      − 70% +     │ CONTEÚDO DA PÁGINA│
│ [01 capa]│  ┌───────────────────────┐      │ + Texto  + Imagem │
│ [02 mat.]│  │      A4 canvas        │      │ + Número + Agenda │
│ [03 gal.]│  │                       │      │ ─────────────────  │
│ ...      │  └───────────────────────┘      │ Ajustes do bloco  │
│ + página │                                 │ selecionado       │
└──────────┴─────────────────────────────────┴───────────────────┘
```

Refinamentos: segunda linha fixa na barra superior com o selo da unidade + cadeado; hierarquia clara entre nome do jornal (input grande), unidade (subtítulo) e salvamento (chip com ícone de check); renomear "Propriedades" → "Conteúdo da página"; "Adicionar bloco" → "Adicionar ao jornal"; miniaturas com rótulo humano ("Capa", "Matéria", "Galeria") em vez de nomes de template.

## 10. Melhorias de usabilidade e linguagem

| Atual | Proposto |
|---|---|
| "Crie edições A4 multipágina e exporte em PDF" | "Monte e exporte o jornal da sua unidade" |
| "Criar novo jornal" | "Criar jornal da unidade" |
| "Adicionar página" (lista de templates) | "Adicionar página" com nomes amigáveis |
| "Propriedades" | "Conteúdo da página" |
| "Alterações salvas automaticamente" | "✓ Tudo salvo · 14:32" |
| "Acesso restrito / setor de Marketing" | "Esta área é da equipe de comunicação da sua unidade" |

Mais: botão primário único e destacado por tela; ações destrutivas com confirmação; contadores como filtros; hover states nas miniaturas de card.

## 11. Preservação da identidade visual

Mantidos integralmente: tokens semânticos atuais (`bg-card`, `text-muted-foreground`, `bg-primary`), badges de status já definidos, cantos arredondados, tipografia, `PageHeader`, grid de 3 colunas do editor, `JournalPageView` como renderizador único. Nenhuma cor nova; o selo de unidade usa `bg-accent`/`border-border`.

## 12. Impactos previstos para futura implementação

- Novo componente `UnitBadge` (3 variantes) — arquivo isolado.
- `JournalPage.tsx`: cabeçalho, contadores, filtros, cards com miniatura, estado vazio.
- `JournalEditor.tsx`: segunda linha da barra superior + renomeações.
- Modal de criação: unidade travada quando o perfil tem unidade definida.
- Sem migration, sem mudança de RLS, sem novas rotas. A tabela `journals` já tem `unit_id` e a política já isola por vínculo.

## 13. Critérios de aceite

Unidade visível em listagem, estado vazio, modal e editor; nenhuma tela permite à diretora escolher unidade; contadores refletem os status reais; cards mostram miniatura, status, páginas e data; identidade visual inalterada; nenhuma funcionalidade nova além de filtros e contadores.

## 14. PROPOSTA VISUAL — SEM IMPLEMENTAÇÃO

Os diagramas das seções 6 a 9 são os mockups 1 a 7. Abaixo, os mockups mobile e o comparativo.

## 15. Mockups (mobile e comparativo)

**8 — Página inicial mobile**
```text
┌──────────────────┐
│ Jornal da unidade│
│ ▣ Pierre Weil 🔒 │
│ [3][5][1] status │
│ 🔎 Buscar        │
│ ┌──────────────┐ │
│ │ [miniatura]  │ │
│ │ Julho/2026   │ │
│ │ ●Rascunho 8p │ │
│ │ [Abrir]  ⋯   │ │
│ └──────────────┘ │
│ ┌──────────────┐ │
│ │ Junho/2026   │ │
│ └──────────────┘ │
│ [ + Criar ] fixo │
└──────────────────┘
```

**9 — Editor mobile (somente leitura/preview + ações)**
```text
┌──────────────────┐
│ ← Julho/2026     │
│ 🏢 Pierre Weil 🔒│
│ ◀ Página 2/8 ▶   │
│ ┌──────────────┐ │
│ │   A4 preview │ │
│ └──────────────┘ │
│ [Exportar PDF]   │
│ Edição completa  │
│ disponível no    │
│ computador.      │
└──────────────────┘
```

**10 — Comparativo dos refinamentos**

| Área | Hoje | Proposto |
|---|---|---|
| Cabeçalho | Título de ferramenta | Saudação + selo de unidade |
| Unidade | Texto cinza no card | Banner fixo + chip + cadeado |
| Estado vazio | "Nenhum jornal criado ainda" | Convite nominal à unidade |
| Criação | Select de unidade aberto | Bloco travado "definida automaticamente" |
| Editor | Sem unidade | Faixa "Jornal da unidade X" |
| Filtros | Só busca | Busca + status + mês + contadores |
| Cards | Texto puro | Miniatura da capa + metadados |

## 16. Pontos pendentes para validação

1. Miniatura da capa nos cards: renderizar `JournalPageView` em escala (mais pesado) ou manter cards textuais?
2. Filtro por mês/ano: campo hoje é texto livre ("Julho/2026") — vale padronizar em seletor?
3. Editor mobile: preview + exportação apenas, ou permitir edição de texto?
4. Admin/marketing geral mantém o seletor de unidade no modal — confirma?
5. "Modelo inicial" e "páginas iniciais" no modal: incluir agora ou manter criação padrão?
