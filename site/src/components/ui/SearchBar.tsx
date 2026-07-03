'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search } from 'lucide-react';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const res = await fetch(`/api/store/products/suggestions?q=${encodeURIComponent(q)}`, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data || []);
        setShowSuggestions((data || []).length > 0);
      }
    } catch {
      setSuggestions([]);
    }
  }, []);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      fetchSuggestions(query);
    }, 300);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [query, fetchSuggestions]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setShowSuggestions(false);
      const q = query.trim();
      if (q) {
        window.location.href = `/busca?search=${encodeURIComponent(q)}`;
      }
    }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setShowSuggestions(false);
    setQuery(suggestion);
    window.location.href = `/busca?search=${encodeURIComponent(suggestion)}`;
  };

  return (
    <div ref={wrapperRef} className="relative flex flex-1 max-w-md">
      <input
        type="text"
        placeholder="Buscar produtos..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
        onKeyDown={handleKeyDown}
        className="w-full rounded-lg border bg-bg py-2 pl-10 pr-3 text-sm text-text placeholder:text-text-muted focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
      />
      <Search
        size={18}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
      />
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border bg-surface shadow-lg overflow-hidden">
          <ul className="py-1">
            {suggestions.map((s, i) => (
              <li key={i}>
                <button
                  onClick={() => handleSelectSuggestion(s)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text hover:bg-bg transition-colors text-left"
                >
                  <Search size={14} className="shrink-0 text-text-muted" />
                  <span className="truncate">{s}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
