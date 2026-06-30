'use client';

import { useEffect, useState } from 'react';
import { getCart } from './cart';

export default function useCartCount(refresh: boolean) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    getCart().then((cart) => {
      setCount(cart.items.reduce((sum, item) => sum + item.quantity, 0));
    });
  }, [refresh]);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'njord_cart') {
        const cart = JSON.parse(e.newValue || '{"items":[]}');
        setCount(cart.items.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0));
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return count;
}
