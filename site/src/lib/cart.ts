import { getApiUrl } from './api';
import { apiFetch } from './client-fetch';

const SESSION_KEY = 'alura_cart_session';

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = 'sess_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

async function fetchCart<T>(path: string, options?: RequestInit): Promise<T> {
  return apiFetch<T>(path, options);
}

export interface CartItem {
  id: number;
  product_id: number;
  variant_id: number | null;
  quantity: number;
  price_at_time: string;
  product: {
    id: number;
    name: string;
    slug: string;
    price: string;
    status: boolean;
    media?: { id: number; path: string }[];
  };
  variant?: {
    id: number;
    sku: string;
    price: string;
    label?: string;
    media?: { id: number; path: string }[];
  };
}

export interface CartCoupon {
  id: number;
  code: string;
  type: string;
  discount: number;
}

export interface Cart {
  id: number | null;
  items: CartItem[];
  subtotal: string;
  discount: string;
  total: string;
  coupon: CartCoupon | null;
}

export async function getCart(): Promise<Cart> {
  const sid = getSessionId();
  if (!sid) return { id: null, items: [], subtotal: '0', discount: '0', total: '0', coupon: null };
  try {
    return await fetchCart<Cart>(`/api/cart?session_id=${sid}`);
  } catch {
    return { id: null, items: [], subtotal: '0', discount: '0', total: '0', coupon: null };
  }
}

export async function addToCart(productId: number, quantity = 1, variantId?: number): Promise<Cart> {
  const body: Record<string, unknown> = { product_id: productId, quantity };
  if (variantId) body.variant_id = variantId;

  return fetchCart<Cart>(`/api/cart/items?session_id=${getSessionId()}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateCartItem(itemId: number, quantity: number): Promise<Cart> {
  return fetchCart<Cart>(`/api/cart/items/${itemId}?session_id=${getSessionId()}`, {
    method: 'PUT',
    body: JSON.stringify({ quantity }),
  });
}

export async function removeCartItem(itemId: number): Promise<Cart> {
  return fetchCart<Cart>(`/api/cart/items/${itemId}?session_id=${getSessionId()}`, {
    method: 'DELETE',
  });
}

export async function clearCart(): Promise<void> {
  await fetchCart(`/api/cart?session_id=${getSessionId()}`, { method: 'DELETE' });
}

export async function applyCoupon(code: string): Promise<{ message?: string; coupon?: CartCoupon; discount?: number; subtotal?: string; total?: string }> {
  return fetchCart(`/api/cart/coupon?session_id=${getSessionId()}`, {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

export async function removeCoupon(): Promise<{ removed: boolean }> {
  return fetchCart(`/api/cart/coupon?session_id=${getSessionId()}`, {
    method: 'DELETE',
  });
}
