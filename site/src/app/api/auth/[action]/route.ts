import { cookies, headers as nextHeaders } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const LARAVEL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function POST(req: NextRequest) {
  const path = req.nextUrl.pathname.replace('/api/auth', '/api/store');
  const body = req.body ? await req.text() : undefined;
  const cookieStore = await cookies();
  const token = cookieStore.get('njord_token')?.value;
  const headersList = await nextHeaders();
  const tenantDomain = (headersList.get('host') || '').split(':')[0];

  const requestHeaders: Record<string, string> = {
    'Content-Type': req.headers.get('content-type') || 'application/json',
    'X-Tenant-Domain': tenantDomain,
    Accept: 'application/json',
  };

  if (token) requestHeaders['Authorization'] = `Bearer ${token}`;

  const laravelRes = await fetch(`${LARAVEL}${path}`, {
    method: req.method,
    headers: requestHeaders,
    body,
  });

  const responseData = await laravelRes.json();

  if (responseData.token) {
    const res = NextResponse.json(responseData, { status: laravelRes.status });
    res.cookies.set('njord_token', responseData.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  }

  return NextResponse.json(responseData, { status: laravelRes.status });
}
