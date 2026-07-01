import { NextRequest, NextResponse } from 'next/server';

const LARAVEL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

function getTenantDomain(req: NextRequest): string {
  let host = (req.headers.get('host') || '').split(':')[0].toLowerCase();
  if (host.startsWith('www.')) host = host.slice(4);
  return host;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith('/api/cart') && !pathname.startsWith('/api/store') && !pathname.startsWith('/api/media') && !pathname.startsWith('/api/search') && !pathname.startsWith('/api/router') && !pathname.startsWith('/api/checkout')) {
    return NextResponse.next();
  }

  const token = req.cookies.get('alura_token')?.value;
  const tenantDomain = getTenantDomain(req);
  const body = req.body ? await req.text() : undefined;

  const headers: Record<string, string> = {
    'Content-Type': req.headers.get('content-type') || 'application/json',
    'X-Tenant-Domain': tenantDomain,
    Accept: 'application/json',
  };

  if (token) headers['Authorization'] = `Bearer ${token}`;

  const laravelRes = await fetch(`${LARAVEL}${pathname}${req.nextUrl.search}`, {
    method: req.method,
    headers,
    body,
  });

  const data = await laravelRes.text();

  return new NextResponse(data, {
    status: laravelRes.status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const config = {
  matcher: ['/api/:path*'],
};
