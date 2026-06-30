import Link from 'next/link';
import ProductGrid from '@/components/ui/ProductGrid';

interface Category {
  id: string;
  name: string;
  description?: string;
  breadcrumbs?: { name: string; path: string }[];
  products?: unknown[];
}

export default function CategoryPage({ category }: { category: Category }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {category.breadcrumbs && category.breadcrumbs.length > 0 && (
        <nav className="mb-4 flex items-center gap-2 text-sm text-text-muted">
          <Link href="/" className="hover:text-primary-600">
            Home
          </Link>
          {category.breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-2">
              <span>/</span>
              <Link href={crumb.path} className="hover:text-primary-600">
                {crumb.name}
              </Link>
            </span>
          ))}
        </nav>
      )}

      <h1 className="text-2xl font-bold text-text">{category.name}</h1>
      {category.description && (
        <p className="mt-2 text-text-muted">{category.description}</p>
      )}

      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-text-muted">
          {category.products?.length || 0} produtos
        </p>
        <div className="flex items-center gap-2">
          <label className="text-sm text-text-muted">Ordenar:</label>
          <select className="rounded-lg border bg-surface px-3 py-1.5 text-sm text-text focus:border-primary-500 focus:ring-1 focus:ring-primary-500">
            <option>Mais recentes</option>
            <option>Menor preço</option>
            <option>Maior preço</option>
            <option>Nome A-Z</option>
          </select>
        </div>
      </div>

      <div className="mt-6">
        {category.products && category.products.length > 0 ? (
          <ProductGrid products={category.products as { id: string; name: string; slug?: string; price: number; images?: { url: string; alt: string }[]; image?: string }[]} />
        ) : (
          <p className="py-12 text-center text-text-muted">
            Nenhum produto encontrado nesta categoria.
          </p>
        )}
      </div>
    </div>
  );
}
