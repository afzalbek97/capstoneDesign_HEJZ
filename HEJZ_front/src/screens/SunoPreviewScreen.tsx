import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, ScrollView, ImageBackground } from 'react-native';
import Slider from '@react-native-community/slider';
import axios from 'axios';
import SoundPlayer from 'react-native-sound-player';
import BASE_URL from '../api/baseUrl';

// interface Props {
//   route: RouteProp<{ params: { title: string; audioUrl: string } }, 'params'>;
// }

const SunoPreviewScreen = () => {
//   const { title, audioUrl } = route.params;
  const [title, setTitle] = useState('');
  const [callbackUrl, setCallbackUrl] = useState('');
  const [prompt, setPrompt] = useState('');
  const [sourceAudioUrl, setSourceAudioUrl] = useState('');
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [taskId, setTaskId] = useState('');
  const [audioId, setAudioId] = useState('');
  const [lyrics, setLyrics] = useState('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [parseLyrics, setParseLyrics] = useState('');

  const [isLoading, setIsLoading] = useState(false);


     const generateSong = async () => {
        try {
          const response = await axios.post(`${callbackUrl}/api/suno/generate`, {
            prompt: prompt,
            style: '',
            title: '',
            customMode: false,
            instrumental: false,
            model: 'V3_5',
            callBackUrl: callBackUrl+'/api/suno/callback',
          });
          Alert.alert('요청 성공', '서버에서 곡 생성 요청을 성공적으로 보냈어요.');
        } catch (error) {
          Alert.alert('요청 실패', '곡 생성 요청 중 오류가 발생했어요.');
        }
      };

      const fetchSavedSongs = async () => {
          try {
            const res = await axios.get(`${callbackUrl}/api/suno/latest`);
            const song = res.data[0];
            setTitle(song.title);
            setSourceAudioUrl(song.sourceAudioUrl);
            setTaskId(song.taskId);
            setAudioId(song.audioId);
            setLyrics(song.prompt);


            lyricsAnalyze();

          } catch (err) {
          }
        };

      const lyricsAnalyze = async () => {
        try {
          const cleanedLyrics = stripSectionHeaders(lyrics);
          const parsedLyrics = cleanedLyrics.replace(/\n/g, "\\n");
          setParseLyrics(parsedLyrics);


          const res = await axios.post(
            `${BASE_URL}/api/emotion/analyze`,
            { lyrics: parsedLyrics },
            {
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );

        } catch (err) {
        }
      };

      function stripSectionHeaders(lyrics: string): string {
        return lyrics
          .split('\n')
          .filter(line => !line.trim().startsWith('['))
          .filter(line => line.trim() !== '')
          .join('\n');
      }

//       useEffect(() => {
//          }, [lyrics]);

  const playSong = () => {
    setIsLoading(true);
    try {
      SoundPlayer.playUrl(sourceAudioUrl);
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(async () => {
        try {
          const info = await SoundPlayer.getInfo();
          setCurrentTime(info.currentTime || 0);
          setDuration(info.duration || 0);

          if (isLoading && info.currentTime > 0) {
            setIsLoading(false);
          }
        } catch (e) {
        }
      }, 500);
    } catch (e) {
      Alert.alert('재생 실패', '오디오 URL에 접근할 수 없습니다.');
    }
  };

  const stopSong = () => {
    try {
      SoundPlayer.stop();
      if (intervalRef.current) clearInterval(intervalRef.current);
    } catch (e) {
    }
  };

  const handleSeek = (value: number) => {
    SoundPlayer.seek(value);
    setCurrentTime(value);
  };


  useEffect(() => {
     fetchSavedSongs();
   }, []);

  return (
  <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 16, padding: 20 }}>
      <ImageBackground
                source={require('../assets/background/mainbackground.png')}
                style={styles.background}
                resizeMode="cover"
              >
        <View style={styles.container}>
              <Text style={styles.header}>🎵 {title || '생성된 곡이 없습니다.'}</Text>

              <TextInput
                style={styles.input}
                placeholder="프롬프트 입력"
                value={prompt}
                onChangeText={setPrompt}
              />

              <TextInput
                style={styles.input}
                placeholder="콜백 URL 입력"
                value={callbackUrl}
                onChangeText={setCallbackUrl}
              />

              <TouchableOpacity onPress={generateSong} style={[styles.button, styles.generate]}>
                <Text style={styles.buttonText}>🎶 곡 생성하기</Text>
              </TouchableOpacity>

              <View style={styles.controls}>
                <TouchableOpacity onPress={playSong} style={[styles.button, styles.play]}>
                  <Text style={styles.buttonText}>▶️ 재생</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={stopSong} style={[styles.button, styles.stop]}>
                  <Text style={styles.buttonText}>⏹ 정지</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={fetchSavedSongs} style={[styles.button, styles.stop]}>
                  <Text style={styles.buttonText}>⏹ 페치</Text>
                </TouchableOpacity>
              </View>

              <Slider
                value={currentTime}
                minimumValue={0}
                maximumValue={duration}
                onSlidingComplete={handleSeek}
                minimumTrackTintColor="#4B9DFE"
                maximumTrackTintColor="#ddd"
                thumbTintColor="#4B9DFE"
                style={{ marginTop: 16 }}
              />
              <Text style={styles.time}>
                {Math.floor(currentTime)} / {Math.floor(duration)} 초
              </Text>

              {isLoading && (
                        <Text style={{ textAlign: 'center', marginBottom: 10, color: 'gray' }}>
                          🎶 재생 준비 중...
                        </Text>
                      )}
        </View>
        </ImageBackground>
    </View>
  );
};

export default SunoPreviewScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  play: {
    backgroundColor: '#4B9DFE',
  },
  stop: {
    backgroundColor: '#FE4B4B',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  time: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginTop: 12,
  },
});
