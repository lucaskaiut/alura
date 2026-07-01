import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { resolveRoute } from '@/lib/router';
import ProductDetail from '@/components/renderers/ProductDetail';
import CategoryPage from '@/components/renderers/CategoryPage';
import PageContent from '@/components/renderers/PageContent';
import ProductGrid from '@/components/ui/ProductGrid';

interface Props {
  params: Promise<{ slug?: string[] }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const path = '/' + (slug ?? []).join('/');
  const resolvedPath = path === '/' ? '/home' : path;
  const route = await resolveRoute(resolvedPath);

  if (route.type === 'not_found') {
    return { title: 'Página não encontrada - Njord' };
  }

  return {
    title: route.seo?.meta_title || 'Njord Store',
    description: route.seo?.meta_description || '',
  };
}

export default async function CatchAllPage({ params }: Props) {
  const { slug } = await params;
  const path = '/' + (slug ?? []).join('/');
  const resolvedPath = path === '/' ? '/home' : path;
  const route = await resolveRoute(resolvedPath);

  switch (route.type) {
    case 'home': {
      const data = route.data as {
        sections?: { id: string; type: string; title?: string; subtitle?: string; products?: unknown[] }[];
      };
      return (
        <div className="space-y-12 pb-12">
          {data.sections?.map((section) => {
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

    case 'product': {
      const productData = (route.data as { product?: Record<string, unknown> }).product;
      return <ProductDetail product={(productData || route.data) as { id: string; name: string; price: string | number; sku?: string; media?: { id: number; path: string; mime_type: string }[]; full_desc?: string; short_desc?: string; description?: string; variants?: { id: string; name: string; values: string[] }[] }} />;
    }

    case 'category': {
      const catData = route.data as { category?: Record<string, unknown>; breadcrumb?: { name: string; slug: string }[] };
      const cat = (catData.category || route.data) as Record<string, unknown>;
      const breadcrumbs = (catData.breadcrumb || (cat as Record<string, unknown>).breadcrumbs as { name: string; slug: string }[] || [])
        .map((b: { name: string; slug: string }) => ({ name: b.name, path: '/' + b.slug }));
      return <CategoryPage category={{ ...cat, breadcrumbs } as { id: string; name: string; description?: string; breadcrumbs?: { name: string; path: string }[]; products?: unknown[] }} />;
    }

    case 'page': {
      const pageData = (route.data as { page?: Record<string, unknown> }).page || route.data;
      return <PageContent page={pageData as { title: string; content?: string; body?: string; sections?: { id: string; type: string; content: string }[] }} />;
    }

    case 'not_found':
    default:
      notFound();
  }
}
