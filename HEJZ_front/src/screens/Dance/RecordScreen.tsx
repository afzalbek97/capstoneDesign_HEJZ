// src/screens/RecordScreen.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert,
  Platform, PermissionsAndroid,
} from 'react-native';
import { Camera, useCameraDevice, type CameraDevice } from 'react-native-vision-camera';
import Video from 'react-native-video';
import CRDefault, { CameraRoll as CRNamed } from '@react-native-camera-roll/camera-roll';
import { getSongSelection, getMotionUrls } from '../../api/dance';

const CameraRoll = (CRNamed ?? CRDefault) as {
  save: (uri: string, opts?: { type?: 'photo' | 'video'; album?: string }) => Promise<string>;
};

type MotionSegment = {
  motionUrl: string;
  startTime: number;
  endTime: number;
  lyrics?: string;
};

type Props = {
  route: {
    params: {
      songId?: string;
      audioUrl?: string;
      motionSegments?: MotionSegment[];
    };
  };
};

export default function RecordScreen({ route }: Props) {
  const [audioUrl, setAudioUrl] = React.useState<string | null>(route.params?.audioUrl || null);
  const [motionSegments, setMotionSegments] = React.useState<MotionSegment[]>(
    route.params?.motionSegments || []
  );
  const [loadingData, setLoadingData] = React.useState(false);

  const [useFront, setUseFront] = useState(false);
  const device: CameraDevice | undefined = useCameraDevice(useFront ? 'front' : 'back');

  const cameraRef = useRef<Camera>(null);
  const [hasPerm, setHasPerm] = useState(false);
  const [permAsked, setPermAsked] = useState(false);

  const [recording, setRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const recordingRef = useRef<any>(null);
  const [lastPath, setLastPath] = useState<string | null>(null);

  const audioRef = useRef<Video>(null);
  const [playAudio, setPlayAudio] = useState(false);
  const [currentAudioTime, setCurrentAudioTime] = useState(0);
  const audioPosRef = useRef(0);

  const overlayVideoRef = useRef<Video>(null);
  const [overlayOn, setOverlayOn] = useState(false);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [videoKey, setVideoKey] = useState(0);

  const requestPerms = useCallback(async () => {
    try {
      const cam = await Camera.requestCameraPermission();
      const mic = await Camera.requestMicrophonePermission();
      const ok = cam === 'granted' && mic === 'granted';
      setHasPerm(ok);
      setPermAsked(true);
      if (!ok) Alert.alert('권한 필요', '설정에서 카메라/마이크 권한을 허용해주세요.');
    } catch (e) {
      setPermAsked(true);
      Alert.alert('권한 요청 실패', String(e));
    }
  }, []);

  useEffect(() => {
    requestPerms();
  }, [requestPerms]);

  useEffect(() => {
    (async () => {
      const { songId } = route.params || {};
      if (!songId) return;

      try {
        setLoadingData(true);

        const savedData = await getSongSelection(songId);
        if (!savedData) {
          Alert.alert('오류', '저장된 안무 데이터를 찾을 수 없습니다.');
          return;
        }


        setAudioUrl(savedData.audioUrl);

        const allMotionIds = savedData.selections
          .flatMap(sel => sel.selectedMotionIds)
          .filter(Boolean);

        const urlMap = await getMotionUrls(allMotionIds);

        const segments: MotionSegment[] = savedData.selections.map(sel => ({
          motionUrl: urlMap.get(sel.selectedMotionIds[0]) || '',
          startTime: sel.startTime || 0,
          endTime: sel.endTime || 0,
          lyrics: sel.lyricsGroup || '',
        })).filter(seg => seg.motionUrl);

        setMotionSegments(segments);

      } catch (e: unknown) {
        Alert.alert('오류', e?.message ?? '저장된 데이터를 불러올 수 없습니다.');
      } finally {
        setLoadingData(false);
      }
    })();
  }, [route.params?.songId]);

  async function ensureAndroidGalleryPerm() {
    if (Platform.OS !== 'android') return true;
    if (Platform.Version >= 33) {
      const res = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO
      );
      return res === PermissionsAndroid.RESULTS.GRANTED;
    }
    if (Platform.Version <= 28) {
      const res = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
      );
      return res === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  }

  async function saveUriToGallery(filePath: string) {
    const ok = await ensureAndroidGalleryPerm();
    if (!ok) throw new Error('갤러리 권한이 거부되었습니다.');
    const uri = filePath.startsWith('file://') ? filePath : `file://${filePath}`;
    const savedUri = await CameraRoll.save(uri, { type: 'video', album: 'UStar' });
    return savedUri;
  }

  async function pauseAudioAndRemember() {
    setPlayAudio(false);
  }

  function resumeAudioFromRemembered() {
    audioRef.current?.seek(audioPosRef.current);
    setPlayAudio(true);
  }

  function resetAudioToZero() {
    audioPosRef.current = 0;
    setCurrentAudioTime(0);
    setPlayAudio(false);
    setCurrentSegmentIndex(0);
    setVideoKey(0);
  }

  useEffect(() => {
    if (!playAudio || motionSegments.length === 0) return;

    let targetIndex = -1;

    for (let i = 0; i < motionSegments.length; i++) {
      const seg = motionSegments[i];
      if (currentAudioTime >= seg.startTime && currentAudioTime < seg.endTime) {
        targetIndex = i;
        break;
      }
    }

    if (targetIndex !== -1 && targetIndex !== currentSegmentIndex) {
      const seg = motionSegments[targetIndex];

      setCurrentSegmentIndex(targetIndex);

      setVideoKey(prev => prev + 1);
    }
  }, [currentAudioTime, playAudio, motionSegments, currentSegmentIndex]);

  const startRec = useCallback(async () => {
    if (recording || !cameraRef.current) return;
    if (!hasPerm || !device) {
      Alert.alert('오류', '카메라/마이크 권한 또는 디바이스가 없습니다.');
      return;
    }

    if (!audioUrl || motionSegments.length === 0) {
      Alert.alert('오류', '오디오 또는 안무 데이터가 없습니다.');
      return;
    }

    setIsStarting(true);
    setOverlayOn(true);

    setCurrentSegmentIndex(0);
    setVideoKey(0);

    resumeAudioFromRemembered();

    try {
      await cameraRef.current.startRecording({
        flash: 'off',
        onRecordingFinished: async (v) => {
          setRecording(false);
          setIsPaused(false);
          setOverlayOn(false);
          setLastPath(v.path);
          setPlayAudio(false);

          try {
            const savedUri = await saveUriToGallery(v.path);
            Alert.alert('녹화 & 저장 완료', savedUri);
          } catch (e: unknown) {
            Alert.alert('저장 실패', e?.message ?? String(e));
          }
        },
        onRecordingError: (e) => {
          setRecording(false);
          setIsPaused(false);
          setOverlayOn(false);
          setPlayAudio(false);
          Alert.alert('녹화 오류', String(e));
        },
      });

      // @ts-ignore
      recordingRef.current = (cameraRef.current as any)?.recording ?? null;

      setRecording(true);
      setIsPaused(false);

      setTimeout(() => {
        resumeAudioFromRemembered();
      }, 200);

    } catch (e) {
      setRecording(false);
      setIsPaused(false);
      setOverlayOn(false);
      setPlayAudio(false);
      Alert.alert('시작 실패', String(e));
    } finally {
      setIsStarting(false);
    }
  }, [recording, hasPerm, device, audioUrl, motionSegments]);

  const togglePauseResume = useCallback(async () => {
    if (!recording) {
      await startRec();
      return;
    }
    if (!isPaused) {
      try {
        await pauseAudioAndRemember();
        await recordingRef.current?.pause?.();
        setIsPaused(true);
      } catch (e: unknown) {
        Alert.alert('일시정지 실패', String(e?.message ?? e));
      }
    } else {
      try {
        resumeAudioFromRemembered();
        await recordingRef.current?.resume?.();
        setIsPaused(false);
      } catch (e: unknown) {
        Alert.alert('재개 실패', String(e?.message ?? e));
      }
    }
  }, [recording, isPaused, startRec]);

  const stopRec = useCallback(async () => {
    if (!recording) return;
    try {
      await cameraRef.current?.stopRecording();
    } catch (e) {
      setRecording(false);
      setIsPaused(false);
      Alert.alert('정지 실패', String(e));
    } finally {
      setOverlayOn(false);
      setPlayAudio(false);
    }
  }, [recording]);

  const resetAll = useCallback(async () => {
    try { await cameraRef.current?.stopRecording(); } catch {}
    setRecording(false);
    setIsPaused(false);
    setOverlayOn(false);
    recordingRef.current = null;
    setLastPath(null);
    resetAudioToZero();
    Alert.alert('초기화', '영상/음악이 처음 상태로 초기화됐습니다.');
  }, []);

  if (loadingData) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#4B9DFE" />
        <Text style={{ marginTop: 8, color:'#ccc' }}>저장된 안무 데이터 불러오는 중...</Text>
      </View>
    );
  }

  if (!permAsked || !hasPerm || !device) {
    const msg = !permAsked ? '권한 요청 중…' : !hasPerm ? '권한 대기…' : '카메라 준비 중…';
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#666" />
        <Text style={{ marginTop: 8, color:'#ccc' }}>{msg}</Text>
        {permAsked && !hasPerm && (
          <TouchableOpacity style={[s.btn, { backgroundColor: '#334155', marginTop: 16 }]} onPress={requestPerms}>
            <Text style={s.btnTxt}>권한 다시 요청</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (!audioUrl || motionSegments.length === 0) {
    return (
      <View style={s.center}>
        <Text style={{ color: '#fff', marginBottom: 16 }}>오디오 또는 안무 데이터가 없습니다</Text>
        <TouchableOpacity style={[s.btn, { backgroundColor: '#4B9DFE' }]} onPress={() => {}}>
          <Text style={s.btnTxt}>뒤로 가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentSegment = motionSegments[currentSegmentIndex];

  const lyricsLines = (currentSegment?.lyrics || '').split('\n').filter(Boolean);

  return (
    <View style={s.wrap}>
      <View style={s.topBar}>
        <TouchableOpacity style={s.topLeftBtn} onPress={() => setUseFront(v => !v)}>
          <Text style={s.topBtnTxt}>전면전환</Text>
        </TouchableOpacity>

        {overlayOn && currentSegment && (
          <View style={s.segmentInfo}>
            <Text style={s.segmentText}>
              안무 {currentSegmentIndex + 1}/{motionSegments.length}
            </Text>
            {lyricsLines.length > 0 && (
              <View style={s.lyricsBox}>
                <Text style={s.lyricsText} numberOfLines={1}>
                  {lyricsLines[0]}
                </Text>
                {lyricsLines.length > 1 && (
                  <Text style={s.lyricsText} numberOfLines={1}>
                    {lyricsLines[1]}
                  </Text>
                )}
              </View>
            )}
            <Text style={s.timeText}>
              {currentSegment.startTime.toFixed(1)}s ~ {currentSegment.endTime.toFixed(1)}s
            </Text>
          </View>
        )}
      </View>

      <Camera
        ref={cameraRef}
        style={s.preview}
        device={device}
        isActive
        video
        audio
        onError={(e) => {
          Alert.alert('카메라 오류', String(e));
        }}
      />

      <Video
        ref={audioRef}
        source={{ uri: audioUrl }}
        paused={!playAudio}
        audioOnly
        repeat={false}
        ignoreSilentSwitch="ignore"
        playInBackground
        onProgress={(p) => {
          audioPosRef.current = p.currentTime ?? 0;
          setCurrentAudioTime(p.currentTime ?? 0);
        }}
        onLoad={() => {
          if (audioPosRef.current > 0) {
            audioRef.current?.seek(audioPosRef.current);
          }
        }}
        onEnd={() => {
          setPlayAudio(false);
        }}
        style={{ width: 0, height: 0 }}
      />

      {overlayOn && currentSegment?.motionUrl && (
        <View style={s.overlayBox}>
          <Video
            key={`motion-${videoKey}-${currentSegmentIndex}`}
            ref={overlayVideoRef}
            source={{ uri: currentSegment.motionUrl }}
            style={s.overlayVideo}
            repeat
            muted
            resizeMode="cover"
            disableFocus
            paused={isPaused || !overlayOn}
            useTextureView
            onError={(e) => {
              Alert.alert('안무 비디오 오류', '안무 영상을 재생할 수 없습니다.');
            }}
            onLoad={() =>}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor:'#000' },
  preview: { flex: 1 },

  topBar: {
    position: 'absolute',
    top: 12,
    left: 0,
    right: 0,
    zIndex: 30,
    paddingHorizontal: 12,
  },
  topLeftBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignSelf: 'flex-start',
  },
  topBtnTxt: { color: '#fff', fontWeight: '700' },

  segmentInfo: {
    marginTop: 8,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 8,
    alignSelf: 'flex-start',
    maxWidth: '80%',
  },
  segmentText: {
    color: '#4B9DFE',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  lyricsBox: {
    marginVertical: 6,
  },
  lyricsText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginVertical: 2,
    lineHeight: 20,
  },
  timeText: {
    color: '#aaa',
    fontSize: 11,
    marginTop: 4,
  },

  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 14,
    backgroundColor: '#0b1020',
  },
  btn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999
  },
  btnTxt: {
    color: '#fff',
    fontWeight: '800',
    letterSpacing: 1
  },

  overlayBox: {
    position: 'absolute',
    top: 80,
    right: 12,
    width: 140,
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
    zIndex: 20,
    borderWidth: 2,
    borderColor: '#4B9DFE',
  },
  overlayVideo: {
    width: '100%',
    height: '100%'
  },
  overlayBadge: {
    position: 'absolute',
    left: 6,
    bottom: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(75, 157, 254, 0.9)',
  },
  badgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 11,
  },
});