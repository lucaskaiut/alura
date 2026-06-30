import { fetchTenant } from './api';

export interface RouteMatch {
  type: 'product' | 'category' | 'page' | 'home' | 'not_found';
  data: unknown;
  seo?: { meta_title?: string; meta_description?: string };
  status: number;
}

export async function resolveRoute(path: string): Promise<RouteMatch> {
  try {
    const result = await fetchTenant<RouteMatch>(
      `/api/router/resolve?path=${encodeURIComponent(path)}`
    );
    return result;
  } catch {
    return { type: 'not_found', data: null, status: 404 };
  }
}
