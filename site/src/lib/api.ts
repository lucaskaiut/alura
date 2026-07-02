const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const MEDIA_BASE = process.env.NEXT_PUBLIC_MEDIA_URL || 'http://localhost:8080';

async function getTenantDomain(): Promise<string> {
  if (typeof window !== 'undefined') return window.location.hostname;

  try {
    const { headers } = await import('next/headers');
    const headersList = await headers();
    const host = headersList.get('host');
    if (host) {
      const domain = host.split(':')[0].toLowerCase();
      return domain.replace(/^www\./, '');
    }
  } catch {
    // headers() throws if called outside request context
  }
  return 'localhost';
}

export function getApiUrl(): string {
  return API_BASE;
}

export function getMediaUrl(media: { id: number | string; path: string } | null | undefined): string {
  if (!media?.path) return '';
  return `${MEDIA_BASE}/storage/${media.path}`;
}

export async function fetchTenant<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'X-Tenant-Domain': await getTenantDomain(),
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    next: { revalidate: 60 },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
