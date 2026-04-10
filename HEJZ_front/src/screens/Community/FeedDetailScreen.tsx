// screens/FeedDetailScreen.tsx
import React, { useCallback, useRef, useMemo, useState, useEffect } from 'react';
import {
  View, Text, Image, StyleSheet, Dimensions, TouchableOpacity, Alert, FlatList,
  SafeAreaView, ScrollView, TextInput, KeyboardAvoidingView, Platform, Modal
} from 'react-native';
import Video from 'react-native-video';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { deleteFeed, getFeed } from '../../api/feed';
import { likeFeed, isLiked, getListOfLike } from '../../api/like';
import { BASE_URL } from '../../api/baseUrl';
import { createComment, getCommentsByFeed, deleteComment, CommentDto } from '../../api/comment';
import { fetchUserInfoById } from '../../api/user';
import Heart from '../../assets/icon/heart.png';
import HeartOutline from '../../assets/icon/heart-outline.png';
import CommentIcon from '../../assets/icon/comments.png';

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get('window');
import type { FeedItemDto } from '../../api/types/feed';

type ImageDto = { url: string; ord?: number };
type P = {
  feedId: number | string;
};

const { width, height } = Dimensions.get('window');

function absUrl(u?: string | null) {
  if (!u) return null;
  const t = String(u).trim();
  if (!t || t === '/' || t === 'null' || t === 'undefined') return null;
  return /^https?:\/\//i.test(t) ? t : `${BASE_URL}${t.startsWith('/') ? '' : '/'}${t}`;
}

function isVideoUrl(u?: string | null) {
  if (!u) return false;
  return /\.(mp4|mov|m4v|webm|3gp)$/i.test(u);
}

function normalizeAbsUrl(u?: string | null) {
  if (!u) return null;
  const t = String(u).trim();
  if (!t || t === '/' || t === '#' || t === 'null' || t === 'undefined') return null;
  return /^https?:\/\//i.test(t) ? t : `${BASE_URL}${t.startsWith('/') ? '' : '/'}${t}`;
}

function pickFirstMediaUrlLocal(item: any): string | null {
  const arr = Array.isArray(item?.images)
    ? item.images
    : Array.isArray(item?.media)
    ? item.media
    : [];
  if (arr.length === 0) return null;
  const first = arr.slice().sort((a: any, b: any) => (a?.ord ?? 0) - (b?.ord ?? 0))[0];
  return normalizeAbsUrl(first?.url ?? null);
}

export default function FeedDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<Record<string, any>, string>>();

  const params = route.params as any;
  const feedId = Number(params?.feedId);


  const [feedData, setFeedData] = useState<FeedItemDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string>('');
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommentDto[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [sending, setSending] = useState(false);

  const [isLikedState, setIsLikedState] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    const loadFeedData = async () => {
      if (!feedId || isNaN(feedId)) {
        Alert.alert('오류', '잘못된 피드 ID입니다.');
        (navigation as any).goBack();
        return;
      }

      try {
        setLoading(true);

        const feed = await getFeed(feedId);
        setFeedData(feed);

        const rawUserId =
          (feed as any)?.userId ??
          (feed as any)?.user_id ??
          (feed as any)?.authorId ??
          (feed as any)?.author_id ??
          (feed as any)?.creator_id ??
          (feed as any)?.creatorId;

        const userId = Number(rawUserId);

        if (Number.isFinite(userId) && userId > 0) {
          try {
            const userInfo = await fetchUserInfoById(userId);
            const fetchedUsername =
              (userInfo as any)?.username ||
              (userInfo as any)?.userName ||
              (userInfo as any)?.name ||
              `user${userId}`;
            setUsername(fetchedUsername);
          } catch (e) {
            setUsername(`user${userId}`);
          }
        } else {
          // fallback username from feed data
          const fallbackUsername =
            (feed as any).username ||
            (feed as any).ownerUsername ||
            'unknown';
          setUsername(fallbackUsername);
        }

        const checkIsLiked = await isLiked(feedId);
        setIsLikedState(checkIsLiked);

        const likeList = await getListOfLike(feedId);
        const count = Array.isArray(likeList) ? likeList.length : 0;
        setLikeCount(count);


      } catch (e: unknown) {
        Alert.alert('오류', e?.message ?? '피드를 불러올 수 없습니다.');
        (navigation as any).goBack();
      } finally {
        setLoading(false);
      }
    };

    loadFeedData();
  }, [feedId, navigation]);

  const media = useMemo(() => {
    if (!feedData) return [];

    const rawImages = Array.isArray((feedData as any).images)
      ? (feedData as any).images
      : Array.isArray((feedData as any).media)
      ? (feedData as any).media
      : [];

    const result = rawImages
      .slice()
      .sort((a: any, b: any) => (a.ord ?? 0) - (b.ord ?? 0))
      .map((m: any) => {
        const raw = m.url;
        const url = absUrl(raw);
        return { url, isVideo: isVideoUrl(raw) };
      })
      .filter((m: any) => !!m.url);

    return result;
  }, [feedData]);

  const firstMedia = media[0];

  const loadComments = async () => {
    try {
      setLoadingComments(true);
      const data = await getCommentsByFeed(feedId);
      setComments(data);
    } catch (e: unknown) {
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    if (showComments) loadComments();
  }, [showComments]);

  const handleCreateComment = async () => {
    if (!commentText.trim()) {
      Alert.alert('알림', '댓글 내용을 입력해주세요.');
      return;
    }
    try {
      setSending(true);
      await createComment(feedId, commentText.trim());
      setCommentText('');
      await loadComments();
      Alert.alert('완료', '댓글이 작성되었습니다.');
    } catch (e: unknown) {
      Alert.alert('실패', e?.message ?? '댓글 작성 중 오류가 발생했습니다.');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteComment = (commentId: number) => {
    Alert.alert('삭제할까요?', '이 댓글을 삭제합니다.', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteComment(commentId);
            await loadComments();
            Alert.alert('완료', '댓글이 삭제되었습니다.');
          } catch (e: unknown) {
            Alert.alert('실패', e?.message ?? '삭제 중 오류가 발생했습니다.');
          }
        }
      }
    ]);
  };

  const toggleLike = async () => {
    try {
      await likeFeed(feedId);

      const checkIsLiked = await isLiked(feedId);

      const likeList = await getListOfLike(feedId);
      const newLikeCount = Array.isArray(likeList) ? likeList.length : 0;

      setIsLikedState(checkIsLiked);
      setLikeCount(newLikeCount);


    } catch (e: unknown) {
      Alert.alert('알림', e?.message ?? '좋아요에 실패했어요.');
    }
  };

  const confirmDelete = () => {
    Alert.alert('삭제할까요?', '이 게시글을 삭제합니다.', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteFeed(feedId);
            Alert.alert('완료', '삭제되었습니다.');
            (navigation as any).goBack();
          } catch (e: unknown) {
            Alert.alert('실패', e?.message ?? '삭제 중 오류가 발생했습니다.');
          }
        }
      }
    ]);
  };

  if (loading) {
    return (
      <View style={[s.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#fff', fontSize: 16 }}>로딩 중...</Text>
      </View>
    );
  }

  if (!feedData) {
    return (
      <View style={[s.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#fff', fontSize: 16 }}>피드를 찾을 수 없습니다.</Text>
      </View>
    );
  }

  const content = (feedData as any).content || '';

  return (
    <View style={s.screen}>
      <View style={s.page}>
        {firstMedia ? (
          firstMedia.isVideo ? (
            <Video
              source={{ uri: firstMedia.url! }}
              style={s.video}
              resizeMode="cover"
              repeat
              paused={false}
              muted={false}
              onError={(error) => {
                Alert.alert('비디오 로드 실패', JSON.stringify(error));
              }}
              onLoad={() =>              }}
              onLoad={() =>}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  page: { width: SCREEN_W, height: SCREEN_H, backgroundColor: '#000' },
  video: { position: 'absolute', width: '100%', height: '100%' },
  gradient: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 200 },
  fallback: { backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center', padding: 16 },
  fallbackTxt: { color: '#E5E7EB', fontSize: 14, textAlign: 'center' },

  topBar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  topBarInner: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginTop: Platform.OS === 'ios' ? 0 : 20,
  },
  topBtn: { padding: 8, borderRadius: 8, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  topBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '600' },

  actions: {
    position: 'absolute',
    right: 12,
    bottom: 120,
    alignItems: 'center',
    gap: 14
  },
  actionBtn: { alignItems: 'center', justifyContent: 'center', minWidth: 36 },
  icon: { width: 30, height: 30, tintColor: '#fff' },
  count: { marginTop: 3, fontSize: 12, color: '#fff' },

  bottomText: { position: 'absolute', left: 12, right: 84, bottom: 60 },
  title: { fontSize: 18, fontWeight: '800', color: '#fff', marginRight: 8 },
  prompt: { marginTop: 6, fontSize: 14, color: '#E5E7EB' },

  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  sheetBar: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginBottom: 10
  },
  commentHeader: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 8 },
  commentRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#111827'
  },
  sendBtn: {
    marginLeft: 8,
    backgroundColor: '#587dc4',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10
  },
  sendTxt: { color: '#fff', fontWeight: '700' },
  closeBtn: { alignSelf: 'center', marginTop: 10 },
  closeTxt: { color: '#587dc4', fontWeight: '700' },
});