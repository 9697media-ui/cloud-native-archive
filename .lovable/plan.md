# Plano — Widget Banner (Slider Responsivo)

Nova modalidade dentro de **Marketing → Ferramentas do Widget**, seguindo integralmente o padrão dos widgets atuais (WhatsApp, Banner simples, Menu, Gateway, Sidetab). Nada é duplicado nem quebrado: entra como mais um `activeWidgetType`.

---

## 1. Arquitetura proposta

Todo o módulo vive em `src/pages/AdminToolboxPage.tsx` com uma máquina de estados por `activeWidgetType`. A adição é uma **expansão lateral**: novo tipo `'banner-slider'` convivendo com os demais.

Pontos de extensão já existentes que serão apenas estendidos (padrão espelhado do que já existe para `banner`, `gateway`, etc.):

- `DEFAULT_BANNER_SLIDER_CONFIG` (novo objeto).
- `getDefaultConfig(type)` — adicionar branch.
- `currentConfig()` e `saveTemplate()` — adicionar branch.
- `loadDemo()` + `WIDGET_DEMOS` — adicionar branch com 2 slides de exemplo.
- Estado `const [bannerSliderConfig, setBannerSliderConfig] = useState(...)` ao lado dos outros configs.
- Deps dos `useEffect` de preview e autosave — incluir `bannerSliderConfig`.
- `generateBannerSliderCode()` — novo gerador de embed HTML/CSS/JS.
- Novo `TabsTrigger` no seletor de tipo de widget.
- Novo bloco no painel de edição: `activeWidgetType === 'banner-slider' ? (...) : ...`.
- Preview: nova render function usando o próprio HTML gerado (mesma técnica dos outros — `iframe` / `dangerouslySetInnerHTML` já usada).

Banco (`widget_templates`) **não muda**: reaproveita a coluna `type` (string) e `config` (jsonb). Apenas passa a aceitar `type = 'banner-slider'`.

Storage: as imagens dos slides vão para o bucket `event-attachments` (mesmo já usado por `FileUpload`), pasta `widgets/banners/YYYY/MM/`. Sem nova migração.

## 2. Modelo de dados (config JSON)

```ts
type BannerSliderConfig = {
  slides: Array<{
    id: string;               // uuid local
    name: string;             // nome interno
    active: boolean;
    imageDesktop: string;     // 1916x821 (wide desktop)
    imageTablet: string;      // 1536x1024 (tablet 3:2)
    imageMobile: string;      // 1080x1440 (mobile 3:4)
    alt: string;              // SEO
    href: string;
    newTab: boolean;
  }>;
  autoplay: boolean;
  intervalMs: number;         // tempo entre slides (2000–10000)
  transitionMs: number;       // velocidade (200–1500)
  loop: boolean;
  showArrows: boolean;
  showPagination: boolean;
  effect: 'slide' | 'fade';
  lazyLoad: boolean;          // carregamento otimizado
  pauseOnHover: boolean;
};
```

## 3. Fluxo do usuário

1. Marketing → aba **Widgets** → clica no chip **Banner Slider** (novo `TabsTrigger`).
2. Painel esquerdo mostra lista de slides (drag-and-drop) + card "Configurações Gerais".
3. "Adicionar slide" abre um card expandido com 3 uploads (Desktop/Tablet/Mobile) reutilizando `FileUpload` em `mode="single"`, mais os campos alt, link, nova aba, nome interno, switch ativo.
4. Preview à direita atualiza em tempo real; pílula Desktop/Tablet/Mobile já existente troca a imagem exibida.
5. "Salvar" grava em `widget_templates`. "Modelos" lista templates salvos filtrados por `type === 'banner-slider'` (o filtro já existe genericamente).
6. "Código de incorporação" gera snippet copiável, mesmo padrão dos demais widgets.

## 4. Organização de componentes

**Reutilizados (sem alteração):**
- `FileUpload` (upload + Supabase Storage).
- `ColorField`, `Slider`, `Switch`, `Select`, `Tabs`, `Card`, `Button`, `Input`, `Label` do shadcn.
- Sistema de templates, autosave (`localStorage widget_draft_*`), histórico e demos.
- Device switcher (`deviceView`).
- Painel de preview e área de código.

**Novos (pequenos, dentro do próprio `AdminToolboxPage.tsx` para manter o padrão do arquivo):**
- `SlideListItem` — linha da lista com drag handle, thumb, nome, switch ativo, duplicar, excluir.
- `SlideEditor` — bloco expansível com os 3 uploads e metadados.
- `BannerSliderPreview` — renderiza o HTML gerado em um contêiner escalado ao device.
- `generateBannerSliderCode()` — gera CSS + HTML + JS vanilla (sem dependências) usando `<picture>` com `<source media>` para responsividade nativa e `loading="lazy"` para lazy load.

O embed gerado será autocontido (um `<style>` + `<div>` + `<script>` IIFE), no mesmo formato dos widgets existentes, com `aria-roledescription="carousel"`, `aria-label` por slide, foco visível e navegação por teclado (←/→).

## 5. Preview

Mesma abordagem já em uso: injeção do HTML/CSS/JS gerado dentro de um contêiner com classes auxiliares de dispositivo (`preview-desktop`, `preview-tablet`, `preview-mobile`). O `<picture>` respeita a largura simulada, então o preview reflete fielmente o comportamento real.

## 6. Código de incorporação

```html
<div class="ana-banner-slider" data-id="..."></div>
<script src="https://.../banner-slider.js" defer></script>
```
Alternativa autocontida (padrão dos demais): bloco único `<style>+<div>+<script>` inline, sem dependência externa. Manteremos o mesmo padrão do widget WhatsApp e Banner atuais.

## 7. Riscos técnicos

- **Peso das imagens.** 1916×821 (desktop), 1536×1024 (tablet) e 1080×1440 (mobile) podem gerar arquivos grandes → aplicar mesma compressão já usada em `ImageBlockField` (>500KB → 2000px, JPEG 0.85) antes do upload.
- **Layout shift (CLS).** Renderizar `<picture>` com `aspect-ratio` fixo por breakpoint para reservar espaço.
- **Autoplay + acessibilidade.** Respeitar `prefers-reduced-motion` e pausar em `:hover`/`:focus-within`.
- **Preview vs. produção.** Como cada breakpoint tem imagem própria, o preview precisa forçar a media-query correta via `width` do contêiner (não `min-width` da janela). Testar nos 3 devices.
- **Ordenação drag-and-drop.** Usar `@dnd-kit/sortable` só se já estiver no bundle; caso contrário, botões ↑/↓ para não introduzir dependência nova.

## 8. Pontos de atenção

- Não alterar assinatura de `saveTemplate`, `loadTemplate` nem schema do banco.
- Preservar autosave: incluir `bannerSliderConfig` nas deps do efeito de rascunho.
- Filtro de "Modelos" por tipo já é genérico — nada a mudar.
- Chip do novo tipo deve entrar por último na `TabsList` para não reordenar a UX atual.

## 9. Oportunidades de melhoria (opcionais, fora do escopo mínimo)

- Agendamento por slide (data início/fim).
- Métricas simples (clique por slide) via endpoint próprio.
- Presets de efeito (ken-burns, parallax leve).

---

## Mockup de alta fidelidade

Layout final proposto para a nova aba, dentro do padrão visual atual da plataforma.

<presentation-artifact path="widget-banner-slider-mockup.jpg" mime_type="image/jpeg"></presentation-artifact>

Aprove para eu iniciar a implementação.
