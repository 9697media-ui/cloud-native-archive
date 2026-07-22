## Plano — Upload de Imagens no Bloco "Imagem"

Adicionar suporte a upload no bloco `type: 'image'` da página Notícias, **sem quebrar** o modelo atual baseado em `content: string` (URL).

---

### 1. Princípio arquitetural

O upload é apenas um **atalho para gerar uma URL**. Após o upload no Supabase Storage, o retorno é uma URL pública que é gravada exatamente no mesmo campo `module.content` usado hoje. Preview, PDF, gallery-grouping e serialização JSON permanecem intocados.

```text
[Usuário] → [Upload | URL]
              ↓         ↓
        Supabase    (input atual)
         Storage        ↓
              ↓         ↓
         URL pública ───┘
              ↓
        module.content (igual hoje)
```

---

### 2. Reutilização do bloco atual

- **Zero alterações** na estrutura do módulo (`{ id, type: 'image', content, cols, rows }`).
- **Zero alterações** no renderer do preview e do PDF (linhas ~1145 e ~1337 de `NewsGeneratorPage.tsx`).
- **Zero alterações** no agrupamento automático de galeria (`preventGallery`, `cols === 3`).
- Apenas o **editor lateral** do bloco ganha um seletor de modo (Upload | URL). O campo URL continua existindo e funcional.

---

### 3. Supabase Storage

- Reutilizar o bucket **público** já existente `event-attachments` (evita nova migration e nova policy).
  - Alternativa: criar bucket dedicado `news-images` se o time preferir isolamento — decisão do usuário.
- Path padronizado: `news/{yyyy}/{mm}/{uuid}.{ext}`.
- Componente base: reaproveitar `src/components/FileUpload.tsx` (modo `single`) — já cobre upload, progress, toast e getPublicUrl.

---

### 4. Impacto no JSON das notícias

- **Nenhum campo novo.** `content` continua sendo uma string URL.
- Notícias antigas (URLs externas Unsplash, etc.) continuam abrindo, editando e exportando normalmente.
- Diferença única: URLs vindas de upload apontam para `…supabase.co/storage/v1/object/public/event-attachments/news/…`.

---

### 5. Compatibilidade com notícias existentes

- 100%. O campo persistido é idêntico.
- Ao abrir uma notícia antiga, o editor detecta se `content` começa com o domínio do Storage → abre a aba **Upload** com a miniatura; caso contrário abre a aba **URL** com o link. Ambos os modos escrevem no mesmo `content`.

---

### 6. Tratamento de imagens grandes

- Limite duro no cliente: **5 MB** (bloqueia antes de subir, evita custo).
- Validação de MIME: `image/png`, `image/jpeg`, `image/webp`.
- Dimensão máxima recomendada: 2000px no maior lado (redimensionado automaticamente na compressão — passo 7).
- Feedback: barra de progresso, toast de erro claro em caso de rejeição.

---

### 7. Compressão automática

- Executada **no navegador antes do upload**, via `browser-image-compression` (leve, ~15KB gzip) ou `Canvas API` puro.
- Regras:
  - Se arquivo > 500KB → redimensiona para no máx. 2000px e re-encoda como JPEG q=0.85 (ou WebP se suportado).
  - Se ≤ 500KB → sobe original.
- Resultado: economia de banda + PDF mais leve + upload mais rápido, **sem perda visual perceptível** no A4.

---

### 8. Remoção de imagens não utilizadas

Risco real: usuário troca a imagem de um bloco várias vezes → arquivos órfãos no Storage.

Estratégia em camadas:

1. **Imediata (síncrona):** ao substituir/remover uma imagem cuja URL pertence ao bucket, chamar `supabase.storage.remove()` do arquivo antigo antes de gravar o novo `content`.
2. **Ao deletar o bloco:** mesmo tratamento.
3. **Ao descartar a notícia** sem salvar: manter set em memória de "uploads desta sessão ainda não commitados" e limpar no unload.
4. **Garbage collector (futuro, opcional):** Edge Function agendada que compara arquivos do bucket com URLs referenciadas em notícias salvas e remove órfãos > 7 dias. Fora do escopo desta entrega, apenas documentar.

URLs externas (não-Supabase) **nunca** são deletadas.

---

### 9. Experiência do usuário

- Duas pílulas no topo do editor do bloco: **Upload** (default) | **URL**.
- Modo Upload: drop zone + click-to-select, preview com nome/tamanho, botão remover.
- Modo URL: campo de texto atual, inalterado.
- Estados: idle → uploading (progress) → success (thumb) → error (toast + retry).
- Preview do artigo atualiza em tempo real assim que a URL é gravada — igual hoje.
- Acessibilidade: drop zone com `role="button"`, `aria-label`, foco visível, suporte a teclado.

---

### 10. Arquivos que serão tocados na implementação

- `src/pages/NewsGeneratorPage.tsx` — trocar o `<Input>` atual do editor do bloco imagem por um novo `<ImageBlockField>` (single component, contido).
- `src/components/news/ImageBlockField.tsx` — **novo**, encapsula Upload+URL+compressão+cleanup.
- `package.json` — adicionar `browser-image-compression` (opcional, se aprovado).
- **Não altera:** renderers, PDF pipeline, JSON schema, tipos de módulo, migrations.

---

### 11. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Bucket `event-attachments` mistura eventos e notícias | Prefixo de path `news/…` isola visualmente; criar bucket dedicado se necessário |
| Vazamento de arquivos órfãos | Cleanup síncrono em troca/remoção + roadmap de GC |
| html2canvas + imagens cross-origin | URLs do Storage são same-origin via CDN pública com CORS permissivo — já funciona hoje com Unsplash |
| Compressão degrada qualidade | q=0.85 e limite 2000px são conservadores; usuário pode desativar via modo URL |

---

### 12. Fora do escopo desta entrega

- Biblioteca/galeria de imagens já enviadas.
- Edição de imagem (crop, filtros).
- Garbage collector agendado (documentado, não implementado).

---

### Mockup da interface proposta

Mockup renderizado em alta fidelidade mostrando os dois estados do bloco (Upload ativo com progress + URL ativo com preview) exibido abaixo desta mensagem.

---

**Aguardando aprovação** para implementar. Pontos de decisão:

1. Bucket: usar `event-attachments` (rápido) ou criar `news-images` dedicado?
2. Compressão: incluir `browser-image-compression` ou usar Canvas puro (zero dependência)?
3. Limite de 5MB e 2000px estão OK?