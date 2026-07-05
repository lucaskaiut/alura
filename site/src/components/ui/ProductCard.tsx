'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getMediaUrl } from '@/lib/api';
import { addToCart } from '@/lib/cart';

interface MediaItem {
  id: number;
  path: string;
  mime_type?: string;
}

interface VariantValue {
  id: number;
  value: string;
  attribute?: { id: number; name: string };
}

interface VariantSummary {
  id: number;
  price?: string;
  attribute_values?: VariantValue[];
}

interface ProductCardProps {
  id: number;
  name: string;
  slug?: string;
  price: number;
  is_variable?: boolean;
  variants?: VariantSummary[];
  media?: MediaItem[];
  image?: string;
}

export default function ProductCard({ id, name, slug, price, is_variable, variants, media, image }: ProductCardProps) {
  const [loading, setLoading] = useState(false);
  const [qty, setQty] = useState(1);

  const firstMedia = media?.[0];
  const imageUrl = firstMedia ? getMediaUrl(firstMedia) : image || '';
  const href = slug ? `/${slug}` : `/produto/${id}`;

  // Compute display price for variable products
  let displayPrice: string;
  if (is_variable && variants?.length) {
    const prices = variants
      .map((v) => (v.price ? parseFloat(v.price) : null))
      .filter((p): p is number => p != null && !isNaN(p));
    if (prices.length === 0) {
      displayPrice = '—';
    } else if (prices.length === 1 || Math.min(...prices) === Math.max(...prices)) {
      displayPrice = `R$ ${Math.min(...prices).toFixed(2).replace('.', ',')}`;
    } else {
      displayPrice = `R$ ${Math.min(...prices).toFixed(2).replace('.', ',')} ~ R$ ${Math.max(...prices).toFixed(2).replace('.', ',')}`;
    }
  } else {
    const num = typeof price === 'number' ? price : parseFloat(String(price));
    displayPrice = num && !isNaN(num)
      ? `R$ ${num.toFixed(2).replace('.', ',')}`
      : '—';
  }

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    // Variable products must be configured on the detail page
    if (is_variable) return;
    setLoading(true);
    try {
      await addToCart(id, qty);
      window.dispatchEvent(new Event('cart-updated'));
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  return (
    <Link
      href={href}
      className="group rounded-lg bg-surface shadow-sm transition-shadow hover:shadow-md block"
    >
      <div className="relative aspect-square overflow-hidden rounded-t-lg bg-bg">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-text-muted text-xs">
            Sem imagem
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-sm font-medium text-text line-clamp-2">{name}</h3>
        <p className="mt-1 text-lg font-bold text-primary-600">
          {displayPrice}
        </p>
        <div className="mt-2 flex gap-1">
          {is_variable ? (
            <span className="flex-1 text-center py-1 px-2 text-xs text-text-muted border border-border rounded">
              Ver opções
            </span>
          ) : (
            <>
              <input
                type="number"
                value={qty}
                min={1}
                max={99}
                onChange={e => setQty(Math.max(1, Math.min(99, Number(e.target.value) || 1)))}
                onClick={e => e.preventDefault()}
                className="w-10 text-center text-xs border border-border rounded py-1 focus:outline-none focus:border-primary-500"
              />
              <button
                onClick={handleAdd}
                disabled={loading}
                className="flex-1 flex items-center justify-center rounded bg-primary-600 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-60"
              >
                {loading ? (
                  <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Adicionar'
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
