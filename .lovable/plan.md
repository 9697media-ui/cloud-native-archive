## Plano — Novo widget "Banner (Slider Responsivo)"

Adicionar mais um `type` ao sistema atual de widgets em `src/pages/AdminToolboxPage.tsx`, sem criar página, rota ou fluxo paralelo. Ele passa a conviver com `whatsapp | banner | menu | gateway | sidetab` como um sexto tipo: `slider`.

---

### 1. Arquitetura proposta

O módulo atual segue um padrão claro e replicável:

```text
activeWidgetType ──► [xxxConfig, setXxxConfig] ──► painel esquerdo (Widget/Modelos/Editor)
        │                    │
        │                    └──► preview central (Preview/Site/Código) + device toggle
        │
        └──► generateXxxCode() ──► botão "Gerar Código para Copiar"
                                        │
                                        └──► persistência em `widget_templates` (type = 'slider')
```

O novo widget entra exatamente nesses cinco pontos, sem tocar em nada dos outros cinco tipos.

---

### 2. Integração com a interface existente

- **Card no seletor "Tipo de Widget"** (linhas ~3671-3703): adicionar a 6ª entrada
  `{ type: 'slider', icon: GalleryHorizontal, label: 'Banner (Slider)', hint: 'Carrossel responsivo' }`.
  Reaproveita 100% do estilo do grid, animação, estado `active`, ring do `primary`.
- **Painel esquerdo — aba Editor**: novo bloco `activeWidgetType === 'slider' && (...)` ao lado dos blocos já existentes (linhas ~3896/3957/4003/4493/4548).
- **Preview central**: `<SliderPreview config={sliderConfig} device={deviceView} />` renderizado no mesmo container já usado pelos demais, respeitando o toggle Desktop/Tablet/Mobile já existente.
- **Aba Código**: `generateSliderCode()` chamado no switch de `getCurrentCode()` (linha 3512-3515).
- **Modelos / Histórico / Draft autosave**: nada muda — a lógica já é agnóstica ao tipo (usa `activeWidgetType` + `currentConfig()`), basta incluir `'slider'` nos switches em `currentConfig`, `setConfigByType`, effects de baseline/draft (linhas 863-871, 899-902, 1311-1331).

---

### 3. Estrutura de dados (`sliderConfig`)

```ts
DEFAULT_SLIDER_CONFIG = {
  autoplay: true,
  interval: 5000,          // ms entre slides
  transitionSpeed: 600,    // ms da animação
  loop: true,
  pauseOnHover: true,
  showArrows: true,
  showBullets: true,
  effect: 'slide',         // 'slide' | 'fade' | 'zoom'
  lazyLoad: true,
  slides: [
    {
      id: uuid,
      name: 'Slide 1',
      enabled: true,
      desktopUrl: '', tabletUrl: '', mobileUrl: '',
      link: '', newTab: true, alt: '',
    },
  ],
}
```

Persistido em `widget_templates.config` como JSON — coluna já existe, tipo genérico, **sem migration**.

---

### 4. Componentes reutilizáveis já existentes

| Reuso | Origem |
|---|---|
| Upload de imagem (3 por slide) | `src/components/news/ImageBlockField.tsx` — já faz upload, compressão, cleanup no bucket `event-attachments` (path prefix `widgets/slider/…`) |
| Toggle de dispositivo | pills Desktop/Tablet/Mobile atuais do preview |
| Painel de abas Preview/Site/Código | `Tabs` já montado |
| Salvar / Modelos / Histórico / Draft | Fluxo genérico já existente |
| Botão "Gerar Código para Copiar" | `getCurrentCode()` |
| `Switch`, `Slider`, `Select`, `Input`, `Label`, `Tooltip` | shadcn já em uso |

---

### 5. Novos componentes / funções

Todos em `AdminToolboxPage.tsx` (mesmo arquivo dos outros widgets, mantendo o padrão) ou extraídos para `src/components/widgets/slider/` se preferirem modularizar:

1. **`<SliderConfigPanel>`** — painel esquerdo com:
   - Lista de slides drag-and-drop (`@dnd-kit/sortable` — nova dep leve, ~15KB) com handle, thumb, nome, ações (👁 ativar, ⧉ duplicar, 🗑 remover).
   - Botão "+ Adicionar Slide".
   - Editor do slide selecionado: 3 `ImageBlockField` (desktop/tablet/mobile) + link + novaAba + alt + nome.
   - Bloco global: autoplay, intervalo, velocidade, loop, hover, setas, bullets, efeito, lazy.

2. **`<SliderPreview>`** — carrossel real (não simulado) para o preview central:
   - Baseado em `embla-carousel-react` (leve, já usado em vários projetos shadcn) **ou** implementação nativa com CSS transforms para evitar nova dep. Recomendo Embla por acessibilidade nativa (ARIA, teclado).
   - Escolhe automaticamente `desktopUrl | tabletUrl | mobileUrl` conforme `deviceView`.
   - Container respeita as dimensões oficiais (1916×821 desktop/tablet, 1080×1440 mobile) via `aspect-ratio` + `object-contain` para não deformar.

3. **`generateSliderCode()`** — devolve HTML+CSS+JS **standalone e sem dependências externas** para o cliente colar em qualquer site:
   - `<picture>` com `<source media="(max-width: 767px)" srcset={mobile}>` + `<source media="(max-width: 1279px)" srcset={tablet}>` + `<img src={desktop}>` — a responsividade é feita pelo browser, sem JS extra.
   - JS mínimo (~2KB) para autoplay, arrows, bullets, pause-on-hover, loop, efeito. Sem libs externas.
   - `loading="lazy"` + `decoding="async"` nas imagens fora do primeiro slide.
   - `role="region"`, `aria-roledescription="carousel"`, `aria-label`, controles com `aria-label`.

---

### 6. Responsividade e dimensões oficiais

- Container do slide: `width: 100%`, `aspect-ratio` dinâmico por breakpoint:
  - `≥1280px`: `1916 / 821`
  - `768-1279px`: `1916 / 821`
  - `<768px`: `1080 / 1440`
- `object-fit: contain` por padrão para respeitar a proporção (opção "cover" pode virar toggle futuro).
- Preview central aplica o mesmo aspect-ratio conforme `deviceView` para o cliente ver exatamente o resultado final.

---

### 7. Persistência e compatibilidade

- **Zero alterações** em `widget_templates` (schema, RLS, grants).
- **Zero alterações** nos outros 5 widgets, seus configs, generators ou modelos salvos.
- **Zero alterações** no bucket `event-attachments` (só um novo prefixo `widgets/slider/`).
- Draft autosave (`widget_draft_${id}`) e histórico (`widget_history_${id}`) funcionam automaticamente porque são keyed por template id.

---

### 8. Riscos técnicos e mitigações

| Risco | Mitigação |
|---|---|
| Arquivo `AdminToolboxPage.tsx` já tem 5.7k linhas | Extrair `<SliderConfigPanel>` e `<SliderPreview>` para `src/components/widgets/slider/` (opcional mas recomendado) |
| Uploads órfãos ao trocar/remover slide | `ImageBlockField` já faz `removeIfOwned()` — reutilizar tal qual |
| Peso do bundle com Embla + dnd-kit | Ambas leves (~15KB gz cada). Alternativa zero-dep: transform CSS + HTML5 DnD nativo |
| Código exportado tem que rodar sem framework no site do cliente | Gerar HTML+CSS+JS vanilla, sem imports; testar em página estática |
| html2canvas / iframe no cliente | Não aplicável — código exportado é HTML puro |
| Muitos slides pesados no preview | `lazyLoad` liga `loading="lazy"` no `<img>` a partir do 2º slide |

---

### 9. Pontos de atenção

- Validar que todos os 3 uploads (desktop/tablet/mobile) existem antes de habilitar o botão "Gerar Código"; caso falte, fallback para o desktop com aviso amarelo.
- No preview central manter proporção fixa via `aspect-ratio` para não "pular" ao trocar de dispositivo.
- Manter i18n PT-BR consistente com o restante do módulo.
- Acessibilidade: navegação por Tab, Setas ← →, Home/End, `prefers-reduced-motion` respeitado (desliga autoplay/animações).

---

### 10. Fora do escopo desta entrega

- Agendamento de slides (data início/fim).
- A/B testing entre variações.
- Analytics de cliques por slide.
- Vídeos como slide.
- Garbage collector agendado para imagens órfãs.

---

### 11. Arquivos tocados

- `src/pages/AdminToolboxPage.tsx` — novo card no seletor, novo bloco no editor, novo case nos switches, `generateSliderCode()`.
- `src/components/widgets/slider/SliderConfigPanel.tsx` — **novo**.
- `src/components/widgets/slider/SliderPreview.tsx` — **novo**.
- `src/components/widgets/slider/generateSliderCode.ts` — **novo**.
- `package.json` — `@dnd-kit/core`, `@dnd-kit/sortable`, `embla-carousel-react` (a confirmar).
- **Não altera**: outros widgets, migrations, RLS, buckets, sistema de exportação existente.

---

### Mockup

Mockup de alta fidelidade abaixo mostra o novo card **Banner (Slider)** já selecionado no grid de tipos, o preview central com carrossel real + toggle de dispositivo, e o painel direito com lista de slides drag-and-drop e todos os controles previstos.

<presentation-artifact path="widget-banner-slider-mockup.jpg" mime_type="image/jpeg"></presentation-artifact>

---

**Aguardando aprovação.** Decisões abertas:

1. Extrair para `src/components/widgets/slider/` ou manter tudo em `AdminToolboxPage.tsx` como os outros?
2. Embla (acessibilidade pronta) ou implementação vanilla zero-dep?
3. `object-fit` padrão: `contain` (respeita proporção, pode ter tarjas) ou `cover` (preenche, pode cortar)?