// src/components/FollowButton.tsx - 완전 교체
import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { followUser, unfollowUser } from '../api/follow';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Props = {
  username: string;
  hideIfMe?: boolean;
  initialFollowing?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
};

export default function FollowButton({ username, hideIfMe, initialFollowing = false, onFollowChange }: Props) {
  const [loading, setLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [isMe, setIsMe] = useState(false);

  // 🔥 중요: initialFollowing 변경 시 상태 동기화
  useEffect(() => {
    setIsFollowing(initialFollowing);
  }, [initialFollowing]);

  // 내 username 확인
  useEffect(() => {
    (async () => {
      try {
        const myUsername = await AsyncStorage.getItem('user.username');
        if (myUsername === username) {
          setIsMe(true);
        }
      } catch (e) {
      }
    })();
  }, [username]);

  const handlePress = async () => {
    setLoading(true);

    try {
      if (isFollowing) {
        await unfollowUser(username);
        setIsFollowing(false);
        onFollowChange?.(false);
        Alert.alert('언팔로우 완료', `@${username}님을 언팔로우했습니다.`);
      } else {
        await followUser(username);
        setIsFollowing(true);
        onFollowChange?.(true);
        Alert.alert('팔로우 완료', `@${username}님을 팔로우했습니다.`);
      }
    } catch (err: any) {
      Alert.alert('오류', err.message ?? '팔로우 처리 실패');
    } finally {
      setLoading(false);
    }
  };

  // 본인이면 숨김
  if (hideIfMe && isMe) {
    return null;
  }


  return (
    <TouchableOpacity
      style={[s.btn, isFollowing ? s.btnFollowing : s.btnFollow]}
      onPress={handlePress}
      disabled={loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator size="small" color={isFollowing ? '#587dc4' : '#fff'} />
      ) : (
        <Text style={[s.btnText, isFollowing ? s.btnTextFollowing : s.btnTextFollow]}>
          {isFollowing ? '팔로잉' : '팔로우'}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  btn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnFollow: {
    backgroundColor: '#587dc4',
  },
  btnFollowing: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  btnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  btnTextFollow: {
    color: '#FFFFFF',
  },
  btnTextFollowing: {
    color: '#6B7280',
  },
});