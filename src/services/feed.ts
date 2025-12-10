/**
 * Feed Service
 * Manages global feed posts (achievements and catches)
 */

import firestore from '@react-native-firebase/firestore';

export interface FeedPost {
  id: string;
  userId: string;
  userDisplayName: string;
  postType: 'achievement' | 'catch';
  achievementName?: string; // For achievement posts
  pokemonName?: string; // For catch posts
  pokemonId?: number; // For catch posts
  pokemonSprite?: string; // For catch posts
  createdAt: string;
}

const FEED_COLLECTION = 'feed';

/**
 * Create a feed post for an achievement
 */
export const createAchievementFeedPost = async (
  userId: string,
  userDisplayName: string,
  achievementName: string
): Promise<void> => {
  try {
    // Ensure all required fields are provided and not undefined
    const post: Omit<FeedPost, 'id'> = {
      userId,
      userDisplayName: userDisplayName || 'Trainer',
      postType: 'achievement',
      achievementName: achievementName || 'Unknown Achievement',
      createdAt: new Date().toISOString(),
    };

    await firestore().collection(FEED_COLLECTION).add(post);
  } catch (error) {
    console.error('Failed to create achievement feed post:', error);
    throw error;
  }
};

/**
 * Create a feed post for a catch
 */
export const createCatchFeedPost = async (
  userId: string,
  userDisplayName: string,
  pokemonName: string,
  pokemonId: number,
  pokemonSprite: string
): Promise<void> => {
  try {
    // Ensure all required fields are provided and not undefined
    const post: Omit<FeedPost, 'id'> = {
      userId,
      userDisplayName: userDisplayName || 'Trainer',
      postType: 'catch',
      pokemonName: pokemonName || 'Unknown',
      pokemonId: pokemonId || 0,
      pokemonSprite: pokemonSprite || '',
      createdAt: new Date().toISOString(),
    };

    await firestore().collection(FEED_COLLECTION).add(post);
  } catch (error) {
    console.error('Failed to create catch feed post:', error);
    throw error;
  }
};

/**
 * Get global feed posts (latest first)
 */
export const getFeedPosts = async (limit: number = 50): Promise<FeedPost[]> => {
  try {
    const snapshot = await firestore()
      .collection(FEED_COLLECTION)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as FeedPost));
  } catch (error) {
    console.error('Failed to get feed posts:', error);
    return [];
  }
};

/**
 * Get feed posts for a specific user
 */
export const getUserFeedPosts = async (userId: string, limit: number = 10): Promise<FeedPost[]> => {
  try {
    const snapshot = await firestore()
      .collection(FEED_COLLECTION)
      .where('userId', '==', userId)
      .get(); // Removed orderBy to avoid composite index requirement

    const posts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as FeedPost));
    
    // Sort in JavaScript after fetching
    posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return posts.slice(0, limit);
  } catch (error) {
    console.error('Failed to get user feed posts:', error);
    return [];
  }
};

