// src/api/fetcher.ts
import { BASE_URL } from './baseUrl';
import { getToken } from '../auth/token';

export type ApiResponse<T = any> = {
  code: number;
  data: T;
  message?: string;
};

export async function apiFetch<T = any>(
  path: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${BASE_URL}/api${path}`, {
    ...options,
    headers,
  });

  let body: any = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (!res.ok) {
    return {
      code: res.status,
      data: (body?.data ?? null) as T,
      message: body?.message ?? `HTTP ${res.status}`,
    };
  }

  if (body && typeof body === 'object' && 'code' in body && 'data' in body) {
    return body as ApiResponse<T>;
  }
  return { code: 200, data: body as T, message: 'OK' };
}
