import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useUser } from '../../context/UserContext';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

type ShortItem = { id: string };

const FeedScreen = ({ navigation }: Props) => {
  const { user } = useUser();

  const renderItem = ({ item }: { item: ShortItem }) => (
    <View style={styles.gridItem}>
      <View style={styles.thumbnail} />
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => navigation.navigate('MyPageOptions')}
      >
        <Text style={styles.menuText}>⋮</Text>
      </TouchableOpacity>

      <View style={styles.profileBox}>
        {user.profileImage ? (
          <Image source={user.profileImage} style={styles.avatar} />
        ) : (
          <View style={styles.avatar} />
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.nickname}>{user.name}</Text>
          <Text style={styles.username}>@{user.username}</Text>
          <Text style={styles.bio}>{user.bio}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.editButton}
        onPress={() => navigation.navigate('EditProfile')}
      >
        <Text style={styles.editButtonText}>Edit Profile</Text>
      </TouchableOpacity>

      <FlatList
        data={[]}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={3}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.gridContainer}
      />
    </View>
  );
};

export default FeedScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
  },
  menuButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    borderRadius: 20,
    zIndex: 1,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  profileBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ccc',
  },
  nickname: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 2,
  },
  username: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  bio: {
    fontSize: 14,
    color: '#444',
  },
  editButton: {
    alignSelf: 'flex-end',
    backgroundColor: '#4B9DFE',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  gridContainer: {
    paddingBottom: 80,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  gridItem: {
    width: '32%',
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  thumbnail: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: '#ccc',
  },
});
