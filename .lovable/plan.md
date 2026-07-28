# Landing Page — Centro de Convivência Inclusivo e Intergeracional (CCII)

Grupo ANA Brasil — Unidade DIC IV, Campinas/SP. Planejamento apenas; nenhum código será escrito nesta etapa.

---

## 1. Arquitetura da Informação

```text
/ccii  (landing page pública, rolagem única)
│
├─ 01 Header fixo ......... logo ANA Brasil + menu âncora + CTA "Quero apoiar"
├─ 02 Hero ................ nome do projeto, promessa, 2 CTAs, foto principal
├─ 03 O que é o CCII ...... texto institucional + selo "Proteção Social Básica"
├─ 04 Números do projeto .. 60 participantes | todas as idades | DIC IV | rede SUAS
├─ 05 Eixos de atuação .... 6 cards de atividades
├─ 06 Serviços de apoio ... acolhimento, orientação, atendimentos, visitas, rede
├─ 07 Impacto social ...... 4 pilares (autonomia, protagonismo, inclusão, direitos)
├─ 08 Galeria ............. fotos reais do dia a dia (placeholders)
├─ 09 Como apoiar ......... parceiro | voluntário | doador (3 caminhos)
├─ 10 Contato & Localização texto + formulário + mapa/endereço
└─ 11 Rodapé .............. dados institucionais, redes, barra 5 faixas
```

Hierarquia de conteúdo: identidade → explicação → prova → impacto → ação → contato.

## 2. Jornada do Usuário

| Persona | Entrada | Percurso | Conversão |
|---|---|---|---|
| Empresa/parceiro | Busca ou indicação | Hero → Números → Impacto → Como apoiar | Formulário "Ser parceiro" |
| Voluntário | Instagram | Hero → Eixos → Galeria → Como apoiar | WhatsApp / formulário |
| Doador | Link compartilhado | Hero → Impacto → Como apoiar | Contato direto |
| Família/usuário | Busca local | Hero → O que é → Serviços → Contato | Telefone / endereço |
| Órgão público | Documento oficial | O que é → Serviços → Rodapé (CNPJ) | E-mail institucional |

Fluxo emocional: acolhimento (hero humano) → confiança (dados e serviços) → pertencimento (galeria) → ação (CTA).

## 3. Wireframe Desktop (≥1024px)

```text
┌───────────────────────────────────────────────────────────────┐
│ [LOGO ANA]   O CCII  Atividades  Impacto  Apoiar  Contato  [CTA]│ fixo
├───────────────────────────────────────────────────────────────┤
│  ╔═══════════════════════════╗   ┌───────────────────────────┐ │
│  ║ selo: Proteção Social     ║   │  [FOTO 1 — hero]          │ │
│  ║ H1 Centro de Convivência  ║   │  roda de convivência      │ │
│  ║ Inclusivo e Intergeracional│  │  intergeracional          │ │
│  ║ subtítulo 2 linhas        ║   │  (retrato 4:5, cantos 24) │ │
│  ║ [Quero apoiar] [Conheça]  ║   └───────────────────────────┘ │
│  ╚═══════════════════════════╝                                 │
├───────────────────────────────────────────────────────────────┤
│  [60]        [Todas as]      [DIC IV]        [Rede]            │
│  participantes  idades       Campinas/SP     socioassistencial │
├───────────────────────────────────────────────────────────────┤
│  ┌ FOTO 2 (16:10) ┐   O que é o CCII                           │
│  │  oficina em     │   parágrafos institucionais                │
│  │  andamento      │   • convivência • vínculos • autonomia     │
│  └────────────────┘                                            │
├───────────────────────────────────────────────────────────────┤
│                Eixos de Atuação                                │
│  [card][card][card]                                            │
│  [card][card][card]                                            │
├───────────────────────────────────────────────────────────────┤
│  Serviços de apoio às famílias  (lista 2 col. com ícones)      │
├───────────────────────────────────────────────────────────────┤
│  Impacto Social — 4 pilares em faixa colorida                  │
├───────────────────────────────────────────────────────────────┤
│  Galeria: [F3 grande][F4][F5]                                  │
│           [F6][F7 grande]                                      │
├───────────────────────────────────────────────────────────────┤
│  Como apoiar:  [Parceiro] [Voluntário] [Doador]                │
├───────────────────────────────────────────────────────────────┤
│  Contato (form 6 campos)      |   Endereço, e-mail, telefone   │
├───────────────────────────────────────────────────────────────┤
│  Rodapé institucional + redes + CNPJ                            │
│  ▓▓▓▓ ▓▓▓▓ ▓▓▓▓ ▓▓▓▓ ▓▓▓▓  (barra 5 cores)                     │
└───────────────────────────────────────────────────────────────┘
```

## 4. Wireframe Mobile (<640px)

```text
┌──────────────────┐
│ [LOGO]      [☰]  │ fixo, 64px
├──────────────────┤
│ selo             │
│ H1 (3 linhas)    │
│ subtítulo        │
│ [Quero apoiar]   │ full-width
│ [Conheça]        │
│ ┌──────────────┐ │
│ │ FOTO 1 (4:3) │ │
│ └──────────────┘ │
├──────────────────┤
│ 60 participantes │ cards
│ Todas as idades  │ empilhados
│ DIC IV           │ 2x2
├──────────────────┤
│ FOTO 2           │
│ O que é o CCII   │
├──────────────────┤
│ Eixos (1 col.)   │
├──────────────────┤
│ Serviços (accord)│
├──────────────────┤
│ Impacto (1 col.) │
├──────────────────┤
│ Galeria (carrossel horizontal, snap) │
├──────────────────┤
│ Como apoiar 1col │
├──────────────────┤
│ Form + contatos  │
├──────────────────┤
│ Rodapé + barra   │
└──────────────────┘
[Botão flutuante WhatsApp — canto inferior direito]
```

## 5. Mockup Descritivo Completo

**Header** — fundo `#F0EEE4` com blur ao rolar, altura 72px desktop. Logo à esquerda, navegação âncora em Poppins Medium 15px `#484848`, CTA sólido `#01ADFF` com texto branco, raio 12px.

**Hero** — fundo `#F0EEE4` com duas manchas radiais suaves (`#81E2CF` 12%, `#FBCE00` 10%). Selo pill `#81E2CF`/texto `#1F2322`: "Serviço de Proteção Social Básica". H1 Poppins Bold 56px `#1F2322`, com "Intergeracional" em `#01ADFF`. Subtítulo 18px `#484848` máx. 60ch. Dois botões: primário `#01ADFF`, secundário outline `#484848`. À direita, **FOTO 1**: roda de convivência com pessoas de diferentes gerações, formato 4:5, raio 24px, sombra suave; moldura decorativa `#FBCE00` deslocada 12px.

**Números** — 4 cards `#FFFFFF` sobre `#F0EEE4`, número em Poppins Bold 40px alternando `#01ADFF`, `#F37964`, `#81E2CF`, `#FBCE00`; rótulo 14px `#484848`.

**O que é o CCII** — duas colunas. Esquerda: **FOTO 2** (oficina/atividade socioeducativa em andamento, 16:10). Direita: título "O que é o CCII", texto institucional do documento em 2–3 parágrafos e três bullets destacados com ícones em `#81E2CF`.

**Eixos de Atuação** — 6 cards em fundo `#FFFFFF`, ícone em círculo colorido 48px, título 18px, descrição 14px:
1. Atividades socioeducativas — `#01ADFF`
2. Cultura e arte — `#F37964`
3. Inclusão digital — `#01ADFF`
4. Preparação para o mundo do trabalho — `#FBCE00`
5. Ações comunitárias — `#81E2CF`
6. Encontros intergeracionais — `#F5DFBB`

**Serviços de apoio** — faixa `#F5DFBB` com lista em 2 colunas: acolhimento, orientação social, atendimentos individuais e familiares, visitas domiciliares, articulação com a rede socioassistencial.

**Impacto Social** — 4 pilares (autonomia, protagonismo social, inclusão e acesso a direitos, participação cidadã) em cards escuros `#1F2322` com texto `#F0EEE4` e acento colorido no topo.

**Galeria** — grid bento com 5 espaços: **FOTO 3** (sala de informática/inclusão digital), **FOTO 4** (grupo com mural "Nenhum de nós é tão bom quanto todos nós juntos"), **FOTO 5** (oficina de primeiros socorros/capacitação), **FOTO 6** (encontro comunitário com participantes sentados), **FOTO 7** (celebração/aniversariantes do mês). Cada uma com legenda curta em overlay ao hover.

**Como apoiar** — 3 cards de ação com borda superior colorida e CTA próprio: Seja Parceiro (`#01ADFF`), Seja Voluntário (`#81E2CF`), Faça uma Doação (`#F37964`).

**Contato** — formulário (nome, organização, e-mail, telefone, tipo de apoio, mensagem) enviando para WhatsApp/e-mail, ao lado do bloco institucional com endereço Rua Ibrantina Cardona, 386 – DIC IV, CEP 13054-513, Campinas/SP, dic@anabrasil.org, (19) 3367-4536.

**Rodapé** — `#1F2322`, logo em versão clara, razão social completa, CNPJ 54.150.339/0004-46 – IE: Isento, links anabrasil.org, Instagram e Facebook @anabrasilorg. Fecha com a barra institucional de 5 faixas iguais.

## 6. Moodboard

- **Palavras-chave:** acolhimento, gerações, luz, comunidade, dignidade, movimento.
- **Texturas:** papel off-white `#F0EEE4`, cantos generosos (16–24px), sombras baixas e difusas.
- **Formas:** círculos e pills — remetem a roda de conversa e convivência.
- **Fotografia:** luz natural, pessoas reais em interação, planos médios, sem poses corporativas.
- **Ilustração/ícones:** linha 1.75px, arredondados, monocromáticos coloridos.
- **Referências de tom:** relatórios de impacto de OSCs contemporâneas — sóbrio, mas caloroso; nada de gradientes roxos genéricos.

## 7. Lista de Componentes

| Componente | Uso |
|---|---|
| `CciiHeader` | Nav fixa + menu mobile |
| `CciiHero` | Título, CTAs, foto principal |
| `CciiStats` | 4 indicadores |
| `CciiAbout` | Texto institucional + foto |
| `CciiEixos` | Grid de 6 cards |
| `CciiServicos` | Lista/accordion de serviços |
| `CciiImpacto` | 4 pilares |
| `CciiGaleria` | Bento desktop / carrossel mobile |
| `CciiApoio` | 3 caminhos de apoio |
| `CciiContato` | Formulário + dados |
| `CciiFooter` | Institucional + barra 5 faixas |
| `PhotoPlaceholder` | Marcador com descrição da foto pendente |

## 8. Guia de Aplicação das Cores

| Cor | Papel | Onde |
|---|---|---|
| `#F0EEE4` | Fundo base | Página, hero, seções claras |
| `#1F2322` | Texto principal / fundo escuro | H1–H3, seção impacto, rodapé |
| `#484848` | Texto secundário | Parágrafos, labels, nav |
| `#01ADFF` | Ação primária | CTAs, links, destaques |
| `#81E2CF` | Apoio / positivo | Selos, ícones, card voluntário |
| `#F37964` | Ênfase emocional | Card doação, acentos |
| `#FBCE00` | Atenção pontual | Molduras, números, ícone trabalho |
| `#F5DFBB` | Fundo alternado | Faixa de serviços, blocos suaves |

Regra: máximo 2 cores de acento por seção; amarelo nunca como fundo de texto pequeno.

## 9. Estratégia de Responsividade

- Mobile-first: 1 coluna → `sm` 2 col. → `lg` 3 col.
- Breakpoints: 640 / 768 / 1024 / 1280 px.
- Tipografia fluida: H1 32→56px, corpo 15→18px.
- Espaçamento vertical entre seções: 64px mobile → 112px desktop.
- Galeria vira carrossel com scroll-snap abaixo de 768px.
- Imagens com `aspect-ratio` fixo para evitar CLS; `srcset` por breakpoint.
- Área de toque mínima 44×44px; botões full-width no mobile.

## 10. Estratégia de Acessibilidade (WCAG AA)

- Contraste verificado: `#1F2322`/`#F0EEE4` ≈ 15:1; `#484848`/`#F0EEE4` ≈ 7,4:1; texto sobre `#01ADFF` e `#FBCE00` sempre em `#1F2322` (nunca branco sobre amarelo).
- HTML semântico: um único `h1`, hierarquia sem saltos, `main`, `section`, `nav`, `footer`.
- Todas as fotos com `alt` descritivo; imagens decorativas com `alt=""`.
- Navegação por teclado completa, `focus-visible` com anel `#01ADFF` de 2px e offset.
- Formulário com `label` visível, erros em texto + ícone (não só cor), `aria-live` para status.
- Skip link "Ir para o conteúdo".
- `prefers-reduced-motion` desativa animações.
- `lang="pt-BR"`, `h-dvh` em vez de `h-screen`.

## 11. Estratégia de SEO

- Title: "CCII — Centro de Convivência Inclusivo e Intergeracional | ANA Brasil" (≤60 ch.)
- Meta description: "Serviço de Proteção Social Básica em Campinas/SP que promove convivência, vínculos e desenvolvimento social para todas as idades." (≤160 ch.)
- URL: `/ccii`; canonical definido.
- JSON-LD `NGO` + `LocalBusiness` com endereço, telefone, e-mail e `sameAs` das redes.
- H1 único com o nome completo do projeto; H2 por seção com termos locais ("Campinas", "DIC IV", "convivência intergeracional").
- Imagens em WebP, `loading="lazy"` fora do hero, `alt` descritivos.
- OG/Twitter tags; sitemap atualizado.

## 12. Estratégia de Animações Suaves

- Entrada por seção: `opacity 0 → 1`, `y 16px → 0`, 500ms, easing `cubic-bezier(.22,.61,.36,1)`, disparo em 20% de visibilidade, uma única vez.
- Stagger de 60ms entre cards de um mesmo grid.
- Contadores dos números animam de 0 ao valor em 1,2s ao entrar em viewport.
- Hover em cards: elevação 2px + sombra, 200ms.
- Header: sombra e blur aparecem após 24px de scroll.
- Scroll suave nas âncoras com offset do header.
- Tudo suprimido sob `prefers-reduced-motion: reduce`.

---

## Mockup Visual (ASCII) — Aparência Final

```text
════════════════════════════════════════════════════════════════════
 ANA BRASIL │ O CCII · Atividades · Impacto · Apoiar · Contato │[Apoiar]
════════════════════════════════════════════════════════════════════

  ( Proteção Social Básica )                 ┌─────────────────────┐
                                             │                     │
  Centro de Convivência                      │   FOTO 1            │
  Inclusivo e                                │   roda de conversa  │
  ✦Intergeracional✦                          │   intergeracional   │
                                             │   (4:5, luz natural)│
  Convivência, vínculos e                    │                     │
  desenvolvimento social para                │                     │
  todas as fases da vida, na                 └─────────────────────┘
  região Sudoeste de Campinas.                 ▂▂ moldura amarela ▂▂

  [ Quero apoiar → ]  [ Conheça o projeto ]

────────────────────────────────────────────────────────────────────
   ╭─────────╮  ╭─────────╮  ╭─────────╮  ╭─────────╮
   │   60    │  │  Todas  │  │  DIC IV │  │  Rede   │
   │ partici-│  │   as    │  │Campinas │  │ socio-  │
   │ pantes  │  │ idades  │  │   /SP   │  │assist.  │
   ╰─────────╯  ╰─────────╯  ╰─────────╯  ╰─────────╯
────────────────────────────────────────────────────────────────────

 ┌──────────────────────┐    O QUE É O CCII
 │  FOTO 2              │    ─────
 │  oficina socio-      │    Serviço da Proteção Social Básica que
 │  educativa em        │    promove convivência, fortalecimento de
 │  andamento (16:10)   │    vínculos familiares e comunitários e o
 └──────────────────────┘    desenvolvimento social de crianças,
                             adolescentes, jovens, adultos e idosos
                             em situação de vulnerabilidade.
                             ✓ Até 60 participantes
                             ✓ Encontros entre gerações
                             ✓ Articulação com a rede do município

────────────────────────────────────────────────────────────────────
                        EIXOS DE ATUAÇÃO
  ┌────────────┐ ┌────────────┐ ┌────────────┐
  │ ◉ Socio-   │ │ ◉ Cultura  │ │ ◉ Inclusão │
  │  educativas│ │   e arte   │ │   digital  │
  └────────────┘ └────────────┘ └────────────┘
  ┌────────────┐ ┌────────────┐ ┌────────────┐
  │ ◉ Mundo do │ │ ◉ Ações    │ │ ◉ Encontros│
  │  trabalho  │ │ comunitár. │ │ intergerac.│
  └────────────┘ └────────────┘ └────────────┘

──────────────── faixa #F5DFBB ────────────────────────────────────
   APOIO ÀS FAMÍLIAS
   • Acolhimento              • Atendimentos individuais/familiares
   • Orientação social        • Visitas domiciliares
   • Articulação com a rede socioassistencial do município
────────────────────────────────────────────────────────────────────

──────────────── faixa escura #1F2322 ─────────────────────────────
   IMPACTO SOCIAL
   ▌Autonomia   ▌Protagonismo   ▌Inclusão e     ▌Participação
                  social          direitos        cidadã
────────────────────────────────────────────────────────────────────

                         NOSSO DIA A DIA
  ┌───────────────────────┐ ┌──────────┐ ┌──────────┐
  │ FOTO 3  informática   │ │ FOTO 4   │ │ FOTO 5   │
  │ inclusão digital      │ │ mural    │ │ oficina  │
  └───────────────────────┘ └──────────┘ └──────────┘
  ┌──────────┐ ┌───────────────────────────────────┐
  │ FOTO 6   │ │ FOTO 7  celebração / aniversários │
  └──────────┘ └───────────────────────────────────┘

────────────────────────────────────────────────────────────────────
                          COMO APOIAR
  ┏━━━━━━━━━━━━━┓ ┏━━━━━━━━━━━━━┓ ┏━━━━━━━━━━━━━┓
  ┃▔▔ azul ▔▔   ┃ ┃▔▔ verde ▔▔  ┃ ┃▔▔ coral ▔▔  ┃
  ┃ Seja        ┃ ┃ Seja        ┃ ┃ Faça uma    ┃
  ┃ Parceiro    ┃ ┃ Voluntário  ┃ ┃ Doação      ┃
  ┃ [Falar →]   ┃ ┃ [Falar →]   ┃ ┃ [Falar →]   ┃
  ┗━━━━━━━━━━━━━┛ ┗━━━━━━━━━━━━━┛ ┗━━━━━━━━━━━━━┛

────────────────────────────────────────────────────────────────────
  FALE CONOSCO                    │  UNIDADE DIC IV
  [ Nome            ]             │  ⌂ Rua Ibrantina Cardona, 386
  [ Organização     ]             │    DIC IV — CEP 13054-513
  [ E-mail ][ Tel   ]             │    Campinas/SP
  [ Como deseja apoiar ▾ ]        │  ✉ dic@anabrasil.org
  [ Mensagem                    ] │  ☎ (19) 3367-4536
  [ Enviar mensagem → ]           │  ⚑ CNPJ 54.150.339/0004-46
════════════════════════════════════════════════════════════════════
  ANA BRASIL · Associação Nazarena Assistencial Beneficente
  anabrasil.org · @anabrasilorg · facebook/anabrasilorg
  ▓▓▓▓▓▓▓ ▓▓▓▓▓▓▓ ▓▓▓▓▓▓▓ ▓▓▓▓▓▓▓ ▓▓▓▓▓▓▓
════════════════════════════════════════════════════════════════════
```

## Fotos pendentes (placeholders)

| ID | Seção | Tipo de foto esperada | Proporção |
|---|---|---|---|
| FOTO 1 | Hero | Roda de convivência com diferentes gerações, luz natural | 4:5 |
| FOTO 2 | O que é | Oficina socioeducativa em andamento | 16:10 |
| FOTO 3 | Galeria | Sala de informática / inclusão digital | 3:2 |
| FOTO 4 | Galeria | Grupo diante do mural "Nenhum de nós é tão bom quanto todos nós juntos" | 1:1 |
| FOTO 5 | Galeria | Oficina de capacitação (ex.: primeiros socorros) | 1:1 |
| FOTO 6 | Galeria | Encontro comunitário com participantes sentados | 1:1 |
| FOTO 7 | Galeria | Celebração / aniversariantes do mês | 3:2 |

---

Aguardo sua aprovação para iniciar a implementação.
