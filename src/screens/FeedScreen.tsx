import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getFeedPosts, FeedPost } from '../services/feed';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import TypeIcon from '../components/TypeIcon';

type RootStackParamList = {
  PostDetail: { post: FeedPost };
  MainTabs: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const POSTS_PER_PAGE = 25;

const FeedScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const [allFeedPosts, setAllFeedPosts] = useState<FeedPost[]>([]);
  const [displayedPosts, setDisplayedPosts] = useState<FeedPost[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadFeedPosts();
  }, []);

  useEffect(() => {
    updateDisplayedPosts();
  }, [allFeedPosts, currentPage]);

  const updateDisplayedPosts = () => {
    const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
    const endIndex = startIndex + POSTS_PER_PAGE;
    setDisplayedPosts(allFeedPosts.slice(startIndex, endIndex));
  };

  const loadFeedPosts = async () => {
    try {
      setLoading(true);
      const posts = await getFeedPosts(1000); // Load all posts for pagination
      setAllFeedPosts(posts);
      setCurrentPage(1);
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

  const totalPages = Math.ceil(allFeedPosts.length / POSTS_PER_PAGE);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handlePostPress = (post: FeedPost) => {
    navigation.navigate('PostDetail', { post });
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
        <TouchableOpacity 
          style={styles.feedPostCard}
          onPress={() => handlePostPress(item)}
          activeOpacity={0.7}
        >
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
        </TouchableOpacity>
      );
    } else {
      return (
        <TouchableOpacity 
          style={styles.feedPostCard}
          onPress={() => handlePostPress(item)}
          activeOpacity={0.7}
        >
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
        </TouchableOpacity>
      );
    }
  };

  if (loading && allFeedPosts.length === 0) {
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
        data={displayedPosts}
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
        ListFooterComponent={
          allFeedPosts.length > 0 ? (
            <View style={styles.paginationContainer}>
              <Text style={styles.paginationText}>
                Showing {Math.min((currentPage - 1) * POSTS_PER_PAGE + 1, allFeedPosts.length)} - {Math.min(currentPage * POSTS_PER_PAGE, allFeedPosts.length)} of {allFeedPosts.length} posts
              </Text>
              <View style={styles.paginationButtons}>
                <TouchableOpacity
                  style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
                  onPress={goToPreviousPage}
                  disabled={currentPage === 1}
                >
                  <Text style={[styles.paginationButtonText, currentPage === 1 && styles.paginationButtonTextDisabled]}>
                    Previous
                  </Text>
                </TouchableOpacity>
                <Text style={styles.pageNumberText}>
                  Page {currentPage} of {totalPages}
                </Text>
                <TouchableOpacity
                  style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
                  onPress={goToNextPage}
                  disabled={currentPage === totalPages}
                >
                  <Text style={[styles.paginationButtonText, currentPage === totalPages && styles.paginationButtonTextDisabled]}>
                    Next
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null
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
  paginationContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
    marginTop: 8,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  paginationText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 12,
  },
  paginationButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  paginationButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  paginationButtonDisabled: {
    backgroundColor: '#bdc3c7',
    opacity: 0.6,
  },
  paginationButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  paginationButtonTextDisabled: {
    color: '#7f8c8d',
  },
  pageNumberText: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '600',
  },
});

export default FeedScreen;
