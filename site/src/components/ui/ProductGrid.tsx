'use client';

import { useState } from 'react';
import Image from 'next/image';
import { getMediaUrl } from '@/lib/api';
import { addToCart } from '@/lib/cart';
import { useToast } from '@/components/ui/Toast';

interface MediaItem {
  id: number;
  path: string;
  mime_type: string;
}

interface Product {
  id: number | string;
  name: string;
  slug?: string;
  price: string | number;
  media?: MediaItem[];
  images?: { url: string; alt: string }[];
  image?: string;
}

export default function ProductGrid({ products }: { products: Product[] }) {
  const { show } = useToast();
  const [loadingIds, setLoadingIds] = useState<Set<number | string>>(new Set());

  const handleAdd = async (productId: number, qty: number) => {
    setLoadingIds((prev) => new Set(prev).add(productId));
    try {
      await addToCart(productId, qty);
      window.dispatchEvent(new Event('cart-updated'));
      show(`${qty > 1 ? `${qty}x ` : ''}Adicionado!`, 'success');
    } catch (err) {
      show(err instanceof Error ? err.message : 'Erro ao adicionar', 'error');
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  };
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => {
        // Get first media image, or fallback to old images format
        const firstMedia = product.media?.[0];
        const imageUrl = firstMedia
          ? getMediaUrl(firstMedia)
          : product.images?.[0]?.url || product.image || '';

        const href = product.slug
          ? `/${product.slug}`
          : `/produto/${product.id}`;

        const price = typeof product.price === 'string'
          ? parseFloat(product.price)
          : product.price;

        return (
          <a
            key={product.id}
            href={href}
            className="group rounded-lg bg-surface shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="relative aspect-square overflow-hidden rounded-t-lg bg-bg">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  unoptimized
                />
              ) : (
                <div className="flex h-full items-center justify-center text-text-muted">
                  Sem imagem
                </div>
              )}
            </div>
            <div className="p-3">
              <h3 className="text-sm font-medium text-text line-clamp-2">
                {product.name}
              </h3>
              <p className="mt-1 text-lg font-bold text-primary-600">
                R$ {price.toFixed(2).replace('.', ',')}
              </p>
              <div className="mt-2 flex gap-1">
                <input
                  type="number"
                  defaultValue={1}
                  min={1}
                  max={99}
                  className="w-10 text-center text-xs border border-border rounded py-1 focus:outline-none focus:border-primary-500"
                  disabled={loadingIds.has(product.id)}
                  onClick={(e) => e.preventDefault()}
                  ref={(el) => {
                    if (el) (el as HTMLInputElement & { _qtyRef?: boolean })._qtyRef = true;
                  }}
                  data-qty-input
                />
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    const input = (e.currentTarget as HTMLElement).parentElement?.querySelector('[data-qty-input]') as HTMLInputElement;
                    const qty = Math.max(1, Math.min(99, parseInt(input?.value || '1') || 1));
                    handleAdd(Number(product.id), qty);
                  }}
                  disabled={loadingIds.has(product.id)}
                  className="flex-1 flex items-center justify-center rounded bg-primary-600 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-60"
                >
                  {loadingIds.has(product.id) ? (
                    <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Adicionar'
                  )}
                </button>
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
}
