function getTenantDomain(): string {
  if (typeof window !== 'undefined') return window.location.hostname;
  return 'localhost';
}

export async function apiFetch<T = unknown>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Tenant-Domain': getTenantDomain(),
    ...(options?.headers as Record<string, string> || {}),
  };

  const res = await fetch(path, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Erro' }));
    throw new Error(err.message || `API error: ${res.status}`);
  }

  return res.json();
}
