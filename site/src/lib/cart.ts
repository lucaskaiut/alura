import { getApiUrl } from './api';

const SESSION_KEY = 'njord_cart_session';

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = 'sess_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

// All API calls go through Next.js BFF (same domain, middleware adds auth cookie)
async function fetchCart<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Erro' }));
    throw new Error(err.message || 'Erro');
  }
  return res.json();
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
  };
}

export interface Cart {
  id: number | null;
  items: CartItem[];
  total: string;
}

export async function getCart(): Promise<Cart> {
  const sid = getSessionId();
  if (!sid) return { id: null, items: [], total: '0' };
  try {
    return await fetchCart<Cart>(`/api/cart?session_id=${sid}`);
  } catch {
    return { id: null, items: [], total: '0' };
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
