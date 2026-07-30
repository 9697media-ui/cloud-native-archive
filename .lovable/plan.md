# Jornal Institucional — Plano Estrutural

## 1. Análise da página atual (Notícias / Informativo)

`src/pages/NewsGeneratorPage.tsx` (~2.100 linhas) concentra tudo: estado, editor em acordeão (4 seções), preview A4, autosave e exportação. Apoia-se em:

- `src/lib/news/units.ts` — 17 unidades em 2 grupos (Social / Educação) + `profileUnit`.
- `src/lib/news/categories.ts` — categorias temáticas.
- `src/hooks/useNewsBulletins.ts` — CRUD em `news_bulletins` (RLS por unidade, soft delete, autosave 2s).
- `src/components/news/InstitutionalHeader.tsx`, `InstitutionalFooterBar.tsx` (5 faixas), `ImageBlockField.tsx` (upload + compressão + legenda).
- Tokens `--news-paper` (#F0EEE4) e `--news-brand-1..5` em `index.css`.
- Export: html2canvas + jsPDF, fatiamento em páginas A4 com rodapé desenhado em cada uma.

## 2. Problemas encontrados

1. Documento de **página única** por natureza — multipágina só existe no PDF, nunca no editor.
2. Preview pequeno e desacoplado da edição: escreve-se em formulário, confere-se abaixo.
3. Sem miniaturas, sem navegação entre páginas, sem reordenação.
4. Blocos são lineares (fluxo vertical) — não há noção de capa, contracapa, agenda, galeria.
5. Painel de propriedades inexistente: todos os controles ficam sempre visíveis.
6. Indicador de ocupação é global, não por página; não há ação sobre excedente.
7. Arquivo monolítico — inviável estender para jornal sem quebrar o informativo.

**Decisão:** Jornal Institucional nasce como **módulo novo e isolado**, reaproveitando componentes visuais e tokens, sem tocar no informativo.

## 3. Objetivos da nova ferramenta

Produzir jornais A4 multipágina padronizados, com edição direta na página, modelos prontos, texto e imagem em estilos travados pela identidade e exportação PDF fiel (digital e impressão). Sem aprovação, publicação, comentários ou campanhas.

Fluxo: **Criar → escolher estrutura → editar páginas → visualizar → exportar PDF.**

## 4. Estrutura da página inicial (`/jornal-institucional`)

- `PageHeader`: título "Jornal Institucional" + descrição + botão primário **Criar novo jornal**.
- Barra de filtros: busca por nome, Unidade, Mês/Ano, Status, Responsável.
- Grade de cards: capa em miniatura A4, nome da edição, unidade, nº de páginas, última edição, autor, pill de status (**Rascunho** âmbar / **Finalizado** verde-água / **Arquivado** cinza-azul).
- Ações por card: Continuar edição, Visualizar, Duplicar, Renomear, Exportar PDF, Arquivar, Excluir (soft delete).
- Estado vazio institucional com ilustração simples e CTA único.

## 5. Controle de acesso (apenas conceito)

Reutiliza `useUserRole()` — a mesma regra do Marketing Hub: `isMarketing` (que já cobre `isAdmin`/`admin_geral`/`bond_type = 'marketing'`).

- Rota envolvida por um guard equivalente ao `MarketingRoute` em `App.tsx`.
- Item de menu em `src/config/navigation.ts` com `marketingOnly: true` (some do menu para os demais).
- No banco: políticas exigindo `check_is_admin()` OU vínculo de marketing — diferente do informativo, o jornal **não** é por unidade; a unidade é apenas um metadado do jornal.
- Nada disso é implementado nesta etapa.

## 6. Estrutura do editor (3 áreas)

```text
┌──────────────────────────────────────────────────────────────┐
│ Jornal ANA — Julho/2026   ✓ Salvo às 14:32  [Visualizar][PDF]│
├───────────┬──────────────────────────────────┬───────────────┤
│ PÁGINAS   │          CANVAS A4               │ PROPRIEDADES  │
│ 01 Capa   │  margens visíveis + área segura  │ (contextual)  │
│ 02 Matéri.│  seleção direta de elementos     │ página /      │
│ 03 Galeria│  zoom · Página 1 de 4            │ texto /       │
│ 04 Agenda │                                  │ imagem        │
│ + página  │                                  │               │
└───────────┴──────────────────────────────────┴───────────────┘
```

- **Esquerda:** miniaturas com número, tipo, preview, drag-to-reorder, duplicar, excluir, badge de excedente, "+ Adicionar página".
- **Centro:** A4 grande (zoom 50–150%), clique seleciona bloco, atualização em tempo real, margens tracejadas, elementos fixos com cursor bloqueado.
- **Direita:** painel contextual — nada selecionado → propriedades da página (modelo, margens, ocupação); texto → controles de texto; imagem → enquadramento.

## 7. Modelos de página (v1: 5 + extras)

| Modelo | Composição |
|---|---|
| Capa | cabeçalho, nome da edição, chamada principal, imagem destaque, 2 chamadas, mês/ano |
| Matérias | 1 matéria principal + 2 chamadas menores com imagens |
| Matéria completa | título, subtítulo, texto corrido, imagem principal, frase de destaque, imagens complementares |
| Galeria | intro, imagem principal, 4 ou 6 fotos, legendas opcionais |
| Agenda | linhas com data, evento, horário, local, descrição curta |
| Resultados e números | grade de indicadores + destaques |
| Contracapa | mensagem institucional, contatos, redes, informações fixas |
| Em branco | slots livres com os blocos permitidos |

Adicionar página abre seleção visual em grade de miniaturas.

## 8. Biblioteca de blocos

- **Texto:** título principal, título de matéria, subtítulo, parágrafo, lista, frase de destaque, chamada curta, legenda.
- **Imagem:** única, horizontal, vertical, quadrada, duas, três, largura total, galeria.
- **Institucional:** destaque numérico, agenda, depoimento, box informativo, aviso, contato, encerramento.

No editor cada bloco aparece como área selecionável com contorno verde-água ao passar o mouse; no PDF é renderizado pelo mesmo componente do canvas (paridade preview = PDF), sem contornos, guias ou controles.

## 9. Edição de texto

Sem escolha livre de fonte, cor, tamanho, sombra ou borda. A pessoa escolhe apenas a **função** (Título de capa, Título de matéria, Subtítulo, Texto corrido, Destaque, Legenda) e o sistema aplica o estilo. Controles: conteúdo, alinhamento, negrito, itálico, lista, espaçamento entre linhas, tamanho do bloco.

## 10. Edição de imagens

Upload (Supabase Storage, mesmo caminho do `ImageBlockField`) ou URL; substituir, recortar, girar, ampliar, reposicionar, ponto focal 3×3, "Preencher espaço / Imagem completa", restaurar enquadramento, legenda, remover. Nunca esticar. Aviso de DPI: "Qualidade adequada para impressão" (verde) ou "Atenção: esta imagem poderá ficar desfocada no PDF" (coral). Todos os controles no painel direito.

## 11. Preview — "Visualizar jornal"

Todas as páginas, alternância página única / lado a lado, setas, zoom, capa e contracapa nas extremidades, conferência de margens e quebras, faixa de miniaturas, botão "Voltar ao editor".

## 12. Exportação em PDF

Modal de conferência: nº de páginas, imagens carregadas, conteúdo excedente, qualidade das imagens, cabeçalho, rodapé, numeração, A4. Depois: **PDF Digital** (escala menor, arquivo leve) ou **PDF para impressão** (escala 2–3×, alta resolução). O PDF mantém proporção A4, sem distorção, com cabeçalho, rodapé de 5 faixas em largura total e numeração em ordem.

## 13. Responsividade

Desktop = experiência principal (3 colunas). Tablet: miniaturas em drawer, propriedades em bottom sheet. Mobile: canvas em foco, barra inferior (Páginas · Editar · Propriedades · Visualizar · Exportar), preview em tela cheia com swipe. Nunca comprimir as 3 colunas.

## 14. Elementos fixos

Logo, cabeçalho, rodapé de faixas, paleta, tipografia, margens, A4, estilos de título, numeração e elementos obrigatórios — visíveis no canvas, não editáveis (apenas o conteúdo dos campos permitidos).

## 15. Impactos técnicos futuros

- Tabelas novas: `journals` (nome, unidade, mês/ano, status, capa, criado_por) e `journal_pages` (journal_id, ordem, template, blocks jsonb) — ou `pages` jsonb dentro de `journals`. Sem migração agora.
- Novo diretório `src/components/journal/` + hook `useJournals` + `useJournalEditor` (undo/redo, autosave).
- Export precisa iterar N nós A4 já montados no DOM (offscreen), não fatiar um nó longo — mais fiel que o informativo atual.
- Reuso direto: `InstitutionalHeader`, `InstitutionalFooterBar`, `ImageBlockField`, tokens `--news-*`, `PageHeader`.

## 16. Ordem recomendada de implementação

1. Rota + guard + página inicial (lista, filtros, estado vazio).
2. Modelo de dados + criação de jornal + seleção de modelo.
3. Shell do editor (3 colunas) + canvas A4 + miniaturas.
4. Blocos de texto e estilos travados.
5. Blocos de imagem + enquadramento + legendas.
6. Ocupação/excedente por página.
7. Modo "Visualizar jornal".
8. Exportação digital e impressão + conferência.
9. Undo/redo, duplicação, arquivamento, responsivo.

## 17. Critérios de aceite

- Só Admin Geral e Marketing veem menu, lista e editor.
- Criar jornal de 4 páginas em menos de 30s.
- Reordenar, duplicar e excluir páginas com reflexo imediato nas miniaturas e no PDF.
- Estilos de texto restritos às funções previstas.
- Imagem nunca distorcida; aviso de baixa resolução funcional.
- PDF com o mesmo resultado visual do preview, A4, rodapé de largura total e numeração correta.
- Autosave com horário visível e aviso ao sair com alterações pendentes.

## 18. PROPOSTA VISUAL — SEM IMPLEMENTAÇÃO

## 19. Mockups

Seis pranchas de alta fidelidade cobrindo os 18 estados pedidos: página inicial e estado vazio; modais de criação e seleção de modelo; editor completo com capa; painéis de texto (com excedente) e de imagem sobre páginas de matérias e galeria; visualização do jornal e conferência/exportação; versões tablet e mobile.

Observação: os mockups são renderizações conceituais — a logomarca e algumas fotos são de preenchimento; na implementação valem os assets reais do ANA Brasil.

## 20. Decisões pendentes

1. O jornal é por unidade (metadado) ou pode ser multiunidade/institucional geral?
2. "Finalizado" trava a edição ou é apenas rótulo?
3. Galeria e capa podem usar imagens já enviadas em informativos (biblioteca compartilhada)?
4. Numeração aparece também na capa e contracapa?
5. Limite máximo de páginas por edição (sugestão: 24)?
6. Undo/redo entra na v1 ou fica para a v2?
