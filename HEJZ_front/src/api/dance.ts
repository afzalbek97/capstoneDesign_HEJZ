// src/api/dance.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './baseUrl';

/* =========================
 * 타입 정의
 * ========================= */
export type LyricsRequest = {
  lyrics: string;
  selectedEmotion: string;
  selectedGenre: string;
};

export type LyricsGroupRecommendation = {
  lyricsGroup: string;
  analyzedEmotion: string;
  selectedEmotionMotion: string | null;
  selectedGenreMotion: string | null;
  analyzedMotion1: string | null;
  analyzedMotion2: string | null;
};

export type IntegratedRecommendationResponse = {
  lyricsRecommendations: LyricsGroupRecommendation[];
};

export type SelectionGroupDto = {
  lyricsGroup: string;
  selectedMotionIds: string[];
  startTime?: number;
  endTime?: number;
};

export type SelectionGroupResponseDto = {
  lyricsGroup: string;
  selectedMotionIds: string[];
  videoUrls: string[];
  startTime?: number;
  endTime?: number;
};

export type SongSelectionDto = {
  songId: string;
  songTitle: string;
  audioUrl: string;
  selections: SelectionGroupDto[];
};

/* =========================
 * 공통: 인증 헤더
 * ========================= */
async function getAuthHeaders() {
  const token = await AsyncStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/* =========================
 * 유틸: 가사 정규화
 * - [Verse], [Chorus] 같은 섹션 태그 제거
 * - 공백 라인 제거
 * ========================= */
export function normalizePlainLyrics(raw: string) {
  return (raw || '')
    .replace(/\r\n/g, '\n')
    .replace(/\[(.*?)\]\n?/g, '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .join('\n');
}

/* =========================
 * 1) 전체 가사 분석 API
 * - 서버 DTO 변화 대비: selectedEmotion/selectedGenre 전송
 * ========================= */
export async function analyzeLyrics(
  lyrics: string,
  selectedEmotion: string,
  selectedGenre: string
): Promise<IntegratedRecommendationResponse> {
  const headers = await getAuthHeaders();

  const body = {
    lyrics,
    selectedEmotion,
    selectedGenre,
  };


  const res = await fetch(`${BASE_URL}/api/emotion/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=UTF-8', ...headers },
    body: JSON.stringify(body),
  });

  const text = await res.text();

  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);

  const json = text ? JSON.parse(text) : {};
  return json as IntegratedRecommendationResponse;
}

/* =========================
 * 2) 2줄 단위 분석 헬퍼
 * - 항상 배열만 반환해서 화면에서 바로 setRecs([...]) 가능
 * ========================= */
export async function analyzeLyricsByTwoLines(
  lyrics: string,
  emotion: string,
  genre: string
): Promise<LyricsGroupRecommendation[]> {
  const headers = await getAuthHeaders();

  const payload = {
    lyrics,
    selectedEmotion: emotion,
    selectedGenre: genre,
  };


  const res = await fetch(`${BASE_URL}/api/emotion/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=UTF-8', ...headers },
    body: JSON.stringify(payload),
  });

  const text = await res.text();

  if (!res.ok) throw new Error(`HTTP ${res.status} ${text}`);

  const json = text ? JSON.parse(text) : {};
  const arr = Array.isArray(json?.lyricsRecommendations) ? json.lyricsRecommendations : [];
  return arr as LyricsGroupRecommendation[];
}

/* =========================
 * 3) ✅ 최종 선택 안무 저장 (수정됨)
 * - 백엔드 API에 맞춰 motionIds 배열만 전송
 * ========================= */
export async function saveFinalSelections(motionIds: string[]): Promise<string> {
  const headers = await getAuthHeaders();


  const res = await fetch(`${BASE_URL}/api/emotion/selections/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(motionIds),
  });

  const text = await res.text();

  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);

  try {
    const json = JSON.parse(text);
    return json.message || '저장 완료';
  } catch {
    return text;
  }
}

/* =========================
 * 4) ✅ 곡별 선택 저장 (로컬 스토리지 사용)
 * - 백엔드에 해당 API가 없으므로 로컬 저장
 * ========================= */
export async function saveSongSelection(
  songSelection: SongSelectionDto
): Promise<string> {
  try {

    const key = `song_selection_${songSelection.songId}`;
    await AsyncStorage.setItem(key, JSON.stringify(songSelection));

    const savedSongsJson = await AsyncStorage.getItem('saved_songs_list');
    const savedSongs: string[] = savedSongsJson ? JSON.parse(savedSongsJson) : [];

    if (!savedSongs.includes(songSelection.songId)) {
      savedSongs.push(songSelection.songId);
      await AsyncStorage.setItem('saved_songs_list', JSON.stringify(savedSongs));
    }


    const allMotionIds = songSelection.selections
      .flatMap(sel => sel.selectedMotionIds)
      .filter(Boolean);

    if (allMotionIds.length > 0) {
      try {
        await saveFinalSelections(allMotionIds);
      } catch (e) {
      }
    }

    return '저장 완료';
  } catch (e: unknown) {
    throw new Error(e?.message || '저장 중 오류가 발생했습니다.');
  }
}

/* =========================
 * 5) ✅ 특정 곡의 선택 조회 (로컬 스토리지에서)
 * ========================= */
export async function getSongSelection(songId: string): Promise<SongSelectionDto | null> {
  try {

    const key = `song_selection_${songId}`;
    const data = await AsyncStorage.getItem(key);

    if (!data) {
      return null;
    }

    const json = JSON.parse(data);
    return json as SongSelectionDto;
  } catch (e: unknown) {
    return null;
  }
}

/* =========================
 * 6) ✅ 저장된 모든 곡 목록 조회
 * ========================= */
export async function getAllSavedSongs(): Promise<SongSelectionDto[]> {
  try {
    const savedSongsJson = await AsyncStorage.getItem('saved_songs_list');
    const savedSongs: string[] = savedSongsJson ? JSON.parse(savedSongsJson) : [];

    const results = await Promise.all(
      savedSongs.map(songId => getSongSelection(songId))
    );

    return results.filter(Boolean) as SongSelectionDto[];
  } catch (e) {
    return [];
  }
}

/* =========================
 * 7) ✅ 안무 영상 URL 조회 (개별)
 *    백엔드: GET /api/motion/{motionId}
 * ========================= */
export async function getMotionUrl(motionId: string): Promise<string> {
  const headers = await getAuthHeaders();


  const res = await fetch(`${BASE_URL}/api/motion/${encodeURIComponent(motionId)}`, {
    method: 'GET',
    headers: { ...headers },
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${text}`);
  }

  const trimmedText = text.trim().replace(/^["']|["']$/g, '');

  if (trimmedText.startsWith('http')) {
    return trimmedText;
  }

  try {
    const json = JSON.parse(text);
    if (json.videoUrl?.startsWith('http')) {
      return json.videoUrl;
    }
    if (json.url?.startsWith('http')) {
      return json.url;
    }
  } catch (e) {
  }

  throw new Error('유효한 URL을 찾을 수 없습니다: ' + text);
}

/* =========================
 * 8) ✅ 여러 모션 URL 병렬 조회 (일괄)
 *    백엔드: POST /api/emotion/selections
 * ========================= */
export async function getMotionUrls(motionIds: string[]): Promise<Map<string, string>> {
  const headers = await getAuthHeaders();


  try {
    const res = await fetch(`${BASE_URL}/api/emotion/selections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(motionIds),
    });

    const text = await res.text();

    if (res.ok) {
      const urls: string[] = JSON.parse(text);
      const map = new Map<string, string>();

      motionIds.forEach((id, index) => {
        if (urls[index]) {
          map.set(id, urls[index]);
        }
      });

      return map;
    }
  } catch (e) {
  }

  const map = new Map<string, string>();
  await Promise.all(
    motionIds.map(async (mid) => {
      try {
        const url = await getMotionUrl(mid);
        map.set(mid, url);
      } catch (e) {
      }
    })
  );

  return map;
}

/* =========================
 * 9) 선택(블록별) Bulk 저장 (기존 - 사용 안함)
 * ========================= */
export async function saveEmotionSelections(
  selections: SelectionGroupDto[]
): Promise<string> {
  const motionIds = selections.flatMap(sel => sel.selectedMotionIds).filter(Boolean);
  return saveFinalSelections(motionIds);
}

/* =========================
 * 10) 저장된 선택 조회 (기존 - 사용 안함)
 * ========================= */
export async function getAllEmotionSelections(): Promise<SelectionGroupResponseDto[]> {
  const allSongs = await getAllSavedSongs();

  const results: SelectionGroupResponseDto[] = [];

  for (const song of allSongs) {
    for (const sel of song.selections) {
      const urlMap = await getMotionUrls(sel.selectedMotionIds);
      const videoUrls = sel.selectedMotionIds.map(id => urlMap.get(id) || '').filter(Boolean);

      results.push({
        lyricsGroup: sel.lyricsGroup,
        selectedMotionIds: sel.selectedMotionIds,
        videoUrls: videoUrls,
        startTime: sel.startTime,
        endTime: sel.endTime,
      });
    }
  }

  return results;
}