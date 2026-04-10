// src/api/user.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './baseUrl';
import { getToken } from '../auth/token';

export type UserProfile = {
  id?: number;
  username: string;
  nickname: string;
  email?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  followers?: number;
  following?: number;
};
export type PublicUser = {
  id: number;
  username: string;
  nickname?: string;
  bio?: string | null;
  avatarUrl?: string | null;
  profileImageUrl?: string | null;
  followers?: number;
  following?: number;
};
export const SK = {
  username: 'user.username',
  nickname: 'user.nickname',
  bio: 'user.bio',
  avatarUrl: 'user.avatarUrl',
  followers: 'user.followers',
  following: 'user.following',
  token: 'auth.token',
} as const;

const ME_PATH = '/api/user/myinfo';
const PUBLIC_INFO_PATH = '/api/user/info';

/** JWT에서 sub 클레임 추출 (실패해도 조용히 무시) */
function decodeJwtSub(token: string | null | undefined): string | null {
  if (!token) return null;
  try {
    const [, payloadB64] = token.split('.');
    const json = JSON.parse(Buffer.from(payloadB64, 'base64').toString('utf8'));
    return typeof json?.sub === 'string' ? json.sub : null;
  } catch {
    return null;
  }
}

/** 백엔드 payload → 공통 UserProfile 매핑 */
function mapToUserProfile(payload: any): UserProfile {
  return {
    id: payload?.id ?? payload?.userId ?? undefined,
    username: payload?.username ?? payload?.userName ?? '',
    nickname: payload?.nickname ?? payload?.nickName ?? '',
    email: payload?.email ?? null,
    bio: payload?.bio ?? payload?.intro ?? '',
    avatarUrl:
      payload?.profileImageUrl ?? payload?.avatarUrl ?? payload?.profileUrl ?? null,
    followers: payload?.followers ?? payload?.fans ?? 0,
    following: payload?.following ?? payload?.follows ?? 0,
  };
}

/** ApiResponse 형태도 함께 처리해서 payload 꺼내기 */
function extractPayloadAndMaybeThrow(raw: string, status: number) {
  const defaultMsg = `HTTP ${status}`;
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && ('code' in parsed || 'data' in parsed)) {
      const code = typeof parsed.code === 'number' ? parsed.code : status;
      if (code !== 200) {
        const msg = parsed.msg || parsed.message || defaultMsg;
        throw new Error(msg);
      }
      return parsed.data ?? {};
    }
    return parsed;
  } catch (e) {
    if (status < 200 || status >= 300) {
      throw new Error(raw || defaultMsg);
    }
    return {};
  }
}

/** 내 프로필 가져오기 (GET /api/user/myinfo) */
export async function fetchMyProfile(): Promise<UserProfile> {
  const token = await getToken();
  const url = `${BASE_URL}${ME_PATH}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const raw = await res.text().catch(() => '');
  if (!res.ok) {
    try {
      const j = raw ? JSON.parse(raw) : null;
      throw new Error(j?.msg || j?.message || `HTTP ${res.status}`);
    } catch {
      throw new Error(raw || `HTTP ${res.status}`);
    }
  }

  const payload = extractPayloadAndMaybeThrow(raw, res.status);

  const profile: UserProfile = mapToUserProfile(payload);

  if (!profile.username && token) {
    const sub = decodeJwtSub(token);
    if (sub) profile.username = sub;
  }

  if (!profile.username && !profile.nickname) {
    throw new Error('myinfo 응답에 username/nickname이 없습니다.');
  }

  return profile;
}

export async function fetchUserInfoById(userId: number): Promise<PublicUser> {

  const keys = ['auth.token', 'token', 'accessToken', 'jwt'];
  const pairs = await AsyncStorage.multiGet(keys);
  const token = pairs.find(([, v]) => !!v)?.[1] ?? null;

  const res = await fetch(`${BASE_URL}/api/user/info`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ userId }),
  });

  let json: any = {};
  try {
    json = await res.json();
  } catch (e) {
  }

  const code = json?.code ?? json?.status ?? json?.statusCode ?? res.status;
  if (code !== 200) {
    const msg = json?.message ?? json?.msg ?? `HTTP ${res.status}`;
    throw new Error(msg);
  }

  const userData = (json?.data ?? json) as PublicUser;
  return userData;
}

export async function fetchUserPublicByUsername(username: string, userId?: number): Promise<PublicUser> {

  const keys = ['auth.token', 'token', 'accessToken', 'jwt'];
  const pairs = await AsyncStorage.multiGet(keys);
  const token = pairs.find(([, v]) => !!v)?.[1] ?? null;

  const res = await fetch(`${BASE_URL}/api/user/info`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      userId: userId,
      ...(userId ? {} : { username })
    }),
  });

  let json: any = {};
  try {
    json = await res.json();
  } catch (e) {
  }

  const code = json?.code ?? json?.status ?? json?.statusCode ?? res.status;
  if (code !== 200) {
    const msg = json?.message ?? json?.msg ?? `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return (json?.data ?? json) as PublicUser;
}


