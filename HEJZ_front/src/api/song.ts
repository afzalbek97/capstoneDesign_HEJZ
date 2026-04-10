// src/services/song.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './baseUrl';

export type Song = {
  id: string;
  title: string;
  filepath: string;
  prompt?: string;
  lyrics?: string;
  taskId?: string;
  audioId?: string;
  sourceAudioUrl?: string;
  streamAudioUrl?: string;
  plainLyrics?: string;
  lyricsJson?: string | any;
};

export type SongResponse = {
  title?: string;
  taskId?: string;
  audioId?: string;
  audioUrl?: string;
  sourceAudioUrl?: string;
  streamAudioUrl?: string;
  sourceStreamAudioUrl?: string;
  prompt?: string;
  lyricsJson?: string;
  plainLyrics?: string;
  id?: string;
  songId?: string;
  songTitle?: string;
  filepath?: string;
  songUrl?: string;
  url?: string;
  description?: string;
  lyrics?: string;
};

export type TimestampLyricsRequest = {
  taskId: string;
  audioId: string;
};

async function getAuthHeaders() {
  const token = await AsyncStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * 타임스탬프 가사 가져오기 및 DB 저장
 * @param taskId - Task ID
 * @param audioId - Audio ID
 * @returns Promise<any>
 */
export async function getTimestampLyrics(taskId: string, audioId: string): Promise<any> {
  try {
    const headers = await getAuthHeaders();


    const response = await fetch(`${BASE_URL}/api/suno/get_timestamplyrics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify({ taskId, audioId }),
    });


    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();

    return result;
  } catch (error) {
    throw error;
  }
}

/**
 * 노래 목록 가져오기 (최근 20개)
 * @returns Promise<Song[]>
 */
export async function getSongList(): Promise<Song[]> {
  try {
    const headers = await getAuthHeaders();


    const response = await fetch(`${BASE_URL}/api/suno/getSongs`, {
      method: 'GET',
      headers: {
        ...headers,
      },
    });


    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();

    if (!result) {
      return [];
    }

    if (Array.isArray(result)) {
      return result.map((song: SongResponse) => parseSong(song));
    }

    if (result.data && Array.isArray(result.data)) {
      return result.data.map((song: SongResponse) => parseSong(song));
    }

    return [];
  } catch (error) {
    throw error;
  }
}

/**
 * 노래 가사 가져오기 (기존 API)
 * @param songId - 노래 ID
 * @returns Promise<string>
 */
export async function getLyrics(songId: string): Promise<string> {
  try {
    const headers = await getAuthHeaders();


    const response = await fetch(`${BASE_URL}/api/song/getlyrics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify({ songId }),
    });


    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();

    if (result.data) {
      if (typeof result.data === 'string') {
        return result.data;
      }
      if (result.data.lyrics) {
        return result.data.lyrics;
      }
      if (result.data.plainLyrics) {
        return result.data.plainLyrics;
      }
    }

    return '';
  } catch (error) {
    throw error;
  }
}

/**
 * API 응답을 Song 타입으로 변환
 * @param data - API 응답 데이터
 * @returns Song
 */
function parseSong(data: SongResponse): Song {
  return {
    id: data.taskId || data.audioId || data.id || data.songId || '',
    title: data.title || data.songTitle || '제목 없음',
    filepath: data.audioUrl || data.streamAudioUrl || data.sourceAudioUrl ||
              data.filepath || data.songUrl || data.url || '',
    prompt: data.prompt || data.description,
    lyrics: data.plainLyrics || data.lyrics,
    taskId: data.taskId,
    audioId: data.audioId,
    sourceAudioUrl: data.sourceAudioUrl,
    streamAudioUrl: data.streamAudioUrl,
    plainLyrics: data.plainLyrics,
    lyricsJson: data.lyricsJson,
  };
}