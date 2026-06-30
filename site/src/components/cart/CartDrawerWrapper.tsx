'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import CartDrawer from './CartDrawer';
import { getCart } from '@/lib/cart';

export default function CartDrawerWrapper() {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Initial load
    getCart().then((c) => setCount(c.items.reduce((s, i) => s + i.quantity, 0)));
    // Poll every 30s
    const iv = setInterval(() => {
      getCart().then((c) => setCount(c.items.reduce((s, i) => s + i.quantity, 0)));
    }, 30000);
    return () => clearInterval(iv);
  }, []);

  // Listen for custom cart-updated events
  useEffect(() => {
    const handler = () => {
      getCart().then((c) => setCount(c.items.reduce((s, i) => s + i.quantity, 0)));
    };
    window.addEventListener('cart-updated', handler);
    return () => window.removeEventListener('cart-updated', handler);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative rounded-lg p-2 text-text-muted hover:bg-bg hover:text-text"
        aria-label="Abrir carrinho"
      >
        <ShoppingCart size={22} />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>
      <CartDrawer open={open} onClose={() => { setOpen(false); getCart().then((c) => setCount(c.items.reduce((s, i) => s + i.quantity, 0))); }} />
    </>
  );
}
