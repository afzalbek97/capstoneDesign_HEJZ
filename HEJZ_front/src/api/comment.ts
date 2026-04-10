// src/api/comments.ts
import { BASE_URL } from './baseUrl';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ====== DTO ======
export interface CommentDto {
  id: number;
  comment: string;
  createdAt: string;
  userId: number;
  username: string;
  likeCount: number;
}

export interface CommentCreateRequest {
  feedId: number;
  comment: string;
}

export interface CommentRequest {
  feedId: number;
}

export interface CommentDeleteRequest {
  commentId: number;
}

async function getAuthToken(): Promise<string | null> {
  const keys = ['auth.token', 'token', 'accessToken', 'jwt'];
  const pairs = await AsyncStorage.multiGet(keys);
  for (const [, val] of pairs) if (val) return val;
  return null;
}

type ApiEnvelope<T> = { code?: number; status?: number; statusCode?: number; message?: string; data?: T } | T;

function unwrapApi<T>(json: ApiEnvelope<T>): T {
  const code = (json as any)?.code ?? (json as any)?.status ?? (json as any)?.statusCode;
  if (typeof code === 'number' && code !== 200) {
    const msg = (json as any)?.message ?? '요청 실패';
    throw new Error(msg);
  }
  return ((json as any)?.data ?? json) as T;
}

async function http<T>(path: string, init: RequestInit & { auth?: boolean } = {}): Promise<T> {
  const token = init.auth ? await getAuthToken() : null;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': init.body ? 'application/json' : 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  });

  if (res.status === 204) return undefined as unknown as T;

  let json: any = {};
  try {
    json = await res.json();
  } catch {
  }

  if (!res.ok) {
    const msg = json?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return unwrapApi<T>(json);
}

// ====== API ======

// POST /api/comments/create
export async function createComment(feedId: number, comment: string): Promise<CommentDto> {
  return http<CommentDto>('/api/comments/create', {
    method: 'POST',
    auth: true,
    body: JSON.stringify({ feedId, comment } as CommentCreateRequest),
  });
}

export async function getCommentsByFeed(feedId: number): Promise<CommentDto[]> {
  return http<CommentDto[]>('/api/comments/getcomments', {
    method: 'POST',
    auth: true,
    body: JSON.stringify({ feedId } as CommentRequest),
  });
}

export async function getMyComments(): Promise<CommentDto[]> {
  return http<CommentDto[]>('/api/comments/getmycomments', {
    method: 'GET',
    auth: true,
  });
}

// DELETE /api/comments/delete  (body: { commentId })
export async function deleteComment(commentId: number): Promise<void> {
  await http<void>('/api/comments/delete', {
    method: 'DELETE',
    auth: true,
    body: JSON.stringify({ commentId } as CommentDeleteRequest),
  });
}
