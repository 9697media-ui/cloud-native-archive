## Plano: Modernização Visual da Página Notícias (Informativo)

Escopo: apenas análise e recomendações. Nenhum arquivo será alterado nesta etapa.

---

### 1. Fundo da página — troca de branco por `#F0EEE4`

**Onde aplicar (a decidir na aprovação):**
- (a) Fundo da área de preview/canvas da notícia (o "papel" onde os módulos são renderizados)
- (b) Fundo do PDF exportado (via `html2canvas` no `NewsGeneratorPage.tsx`)
- (c) Opcionalmente, fundo da própria rota `/noticias` (área externa ao card)

Recomendação: aplicar em (a) e (b) para garantir consistência entre visualização e PDF. Manter (c) com o token `--background` atual (`#F0EEE4` já é praticamente o valor do token global `40 27% 96%` — muito próximo, então o efeito é sutil e coerente com o design system).

**Análise de contraste (WCAG AA — texto sobre `#F0EEE4`):**
- Texto principal `hsl(150 4% 13%)` ≈ `#1F211F` → contraste ~15.8:1 ✅ (AAA)
- Texto muted `hsl(0 0% 28%)` ≈ `#474747` → contraste ~7.9:1 ✅ (AAA)
- Primary `#8BE0C6` sobre `#F0EEE4` → ~1.4:1 ❌ (só usar em blocos, nunca em texto pequeno)

**Legibilidade:** bege quente reduz o glare do branco puro, melhora leitura prolongada, transmite tom institucional/editorial (adequado ao ANA Brasil).

**Impacto visual:** aproxima a peça de um "papel impresso", reforça identidade institucional; imagens continuam destacadas por contraste com o fundo levemente off-white.

**Acessibilidade:** sem regressões — todos os textos do design system permanecem acima de AA. Verificar apenas placeholders e ícones cinza-claro em toolbars (garantir ≥ 4.5:1).

**Modo escuro:** manter o comportamento atual (o `#F0EEE4` só se aplica ao "papel" da notícia; o restante segue tokens). O papel da notícia deve permanecer claro mesmo em dark mode, pois o PDF final é sempre claro.

---

### 2. Rodapé institucional — barra de 5 faixas

**Cores (ordem fixa, esquerda → direita):**
`#F5DFBB` · `#FBCE00` · `#F37964` · `#81E2CF` · `#01ADFF`

**Estrutura recomendada:**
- 5 divs `flex-1` (larguras iguais), lado a lado, sem gap
- Container `flex w-full overflow-hidden`

**Altura recomendada:**
- Visualização web: **12px** (fina, discreta, institucional — estilo bandeira/selo)
- PDF A4 (816px de largura no canvas): **16–20px**, para manter proporção visível na impressão
- Alternativa mais marcante: 24px se o objetivo for reforçar identidade visual

**Posição:**
- Última coisa dentro do "papel" da notícia, colada no fundo (sem margem inferior)
- Aparece tanto no preview quanto no PDF exportado (mesmo componente, garante paridade)

**Container vs largura total:**
- Recomendo **ocupar 100% da largura do container da notícia** (não sangrar para fora do papel). Assim funciona como um "rodapé de marca" institucional e mantém a metáfora de documento.
- Fora do container (edge-to-edge da viewport) só faria sentido se o fundo bege ocupasse a página inteira — não é o caso.

**Border-radius:**
- O papel da notícia usa `rounded-xl` (12px). A barra deve **acompanhar apenas os cantos inferiores** (`rounded-b-xl`) para não quebrar a silhueta do card.
- No PDF: como o `html2canvas` rasteriza, garantir que o container pai tenha `overflow-hidden` para o radius recortar as pontas coloridas.

**Espaçamento acima da barra:**
- Sem padding entre o último módulo de conteúdo e a barra (barra "toca" o fim do conteúdo) — reforça leitura de rodapé institucional.
- Se ficar visualmente apertado, adicionar `mt-8` no wrapper da barra apenas na visualização web.

---

### 3. Pontos de decisão para você aprovar

1. Aplicar `#F0EEE4` em: **(a) papel + (b) PDF** apenas, ou também em (c) rota inteira?
2. Altura da barra: **12px web / 18px PDF** (recomendado) ou uniforme 16px?
3. Barra com `rounded-b-xl` acompanhando o papel (recomendado) ou 100% reta?
4. Manter a barra também em eventuais previews de e-mail/embed da notícia?

---

### 4. Arquivos que seriam tocados na implementação (referência, não alterados agora)

- `src/pages/NewsGeneratorPage.tsx` — fundo do canvas, novo componente `<InstitutionalFooterBar />`, inclusão no fluxo de export PDF
- `src/index.css` — (opcional) token `--news-paper: 43 33% 92%;` e `--news-footer-*` para as 5 cores, evitando hex hard-coded nos componentes

---

Aguardando sua aprovação (ou ajustes) para partir para a implementação.