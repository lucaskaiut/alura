'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { getCart, updateCartItem, removeCartItem, type Cart, type CartItem } from '@/lib/cart';
import { getMediaUrl } from '@/lib/api';

export default function CarrinhoPage() {
  const [cart, setCart] = useState<Cart>({ id: null, items: [], subtotal: '0', discount: '0', total: '0', coupon: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCart().then(setCart).finally(() => setLoading(false));
  }, []);

  const handleUpdate = async (item: CartItem, qty: number) => {
    if (qty < 1) return;
    const updated = await updateCartItem(item.id, qty);
    setCart(updated);
    window.dispatchEvent(new Event('cart-updated'));
  };

  const handleRemove = async (item: CartItem) => {
    const updated = await removeCartItem(item.id);
    setCart(updated);
    window.dispatchEvent(new Event('cart-updated'));
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-text">Carrinho</h1>
        <p className="mt-4 text-text-muted">Seu carrinho está vazio.</p>
        <Link href="/" className="mt-6 inline-block rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-700">
          Ver produtos
        </Link>
      </div>
    );
  }

  const total = parseFloat(cart.total);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-text mb-6">Carrinho</h1>

      <div className="space-y-4">
        {cart.items.map((item) => {
          const img = item.product?.media?.[0];
          const price = parseFloat(item.price_at_time);
          return (
            <div key={item.id} className="flex gap-4 rounded-lg border border-border bg-surface p-4">
              <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-bg">
                {img ? (
                  <Image src={getMediaUrl(img)} alt={item.product?.name || ''} fill className="object-cover" sizes="96px" unoptimized />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-text-muted">Sem imagem</div>
                )}
              </div>
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <Link href={`/${item.product?.slug}`} className="text-sm font-medium text-text hover:text-primary-600 line-clamp-1">
                    {item.product?.name}
                  </Link>
                  <p className="text-sm font-semibold text-primary-600 mt-1">R$ {price.toFixed(2).replace('.', ',')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleUpdate(item, item.quantity - 1)} className="rounded border p-1 text-text-muted hover:bg-bg"><Minus size={14} /></button>
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    <button onClick={() => handleUpdate(item, item.quantity + 1)} className="rounded border p-1 text-text-muted hover:bg-bg"><Plus size={14} /></button>
                  </div>
                  <p className="text-sm font-semibold text-text ml-auto">
                    R$ {(price * item.quantity).toFixed(2).replace('.', ',')}
                  </p>
                  <button onClick={() => handleRemove(item)} className="rounded p-1 text-text-muted hover:text-danger-500"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-lg border border-border bg-surface p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-muted">Subtotal ({cart.items.reduce((s, i) => s + i.quantity, 0)} itens)</span>
          <span className="text-lg font-bold text-text">R$ {total.toFixed(2).replace('.', ',')}</span>
        </div>
        <Link href="/checkout" className="mt-4 block w-full rounded-lg bg-primary-600 px-6 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-primary-700">
          Finalizar compra
        </Link>
      </div>
    </div>
  );
}
