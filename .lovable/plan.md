# Jornal Institucional — Refinamento de Interface e Experiência

## 1. Resumo executivo

Refinamento da ferramenta já existente (não é reconstrução). Três eixos: **legibilidade** (fundo do canvas), **fluidez** (seleção, arraste, redimensionamento) e **edição guiada** (modelos de capa e de páginas internas, automação, menos controles expostos). A estrutura atual — lista de jornais, editor com miniaturas + canvas + painel lateral, autosave 2s, exportação PDF, isolamento por unidade — é preservada integralmente.

## 2. Análise da página atual

- `JournalPage.tsx`: lista de jornais + `UnitBadge` + entrada no editor.
- `JournalEditor.tsx`: grade `180px | canvas | 300px`. Miniaturas com ações em hover, canvas com zoom manual fixo em 70%, painel direito com "Adicionar conteúdo" + lista de blocos + painel de propriedades.
- `JournalPageView.tsx`: página A4 794×1123, grade de 6 colunas, alças de largura/altura, arraste de reordenação, cabeçalho com logo e rodapé institucional.
- `templates.ts`: 8 modelos de página que geram blocos e depois ficam 100% livres.
- Exportação: `html2canvas` + `jsPDF`, fundo fixo `#F0EEE4`.

## 3. Principais problemas encontrados

1. Fundo off-white `#F0EEE4` no canvas + `bg-muted/40` ao redor → baixo contraste e fadiga de leitura.
2. Zoom inicial fixo (70%): em telas menores a folha corta; em telas grandes sobra espaço.
3. Miniatura: o card já é clicável, mas o alvo visual é confuso — os botões de hover competem com o clique e o estado ativo é discreto (borda fina).
4. Arraste/redimensionamento sem transição, sem preview de destino ("fantasma"), sem snapping visível → sensação de travamento.
5. Painel direito mistura níveis: adicionar conteúdo, ordenar blocos e propriedades avançadas no mesmo plano.
6. Templates são só um ponto de partida: a capa pode ser destruída com dois cliques, sem padrão institucional garantido.
7. Sem detecção de estouro do A4 nem sugestão de tamanho/largura.
8. Imagens com cantos retos, destoando dos cards do sistema.
9. Nenhum autopreenchimento: unidade, mês/ano e título são digitados manualmente.

## 4. Direção geral do refinamento

"Documento em primeiro plano, ferramentas em segundo." Canvas mais claro e neutro, ações básicas sempre visíveis, ajustes avançados recolhidos, e modelos como contrato visual — a diretora preenche conteúdo, o sistema cuida da diagramação.

## 5. Fundo e legibilidade

- Área de trabalho ao redor da folha: cinza neutro `#EEEEEE` (claro) / `hsl(var(--muted))` no escuro, substituindo `bg-muted/40`.
- Folha: alternador **Papel** com dois estados — `Branco (#FFFFFF)` (padrão novo) e `Off-white (#F0EEE4)` (identidade atual).
- A escolha é por jornal, persistida no registro, e **respeitada na exportação** (o PDF usa o mesmo fundo do preview).
- Sombra da folha reforçada (`0 8px 28px -12px`) para separar papel e mesa.
- Texto corrido mantém `#1F211F`; contraste mínimo AA garantido nos dois papéis.

## 6. Fluidez e microinterações

- Seleção: anel de foco com transição de 120ms em vez de mudança instantânea de box-shadow.
- Arraste: bloco arrastado a `opacity .6` + leve `scale(.98)`; indicador de destino como barra animada (já existe, ganha transição e altura total).
- Redimensionamento: badge `n/6` acompanha o cursor; réguas das colunas acendem apenas durante o arraste (snapping visível).
- Soltura: animação curta de acomodação (150ms, ease-out) do bloco na nova posição.
- Alças aparecem em 100ms no hover; cursor correto (`col-resize` / `row-resize` / `grab`).
- Todas as transições respeitam `prefers-reduced-motion`.

## 7. Modelos de capa (3)

Capas passam a ser **estruturas fixas com campos editáveis**, não páginas livres.

| Modelo | Estrutura | Campos editáveis |
|---|---|---|
| **C1 — Imagem dominante** | Chapéu, título grande, imagem 6/6 alta, chamada única no rodapé | Título, chamada, imagem, mês/ano, unidade |
| **C2 — Imagem + chamadas** | Imagem 6/6 média + 3 cartões de chamada (2/6 cada) | Título, imagem, 3 chamadas, mês/ano |
| **C3 — Editorial** | Filete superior, título em 4/6, coluna de destaques em 2/6, imagem 4/3 abaixo | Título, subtítulo, texto de abertura, imagem, 2 destaques |

Nas capas, arrastar/redimensionar fica desabilitado; clicar em um campo abre só o editor daquele campo. Um botão discreto "Destravar capa" (com confirmação) libera o modo livre para casos excepcionais.

## 8. Simplificação das ferramentas

Painel direito reorganizado em três níveis:

1. **Conteúdo** (sempre visível): Texto, Imagem, Número, Agenda + lista de blocos com reordenação.
2. **Formatação essencial** (ao selecionar): estilo tipográfico, alinhamento, negrito/itálico, cor, trocar imagem, legenda.
3. **Ajustes avançados** (recolhido): tamanho de fonte manual, entrelinha, altura fixa, span manual, `fit` de imagem.

Remoção de duplicidades: largura só pelo canvas; ordenação só pela lista + arraste.

## 9. Reconhecimento automático de diagramação

Camada de análise (somente leitura, sem alterar conteúdo):

- **Medição**: soma da altura renderizada dos blocos vs. área útil da página (1123px − cabeçalho − rodapé).
- **Estouro**: faixa âmbar no topo do canvas — "Conteúdo excede a página" + ação "Mover excedente para nova página".
- **Sugestão de imagem**: ao subir uma foto, compara proporção original com o espaço disponível e sugere span e altura ("Sugerido: 3/6, 4:3").
- **Sugestão de largura**: bloco de texto acima de X caracteres sugere 6/6; legenda sugere acompanhar a largura da imagem.
- **Fora do padrão**: aviso quando fonte ou entrelinha saem da faixa institucional.
- Todas as sugestões são **aplicáveis com um clique** e dispensáveis.

## 10. Navegação entre páginas

- Card inteiro clicável (área ampliada, `cursor-pointer`, `role="button"` + teclado).
- Estado ativo: borda 2px `primary` + faixa lateral + fundo `accent` + numeração em destaque.
- Ações (mover, duplicar, excluir) migram para um menu `⋯` no canto do card, evitando conflito com o clique.
- Miniatura maior (h-32) e rótulo com o nome do modelo.
- "Adicionar página" vira botão primário que abre a galeria de layouts (seção 14).

## 11. Refinamento visual das imagens

- Raio `6px` (`--radius-sm` institucional) em imagens de conteúdo e miniaturas; capas com imagem sangrada permanecem retas.
- Legenda alinhada à esquerda da imagem, sem borda ou caixa.
- Placeholder de imagem com mesmo raio e ícone centralizado.
- Coerência com cards do sistema; o PDF replica o raio.

## 12. Auto-fit da folha

- Ao abrir o editor e ao redimensionar a janela: zoom calculado por `min(largura útil / 794, altura útil / 1123)`, limitado a 40–100%.
- Botão **Ajustar à tela** ao lado do controle de zoom + atalho `Shift+0`.
- Trocar de página mantém o zoom escolhido; zoom manual desativa o auto-fit até novo clique no botão.
- Padding do canvas reduzido para aproveitar a área central.

## 13. Destaque das funções básicas

Barra superior do editor em dois níveis:

- **Primário**: Nova página · Trocar modelo · Visualizar · Exportar PDF.
- **Secundário** (menu `⋯`): PDF de impressão, duplicar jornal, renomear, trocar unidade.
- No canvas, ao selecionar um bloco: mini-barra flutuante com Editar · Trocar imagem · Duplicar · Excluir.

## 14. Layouts predefinidos (páginas internas)

Galeria de modelos ao criar página, com miniatura de cada estrutura:

`Matéria com imagem` · `Duas matérias` · `Galeria (4 fotos)` · `Agenda` · `Destaques rápidos (números)` · `Chamada principal + destaques` · `Página em branco (avançado)`

Cada modelo já nasce com blocos posicionados e proporcionados; a edição padrão é de conteúdo, e o rearranjo livre continua possível nas páginas internas.

## 15. Automação e autopreenchimento

Ao criar um jornal, um passo único preenche:

- Unidade (do perfil da diretora, sem digitação);
- Mês/ano de referência (mês atual) e nome sugerido "Jornal — {Unidade} — {Mês/Ano}";
- Modelo de capa escolhido, já com título, unidade e data aplicados;
- Estrutura sugerida: Capa · Matéria · Galeria · Contracapa;
- Contracapa preenchida com contatos institucionais padrão.

Durante a edição: cabeçalho/rodapé sempre sincronizados com unidade e edição; nova página herda o padrão tipográfico da anterior.

## 16. Impactos previstos para implementação

- `JournalEditor.tsx`: barra superior, auto-fit, miniaturas, painel em 3 níveis (refactor médio, sem mudança de dados).
- `JournalPageView.tsx`: transições, snapping, raio das imagens, fundo configurável.
- `templates.ts` / `types.ts`: novos modelos de capa e de página, flag `locked` na capa, campo `paper`.
- Novo módulo de análise de diagramação (cálculo de altura e sugestões).
- Persistência: um campo adicional por jornal (papel). Sem mudança em RLS ou permissões.
- Exportação: usar o papel escolhido em vez de `#F0EEE4` fixo.

## 17. Critérios de aceite

Base preservada; fundo tratado com alternância branco/off-white refletida no PDF; miniatura inteira clicável com estado ativo evidente; arraste com feedback e transições; 3 modelos de capa definidos e travados; painel com avançado recolhido; funções básicas em destaque; auto-fit ao abrir e botão manual; layouts internos disponíveis; autopreenchimento de unidade, mês/ano e nome; imagens arredondadas; nenhuma implementação nesta etapa.

## 18. PROPOSTA VISUAL — SEM IMPLEMENTAÇÃO

## 19. Mockups

**M1 — Página inicial refinada**
```text
Jornal Institucional            [ + Novo jornal ]
Unidade: NAVE DIC  (trocar)
┌──────────┐ ┌──────────┐ ┌──────────┐
│ [capa]   │ │ [capa]   │ │ [capa]   │
│ Ago/2026 │ │ Jul/2026 │ │ Jun/2026 │
│ Rascunho │ │ Publicado│ │ Publicado│
│ Abrir ⋯  │ │ Abrir ⋯  │ │ Abrir ⋯  │
└──────────┘ └──────────┘ └──────────┘
```

**M2 — Estado vazio refinado**
```text
        ▢  Nenhum jornal ainda
   Comece por um modelo de capa institucional
   [ Criar primeiro jornal ]   Leva ~2 minutos
```

**M3/M4 — Editor: papel branco vs. #EEEEEE**
```text
mesa #EEEEEE                    mesa #EEEEEE
┌ folha BRANCA ─────┐           ┌ folha OFF-WHITE ──┐
│ ANA · Jornal      │           │ ANA · Jornal      │
│ Título grande     │           │ Título grande     │
│ [imagem]          │           │ [imagem]          │
└───────────────────┘           └───────────────────┘
Papel: (●Branco) ( Off-white)   Papel: ( Branco) (●Off-white)
```

**M5 — Miniaturas totalmente clicáveis**
```text
┌▌01 · Capa        ⋯┐   ← ativo: barra lateral + borda primary
│  [ miniatura A4 ] │
└───────────────────┘
┌ 02 · Matéria     ⋯┐
│  [ miniatura A4 ] │
└───────────────────┘
[ + Adicionar página ]
```

**M6 — Auto-fit**
```text
Página 1 de 4      [ Ajustar à tela ] − 82% +
┌──────────────────────────────┐
│      ┌ folha inteira ┐       │
│      │               │       │
│      └───────────────┘       │
└──────────────────────────────┘
```

**M7 — Seleção e movimentação fluidas**
```text
┌ bloco arrastado (opacidade .6) ┐
▌ ← barra de destino animada
[ Editar ][ Trocar ][ Duplicar ][ Excluir ]   ← mini-barra flutuante
colunas: ┆ ┆ ┆ ┆ ┆ ┆  (acendem durante o arraste)   badge 3/6
```

**M8 — Imagens arredondadas**
```text
╭───────────────╮
│    imagem     │  raio 6px
╰───────────────╯
Legenda da imagem
```

**M9 — Criação com escolha de capa**
```text
Novo jornal
Unidade: NAVE DIC (automático)   Edição: Agosto/2026 (automático)
Escolha a capa:
[ C1 imagem grande ] [ C2 imagem+chamadas ] [ C3 editorial ]
Estrutura sugerida: Capa · Matéria · Galeria · Contracapa
                                   [ Criar jornal ]
```

**M10 — Os 3 modelos de capa**
```text
C1                    C2                    C3
┌──────────┐          ┌──────────┐          ┌──────────┐
│ CHAPÉU   │          │ TÍTULO   │          │ ─────    │
│ TÍTULO   │          │ [imagem] │          │ TÍT │ ▪  │
│ [ imagem │          │ ▪ ▪ ▪    │          │ sub │ ▪  │
│   grande]│          │ chamadas │          │ [imagem] │
│ chamada  │          │          │          │ texto    │
└──────────┘          └──────────┘          └──────────┘
```

**M11 — Layouts internos**
```text
Matéria+img   Duas matérias   Galeria      Agenda      Destaques
┌────────┐    ┌────┬────┐    ┌──┬──┐     ┌────────┐   ┌─┬─┬─┐
│ TÍTULO │    │ T  │ T  │    ├──┼──┤     │ ▤▤▤▤▤▤ │   │#│#│#│
│[imagem]│    │txt │txt │    │  │  │     │ ▤▤▤▤▤▤ │   └─┴─┴─┘
│ texto  │    │[im]│[im]│    └──┴──┘     └────────┘   texto
└────────┘    └────┴────┘
```

**M12 — Interface simplificada**
```text
Conteúdo      [Texto][Imagem][Número][Agenda]
Blocos        1 Título · 2 Imagem · 3 Corpo      ↑↓
Formatação    [Estilo ▾] [≡ ≡ ≡ ≡] [B][I] [cor]
▸ Ajustes avançados                        (recolhido)
```

**M13 — Destaque das funções básicas**
```text
← Voltar  Jornal Agosto/2026  ✓ salvo
[ + Nova página ] [ Modelo ] [ Visualizar ] [ Exportar PDF ]  ⋯
```

**M14 — Autopreenchimento**
```text
Preenchido automaticamente
Unidade  NAVE DIC          (do seu perfil)
Edição   Agosto/2026       (mês atual)
Nome     Jornal — NAVE DIC — Ago/2026   [editar]
Rodapé   contato@anabrasil.org · @anabrasil
```

**M15 — Reconhecimento de diagramação**
```text
⚠ Conteúdo excede a página em ~120px
  [ Mover excedente para nova página ]  [ Ignorar ]
💡 Imagem 1600×1200 — sugerido 3/6 · 4:3   [ Aplicar ]
```

**M16 — Antes × Depois**
```text
ATUAL                          REFINADO
mesa cinza-esverdeada          mesa #EEEEEE neutra
folha off-white fixa           papel branco/off-white
zoom fixo 70%                  auto-fit + botão
miniatura: alvo confuso        card inteiro + ⋯
capa livre                     3 capas travadas
painel com tudo aberto         3 níveis, avançado recolhido
imagens retas                  raio 6px
sem alertas                    estouro + sugestões
```

**M17 — Tela menor (≤1280px)**
```text
[ Páginas ▾ ]  [ Editar ▾ ]        [ PDF ]
┌──────── folha auto-fit ────────┐
└────────────────────────────────┘
Painéis viram gavetas laterais; canvas mantém prioridade.
```

## 20. Decisões pendentes

1. Papel padrão para novos jornais: branco ou off-white? **Ambos — o usuário escolhe no ato da criação (branco é o default).**
2. A alternância de papel vale por jornal ou é uma preferência global da unidade? **Por jornal, persistida no campo `paper`.**
3. Capas travadas devem permitir "Destravar" ou ficarem 100% fixas? **Ficam 100% fixas (sem opção de destravar).**
4. Manter o modelo "Página em branco" para usuárias avançadas? **Sim, mantido como opção avançada na galeria de layouts internos.**
5. As sugestões de diagramação devem ser aplicadas automaticamente ou sempre exigir confirmação? **Sempre exigir confirmação (banner informativo + botão "Aplicar").**
6. O excedente de conteúdo deve gerar nova página automaticamente ou apenas alertar? **Apenas alertar (banner âmbar com ação manual).**
