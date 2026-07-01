'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getMediaUrl } from '@/lib/api';
import { addToCart } from '@/lib/cart';

interface MediaItem {
  id: number;
  path: string;
  mime_type: string;
}

interface ProductCardProps {
  id: number;
  name: string;
  slug?: string;
  price: number;
  media?: MediaItem[];
  image?: string;
}

export default function ProductCard({ id, name, slug, price, media, image }: ProductCardProps) {
  const [loading, setLoading] = useState(false);
  const [qty, setQty] = useState(1);

  const firstMedia = media?.[0];
  const imageUrl = firstMedia ? getMediaUrl(firstMedia) : image || '';
  const href = slug ? `/${slug}` : `/produto/${id}`;
  const formattedPrice = typeof price === "number"
    ? price.toFixed(2).replace(".", ",")
    : String(price).replace(".", ",");

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
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
          R$ {formattedPrice}
        </p>
        <div className="mt-2 flex gap-1">
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
        </div>
      </div>
    </Link>
  );
}
