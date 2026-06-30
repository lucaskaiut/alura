import SafeHtml from '@/components/ui/SafeHtml';

interface PageData {
  title: string;
  content?: string;
  body?: string;
  sections?: { id: string; type: string; content: string }[];
}

export default function PageContent({ page }: { page: PageData }) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold text-text">{page.title}</h1>
      <div className="prose prose-lg mt-6 max-w-none">
        {page.content || page.body ? (
          <SafeHtml html={page.content || page.body || ''} />
        ) : page.sections ? (
          page.sections.map((section) => (
            <div key={section.id} className="mb-8">
              <SafeHtml html={section.content} />
            </div>
          ))
        ) : null}
      </div>
    </div>
  );
}
