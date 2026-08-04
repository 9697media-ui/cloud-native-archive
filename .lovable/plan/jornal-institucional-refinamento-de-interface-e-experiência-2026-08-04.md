# Jornal Institucional — Refinamento de Interface e Experiência

## 1. Resumo executivo
Refinar (não recriar) a página existente do Jornal Institucional: fundo mais legível, edição mais fluida, modelos fixos de capa e de páginas internas, menos controles expostos, navegação lateral totalmente clicável, auto-fit da folha e autopreenchimento institucional. Base, identidade e lógica editor + canvas + painel permanecem.

## 2. Análise da página atual
- `JournalPage.tsx`: lista de jornais por unidade, `UnitBadge`, criação livre.
- `JournalEditor.tsx`: topo (nome, salvar, exportar PDF), coluna esquerda com páginas, canvas central com zoom fixo inicial 70%, painel direito com abas de conteúdo/propriedades.
- `JournalPageView.tsx`: página A4 794x1123, grade de 6 colunas, alças de largura, altura e arraste de reordenação.
- `TextBlockPanel` / `JournalPropertiesPanel`: todos os controles visíveis (estilo, tamanho de fonte, cor, alinhamento, formatação, espaçamento).

## 3. Principais problemas encontrados
1. Fundo off-white do papel + fundo da área de trabalho com contraste baixo — cansaço visual.
2. Zoom inicial fixo (70%) ignora o tamanho da tela: sobra ou falta espaço.
3. Miniaturas de página: clique útil restrito ao título/linha; estado ativo discreto.
4. Arraste/redimensionamento sem transição, sem indicador de encaixe — sensação de "travado".
5. Excesso de controles simultâneos no painel — risco de sair do padrão institucional.
6. Páginas 100% livres: cada diretora monta uma capa diferente.
7. Imagens com cantos retos, destoando dos cards do sistema.
8. Nenhum autopreenchimento (unidade, mês/ano, nome da edição).

## 4. Direção geral do refinamento
"Menos escolhas, mais modelos." Guiar por template, expor apenas o essencial, deixar o avançado recolhido, e tornar cada interação visualmente suave e previsível.

## 5. Fundo e legibilidade
- Área de trabalho passa para cinza neutro `#EEEEEE` (token `--journal-workspace`), papel branco puro por padrão.
- Alternância no topo do canvas: `Papel: Branco | Off-white (#F0EEE4)` — decisão apenas visual/estética, aplicada também ao PDF.
- Sombra suave e borda de 1px no papel para separá-lo do fundo.

## 6. Fluidez e microinterações
- Transições de 120–160ms em seleção, hover, foco de bloco e abertura de painel.
- Arraste com bloco "fantasma" translúcido e indicador de destino em linha contínua.
- Snapping às 6 colunas com feedback de coluna destacada durante o resize.
- Soltura com pequeno easing (spring curto) no bloco reposicionado.
- Cursor e halo de seleção consistentes; sem repintura completa do canvas ao mover.

## 7. Modelos de capa (3 fixos)
- **Capa Imagem Cheia** — imagem de destaque grande, título sobreposto, mês/ano e unidade no rodapé.
- **Capa Imagem + Chamadas** — imagem 4/6 no topo, título, duas chamadas secundárias.
- **Capa Editorial** — título tipográfico dominante, imagem menor lateral, três destaques curtos.
Campos editáveis restritos a: título, subtítulo/chamada, imagem, chamadas secundárias, mês/ano, unidade, pequenos destaques. Estrutura e proporções bloqueadas.

## 8. Simplificação das ferramentas
- Barra essencial sempre visível: adicionar página, modelo, texto, imagem, mover, duplicar, excluir, visualizar, exportar.
- Painel de texto reduzido a: função tipográfica, alinhamento, negrito/itálico, cor institucional.
- Recolhidos em "Ajustes avançados": tamanho de fonte manual, entrelinha, altura fixa, largura em colunas.
- Remoção de controles redundantes com as alças do canvas.

## 9. Reconhecimento automático de diagramação (conceito)
- Cada template declara "slots" (área, proporção, span sugerido).
- Ao inserir imagem: recorte e span sugeridos pelo slot; aviso se a resolução for baixa.
- Detecção de estouro do A4: badge "Conteúdo excede a página" + ação "Mover para nova página".
- Alerta suave quando um bloco sai do padrão do template (não bloqueia, sinaliza).

## 10. Navegação entre páginas
- Card de miniatura inteiro clicável (área ~140x198), com render real reduzido da página.
- Estado ativo: borda primária de 2px + fundo destacado + número em pílula.
- Ações rápidas no hover do card: duplicar, excluir, mover.

## 11. Refinamento visual das imagens
- Raio de 8px em imagens de conteúdo, mantido no PDF; capa de imagem cheia permanece reta.
- Mesmo raio dos cards do sistema para coerência; legenda alinhada sem borda.

## 12. Auto-fit da folha
- Ao abrir e ao trocar de página: zoom calculado pelo espaço disponível (min 40%, max 100%).
- Botão "Ajustar à tela" + atalho; recalcula ao redimensionar a janela.

## 13. Destaque das funções básicas
Hierarquia: primárias em botões sólidos com rótulo, secundárias em ícone/menu "…". Exportar e Visualizar fixos no topo direito.

## 14. Layouts predefinidos de páginas internas
Matéria com imagem e texto · Galeria · Agenda · Destaques rápidos · Duas matérias · Chamada principal + destaques. Aplicados na criação da página, com conteúdo editável e ajustes simples.

## 15. Automação e autopreenchimento
- Novo jornal: nome sugerido "Informativo {Unidade} — {Mês/Ano}", unidade e data preenchidas.
- Capa criada já com modelo escolhido e campos institucionais preenchidos.
- Nova página nasce com layout selecionado, nunca em branco.
- Cabeçalho/rodapé institucional automáticos em todas as páginas.

## 16. Impactos previstos
- Alterações concentradas em `JournalEditor.tsx`, `JournalPageView.tsx`, painéis, `templates.ts` e tokens do `index.css`.
- Novos campos opcionais no JSON de página (`templateId`, `paperTone`) — retrocompatíveis, sem migration obrigatória.
- Jornais existentes continuam abrindo como estão (modo livre legado).

## 17. Critérios de aceite
Base preservada · leitura confortável · fundo tratado · miniaturas 100% clicáveis · arraste fluido · 3 capas definidas · menos controles · funções básicas evidentes · automações presentes · layouts internos definidos.

## 18. PROPOSTA VISUAL — SEM IMPLEMENTAÇÃO

## 19. Mockups

Editor refinado (fundo #EEEEEE, auto-fit, imagens arredondadas):
```text
┌──────────────────────────────────────────────────────────────────────┐
│ ← Jornais  Informativo NAVE DIC — Ago/2026   ● salvo   [Visualizar] [Exportar PDF] │
├───────────┬──────────────────────────────────────────┬───────────────┤
│ PÁGINAS   │  Papel: (Branco) Off-white   − 86% +  [Ajustar à tela]   │
│ ┌───────┐ │        ┌───────────────────────────┐    │ CONTEÚDO      │
│ │ ▓▓▓▓▓ │ │        │  ANA BRASIL   Ago/2026    │    │ [Texto][Img]  │
│ │ ▓▓ 1  │◀│        │  ╭─────────────────────╮  │    │ [Galeria]     │
│ └───────┘ │        │  │  imagem  (raio 8px) │  │    │               │
│ ┌───────┐ │        │  ╰─────────────────────╯  │    │ Blocos        │
│ │ ░░ 2  │ │        │  Título da matéria        │    │ 1 Título      │
│ └───────┘ │        │  texto ▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁    │    │ 2 Imagem  ↑↓  │
│ [+ Página]│        └───────────────────────────┘    │ 3 Texto       │
└───────────┴──────────────────────────────────────────┴───────────────┘
   card inteiro clicável            folha centralizada com auto-fit
```

Criação guiada — escolha de capa:
```text
┌───────────── Novo jornal institucional ─────────────┐
│ Nome  [Informativo NAVE DIC — Agosto/2026        ]  │
│ Unidade [NAVE DIC]        Edição [08/2026]          │
│ Modelo de capa:                                     │
│ ┌────────┐  ┌────────┐  ┌────────┐                  │
│ │▓▓▓▓▓▓▓▓│  │▓▓▓▓▓▓▓▓│  │TÍTULO  │                  │
│ │▓TÍTULO▓│  │ título │  │ ▁▁▁ ▓▓ │                  │
│ │▓▓▓▓▓▓▓▓│  │ ▁▁  ▁▁ │  │ ▁▁▁ ▓▓ │                  │
│ └────────┘  └────────┘  └────────┘                  │
│  Imagem      Imagem +     Editorial                 │
│  cheia       chamadas                               │
│                        [Cancelar]  [Criar jornal]   │
└─────────────────────────────────────────────────────┘
```

Antes × depois (painel de texto):
```text
ATUAL                            REFINADO
[estilo][tam][cor][A A A A]      [Função tipográfica ▾]
[B][I][lista][entrelinha ——]     [≡ ≡ ≡ ≡]  [B][I]  [●●●●●●]
[largura 1..6][altura px]        ▸ Ajustes avançados
```

Estado vazio e diagramação automática:
```text
┌───────────── Nenhum jornal ainda ─────────────┐   ┌ Imagem selecionada ┐
│        📰  Comece pelo modelo de capa         │   │ ⚠ Conteúdo excede  │
│  [Imagem cheia] [Imagem+chamadas] [Editorial] │   │   a página          │
│        Unidade e mês já preenchidos           │   │ [Ajustar ao slot]   │
└───────────────────────────────────────────────┘   └────────────────────┘
```

Tela menor (< 1280px): painel direito vira gaveta lateral, miniaturas viram faixa horizontal no topo, canvas ocupa a área central com auto-fit.

## 20. Decisões pendentes
1. Papel padrão: branco fixo ou lembrar a última escolha por jornal?
2. Jornais antigos migram para modelos ou permanecem em modo livre?
3. "Ajustes avançados" ficam visíveis para todas as diretoras ou só para marketing?
4. Bordas arredondadas também na capa de imagem cheia?
