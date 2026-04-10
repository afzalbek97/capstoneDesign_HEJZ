// screens/EditProfileScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import { launchImageLibrary, ImageLibraryOptions, Asset } from 'react-native-image-picker';

import { useUser } from '../../context/UserContext';
import { BASE_URL } from '../../api/baseUrl';
import { fetchMyProfile, cacheMyProfile, SK } from '../../api/user';

const FALLBACK_AVATAR = (() => {
  try { return require('../../assets/icon/cat.png'); } catch { return null as any; }
})();

// ===== helper =====
function absUrl(u?: string | null) {
  if (!u) return null;
  if (/^https?:\/\
  return `${BASE_URL}${u}`;
}

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const { user, setUser } = useUser();

  const [nickname, setNickname] = useState(user?.name ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarLocalPreview, setAvatarLocalPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const me = await fetchMyProfile().catch(() => null);
        if (mounted && me) {
          setNickname(me.nickname ?? user?.name ?? '');
          setBio(me.bio ?? user?.bio ?? '');
          setAvatarUrl(me.avatarUrl ?? null);
          await AsyncStorage.multiSet([
            [SK.nickname, me.nickname ?? ''],
            [SK.bio, me.bio ?? ''],
            [SK.avatarUrl, me.avatarUrl ?? ''],
          ]);
          return;
        }
        const [n, b, a] = await AsyncStorage.multiGet([SK.nickname, SK.bio, SK.avatarUrl]);
        if (!mounted) return;
        setNickname(n?.[1] ?? user?.name ?? '');
        setBio(b?.[1] ?? user?.bio ?? '');
        setAvatarUrl(a?.[1] || null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleChangeProfileImage = async () => {
    const options: ImageLibraryOptions = {
      mediaType: 'photo',
      selectionLimit: 1,
      quality: 0.9,
      includeBase64: true,
    };
    const result = await launchImageLibrary(options);
    if (result.didCancel) return;
    if (result.errorCode) {
      Alert.alert('오류', result.errorMessage || result.errorCode);
      return;
    }

    const asset: Asset | undefined = result.assets?.[0];
    const srcUri = asset?.uri;
    if (!asset || !srcUri) {
      Alert.alert('오류', '이미지 경로를 찾을 수 없습니다.');
      return;
    }

    try {
      setLoading(true);
      const ext = (asset.fileName?.split('.').pop() || 'jpg').toLowerCase();
      const fileName = `avatar_${Date.now()}.${ext}`;
      const destPath = `${RNFS.DocumentDirectoryPath}/${fileName}`;

      if (asset.base64) {
        await RNFS.writeFile(destPath, asset.base64, 'base64');
      } else if (/^file:\/\//i.test(srcUri)) {
        await RNFS.copyFile(srcUri.replace('file://', ''), destPath);
      } else {
        throw new Error('content URI를 직접 복사할 수 없습니다. includeBase64 옵션을 활성화하세요.');
      }

      const fileUri = `file://${destPath}`;
      setAvatarLocalPreview(fileUri);
      setAvatarUrl(fileUri);

      await cacheMyProfile({ avatarUrl: fileUri });
      setUser?.((prev: any) => ({
        ...prev,
        profileImage: { uri: fileUri },
      }));

      Alert.alert('완료', '프로필 사진이 변경되었습니다.');
    } catch (e: unknown) {
      Alert.alert('오류', e?.message ?? '이미지 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await cacheMyProfile({
        nickname,
        bio,
        avatarUrl: avatarUrl ?? '',
      });

      setUser?.({
        ...user,
        name: nickname,
        bio,
        profileImage:
          (avatarLocalPreview && { uri: avatarLocalPreview }) ||
          (avatarUrl && { uri: absUrl(avatarUrl)! }) ||
          user?.profileImage ||
          FALLBACK_AVATAR,
      });

      Alert.alert('저장 완료', '프로필 정보가 저장되었습니다.');
      (navigation as any).navigate('MyRoom', { refresh: Date.now() });
    } catch (e: unknown) {
      Alert.alert('알림', e?.message ?? '로컬 저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = () => {
    Alert.alert('알림', '비밀번호 수정 기능은 준비 중입니다!');
  };

  const avatarPreview =
    (avatarLocalPreview && { uri: avatarLocalPreview }) ||
    (avatarUrl && { uri: absUrl(avatarUrl)! }) ||
    user?.profileImage ||
    FALLBACK_AVATAR;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>내 정보 수정</Text>

      <TouchableOpacity onPress={handleChangeProfileImage} style={styles.profileContainer} disabled={loading}>
        <Image source={avatarPreview as any} style={styles.profileImage} />
        <Text style={styles.changePhotoText}>프로필 사진 변경</Text>
      </TouchableOpacity>

      <Text style={styles.label}>닉네임</Text>
      <TextInput
        style={styles.input}
        value={nickname}
        onChangeText={setNickname}
        placeholder="닉네임을 입력하세요"
        editable={!loading}
      />

      <Text style={styles.label}>자기소개</Text>
      <TextInput
        style={[styles.input, styles.multilineInput]}
        value={bio}
        onChangeText={setBio}
        placeholder="자기소개를 입력하세요"
        multiline
        numberOfLines={4}
        editable={!loading}
      />

      <TouchableOpacity style={[styles.saveButton, loading && { opacity: 0.6 }]} onPress={handleSave} disabled={loading}>
        <Text style={styles.saveButtonText}>{loading ? '저장 중…' : '저장하기'}</Text>
      </TouchableOpacity>

      <View style={styles.extraButtons}>
        <TouchableOpacity style={styles.extraButton} onPress={handleChangePassword} disabled={loading}>
          <Text style={styles.extraButtonText}> 비밀번호 수정</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.extraButton} onPress={() => Alert.alert('연결된 계정', '준비 중입니다.')} disabled={loading}>
          <Text style={styles.extraButtonText}> 연결된 계정</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.extraButton} onPress={() => Alert.alert('알림 설정', '준비 중입니다.')} disabled={loading}>
          <Text style={styles.extraButtonText}> 알림 설정</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ===== styles =====
const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 24, textAlign: 'center' },
  profileContainer: { alignItems: 'center', marginBottom: 30 },
  profileImage: { width: 100, height: 100, borderRadius: 50, marginBottom: 8, backgroundColor: '#eee' },
  changePhotoText: { fontSize: 14, color: '#4B9DFE' },
  label: { fontSize: 16, fontWeight: '500', marginBottom: 8, color: '#333' },
  input: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, marginBottom: 20,
  },
  multilineInput: { textAlignVertical: 'top', height: 100 },
  saveButton: { backgroundColor: '#4B9DFE', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginBottom: 30 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  extraButtons: { gap: 12 },
  extraButton: { backgroundColor: '#f5f5f5', padding: 14, borderRadius: 8 },
  extraButtonText: { fontSize: 15, color: '#333' },
});
