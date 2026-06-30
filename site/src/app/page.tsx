import { resolveRoute } from '@/lib/router';
import ProductGrid from '@/components/ui/ProductGrid';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const route = await resolveRoute('/');
  type HomeData = {
    sections?: { id: string; type: string; title?: string; subtitle?: string; products?: unknown[] }[];
    featured_products?: unknown[];
    title?: string;
  };
  const data = route.data as HomeData | null | undefined;

  if (route.type === 'home' && data?.sections) {
    return (
      <div className="space-y-12 pb-12">
        {data.sections.map((section) => {
          if (section.type === 'hero') {
            return (
              <section
                key={section.id}
                className="bg-primary-700 py-20 text-center text-white"
              >
                <h1 className="text-4xl font-bold">
                  {section.title || 'Bem-vindo à Njord'}
                </h1>
                {section.subtitle && (
                  <p className="mt-4 text-lg text-primary-100">
                    {section.subtitle}
                  </p>
                )}
              </section>
            );
          }
          if (section.type === 'products' && section.products) {
            return (
              <section key={section.id} className="mx-auto max-w-6xl px-4">
                {section.title && (
                  <h2 className="mb-6 text-2xl font-bold text-text">
                    {section.title}
                  </h2>
                )}
                <ProductGrid products={section.products as { id: string; name: string; slug?: string; price: number; images?: { url: string; alt: string }[]; image?: string }[]} />
              </section>
            );
          }
          return null;
        })}
      </div>
    );
  }

  if (route.type === 'home' && data?.featured_products) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-3xl font-bold text-text">
          {data.title || 'Produtos em destaque'}
        </h1>
        <div className="mt-8">
          <ProductGrid products={data.featured_products as { id: string; name: string; slug?: string; price: number; images?: { url: string; alt: string }[]; image?: string }[]} />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="bg-primary-700 py-16 text-center text-white rounded-lg">
        <h1 className="text-4xl font-bold">Njord Store</h1>
        <p className="mt-4 text-lg text-primary-100">
          Sua loja online com a plataforma Njord.
        </p>
      </div>
      <div className="mt-12">
        <h2 className="text-xl font-semibold text-text">Produtos em destaque</h2>
        <p className="mt-2 text-text-muted">
          Configure sua página inicial no painel administrativo para personalizar esta seção.
        </p>
      </div>
    </div>
  );
}
