# Redimensionamento e alinhamento de imagens no canvas — Jornal Institucional

Plano estrutural. Nada foi implementado.

## 1. Diagnóstico do editor atual

- A página A4 (`JournalPageView`) usa uma grade de 6 colunas com `gap`, e cada bloco só controla `span` (1–6).
- O bloco de imagem tem `ratio` (16/9, 4/3, 1/1, 3/4) e `fit` (cover/contain). A altura é derivada da proporção — nunca é definida diretamente.
- Consequência: em "imagem + texto lateral", a altura da imagem depende do ratio e a do texto depende do conteúdo. Não há como igualá-las.
- Não existe seleção manipulável no canvas: clicar só destaca o bloco e abre o painel lateral.

## 2. Modelo de dados proposto (somente adições, retrocompatível)

No `JournalImageBlock`:

| Campo | Tipo | Função |
|---|---|---|
| `height` | `number` (px A4) opcional | altura explícita do quadro; ausente = usa `ratio` como hoje |
| `widthPct` | `number` opcional | largura fina dentro do span (60–100%) |
| `lockRatio` | `boolean` | proporção travada nas alças de canto |
| `focal` | `{ x: number; y: number }` | ponto focal 0–1 usado no recorte |
| `zoom` | `number` | 1–3, escala da foto dentro do quadro |
| `alignSelf` | `'start' \| 'center' \| 'end' \| 'stretch'` | alinhamento vertical na linha da grade |
| `justify` | `'start' \| 'center' \| 'end'` | alinhamento horizontal dentro do span |

Blocos existentes continuam válidos: todos os campos novos são opcionais, com fallback ao comportamento atual (ratio + cover/contain, focal 0.5/0.5, zoom 1).

## 3. Renderização (canvas = preview = PDF)

- A geometria vira **estilo puro**: quadro com `height`/`width` em px A4 e a foto posicionada por `object-position: {focal.x}% {focal.y}%` + `transform: scale(zoom)` dentro de um `overflow:hidden`.
- Nada de recorte por canvas/JS: o recorte é apenas CSS determinístico, portanto o `html2canvas` reproduz exatamente o que o editor mostra.
- As alças, contornos, guias e medidas ficam em uma camada de overlay renderizada **apenas** quando `interactive === true` — ela não existe no preview nem no clone de exportação.

## 4. Interação no canvas

**Seleção:** contorno azul institucional, 4 alças de canto (quadradas) + 4 alças laterais (redondas), etiqueta de medidas em mm sob o quadro e indicador de proporção travada/livre.

**Alças de canto:** largura + altura juntas, mantendo a proporção do quadro.
**Alças laterais:** apenas largura ou apenas altura. A foto nunca estica — mudança de formato = recorte proporcional a partir do ponto focal.

**Modo enquadramento:** duplo clique na foto (ou "Ajustar enquadramento") entra em um modo em que o quadro fica fixo e a foto é arrastada; slider de zoom; alternância "Preencher espaço" / "Imagem completa"; "Restaurar enquadramento original"; ESC ou "Concluir" sai.

**Guias magnéticas:** durante arrasto/resize, comparação das bordas do quadro com topo, base, centro vertical e horizontal dos blocos vizinhos, margens da página e trilhos das colunas. Guia coral aparece quando a distância for ≤ 4 px e o valor encaixa suavemente. Segurar `Alt` desativa o encaixe.

**Área segura:** ao ultrapassar a margem ou a altura útil da página, o contorno fica coral com aviso "fora da área segura" — não bloqueia, apenas alerta.

## 5. Painel de propriedades da imagem

- **Alinhamento:** topo · centro · base · esquerda · direita · ajustar à coluna.
- **Dimensões:** **Igualar altura ao bloco de texto** (ação principal, destaque amarelo) · mesma largura do bloco ao lado · restaurar tamanho original · bloquear proporção · campos numéricos L/A em mm.
- **Enquadramento:** entrar no modo, preencher/completa, zoom, restaurar.
- Legenda e upload/URL permanecem exatamente como estão hoje.

**"Igualar altura ao bloco de texto":** mede a altura renderizada do bloco irmão na mesma linha, grava esse valor em `height`, mantém a proporção da foto, recorta o excedente a partir do ponto focal e deixa o enquadramento reposicionável. Zero distorção.

## 6. Escopo e restrições respeitadas

- Nenhuma alteração em logo, cabeçalho, rodapé ou identidade visual.
- Nenhuma alteração nos blocos de texto, agenda e indicador.
- Upload e URL de imagem intocados.
- Exportação em PDF continua usando o mesmo componente — apenas ganha os novos estilos.

## 7. Pontos para você decidir

1. As medidas devem aparecer em **mm** (impressão) ou em **px**?
2. "Igualar altura" deve recalcular sozinho quando o texto ao lado for editado, ou só ao clicar no botão?
3. Manter o seletor de proporção (16/9, 4/3…) como atalho, agora que a altura é livre?
4. Liberar altura livre também para blocos de imagem de largura total (span 6)?
