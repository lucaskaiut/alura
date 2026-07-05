import { Suspense } from "react";
import { headers } from "next/headers";
import ProductCard from "@/components/ui/ProductCard";
import { marginStyle, paddingStyle } from "./CraftPageRenderer";

interface StoreProduct {
  id: number;
  name: string;
  slug: string;
  price: number;
  is_variable?: boolean;
  variants?: { id: number; price?: string; attribute_values?: { id: number; value: string; attribute?: { id: number; name: string } }[] }[];
  media?: { id: number; path: string }[];
}

async function fetchProducts(ids: number[]): Promise<StoreProduct[]> {
  try {
    const host = (await headers()).get("host") || "localhost";
    const tenantDomain = host.split(":")[0].replace(/^www\./, "");
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

    const res = await fetch(
      `${apiBase}/store/products?ids=${ids.join(",")}&per_page=50`,
      {
        headers: { "X-Tenant-Domain": tenantDomain },
        next: { revalidate: 60 },
      }
    );
    const data = await res.json();
    return (data.data ?? data) as StoreProduct[];
  } catch {
    return [];
  }
}

async function ProductGridContent({
  productIds,
  title,
  limit = 4,
  columns = 3,
}: {
  productIds: number[];
  title?: string;
  limit?: number;
  columns?: number;
}) {
  const products = await fetchProducts(productIds);

  if (!products.length) {
    return (
      <div className="text-center py-10 text-text-muted">Nenhum produto encontrado.</div>
    );
  }

  return (
    <div>
      {title && <h3 className="text-xl font-semibold text-text mb-4">{title}</h3>}
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${columns || 3}, minmax(0, 1fr))` }}
      >
        {products.slice(0, limit || 4).map((p) => (
          <ProductCard
            key={p.id}
            id={p.id}
            name={p.name}
            slug={p.slug}
            price={p.price}
            is_variable={p.is_variable}
            variants={p.variants}
            media={p.media}
          />
        ))}
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-lg bg-surface shadow-sm animate-pulse">
          <div className="aspect-square bg-bg rounded-t-lg" />
          <div className="p-3 space-y-2">
            <div className="h-4 bg-bg rounded w-3/4" />
            <div className="h-5 bg-bg rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ProductGridDisplay(props: Record<string, unknown>) {
  const ids = (props.productIds as number[]) || [];
  if (!ids.length) {
    return (
      <div style={{ ...marginStyle(props), ...paddingStyle(props) }} className="text-center py-10 text-text-muted border border-dashed border-border rounded-lg">
        Nenhum produto selecionado
      </div>
    );
  }

  return (
    <div style={{ ...marginStyle(props), ...paddingStyle(props) }}>
      <Suspense fallback={<Skeleton />}>
        <ProductGridContent
          productIds={ids}
          title={props.title as string}
          limit={props.limit as number}
          columns={props.columns as number}
        />
      </Suspense>
    </div>
  );
}
