'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Minus, Plus, Trash2, Ticket } from 'lucide-react';
import { getCart, removeCartItem, updateCartItem, applyCoupon, removeCoupon, type Cart, type CartItem } from '@/lib/cart';
import { getMediaUrl } from '@/lib/api';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function CartDrawer({ open, onClose }: CartDrawerProps) {
  const [cart, setCart] = useState<Cart>({ id: null, items: [], subtotal: '0', discount: '0', total: '0', coupon: null });
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    const c = await getCart();
    setCart(c);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);

  const handleUpdate = async (item: CartItem, qty: number) => {
    if (qty < 1) return;
    const updated = await updateCartItem(item.id, qty);
    setCart(updated);
  };

  const handleRemove = async (item: CartItem) => {
    const updated = await removeCartItem(item.id);
    setCart(updated);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const res = await applyCoupon(couponCode.trim());
      if (res.message) {
        setCouponError(res.message);
      } else {
        refresh();
        setCouponCode('');
      }
    } catch {
      setCouponError('Erro ao aplicar cupom.');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = async () => {
    await removeCoupon();
    refresh();
  };

  const count = cart.items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = parseFloat(cart.subtotal);
  const discount = parseFloat(cart.discount);
  const total = parseFloat(cart.total);

  return (
    <>
      {open && <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />}
      <div className={`fixed right-0 top-0 z-50 h-full w-full max-w-md bg-surface shadow-xl transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b px-4 py-4">
            <h2 className="text-lg font-semibold text-text">Carrinho{count > 0 ? ` (${count})` : ''}</h2>
            <button onClick={onClose} className="rounded p-1 text-text-muted hover:bg-bg hover:text-text"><X size={20} /></button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            {loading ? (
              <div className="flex items-center justify-center py-12"><div className="w-6 h-6 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" /></div>
            ) : cart.items.length === 0 ? (
              <p className="py-8 text-center text-text-muted">Seu carrinho está vazio.</p>
            ) : (
              <ul className="space-y-4">
                {cart.items.map((item) => {
                  const img = item.variant?.media?.[0] || item.product?.media?.[0];
                  const price = parseFloat(item.price_at_time);
                  return (
                    <li key={item.id} className="flex gap-3">
                      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-bg">
                        {img ? (
                          <Image src={getMediaUrl(img)} alt={item.product?.name || ''} fill className="object-cover" sizes="80px" unoptimized />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-text-muted">Sem imagem</div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col justify-between">
                        <div>
                          <p className="text-sm font-medium text-text line-clamp-1">{item.product?.name}</p>
                          {item.variant && (
                            <p className="text-xs text-text-muted">
                              {item.variant.label || item.variant.sku || `SKU: ${item.variant.sku}`}
                            </p>
                          )}
                          <p className="text-sm font-semibold text-primary-600">R$ {price.toFixed(2).replace('.', ',')}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleUpdate(item, item.quantity - 1)} className="rounded border p-0.5 text-text-muted hover:bg-bg"><Minus size={14} /></button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <button onClick={() => handleUpdate(item, item.quantity + 1)} className="rounded border p-0.5 text-text-muted hover:bg-bg"><Plus size={14} /></button>
                          <button onClick={() => handleRemove(item)} className="ml-auto rounded p-1 text-text-muted hover:text-danger-500"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {/* Coupon section */}
            {cart.items.length > 0 && !cart.coupon && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                    placeholder="Código do cupom"
                    className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {couponLoading ? '...' : 'Aplicar'}
                  </button>
                </div>
                {couponError && <p className="mt-1 text-xs text-danger-500">{couponError}</p>}
              </div>
            )}

            {cart.coupon && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Ticket size={16} className="text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-700">{cart.coupon.code}</p>
                      <p className="text-xs text-green-600">-R$ {cart.coupon.discount.toFixed(2).replace('.', ',')}</p>
                    </div>
                  </div>
                  <button onClick={handleRemoveCoupon} className="text-green-500 hover:text-danger-500"><X size={16} /></button>
                </div>
              </div>
            )}
          </div>

          {cart.items.length > 0 && (
            <div className="border-t px-4 py-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">Subtotal</span>
                <span className="font-medium text-text">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
              </div>
              {discount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-600">Desconto</span>
                  <span className="font-medium text-green-600">-R$ {discount.toFixed(2).replace('.', ',')}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">Total</span>
                <span className="font-semibold text-text">R$ {total.toFixed(2).replace('.', ',')}</span>
              </div>
              <Link href="/checkout" onClick={onClose} className="block w-full rounded-lg bg-primary-600 px-6 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-primary-700">
                Finalizar compra
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
