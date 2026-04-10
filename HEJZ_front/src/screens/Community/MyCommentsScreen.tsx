import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

const MyCommentsScreen = ({ route }: { route: any }) => {
  const commentedShorts = route?.params?.commentedShorts ?? [];

  return (
    <View style={styles.container}>
      <Text style={styles.header}>내가 댓글 단 숏츠</Text>

      {commentedShorts.length === 0 ? (
        <Text style={styles.emptyText}>댓글을 단 숏츠가 아직 없어요 📝</Text>
      ) : (
        <FlatList
          data={commentedShorts}
          renderItem={({ item }) => (
            <View style={styles.shortsItem}>
              <View style={styles.thumbnail} />
              <Text style={styles.title}>{item.title}</Text>
              {item.comments.map((c: string, i: number) => (
                <Text key={i} style={styles.commentText}>• {c}</Text>
              ))}
            </View>
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
};


export default MyCommentsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
    color: '#000',
  },
  listContainer: {
    paddingBottom: 100,
  },
  shortsItem: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  thumbnail: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#eee',
    borderRadius: 6,
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
    color: '#000',
  },
  commentBox: {
    marginTop: 6,
  },
  commentText: {
    fontSize: 13,
    color: '#555',
    marginBottom: 2,
  },
  emptyText: {
  fontSize: 16,
  color: '#999',
  textAlign: 'center',
  marginTop: 100,
},

});