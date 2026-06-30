'use client';

import { Search } from 'lucide-react';

export default function SearchBar() {
  return (
    <div className="relative flex flex-1 max-w-md">
      <input
        type="text"
        placeholder="Buscar produtos..."
        className="w-full rounded-lg border bg-bg py-2 pl-10 pr-3 text-sm text-text placeholder:text-text-muted focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            const q = (e.target as HTMLInputElement).value;
            if (q.trim()) {
              window.location.href = `/busca?q=${encodeURIComponent(q.trim())}`;
            }
          }
        }}
      />
      <Search
        size={18}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
      />
    </div>
  );
}
