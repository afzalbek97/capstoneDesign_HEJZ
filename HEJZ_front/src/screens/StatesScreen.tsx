import React from 'react';
import { View, Text, StyleSheet, ImageBackground } from 'react-native';

const StatsScreen = () => {
  const stats = {
    mostLiked: '-',
    songCount: 0,
    videoCount: 0,
    commentCount: 0,
  };

  return (
    <ImageBackground
      source={require('../assets/background/mainbackground.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <Text style={styles.title}>My Content Stats</Text>

        <View style={styles.section}>
          <Text style={styles.label}>Most Popular Post</Text>
          <Text style={styles.value}>{stats.mostLiked}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Songs Created</Text>
          <Text style={styles.value}>{stats.songCount}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Videos Created</Text>
          <Text style={styles.value}>{stats.videoCount}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Comments Written</Text>
          <Text style={styles.value}>{stats.commentCount}</Text>
        </View>
      </View>
    </ImageBackground>
  );
};

export default StatsScreen;

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 30,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  value: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
});
