'use client';

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ProductGrid from '@/components/ui/ProductGrid';
import { apiFetch } from '@/lib/client-fetch';
import { X, SlidersHorizontal } from 'lucide-react';

interface Facet {
  id: number | string;
  name: string;
  count: number;
}

interface PriceFacet {
  key: string;
  label: string;
  count: number;
}

interface Facets {
  categories: Facet[];
  brands: Facet[];
  price_ranges: PriceFacet[];
}

interface Product {
  id: number | string;
  name: string;
  slug?: string;
  price: string | number;
  media?: { id: number; path: string; mime_type?: string }[];
  images?: { url: string; alt: string }[];
  image?: string;
}

interface SearchResponse {
  data: Product[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  facets?: Facets;
}

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevância' },
  { value: 'price_asc', label: 'Menor Preço' },
  { value: 'price_desc', label: 'Maior Preço' },
  { value: 'newest', label: 'Mais Recentes' },
  { value: 'name_asc', label: 'Nome A-Z' },
  { value: 'name_desc', label: 'Nome Z-A' },
];

function useFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const getParam = (key: string) => searchParams.get(key) || '';
  const getIntParam = (key: string) => {
    const v = searchParams.get(key);
    return v ? Number(v) : undefined;
  };

  const search = getParam('search');
  const categoryId = getIntParam('category_id');
  const brandId = getIntParam('brand_id');
  const priceMin = getIntParam('price_min');
  const priceMax = getIntParam('price_max');
  const inStock = getParam('in_stock') === 'true';
  const sort = getParam('sort') || 'relevance';
  const page = getIntParam('page') || 1;

  const setParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    if (key !== 'page') params.delete('page');
    router.push(`/busca?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

  return {
    search, categoryId, brandId, priceMin, priceMax, inStock, sort, page,
    setParam,
    setSearch: (v: string) => setParam('search', v),
    setCategoryId: (v: string) => setParam('category_id', v),
    setBrandId: (v: string) => setParam('brand_id', v),
    setPriceMin: (v: string) => setParam('price_min', v),
    setPriceMax: (v: string) => setParam('price_max', v),
    setInStock: (v: boolean) => setParam('in_stock', v ? 'true' : ''),
    setSort: (v: string) => setParam('sort', v),
    setPage: (v: number) => setParam('page', String(v)),
  };
}

function FilterSidebar({ facets, filters }: { facets: Facets | null; filters: ReturnType<typeof useFilters> }) {
  if (!facets) return null;

  return (
    <aside className="w-64 shrink-0 space-y-6">
      {facets.categories.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-text">Categorias</h3>
          <ul className="space-y-1">
            {facets.categories.map((cat) => (
              <li key={cat.id}>
                <button
                  onClick={() => filters.setCategoryId(filters.categoryId === Number(cat.id) ? '' : String(cat.id))}
                  className={`flex w-full items-center justify-between rounded px-2 py-1 text-sm transition-colors ${
                    filters.categoryId === Number(cat.id)
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-text-muted hover:bg-bg hover:text-text'
                  }`}
                >
                  <span className="truncate text-left">{cat.name}</span>
                  <span className="ml-2 shrink-0 text-xs">{cat.count}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {facets.brands.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-text">Marcas</h3>
          <ul className="space-y-1">
            {facets.brands.map((brand) => (
              <li key={brand.id}>
                <button
                  onClick={() => filters.setBrandId(filters.brandId === Number(brand.id) ? '' : String(brand.id))}
                  className={`flex w-full items-center justify-between rounded px-2 py-1 text-sm transition-colors ${
                    filters.brandId === Number(brand.id)
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-text-muted hover:bg-bg hover:text-text'
                  }`}
                >
                  <span className="truncate text-left">{brand.name}</span>
                  <span className="ml-2 shrink-0 text-xs">{brand.count}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {facets.price_ranges.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-text">Faixa de Preço</h3>
          <ul className="space-y-1">
            {facets.price_ranges.map((range) => (
              <li key={range.key}>
                <button
                  className="flex w-full items-center justify-between rounded px-2 py-1 text-sm text-text-muted hover:bg-bg hover:text-text transition-colors"
                  onClick={() => { /* price range filter via min/max */ }}
                >
                  <span>{range.label}</span>
                  <span className="text-xs">{range.count}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex gap-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.priceMin || ''}
              onChange={(e) => filters.setPriceMin(e.target.value)}
              className="w-full rounded border bg-bg px-2 py-1 text-sm text-text placeholder:text-text-muted focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
            <input
              type="number"
              placeholder="Max"
              value={filters.priceMax || ''}
              onChange={(e) => filters.setPriceMax(e.target.value)}
              className="w-full rounded border bg-bg px-2 py-1 text-sm text-text placeholder:text-text-muted focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>
        </div>
      )}

      <div>
        <label className="flex items-center gap-2 text-sm text-text-muted cursor-pointer">
          <input
            type="checkbox"
            checked={filters.inStock}
            onChange={(e) => filters.setInStock(e.target.checked)}
            className="rounded border-border text-primary-600 focus:ring-primary-500"
          />
          Em estoque
        </label>
      </div>
    </aside>
  );
}

function MobileFilterDrawer({
  facets, filters, open, onClose,
}: {
  facets: Facets | null;
  filters: ReturnType<typeof useFilters>;
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />
      <div className="fixed inset-y-0 left-0 z-50 w-72 bg-surface p-4 overflow-y-auto shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text">Filtros</h2>
          <button onClick={onClose} className="rounded p-1 text-text-muted hover:bg-bg">
            <X size={20} />
          </button>
        </div>
        <FilterSidebar facets={facets} filters={filters} />
      </div>
    </>
  );
}

function SearchResults() {
  const filters = useFilters();
  const [results, setResults] = useState<Product[]>([]);
  const [facets, setFacets] = useState<Facets | null>(null);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const { search, categoryId, brandId, priceMin, priceMax, inStock, sort, page } = filters;

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (categoryId) params.set('category_id', String(categoryId));
    if (brandId) params.set('brand_id', String(brandId));
    if (priceMin) params.set('price_min', String(priceMin));
    if (priceMax) params.set('price_max', String(priceMax));
    if (inStock) params.set('in_stock', 'true');
    if (sort) params.set('sort', sort);
    params.set('page', String(page));
    params.set('per_page', '20');

    let cancelled = false;
    setLoading(true);

    void (async () => {
      try {
        const data = await apiFetch<SearchResponse>(`/api/store/products?${params.toString()}`);
        if (cancelled) return;
        setResults(data.data || []);
        setFacets(data.facets || null);
        setTotal(data.total || 0);
        setLastPage(data.last_page || 1);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [search, categoryId, brandId, priceMin, priceMax, inStock, sort, page]);

  const hasActiveFilters = !!(categoryId || brandId || priceMin || priceMax || inStock);

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {search && (
            <p className="text-sm text-text-muted">
              <span className="font-medium text-text">{total}</span> resultados para &ldquo;{search}&rdquo;
            </p>
          )}
          {!search && (
            <p className="text-sm text-text-muted">
              <span className="font-medium text-text">{total}</span> produtos
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="flex items-center gap-1 rounded-lg border bg-surface px-3 py-1.5 text-sm text-text hover:bg-bg lg:hidden"
          >
            <SlidersHorizontal size={16} />
            Filtros
            {hasActiveFilters && (
              <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary-600 text-[10px] text-white">
                !
              </span>
            )}
          </button>
          <select
            value={sort}
            onChange={(e) => filters.setSort(e.target.value)}
            className="rounded-lg border bg-surface px-3 py-1.5 text-sm text-text focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-8">
        <div className="hidden lg:block">
          <FilterSidebar facets={facets} filters={filters} />
        </div>

        <MobileFilterDrawer
          facets={facets}
          filters={filters}
          open={mobileFiltersOpen}
          onClose={() => setMobileFiltersOpen(false)}
        />

        <div className="flex-1">
          {loading ? (
            <p className="py-12 text-center text-text-muted">Buscando...</p>
          ) : results.length > 0 ? (
            <>
              <ProductGrid products={results} />
              {lastPage > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  {Array.from({ length: Math.min(lastPage, 5) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => filters.setPage(pageNum)}
                        className={`flex h-8 w-8 items-center justify-center rounded text-sm transition-colors ${
                          filters.page === pageNum
                            ? 'bg-primary-600 text-white'
                            : 'text-text-muted hover:bg-bg hover:text-text'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <p className="py-12 text-center text-text-muted">
              Nenhum resultado encontrado.
            </p>
          )}
        </div>
      </div>
    </>
  );
}

export default function BuscaPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-text">Buscar</h1>
      <Suspense fallback={<p className="py-12 text-center text-text-muted">Carregando...</p>}>
        <SearchResults />
      </Suspense>
    </div>
  );
}
