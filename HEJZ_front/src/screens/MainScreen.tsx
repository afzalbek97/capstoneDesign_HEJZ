import React, { useRef, useCallback } from 'react';
import {
  View,
  ImageBackground,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

const { width: W, height: H } = Dimensions.get('window');

const CLOUD_ASPECT = 768 / 855;
const CLOUD_H0 = H * 0.55;
const CLOUD_W0 = CLOUD_H0 * CLOUD_ASPECT;
const COVER_SCALE = 3.0;
const CLOUD_OFFSET_X = W * 0.4;
const CLOUD_OFFSET_Y = H * 0.17;

export default function MainScreen({ navigation }: Props) {
  const progress = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      progress.setValue(0);
    }, [progress])
  );

  const uiOpacity = progress.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [1, 0.2, 0],
  });

  const overlayOpacity = progress.interpolate({
    inputRange: [0.9, 1],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const cloudStyle = {
    width: CLOUD_W0,
    height: CLOUD_H0,
    position: 'absolute' as const,
    left: progress.interpolate({
      inputRange: [0, 1],
      outputRange: [
        -CLOUD_W0 * 0.65 + CLOUD_OFFSET_X,
        W / 2 - (CLOUD_W0 * COVER_SCALE) / 2 + CLOUD_OFFSET_X,
      ],
    }),
    bottom: progress.interpolate({
      inputRange: [0, 1],
      outputRange: [
        -CLOUD_H0 * 0.35 - CLOUD_OFFSET_Y,
        H / 2 - (CLOUD_H0 * COVER_SCALE) / 2 - CLOUD_OFFSET_Y,
      ],
    }),
    transform: [
      {
        scale: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [1, COVER_SCALE],
        }),
      },
      {
        rotate: progress.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '-2deg'],
        }),
      },
    ],
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dy) > 2 || Math.abs(g.dx) > 2,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,

      onPanResponderMove: (_e, g) => {
        const dy = Math.max(0, -g.dy);
        const p = Math.min(1, dy / (H * 0.8));
        progress.setValue(p);
      },
      onPanResponderRelease: (_e, g) => {
        const dy = Math.max(0, -g.dy);
        const passed = dy > H * 0.25;
        Animated.timing(progress, {
          toValue: passed ? 1 : 0,
          duration: passed ? 320 : 220,
          useNativeDriver: false,
        }).start(() => {
          if (passed) {
            navigation.navigate('Community', {
              screen: 'MyRoom',
              params: { refresh: Date.now() },
              merge: true,
            });
          }
        });
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../assets/background/newback.png')}
        style={styles.background}
        resizeMode="cover"
        pointerEvents="box-none"
      >
        <Animated.View style={[styles.uiLayer, { opacity: uiOpacity }]} />
      </ImageBackground>

      <Animated.Image
        source={require('../assets/icon/cloud2.png')}
        style={cloudStyle}
        resizeMode="contain"
        pointerEvents="none"
      />

      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFillObject, { backgroundColor: '#FFF', opacity: overlayOpacity }]}
      />

      <View
        style={styles.gestureLayer}
        pointerEvents="box-only"
        collapsable={false}
        {...panResponder.panHandlers}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0E1220' },
  background: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end' },
  uiLayer: { padding: 16 },
  gestureLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
});
