import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

const REVALIDATE_TOKEN = process.env.REVALIDATE_TOKEN || 'alura-revalidate-secret';

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-revalidate-token') || '';
  if (token !== REVALIDATE_TOKEN) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const path = body.path as string;

  if (!path || typeof path !== "string") {
    return NextResponse.json({ error: "path is required" }, { status: 400 });
  }

  revalidatePath(path);

  return NextResponse.json({ revalidated: true, path });
}
