import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getFeedPosts, FeedPost } from '../services/feed';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import TypeIcon from '../components/TypeIcon';

const FeedScreen = () => {
  const insets = useSafeAreaInsets();
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadFeedPosts();
  }, []);

  const loadFeedPosts = async () => {
    try {
      setLoading(true);
      const posts = await getFeedPosts(50);
      setFeedPosts(posts);
    } catch (error) {
      console.error('Failed to load feed posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFeedPosts();
    setRefreshing(false);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Helper function to parse achievement info from name
  const parseAchievementInfo = (achievementName: string): { isCatch: boolean; type?: string; romanNumeral?: string } => {
    if (achievementName.startsWith('Catch ')) {
      const romanNumeral = achievementName.replace('Catch ', '');
      return { isCatch: true, romanNumeral };
    } else {
      // Type achievement: "Fire I", "Normal II", etc.
      const parts = achievementName.split(' ');
      if (parts.length >= 2) {
        const type = parts[0].toLowerCase();
        const romanNumeral = parts[1];
        return { isCatch: false, type, romanNumeral };
      }
    }
    return { isCatch: false };
  };

  // Helper function to convert roman numeral to milestone
  const romanToMilestone = (roman: string): number => {
    const map: { [key: string]: number } = {
      'I': 1,
      'II': 5,
      'III': 10,
      'IV': 50,
      'V': 100,
      'VI': 500,
    };
    return map[roman] || 0;
  };

  const renderFeedPost = ({ item }: { item: FeedPost }) => {
    if (item.postType === 'achievement' && item.achievementName) {
      const achievementInfo = parseAchievementInfo(item.achievementName);
      
      return (
        <View style={styles.feedPostCard}>
          <View style={styles.feedPostIconContainer}>
            {achievementInfo.isCatch ? (
              <View style={styles.pokeballIconWithBadgeFeed}>
                <Image
                  source={require('../icons/pokeball.png')}
                  style={styles.pokeballIconFeed}
                  resizeMode="contain"
                />
                {achievementInfo.romanNumeral && (
                  <View style={styles.romanNumeralBadgeFeed}>
                    <Text style={styles.romanNumeralTextFeed}>{achievementInfo.romanNumeral}</Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.typeIconWithBadgeFeed}>
                <TypeIcon type={achievementInfo.type || 'normal'} size={32} />
                {achievementInfo.romanNumeral && (
                  <View style={styles.romanNumeralBadgeFeed}>
                    <Text style={styles.romanNumeralTextFeed}>{achievementInfo.romanNumeral}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
          <View style={styles.feedPostContent}>
            <Text style={styles.feedPostText}>
              <Text style={styles.feedPostUserName}>{item.userDisplayName}</Text> has achieved "
              {item.achievementName}" achievement
            </Text>
            <Text style={styles.feedPostDate}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>
      );
    } else {
      return (
        <View style={styles.feedPostCard}>
          <Image
            source={{ uri: item.pokemonSprite || 'https://via.placeholder.com/60' }}
            style={styles.feedPostImage}
          />
          <View style={styles.feedPostContent}>
            <Text style={styles.feedPostText}>
              <Text style={styles.feedPostUserName}>{item.userDisplayName}</Text> has caught a "
              {item.pokemonName?.charAt(0).toUpperCase() + item.pokemonName?.slice(1)}"
            </Text>
            <Text style={styles.feedPostDate}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>
      );
    }
  };

  if (loading && feedPosts.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Feed</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Feed</Text>
      </View>
      <FlatList
        data={feedPosts}
        renderItem={renderFeedPost}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.feedList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3498db" />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No feed posts yet. Start catching Pokemon!</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedList: {
    padding: 16,
  },
  feedPostCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  feedPostIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  pokeballIconWithBadgeFeed: {
    position: 'relative',
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pokeballIconFeed: {
    width: 32,
    height: 32,
  },
  typeIconWithBadgeFeed: {
    position: 'relative',
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  romanNumeralBadgeFeed: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#fff',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  romanNumeralTextFeed: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  feedPostImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
    backgroundColor: '#f8f9fa',
  },
  feedPostContent: {
    flex: 1,
    justifyContent: 'center',
  },
  feedPostText: {
    fontSize: 16,
    color: '#2c3e50',
    marginBottom: 4,
    lineHeight: 22,
  },
  feedPostUserName: {
    fontWeight: '600',
    color: '#3498db',
  },
  feedPostDate: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default FeedScreen;
