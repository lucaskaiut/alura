'use client';

import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { addToCart } from '@/lib/cart';
import { useToast } from '@/components/ui/Toast';

export default function AddToCartButton({ productId }: { productId: number }) {
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const { show } = useToast();

  const handleAdd = async () => {
    setLoading(true);
    try {
      await addToCart(productId, qty);
      window.dispatchEvent(new Event('cart-updated'));
      show(`${qty}x adicionado ao carrinho!`, 'success');
      setQty(1);
    } catch (err) {
      show(err instanceof Error ? err.message : 'Erro ao adicionar', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 flex items-stretch gap-2">
      <div className="flex items-center border border-border rounded-lg">
        <button
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          className="px-3 py-2 text-text-muted hover:bg-bg transition-colors"
          disabled={loading}
        ><Minus size={14} /></button>
        <input
          type="number"
          value={qty}
          onChange={(e) => setQty(Math.max(1, Math.min(99, parseInt(e.target.value) || 1)))}
          className="w-14 text-center text-sm border-x border-border py-2 focus:outline-none"
          min={1} max={99}
          disabled={loading}
        />
        <button
          onClick={() => setQty((q) => Math.min(99, q + 1))}
          className="px-3 py-2 text-text-muted hover:bg-bg transition-colors"
          disabled={loading}
        ><Plus size={14} /></button>
      </div>
      <button
        onClick={handleAdd}
        disabled={loading}
        className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-6 py-3 font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-60"
      >
        {loading ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Adicionando...
          </>
        ) : (
          'Adicionar ao carrinho'
        )}
      </button>
    </div>
  );
}

