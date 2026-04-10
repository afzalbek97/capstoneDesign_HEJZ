// src/screens/SearchScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SectionList,
  Image,
  Keyboard,
  Dimensions,
} from 'react-native';
import { BASE_URL } from '../../api/baseUrl';
import { searchAll } from '../../api/search';
import { getFollowings, getFollowers } from '../../api/follow';
import { fetchUserPublicByUsername, fetchUserInfoById } from '../../api/user';

const { width } = Dimensions.get('window');

const SCOPES = ['ALL', 'FOLLOWING'] as const;
type Scope = typeof SCOPES[number];

function absUrl(u?: string | null) {
  if (!u) return null;
  return /^https?:\/\//i.test(u) ? u : `${BASE_URL}${u}`;
}

function resolveUsernameFromItem(it: any, idMap: Map<number, string>): string | undefined {
  if (typeof it?.username === 'string' && it.username) return it.username;
  if (typeof it?.authorUsername === 'string' && it.authorUsername) return it.authorUsername;
  if (typeof it?.user?.username === 'string' && it.user.username) return it.user.username;

  const uid =
    typeof it?.userId === 'number' ? it.userId :
    typeof it?.authorId === 'number' ? it.authorId :
    typeof it?.user?.id === 'number' ? it.user.id :
    undefined;
  if (uid && idMap.has(uid)) return idMap.get(uid)!;

  return undefined;
}

import type { CommunityNavigationProp } from '../../navigation/types';

type Props = { navigation: CommunityNavigationProp };

export default function SearchScreen({ navigation }: Props) {
  const [q, setQ] = useState('');
  const [scope, setScope] = useState<Scope>('ALL');
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  const [idUsernameMap, setIdUsernameMap] = useState<Map<number, string>>(new Map());
  const [followingIds, setFollowingIds] = useState<Set<number | string>>(new Set());

  const inFlightRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    (async () => {
      try {
        const [followings, followers] = await Promise.all([
          getFollowings().catch(() => []),
          getFollowers().catch(() => []),
        ]);

        const idMap = new Map<number, string>();
        const followingSet = new Set<number | string>();

        const pushMap = (arr: any[]) => {
          for (const it of Array.isArray(arr) ? arr : []) {
            const id =
              typeof it?.userId === 'number' ? it.userId :
              typeof it?.id === 'number' ? it.id :
              undefined;
            const uname = typeof it?.username === 'string' ? it.username : undefined;
            if (id && uname && !idMap.has(id)) idMap.set(id, uname);
          }
        };

        for (const it of Array.isArray(followings) ? followings : []) {
          const id =
            typeof it?.userId === 'number' ? it.userId :
            typeof it?.id === 'number' ? it.id :
            undefined;
          const uname = typeof it?.username === 'string' ? it.username : undefined;
          if (id) followingSet.add(id);
          if (uname) followingSet.add(uname);
        }

        pushMap(followings);
        pushMap(followers);

        setIdUsernameMap(idMap);
        setFollowingIds(followingSet);
      } catch {
        setIdUsernameMap(new Map());
        setFollowingIds(new Set());
      }
    })();
  }, []);

  useEffect(() => {
    if (!q.trim()) {
      setData(null);
      setErr(null);
      return;
    }
    setLoading(true);
    setErr(null);

    const t = setTimeout(async () => {
      try {
        const d = await searchAll({ keyword: q.trim(), limit });

        if (Array.isArray(d) && d.length > 0) {
        }

        setData(d);
      } catch (e: unknown) {
        setErr(e?.message ?? '검색 실패');
        setData(null);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(t);
  }, [q, limit]);

  useEffect(() => {
    if (!Array.isArray(data) || data.length === 0) return;

    setIdUsernameMap(prev => {
      const next = new Map(prev);

      for (const it of data) {
        const uname = resolveUsernameFromItem(it, next);
        const uid =
          typeof it?.userId === 'number' ? it.userId :
          typeof it?.authorId === 'number' ? it.authorId :
          typeof it?.user?.id === 'number' ? it.user.id :
          undefined;

        if (uid && uname && !next.has(uid)) next.set(uid, uname);
      }

      const byUid = new Map<number, { uname?: string }>();
      for (const it of data) {
        const uid =
          typeof it?.userId === 'number' ? it.userId :
          typeof it?.authorId === 'number' ? it.authorId :
          typeof it?.user?.id === 'number' ? it.user.id :
          undefined;
        if (!uid) continue;

        const known = byUid.get(uid) ?? {};
        const uname =
          (typeof it?.username === 'string' && it.username) ||
          (typeof it?.authorUsername === 'string' && it.authorUsername) ||
          (typeof it?.user?.username === 'string' && it.user.username) ||
          (typeof it?.author?.username === 'string' && it.author.username) ||
          (typeof it?.owner?.username === 'string' && it.owner.username) ||
          (typeof it?.createdBy?.username === 'string' && it.createdBy.username) ||
          undefined;

        if (uname) known.uname = uname;
        byUid.set(uid, known);
      }
      for (const [uid, { uname }] of byUid) {
        if (uid && uname && !next.has(uid)) next.set(uid, uname);
      }

      return next;
    });
  }, [data]);

  useEffect(() => {

    if (!Array.isArray(data) || data.length === 0) {
      return;
    }

    const need: number[] = [];
    for (const it of data) {
      const uid =
        typeof it?.userId === 'number' ? it.userId :
        typeof it?.authorId === 'number' ? it.authorId :
        typeof it?.user?.id === 'number' ? it.user.id :
        undefined;

      if (!uid) continue;

      if (inFlightRef.current.has(uid)) {
        continue;
      }

      need.push(uid);
      inFlightRef.current.add(uid);
      if (need.length >= 20) break;
    }


    if (need.length === 0) {
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const results = await Promise.all(
          need.map(async (id) => {
            try {
              const user = await fetchUserInfoById(id);
              return { userId: id, user };
            } catch (err: any) {
              return { userId: id, user: null };
            }
          })
        );

        if (cancelled) {
          return;
        }


        setIdUsernameMap(prev => {
          const next = new Map(prev);

          let addedCount = 0;
          for (const { userId, user } of results) {
            if (user?.username && !next.has(userId)) {
              next.set(userId, user.username);
              addedCount++;
            }
          }

          return next;
        });
      } catch (error: unknown) {
      } finally {
        need.forEach(id => inFlightRef.current.delete(id));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [data]);

  const posts: any[] = useMemo(() => {
    const arr = Array.isArray(data) ? data : [];
    if (scope === 'ALL') return arr;

    return arr.filter((item) => {
      const uid =
        typeof item?.userId === 'number' ? item.userId :
        typeof item?.authorId === 'number' ? item.authorId :
        undefined;
      const uname = resolveUsernameFromItem(item, idUsernameMap);
      const hit =
        (typeof uid === 'number' && followingIds.has(uid)) ||
        (typeof uname === 'string' && followingIds.has(uname));
      return hit;
    });
  }, [data, scope, followingIds, idUsernameMap]);

  const sections = useMemo(
    () =>
      posts.length
        ? [{ title: scope === 'FOLLOWING' ? 'following posts' : 'posts', key: 'posts', data: posts }]
        : [],
    [posts, scope]
  );

  const renderItem={({ item }: { item: any }) => {
    const imgUrl = item?.images?.[0]?.url ?? item?.media?.[0]?.url ?? null;
    const thumb = imgUrl ? absUrl(imgUrl) ?? undefined : undefined;

    const images =
      item?.images ??
      (Array.isArray(item?.media)
        ? item.media.map((m: any) => ({ url: m?.url, ord: m?.ord, type: m?.type }))
        : []);

    const resolvedUsername = resolveUsernameFromItem(item, idUsernameMap);

    const showLine = resolvedUsername
      ? `@${resolvedUsername}`
      : '작성자 정보 없음';

    const goToAuthor = () => {
      const uid =
        typeof item?.userId === 'number' ? item.userId :
        typeof item?.authorId === 'number' ? item.authorId :
        typeof item?.user?.id === 'number' ? item.user.id :
        undefined;

      if (resolvedUsername && uid) {
        navigation.navigate('UserRoom', {
          username: resolvedUsername,
          userId: uid,
        });
      } else if (resolvedUsername) {
        navigation.navigate('FeedDetail', {
          feedId: item?.id,
          content: item?.content,
          images,
        });
      }
    };

    return (
      <TouchableOpacity
        style={s.cardRow}
        onPress={() =>
          navigation.navigate('FeedDetail', {
            feedId: item?.id,
            content: item?.content,
            images,
          })
        }
        activeOpacity={0.85}
      >
        {thumb ? (
          <Image source={{ uri: thumb }} style={s.thumb} />
        ) : (
          <View style={[s.thumb, s.thumbFallback]} />
        )}
        <View style={{ flex: 1 }}>
          <Text numberOfLines={2} style={s.titleTxt}>
            {item?.content ?? '(내용 없음)'}
          </Text>

          <Text style={s.subTxt}>{showLine}</Text>

          {resolvedUsername && (
            <TouchableOpacity onPress={goToAuthor} style={s.authorChip} activeOpacity={0.8}>
              <Text style={s.authorTxt}>{showLine}</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={s.screen}>
      <View style={s.searchBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={s.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={s.backTxt}>‹</Text>
        </TouchableOpacity>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="게시글 내용으로 검색"
          placeholderTextColor="#9CA3AF"
          style={s.input}
          returnKeyType="search"
          onSubmitEditing={() => Keyboard.dismiss()}
          autoFocus
        />
        <TouchableOpacity
          onPress={() => setQ('')}
          style={s.clearBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={s.clearTxt}>×</Text>
        </TouchableOpacity>
      </View>

      <View style={s.scopeRow}>
        {SCOPES.map((sc) => (
          <TouchableOpacity
            key={sc}
            style={[s.scopeBtn, scope === sc && s.scopeBtnOn]}
            onPress={() => setScope(sc)}
            activeOpacity={0.85}
          >
            <Text style={[s.scopeTxt, scope === sc && s.scopeTxtOn]}>
              {sc === 'ALL' ? 'ALL' : 'FOLLOWING'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? <ActivityIndicator style={{ marginTop: 16 }} /> : null}
      {err ? <Text style={s.errTxt}>{err}</Text> : null}

      <SectionList
        sections={sections}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderItem}
        renderSectionHeader={({ section }) => (
          <Text style={s.sectionHeader}>{section.title}</Text>
        )}
        ItemSeparatorComponent={() => <View style={s.sep} />}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          !loading && q.trim().length > 0 ? (
            <Text style={s.empty}>
              {scope === 'FOLLOWING' ? '팔로잉한 사용자의 게시글 중 결과가 없어요' : '검색 결과가 없어요'}
            </Text>
          ) : (
            <Text style={s.empty}>검색어를 입력해보세요</Text>
          )
        }
      />

      {sections.length > 0 && (
        <TouchableOpacity
          style={s.moreBtn}
          onPress={() => setLimit((prev) => prev + 20)}
          activeOpacity={0.9}
        >
          <Text style={s.moreTxt}>더 보기 +20</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: { paddingRight: 6, paddingVertical: 4 },
  backTxt: { fontSize: 26, color: '#111827' },
  input: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    color: '#111827',
  },
  clearBtn: { paddingLeft: 6, paddingVertical: 4 },
  clearTxt: { fontSize: 22, color: '#9CA3AF' },

  scopeRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  scopeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
  },
  scopeBtnOn: { backgroundColor: '#587dc4' },
  scopeTxt: { fontSize: 12, color: '#4B5563', fontWeight: '700' },
  scopeTxtOn: { color: '#fff' },

  sectionHeader: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 6,
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '700',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: '#E5E7EB', marginLeft: 14 },

  thumb: { width: 60, height: 60, borderRadius: 8, marginRight: 12, backgroundColor: '#E5E7EB' },
  thumbFallback: { backgroundColor: '#0F172A' },

  titleTxt: { fontSize: 14, color: '#111827', fontWeight: '700' },
  subTxt: { fontSize: 12, color: '#6B7280', marginTop: 2 },

  empty: { textAlign: 'center', paddingVertical: 24, color: '#9CA3AF' },
  errTxt: { textAlign: 'center', marginTop: 12, color: '#EF4444' },

  moreBtn: {
    position: 'absolute',
    bottom: 14,
    left: width * 0.5 - 60,
    width: 120,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#111827',
  },
  moreTxt: { color: '#fff', fontWeight: '800' },

  authorChip: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
  },
  authorTxt: { fontSize: 12, color: '#374151', fontWeight: '700' },
});
