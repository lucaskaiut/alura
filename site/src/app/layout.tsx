import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { headers } from 'next/headers';
import ClientLayout from '@/components/layout/ClientLayout';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'Alura Store',
  description: 'Powered by Alura',
};

interface MenuItem {
  id: number;
  title: string;
  slug: string;
  open_new_tab: boolean;
  children: MenuItem[];
}

interface DesignColors {
  primary: string;
  bg_main: string;
  bg_secondary: string;
  text_main: string;
  text_secondary: string;
  border: string;
  success: string;
  warning: string;
  danger: string;
}

function colorsToCss(colors: DesignColors): string {
  const p = colors.primary;
  return [
    `--color-primary-50: color-mix(in oklab, ${p} 5%, white) !important;`,
    `--color-primary-100: color-mix(in oklab, ${p} 15%, white) !important;`,
    `--color-primary-200: color-mix(in oklab, ${p} 30%, white) !important;`,
    `--color-primary-300: color-mix(in oklab, ${p} 50%, white) !important;`,
    `--color-primary-400: color-mix(in oklab, ${p} 75%, white) !important;`,
    `--color-primary-500: ${p} !important;`,
    `--color-primary-600: color-mix(in oklab, ${p} 80%, black) !important;`,
    `--color-primary-700: color-mix(in oklab, ${p} 60%, black) !important;`,
    `--color-primary-800: color-mix(in oklab, ${p} 40%, black) !important;`,
    `--color-primary-900: color-mix(in oklab, ${p} 25%, black) !important;`,
    `--color-primary-950: color-mix(in oklab, ${p} 12%, black) !important;`,
    `--color-surface: ${colors.bg_main} !important;`,
    `--color-bg: ${colors.bg_secondary} !important;`,
    `--color-border: ${colors.border} !important;`,
    `--color-text: ${colors.text_main} !important;`,
    `--color-text-muted: ${colors.text_secondary} !important;`,
    `--color-danger-500: ${colors.danger} !important;`,
    `--color-success-500: ${colors.success} !important;`,
    `--color-warning-500: ${colors.warning} !important;`,
  ].join('\n');
}

async function fetchStoreSettings(): Promise<{ menu: MenuItem[]; design: DesignColors | null }> {
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    const hdrs = await headers();
    const host = hdrs.get('host') || 'localhost';
    const domain = host.split(':')[0].toLowerCase().replace(/^www\./, '');

    const res = await fetch(`${apiBase}/store/settings`, {
      headers: { 'X-Tenant-Domain': domain },
      cache: 'no-store',
    });
    if (!res.ok) return { menu: [], design: null };
    const data = await res.json();
    return {
      menu: data.menu ?? [],
      design: data.design?.colors ?? null,
    };
  } catch {
    return { menu: [], design: null };
  }
}

const defaultColors: DesignColors = {
  primary: '#ffa6de',
  bg_main: '#ffffff',
  bg_secondary: '#f8fafc',
  text_main: '#111827',
  text_secondary: '#6b7280',
  border: '#e5e7eb',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { menu, design } = await fetchStoreSettings();
  const colors = design || defaultColors;

  return (
    <html lang="pt-BR" className={`${inter.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-bg font-sans text-text antialiased">
        <style
          id="design-tokens"
          dangerouslySetInnerHTML={{ __html: `:root { ${colorsToCss(colors)} }` }}
        />
        <ClientLayout serverMenu={menu}>{children}</ClientLayout>
      </body>
    </html>
  );
}
