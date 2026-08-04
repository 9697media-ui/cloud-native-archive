import { JournalPageView } from '@/components/journal/JournalPageView';
import { createPage } from '@/lib/journal/templates';

/** Página temporária de validação visual das capas C1/C2/C3. */
export default function CoverCheck() {
  const pages = (['capa_c1', 'capa_c2', 'capa_c3'] as const).map((t) => createPage(t));
  return (
    <div className="flex flex-wrap gap-6 bg-[#EEEEEE] p-6">
      {pages.map((page, index) => (
        <div key={page.id} id={`cover-${index + 1}`} className="shadow-lg">
          <JournalPageView
            page={page}
            index={index}
            total={3}
            edition="Agosto 2026"
            unitName="Unidade Teste"
            interactive
            paper="branco"
          />
        </div>
      ))}
    </div>
  );
}
