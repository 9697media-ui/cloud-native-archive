# Widget Banner / Slider — Plano de Estrutura

Widget novo, reutilizável, com padrão visual dos demais widgets da plataforma. Nada será implementado nesta etapa.

## 1. Arquitetura de componentes

```text
src/components/widgets/banner-slider/
├── BannerSlider.tsx          # runtime público (renderiza no site)
├── BannerSliderEditor.tsx    # painel administrativo (abas)
├── SlidesTab.tsx             # lista + drag-and-drop + uploads por device
├── SettingsTab.tsx           # autoplay, intervalo, navegação, etc.
├── EffectsTab.tsx            # seleção de transição + parâmetros
├── SlideCard.tsx             # linha de slide (thumb, toggle, duplicar, remover)
├── DeviceUploader.tsx        # dropzone reutilizável (Desktop / Tablet / Mobile)
├── useDeviceImage.ts         # hook: escolhe src conforme viewport
└── types.ts                  # tipos + defaults
```

Reaproveita `ImageBlockField` (upload/compressão), `sonner`, shadcn (`Tabs`, `Switch`, `Slider`, `Select`, `Button`), `@dnd-kit/sortable` para reordenar.

## 2. Modelo de dados

```ts
type Device = 'desktop' | 'tablet' | 'mobile';

interface SlideImage { url: string; width: number; height: number; alt?: string }

interface Slide {
  id: string;              // uuid
  active: boolean;
  order: number;
  images: Partial<Record<Device, SlideImage>>;
  // preparado para conteúdo futuro (não exposto no editor v1):
  content?: {
    title?: string; subtitle?: string; description?: string;
    primaryCta?: { label: string; href: string };
    secondaryCta?: { label: string; href: string };
  };
}

interface SliderSettings {
  autoplay: boolean;
  intervalMs: number;          // 1000–10000
  transitionMs: number;        // 200–2000
  loop: boolean;
  arrows: boolean;
  dots: boolean;
  swipe: boolean;
  pauseOnHover: boolean;
  pauseOnBlur: boolean;        // Page Visibility API
  effect: 'fade' | 'slide-h' | 'slide-v' | 'zoom' | 'scale' | 'parallax';
}

interface BannerAppearance {
  height: number | 'auto';
  objectFit: 'cover' | 'contain' | 'fill';
  alignX: 'left' | 'center' | 'right';
  alignY: 'top' | 'center' | 'bottom';
  zoom: number;                // 1.0–1.5
  overlayOpacity: number;      // 0–1
  rounded: boolean;
}

interface BannerSliderWidget {
  id: string;
  slides: Slide[];
  settings: SliderSettings;
  appearance: BannerAppearance;
}
```

Persistência: nova tabela `widget_banner_slider` ou reuso de `widget_templates` (JSONB `config`). Decisão fica para a fase de implementação.

## 3. Uploads por dispositivo

Cada slide tem 3 slots independentes usando `DeviceUploader` (baseado em `ImageBlockField`):

| Device  | Dimensão oficial | Proporção | Aceite       | Compressão   |
|---------|------------------|-----------|--------------|--------------|
| Desktop | 1916 × 821       | ~2.33:1   | PNG/JPG/WebP | max 1920px   |
| Tablet  | 1536 × 1024      | 3:2       | PNG/JPG/WebP | max 1600px   |
| Mobile  | 1080 × 1440      | 3:4       | PNG/JPG/WebP | max 1200px   |

Storage: bucket já existente `event-attachments`, prefixo `banners/YYYY/MM/`. Validação avisa (não bloqueia) se a proporção divergir >10%.

## 4. Seleção automática por viewport (runtime)

`useDeviceImage` usa `matchMedia`:

- `(max-width: 767px)` → mobile
- `(min-width: 768px) and (max-width: 1279px)` → tablet
- `(min-width: 1280px)` → desktop

Fallback em cascata: mobile → tablet → desktop (se algum slot vazio). Só a imagem escolhida entra no DOM (`<img>` único), evitando download desnecessário.

## 5. Performance

- `loading="lazy"` em todos os slides exceto o primeiro (LCP).
- `decoding="async"` + `fetchpriority="high"` no slide 1.
- `<link rel="preload" as="image">` apenas para a imagem do primeiro slide na resolução detectada.
- Pré-carrega o próximo slide 300 ms antes da transição.
- `IntersectionObserver` pausa autoplay se o slider estiver fora da viewport.
- `document.visibilitychange` pausa quando aba inativa.

## 6. Efeitos de transição

Camada `transitions/` com um contrato único:

```ts
interface TransitionAdapter {
  name: string;
  enter: (el: HTMLElement, ms: number) => Promise<void>;
  leave: (el: HTMLElement, ms: number) => Promise<void>;
}
```

v1 entrega `fade`, `slide-h`, `slide-v`, `zoom`, `scale`, `parallax`. Novos efeitos = novo arquivo + registro no `effectsRegistry`. Sem quebrar o editor.

## 7. Editor administrativo (UX)

Três abas no padrão dos demais widgets:

1. **Slides** — lista drag-and-drop, cada linha com handle, thumb, título opcional, toggle ativo, duplicar, remover. Botão "+ Adicionar Slide". Ao selecionar um slide, aparecem os 3 uploaders (Desktop / Tablet / Mobile) com preview e badge "Imagem atual".
2. **Configurações** — autoplay, intervalo, velocidade, loop, setas, dots, swipe, pausa hover, pausa aba inativa, altura, object-fit, alinhamento H/V, zoom, overlay, bordas.
3. **Efeitos** — select de transição + preview animado em miniatura.

Prévia ao vivo A4-like à esquerda (mesmo padrão do editor de Notícias).

## 8. Responsividade validada

Breakpoints testados: 360, 414, 768, 1024, 1280, 1440, 1920, 2560 (ultrawide). Container do banner respeita `max-width` do site; imagem preenche via `object-fit` configurado.

## 9. Fora do escopo desta etapa

Textos/CTAs sobrepostos ficam no schema mas ocultos do editor v1 (feature flag `bannerContentOverlayEnabled`). Isso mantém o editor simples e permite ativar depois sem migração.

## Mockup visual

Mockup do editor administrativo (prévia + abas + uploaders + configurações) para aprovação:

<presentation-artifact path="banner-slider-widget-mockup.jpg" mime_type="image/jpeg"></presentation-artifact>

Aguardo aprovação para iniciar a implementação.