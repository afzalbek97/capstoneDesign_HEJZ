import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  Stats: undefined;
  Select: undefined;
  SignUp: undefined;
  Music: undefined;
  Dance: undefined;
  Community: { screen?: string; params?: object; merge?: boolean } | undefined;
  SongPlay: { songId: string };
  SunoPreviewScreen: undefined;
};

export type CommunityStackParamList = {
  Community: undefined;
  Feeds: undefined;
  Bookmark: undefined;
  Comments: undefined;
  BlockedUser: undefined;
  MyVideos: undefined;
  MySongs: undefined;
  MyPageOptions: undefined;
  EditProfile: undefined;
  EditPassword: undefined;
  MyRoom: { refresh?: number } | undefined;
  ComposeFeed: undefined;
  FeedDetail: { feedId: string | number };
  FeedCreate: undefined;
  Search: { screen?: string } | undefined;
  UserRoom: { userId?: string | number } | undefined;
  SignUp: undefined;
};

export type DanceStackParamList = {
  DanceScreen: undefined;
  DanceRecommendScreen: {
    p_id: string;
    p_title: string;
    p_filepath: string;
    p_emotion: string;
    p_genre: string;
    p_plainLyrics: string;
    p_lyricsJsonRaw: string;
  };
  RecordScreen: {
    videoUrl?: string;
    audioUrl?: string;
    motionTitle?: string;
  } | undefined;
};

export type RootNavigationProp = NativeStackNavigationProp<RootStackParamList>;
export type CommunityNavigationProp = NativeStackNavigationProp<CommunityStackParamList>;
export type DanceNavigationProp = NativeStackNavigationProp<DanceStackParamList>;

export type FeedDetailRouteProp = RouteProp<CommunityStackParamList, 'FeedDetail'>;
export type DanceRecommendRouteProp = RouteProp<DanceStackParamList, 'DanceRecommendScreen'>;
export type SongPlayRouteProp = RouteProp<RootStackParamList, 'SongPlay'>;
