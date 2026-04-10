import React from 'react';
import { Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { logoutLocalOnly } from '../../api/auth';
import { clearProfileCache } from '../../api/user';

import type { CommunityNavigationProp } from '../../navigation/types';

type Props = { navigation: CommunityNavigationProp };

const MyPageOptionsScreen = ({ navigation }: Props) => {
  const handleLogout = async () => {
    try {
      await logoutLocalOnly();
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (e: unknown) {
      Alert.alert('로그아웃 오류', String(e?.message ?? e));
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>설정</Text>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('MySongs')}>
        <Text style={styles.buttonText}>노래 목록</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('MyVideos')}>
        <Text style={styles.buttonText}>영상 목록</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Bookmark')}>
        <Text style={styles.buttonText}>북마크 목록</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('comments')}>
        <Text style={styles.buttonText}>내 댓글</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('States')}>
        <Text style={styles.buttonText}>내 콘텐츠 통계</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('BlockedUser')}>
        <Text style={styles.buttonText}>차단 목록</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.danger]} onPress={handleLogout}>
        <Text style={[styles.buttonText, { fontWeight: '700' }]}>로그아웃</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default MyPageOptionsScreen;

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 60, backgroundColor: '#fff' },
  header: { fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 32, color: '#000' },
  button: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc',
    padding: 16, borderRadius: 8, marginBottom: 16,
  },
  buttonText: { fontSize: 16, color: '#000', fontWeight: '500' },
  danger: { borderColor: '#f33' },
});
