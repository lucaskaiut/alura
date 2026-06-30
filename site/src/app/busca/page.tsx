'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductGrid from '@/components/ui/ProductGrid';

interface Product {
  id: string;
  name: string;
  slug?: string;
  price: number;
  images?: { url: string; alt: string }[];
  image?: string;
}

function SearchResults() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q) return;

    let cancelled = false;
    queueMicrotask(() => setLoading(true));

    void (async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(q)}`,
          {
            headers: { 'Content-Type': 'application/json' },
          }
        );
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          setResults(data.products || data.results || data.data || []);
        }
      } catch {
        if (!cancelled) {
          setResults([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [q]);

  const hasQuery = q !== '';

  return (
    <div>
      {!hasQuery ? (
        <p className="py-12 text-center text-text-muted">
          Digite um termo de busca.
        </p>
      ) : loading ? (
        <p className="text-center text-text-muted">Buscando...</p>
      ) : results.length > 0 ? (
        <ProductGrid products={results} />
      ) : (
        <p className="py-12 text-center text-text-muted">
          Nenhum resultado para &ldquo;{q}&rdquo;.
        </p>
      )}
    </div>
  );
}

export default function BuscaPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-text">Buscar</h1>
      <div className="mt-6">
        <Suspense fallback={<p className="text-center text-text-muted">Carregando...</p>}>
          <SearchResults />
        </Suspense>
      </div>
    </div>
  );
}
