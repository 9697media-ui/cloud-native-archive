## 1. Resumo executivo

Refinamento da página existente `/jornal-institucional` (rota, dados e editor preservados). Três frentes: (a) legibilidade e enquadramento da folha, (b) fluidez de seleção/arraste, (c) mudança de paradigma — de páginas livres para **modelos completos de jornal** (capa + internas), com preenchimento guiado. Nada é reconstruído: `JournalPage.tsx`, `JournalEditor.tsx`, `JournalPageView.tsx`, `JournalPropertiesPanel.tsx`, `TextBlockPanel.tsx` e a exportação em PDF continuam sendo a base.

## 2. Análise da página atual

Funciona bem: listagem com selo de unidade e contadores; editor em 3 colunas; autosave 2s; canvas A4 com grid de 6 colunas, alças de largura/altura e arraste; painel de texto com cor, alinhamento, entrelinha e tamanho de fonte; lista de blocos com reordenação; exportação PDF.

Pontos frágeis:
- Fundo off-white da interface encosta na cor da folha — o A4 "some" no fundo.
- Zoom manual: ao abrir, a folha raramente cabe na área central.
- Miniaturas laterais pequenas; clique útil concentrado em parte do card.
- Muitos controles simultâneos no painel direito (tipografia, cor, span, altura, imagem).
- Arraste sem guias, sem imã, sem feedback de soltura; sensação de travamento.
- Criação de jornal entrega 4 páginas genéricas; a diagramação inteira fica por conta da diretora.
- Imagens sem raio consistente entre canvas/preview/PDF.

## 3. Problemas encontrados (síntese)

| # | Problema | Impacto para a diretora |
|---|---|---|
| 1 | Baixo contraste interface × folha | Não percebe os limites da página |
| 2 | Zoom manual | Perde tempo, corta conteúdo |
| 3 | Miniatura pouco clicável/pequena | Navegação lenta |
| 4 | Excesso de controles técnicos | Medo de "quebrar" |
| 5 | Arraste sem guias | Desalinhamento visível no PDF |
| 6 | Ausência de modelo completo | Jornal em branco = paralisia |
| 7 | Sem indicação de pendências | Publica página incompleta |
| 8 | Raio de imagem inconsistente | Quebra de identidade |

## 4. Direção geral do refinamento

Evolução, não redesign. A ferramenta passa a se comportar como **formulário visual institucional**: o modelo define a estrutura; a diretora troca conteúdo. Toda liberdade que hoje existe permanece disponível, porém recolhida em "Mais opções" e limitada pelas regras do modelo.

## 5. Fundo e legibilidade

Alternativas avaliadas:

| Opção | Contraste | Risco |
|---|---|---|
| Interface toda branca | Baixo — folha branca some | Alto |
| Interface toda #EEEEEE | Médio | Painéis pesados |
| **Painéis brancos + área de trabalho #EEEEEE** | **Alto** | **Nenhum** |

**Recomendação:** painéis (`bg-card` branco) + área de trabalho cinza `#EEEEEE`, folha com sombra suave e borda de 1px. No dark mode, área de trabalho em cinza-escuro neutro, folha sempre na cor real de exportação.

Separado disso: **fundo do jornal** (conteúdo real) com duas opções controladas — Branco e Off-white institucional (#F0EEE4) — aplicadas ao jornal inteiro, nunca por página, com prévia no seletor. Canvas, preview e PDF usam o mesmo token.

Nenhum fundo de interface interfere na cor exportada.

## 6. Fluidez e microinterações

- Arraste em `transform` (sem reflow), cursor `grabbing`, bloco a 92% de opacidade e sombra elevada.
- Guias magnéticas: bordas da coluna, centro horizontal, topo/base de blocos vizinhos; imã de 6px com linha verde-água.
- Encaixe: pulso curto (120ms) na coluna de destino ao soltar.
- Seleção: contorno 2px verde-água + 4 alças + rótulo de largura ("3 de 6 colunas").
- Reordenação de páginas e blocos com transição de posição de 180ms.
- Painéis abrem/fecham em 200ms ease-out; botões com estado hover/active/focus-visible.
- Movimentação continua limitada à área segura da página e às regras do modelo.

## 7. Modelos completos de jornal

Substituem a criação genérica. Cada modelo entrega o jornal inteiro diagramado, com:
- páginas na ordem editorial correta;
- áreas de texto e imagem já posicionadas;
- cabeçalho, rodapé e faixas institucionais aplicados e **bloqueados**;
- placeholders orientativos em vez de texto solto.

Estados de campo: `editável` (texto, imagem, legenda, data) e `protegido` (logo, faixas, margens, tipografia, grid).

Páginas extras: só a partir de páginas-tipo do próprio modelo (ex.: "+ Matéria", "+ Galeria"), preservando a coerência.

## 8. Estrutura dos três modelos

### Modelo A — Jornal Institucional Padrão (6 páginas)
| Pág. | Objetivo | Campos editáveis | Bloqueado | Imagens | Limite de texto |
|---|---|---|---|---|---|
| 1 Capa | Identidade da edição | Título, chamada, mês/ano, imagem principal | Logo, faixa, unidade | 1 horizontal 16/9 | Título 60c · chamadas 90c |
| 2 Matéria principal | Assunto central | Título, subtítulo, corpo, legenda | Grid, margens | 1 principal + 1 apoio | 1.400c |
| 3 Duas matérias | Ações da unidade | 2×(título, corpo, legenda) | Divisória | 2 (4/3) | 600c cada |
| 4 Galeria | Registros | Legendas | Moldura da grade | 4 a 6 | 80c/legenda |
| 5 Agenda/Avisos | Próximos eventos | Itens (data, título, hora, local) | Cabeçalho da agenda | 0–1 | 6 itens |
| 6 Encerramento | Mensagem institucional | Texto de fecho | Contatos, rodapé | 0–1 | 500c |

### Modelo B — Jornal Pedagógico (6 páginas)
| Pág. | Objetivo | Campos editáveis | Imagens | Limite |
|---|---|---|---|---|
| 1 Capa pedagógica | Atividade em destaque | Título do projeto, turma, período, imagem | 1 (16/9) | 60c |
| 2 Relato principal | Experiência | Título, corpo, legenda | 1 + 1 | 1.400c |
| 3 Objetivos e aprendizados | Processo | 3 blocos (objetivos, desenvolvimento, aprendizados) | 0–1 | 400c cada |
| 4 Registros fotográficos | Documentação | Legendas | 4 a 6 | 80c |
| 5 Falas e produções | Vozes das crianças | Citações (até 4), autoria | 0–2 | 180c/citação |
| 6 Encerramento | Fecho institucional | Texto | 0–1 | 500c |

### Modelo C — Jornal de Eventos e Ações (6 páginas)
| Pág. | Objetivo | Campos editáveis | Imagens | Limite |
|---|---|---|---|---|
| 1 Capa do evento | Evento/ação | Nome do evento, data, local, imagem | 1 (16/9) | 60c |
| 2 Apresentação | Contexto | Título, corpo | 1 | 1.000c |
| 3 Principais momentos | Narrativa | 3 blocos com legenda | 3 (4/3) | 300c cada |
| 4 Galeria | Fotos | Legendas | 4 a 6 | 80c |
| 5 Resultados | Números e destaques | 3 indicadores + comentário | 0–1 | 400c |
| 6 Próximos eventos | Continuidade | Agenda ou fecho | 0–1 | 6 itens |

Comportamento comum no preview e no PDF: mesma renderização (`JournalPageView`), mesmas margens, mesmo raio de imagem, mesmo fundo escolhido; nenhuma diferença entre tela e arquivo exportado.

## 9. Fluxo de criação

```text
┌── Criar jornal da unidade ───────────────────────────────────┐
│ 1 Nome da edição   [ Jornal Pierre Weil — Agosto/2026 ]      │
│ 2 Unidade  ▣ CEI Bem Querer Pierre Weil  [Trocar ▾]          │
│ 3 Mês/Ano  [ Agosto ▾ ] [ 2026 ▾ ]                           │
│ 4 Modelo                                                     │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐                │
│  │ [capa A]   │ │ [capa B]   │ │ [capa C]   │                │
│  │ Padrão     │ │ Pedagógico │ │ Eventos    │                │
│  │ 6 páginas  │ │ 6 páginas  │ │ 6 páginas  │                │
│  │ Capa•Mat.• │ │ Capa•Relato│ │ Capa•Contx │                │
│  │ Notícias•  │ │ •Objetivos │ │ •Momentos• │                │
│  │ Galeria•   │ │ •Registros │ │ Galeria•   │                │
│  │ Agenda•Fim │ │ •Falas•Fim │ │ Result•Fim │                │
│  │[Visualizar]│ │[Visualizar]│ │[Visualizar]│                │
│  │[Usar este ]│ │[Usar este ]│ │[Usar este ]│                │
│  └────────────┘ └────────────┘ └────────────┘                │
│ 5 Prévia das páginas incluídas (tira de miniaturas)          │
│              [ Cancelar ]        [ 6 Criar jornal ]          │
└──────────────────────────────────────────────────────────────┘
   → 7 abre o editor com as 6 páginas já montadas
```

Unidade preenchida automaticamente; troca continua possível com o popup de confirmação já existente.

## 10. Preenchimento guiado

Cada campo do modelo carrega metadados: rótulo-guia, tipo esperado, limite, obrigatoriedade e estado.

```text
┌ Página 02 · Matéria principal ───────────────────────┐
│ Título        [ Digite o título principal        ]   │
│               0/60 · obrigatório         ● pendente  │
│ Imagem        [ Adicione uma imagem horizontal   ]   │
│               16/9 · mín. 1200px         ✓ ok        │
│ Resumo        [ Escreva um resumo…               ]   │
│               287/350                    ✓ ok        │
│ Legenda       [ Digite a legenda da imagem       ]   │
│               opcional                   ○ vazio     │
└──────────────────────────────────────────────────────┘
```

Placeholders aparecem no canvas em cinza; não são exportados quando vazios.

## 11. Automação e autopreenchimento

Preenche automaticamente: unidade, mês/ano, cabeçalho, rodapé, faixas, tipografia, cores, margens, alinhamento e a geração das páginas do modelo. Sugere distribuição de imagens na galeria, cria legenda opcional, ajusta blocos à quantidade de conteúdo dentro de limites seguros, sinaliza obrigatórios e mantém o autosave de 2s. Nunca inventa conteúdo institucional — apenas organiza o que a usuária inseriu.

## 12. Reconhecimento automático de diagramação (conceitual)

Lógica: para cada página, medir `alturaEstimadaDoConteúdo` (caracteres × métrica tipográfica + altura das imagens + espaçamentos) contra `alturaÚtil` (A4 − margens − cabeçalho − rodapé).

- razão < 0,6 → "Há espaço sobrando: aumente a imagem principal ou inclua uma legenda."
- 0,6–1,0 → sem alerta.
- \> 1,0 → "O texto ultrapassa o espaço previsto. Reduza o conteúdo ou continue na próxima página." + ação "Mover excedente para nova página".
- 1 imagem grande + 2 pequenas disponíveis → "Este conteúdo se encaixa melhor no layout com uma imagem principal e duas imagens menores."
- Imagem abaixo de 1200px na maior dimensão → aviso de qualidade para impressão.

Somente conceitual nesta etapa.

## 13. Simplificação das ferramentas

Barra contextual sobre o elemento selecionado, com no máximo 7 ações: Editar texto · Trocar imagem · Recortar · Legenda · Duplicar · Excluir · Mais opções.

Vai para "Mais opções": entrelinha, tamanho de fonte manual, cor fora do uso comum, span numérico, altura fixa. Ficam protegidos pelo modelo: fontes livres, cores fora da paleta, margens, posicionamento fora da grade, efeitos e bordas decorativas.

## 14. Navegação entre páginas

```text
┌ PÁGINAS ───────────────┐
│ ┌────────────────────┐ │
│ │ [ miniatura 01 ]   │ │ ← card inteiro clicável
│ │ Página 01 · Capa   │ │
│ │ ✓ Completa      ⋯  │ │
│ └────────────────────┘ │
│ ┌────────────────────┐ │
│ │ [ miniatura 02 ]   │ │ ← ativa: borda verde-água
│ │ Pág. 02 · Matéria  │ │
│ │ ● Texto pendente ⋯ │ │
│ └────────────────────┘ │
│ ┌────────────────────┐ │
│ │ [ miniatura 03 ]   │ │
│ │ Pág. 03 · Notícias │ │
│ │ ▲ Texto excedente⋯ │ │
│ └────────────────────┘ │
│ [ + Adicionar página ] │
└────────────────────────┘
```

Miniatura maior e legível, hover, estado ativo, transição suave, número + função da página, badges de completa/pendente/alerta. Duplicar e excluir só pelo menu "⋯", nunca no clique principal.

## 15. Ajuste automático à tela

Ao abrir o editor e ao trocar de página, calcular `zoom = min((larguraCentral − 64) / 210mm, (alturaCentral − 64) / 297mm)`, limitado a 30–150%, com a folha centralizada e o cálculo refeito ao recolher painéis ou redimensionar a janela. Controles: Ajustar à tela · Ajustar à largura · Ajustar à altura · zoom manual (−/+) · Restaurar 100% · Tela cheia. O zoom nunca altera as dimensões reais do PDF.

## 16. Imagens, redimensionamento e alinhamento

Raio institucional padrão (8px em escala A4) aplicado igualmente em canvas, preview e PDF; exceção para imagens de largura total e cortes retos previstos no modelo. Recorte por ponto focal, sem distorção; indicador de qualidade para impressão.

Ao selecionar: contorno, 4 alças, guias, medida em colunas e imã. Ações: ajustar quadro, reposicionar, ponto focal, igualar altura a outro bloco, alinhar topo/base, centralizar, ajustar à coluna. Em áreas fixas do modelo, o redimensionamento fica preso ao intervalo seguro daquela área.

## 17. Preservação da identidade

Mantidos: logo, tipografia institucional, paleta ANA Brasil, cabeçalho, rodapé, faixas coloridas, cantos arredondados, verde-água em estados ativos, azul-escuro em títulos, tokens semânticos atuais. Nenhuma cor nova, nenhuma nova identidade, nenhum editor de design genérico.

## 18. Responsividade

Desktop: páginas à esquerda, canvas ao centro, propriedades à direita. Abaixo de 1280px: painel de páginas recolhível; abaixo de 1024px: propriedades em gaveta lateral; mobile: canvas em preview, ações principais em barra fixa, edição completa indicada para o computador. As três colunas nunca são comprimidas além do limite legível.

## 19. Impactos técnicos previstos

- `src/lib/journal/templates.ts`: novo conceito de *journal template* (conjunto de páginas) sobre o atual *page template*.
- Novos metadados de campo (rótulo-guia, limite, obrigatório, bloqueado) no tipo de bloco.
- `JournalPage.tsx`: passo de escolha de modelo no modal de criação.
- `JournalEditor.tsx`: auto-fit, controles de zoom, cards de página, barra contextual.
- `JournalPageView.tsx`: guias, imã, raio de imagem, fundo do jornal.
- `JournalPropertiesPanel.tsx` / `TextBlockPanel.tsx`: recolhimento em "Mais opções".
- Persistência: campos novos cabem no JSON já gravado (`pages`); jornais existentes continuam abrindo como "modelo livre". **Sem migration, sem mudança de RLS, sem nova rota.**

## 20. Ordem recomendada para futura implementação

1. Fundo, contraste e ajuste da folha à tela
2. Miniaturas totalmente clicáveis
3. Fluidez, animações e arraste
4. Simplificação das ferramentas
5. Estrutura dos modelos completos
6. Criação dos três modelos
7. Preenchimento guiado
8. Automação e autopreenchimento
9. Reconhecimento de diagramação
10. Testes de preview e PDF

## 21. Critérios de aceite

Rota, dados e jornais existentes preservados; contraste e leitura melhorados; arraste fluido com guias; miniatura inteira clicável; auto-fit ativo; ferramentas reduzidas e básicas em destaque; imagens com raio consistente; três modelos completos com capa e internas; diagramação manual reduzida; preenchimento guiado e automação presentes; identidade visual intacta.

## 22. PROPOSTA VISUAL — SEM IMPLEMENTAÇÃO

Os diagramas a seguir são representações estáticas. Nada foi codificado.

## 23. Mockups

**1 — Página atual refinada (listagem)**
```text
┌──────────────────────────────────────────────────────────────┐
│ Olá, Diretora                      [ + Criar jornal ]        │
│ ▣ MINHA UNIDADE  CEI Bem Querer Pierre Weil   [Trocar ▾]     │
│ [3 Rascunhos][5 Finalizados][1 Arquivado]                    │
│ 🔎 Buscar   Status ▾   Mês ▾   Modelo ▾                      │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐                          │
│ │[capa]   │ │[capa]   │ │[capa]   │                          │
│ │Ago/2026 │ │Jul/2026 │ │Jun/2026 │                          │
│ │Padrão·6p│ │Pedag.·6p│ │Event.·6p│                          │
│ └─────────┘ └─────────┘ └─────────┘                          │
└──────────────────────────────────────────────────────────────┘
```

**2 — Editor com fundo branco (rejeitado)**
```text
│PÁGINAS│           branco            │PROPRIED.│
│       │  ┌───────────────────────┐  │         │
│       │  │  folha branca         │  │  a folha se
│       │  └───────────────────────┘  │  confunde
```

**3 — Editor com área de trabalho #EEEEEE (recomendado)**
```text
│PÁGINAS│░░░░░░░░ #EEEEEE ░░░░░░░░░░░│PROPRIED.│
│branco │░┌───────────────────────┐░░│ branco  │
│       │░│  folha (sombra+borda) │░░│         │
│       │░└───────────────────────┘░░│         │
```

**4 — Alternância do fundo do jornal**
```text
┌ Fundo do jornal ─────────────┐
│ ( ) Branco     [prévia ▢]    │
│ (•) Off-white  [prévia ▨]    │
│ Aplica-se a todas as páginas │
└──────────────────────────────┘
```

**5 — Criação de novo jornal** → ver diagrama da seção 9.

**6 — Seleção dos três modelos** → cards da seção 9, com "Visualizar modelo" e "Usar este modelo".

**7 — Modelo A expandido**
```text
[01 Capa][02 Matéria][03 Notícias][04 Galeria][05 Agenda][06 Fim]
Imagem principal • título • chamadas → texto longo → 2 blocos →
grade de fotos → lista de eventos → mensagem institucional
```

**8 — Modelo B expandido**
```text
[01 Capa][02 Relato][03 Objetivos][04 Registros][05 Falas][06 Fim]
```

**9 — Modelo C expandido**
```text
[01 Capa][02 Contexto][03 Momentos][04 Galeria][05 Resultados][06 Fim]
```

**10 — Modelo completo (capa + internas)**
```text
┌ Capa ─┐ ┌ Matéria ┐ ┌ Notícias ┐ ┌ Galeria ┐ ┌ Agenda ┐ ┌ Fim ┐
│ ▤▤▤▤ │ │ ▬▬ ▤▤   │ │ ▬▬ | ▬▬  │ │ ▤▤ ▤▤   │ │ ▬ 05/08│ │ ▬▬▬ │
│ TÍTULO│ │ ▬▬▬▬▬▬  │ │ ▤▤ | ▤▤  │ │ ▤▤ ▤▤   │ │ ▬ 12/08│ │ ▬▬  │
│ ▬ ▬   │ │ ▬▬▬▬▬▬  │ │ ▬▬ | ▬▬  │ │ ▤▤ ▤▤   │ │ ▬ 20/08│ │ ✉︎  │
└───────┘ └─────────┘ └──────────┘ └─────────┘ └────────┘ └─────┘
```

**11 — Jornal criado automaticamente**
```text
✓ Jornal "Pierre Weil — Agosto/2026" criado com 6 páginas.
  Cabeçalho, rodapé e unidade já aplicados. Comece pela capa.
```

**12 — Editor com todas as páginas predefinidas** → ver mockup 14 (barra lateral) + canvas central.

**13 — Página com campos guiados** → ver diagrama da seção 10.

**14 — Página com autopreenchimento**
```text
Cabeçalho: CEI Bem Querer Pierre Weil · Agosto/2026   (automático)
Rodapé institucional                                   (automático)
Título: [ digite o título principal ]                  (pendente)
```

**15 — Reconhecimento de diagramação**
```text
┌ ⚠ Conteúdo excede a página ───────────────────┐
│ O texto ultrapassa o espaço previsto.         │
│ [ Reduzir texto ]  [ Continuar na próxima ]   │
└───────────────────────────────────────────────┘
```

**16 — Interface simplificada**
```text
[ Editar texto ][ Trocar imagem ][ Recortar ][ Legenda ][ ⧉ ][ 🗑 ][ ⋯ ]
```

**17 — Ferramentas básicas em destaque**
```text
┌ CONTEÚDO DA PÁGINA ─────────┐
│ [ + Texto ] [ + Imagem ]    │
│ [ + Legenda ] [ + Agenda ]  │
│ ─────────────────────────── │
│ Blocos da página (ordem)    │
│ 1 Título        ↑ ↓         │
│ 2 Imagem        ↑ ↓         │
│ ─────────────────────────── │
│ ▸ Mais opções               │
└─────────────────────────────┘
```

**18 e 19 — Miniaturas clicáveis e estados** → ver diagrama da seção 14.

**20 — Ajuste automático à tela**
```text
[ Ajustar à tela ] [ Largura ] [ Altura ]   − 68% +   [ ⛶ ]
```

**21 — Seleção e movimentação**
```text
╔══════════════╗ ← contorno verde-água
║ ▣ imagem     ║   alças nos 4 cantos
╚══════════════╝   "3 de 6 colunas"
```

**22 — Alinhamento magnético**
```text
┆        ┆        ┆   guias verticais
╔════════╗┆
║ bloco  ║┆ ····· imã ao centro
╚════════╝┆
```

**23 — Imagem com bordas arredondadas**
```text
╭──────────────╮
│   fotografia │  raio institucional
╰──────────────╯  legenda opcional abaixo
```

**24 — Redimensionamento limitado ao modelo**
```text
╔════════╗•  arraste até o limite da área do modelo
║ imagem ║•  ⓘ "Tamanho máximo desta área do modelo"
╚════════╝•
```

**25 — Preview do jornal completo**
```text
[01][02][03][04][05][06]   ◀ ▶   [ Exportar PDF ]
        ┌───────────┐
        │  página   │
        └───────────┘
```

**26 — PDF final (Modelo A)**
```text
6 páginas A4 · 210×297mm · fundo escolhido · cabeçalho e rodapé
institucionais em todas · imagens com raio · sem grid, sem alças
```

**27 — Comparação atual × refinada**

| Área | Hoje | Refinado |
|---|---|---|
| Fundo | Off-white uniforme | Painéis brancos + #EEEEEE |
| Zoom | Manual | Auto-fit + controles |
| Miniatura | Pequena, clique parcial | Card inteiro + status |
| Arraste | Sem guias | Guias + imã + feedback |
| Criação | 4 páginas genéricas | Modelo completo de 6 páginas |
| Painel | Tudo visível | Básico + "Mais opções" |
| Imagens | Raio inconsistente | Raio institucional único |

**28 — Versão para tela menor**
```text
┌──────────────────┐
│ ← Ago/2026   ⋯   │
│ 🏢 Pierre Weil   │
│ ◀ Página 2/6 ▶   │
│ ┌──────────────┐ │
│ │  A4 preview  │ │
│ └──────────────┘ │
│ [Páginas][Editar]│
│ [ Exportar PDF ] │
└──────────────────┘
```

## 24. Decisões pendentes

1. Jornais já criados: manter como "modelo livre" (sem campos guiados) ou oferecer conversão opcional para um modelo?
2. Limites de texto: bloquear a digitação no limite ou apenas alertar?
3. Páginas extras: liberar todas as páginas-tipo do modelo ou só um subconjunto (matéria/galeria)?
4. Fundo do jornal: a diretora escolhe ou fica fixado pelo modelo?
5. Modelos por unidade (variações) ou três modelos globais nesta etapa?
6. Reconhecimento de diagramação: alerta passivo ou ação automática de mover excedente?
