import { BASE_URL } from './baseUrl';
import { getToken } from '../auth/token';

type Json = Record<string, any> | any[] | null;

export function buildURL(path: string, params?: Record<string, any> | null) {
  const p = path.startsWith('/') ? path : `/${path}`;
  const base = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
  if (!params) return `${base}${p}`;
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) qs.append(k, String(v));
  });
  const q = qs.toString();
  return `${base}${p}${q ? `?${q}` : ''}`;
}

export async function authFetch(
  path: string,
  init?: RequestInit & { params?: Record<string, any> | null; tag?: string }
) {
  const token = await getToken();
  const { params, headers, tag, ...rest } = init ?? {};
  const url = buildURL(path, params);

  const h: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(headers as any),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  try {
    const res = await fetch(url, { ...rest, headers: h });
    const raw = await res.text().catch(() => '');

    let json: Json = null;
    try { json = raw ? JSON.parse(raw) : null; } catch { json = null; }

    if (!res.ok) {
      const msg =
        (json && (json as any).message) ||
        raw ||
        `HTTP ${res.status} ${res.statusText}`;
      const err: any = new Error(msg);
      err.status = res.status;
      err.body = json ?? raw;
      err.url = url;
      err.tag = tag;
      throw err;
    }

    return (json && (json as any).data != null) ? (json as any).data : json;
  } catch (e: any) {
    throw e;
  }
}
