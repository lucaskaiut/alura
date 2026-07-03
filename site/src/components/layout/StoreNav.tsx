"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { apiFetch } from "@/lib/client-fetch";

interface MenuItem {
  id: number;
  title: string;
  slug: string;
  open_new_tab: boolean;
  children: MenuItem[];
}

export default function StoreNav() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [openId, setOpenId] = useState<number | null>(null);

  useEffect(() => {
    apiFetch<{ menu: MenuItem[] }>("/api/store/settings")
      .then((d) => setMenu(d.menu ?? []))
      .catch(() => {});
  }, []);

  if (!menu.length) return null;

  return (
    <nav className="hidden md:flex items-center gap-0">
      {menu.map((item) => (
        <div key={item.id} className="relative group">
          <Link
            href={item.slug}
            target={item.open_new_tab ? "_blank" : undefined}
            className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              openId === item.id ? "bg-bg text-primary-600" : "text-text-muted hover:text-text hover:bg-bg"
            }`}
            onClick={() => item.children.length > 0 && setOpenId(openId === item.id ? null : item.id)}
          >
            {item.title}
            {item.children.length > 0 && <ChevronDown size={14} className={`transition-transform ${openId === item.id ? "rotate-180" : ""}`} />}
          </Link>
          {item.children.length > 0 && openId === item.id && (
            <div className="absolute left-0 top-full mt-1 bg-surface border border-border rounded-lg shadow-lg p-1 min-w-[180px] z-50">
              {item.children.map((child) => (
                <Link
                  key={child.id}
                  href={child.slug}
                  target={child.open_new_tab ? "_blank" : undefined}
                  className="block px-3 py-2 text-sm text-text-muted hover:text-text hover:bg-bg rounded-md transition-colors"
                  onClick={() => setOpenId(null)}
                >
                  {child.title}
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  );
}
