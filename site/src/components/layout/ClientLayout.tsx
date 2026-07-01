'use client';

import { ToastProvider } from '@/components/ui/Toast';
import CartDrawerWrapper from '@/components/cart/CartDrawerWrapper';
import SearchBar from '@/components/ui/SearchBar';
import StoreNav from '@/components/layout/StoreNav';
import Link from 'next/link';
import { type ReactNode } from 'react';

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <header className="sticky top-0 z-40 border-b bg-surface">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
          <Link href="/" className="text-xl font-bold text-primary-700">Alura</Link>
          <div className="flex flex-1 items-center gap-2">
            <SearchBar />
            <StoreNav />
          </div>
          <CartDrawerWrapper />
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            <div><h3 className="text-sm font-semibold text-text">Loja</h3><ul className="mt-3 space-y-2"><li><Link href="/" className="text-sm text-text-muted hover:text-primary-600">Produtos</Link></li><li><Link href="/busca" className="text-sm text-text-muted hover:text-primary-600">Buscar</Link></li></ul></div>
            <div><h3 className="text-sm font-semibold text-text">Atendimento</h3><ul className="mt-3 space-y-2"><li><Link href="/" className="text-sm text-text-muted hover:text-primary-600">Contato</Link></li><li><Link href="/" className="text-sm text-text-muted hover:text-primary-600">Trocas e devoluções</Link></li></ul></div>
            <div><h3 className="text-sm font-semibold text-text">Institucional</h3><ul className="mt-3 space-y-2"><li><Link href="/" className="text-sm text-text-muted hover:text-primary-600">Sobre nós</Link></li><li><Link href="/" className="text-sm text-text-muted hover:text-primary-600">Política de privacidade</Link></li></ul></div>
            <div><h3 className="text-sm font-semibold text-text">Alura</h3><p className="mt-3 text-sm text-text-muted">Plataforma de e-commerce open source.</p></div>
          </div>
          <div className="mt-8 border-t pt-4 text-center text-xs text-text-muted">&copy; {new Date().getFullYear()} Alura. Todos os direitos reservados.</div>
        </div>
      </footer>
    </ToastProvider>
  );
}
