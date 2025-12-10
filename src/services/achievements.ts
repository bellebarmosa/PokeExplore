/**
 * Achievements Service
 * Tracks and manages user achievements
 */

import firestore from '@react-native-firebase/firestore';
import { getUserProfile, initializeUserProfile } from './userProfile';

export interface Achievement {
  id: string;
  userId: string;
  achievementType: 'catch_milestone' | 'type_milestone';
  achievementName: string; // e.g., "Catch I", "Fire I", "Normal II"
  pokemonType?: string; // For type milestones
  milestone: number; // 1, 5, 10, 50, 100, 500
  unlockedAt: string;
  pokemonId?: number; // For catch milestones, the Pokemon that triggered it
}

export interface UserAchievement extends Achievement {
  displayName: string; // User's display name at time of achievement
}

const ACHIEVEMENTS_COLLECTION = 'achievements';
const USERS_COLLECTION = 'users';

/**
 * Achievement milestone levels
 */
export const CATCH_MILESTONES = [1, 5, 10, 50, 100, 500];
export const TYPE_MILESTONES = [1, 5, 10, 50, 100, 500];

/**
 * Get achievement name for catch milestone
 */
export const getCatchAchievementName = (milestone: number): string => {
  const names: { [key: number]: string } = {
    1: 'Catch I',
    5: 'Catch II',
    10: 'Catch III',
    50: 'Catch IV',
    100: 'Catch V',
    500: 'Catch VI',
  };
  return names[milestone] || `Catch ${milestone}`;
};

/**
 * Get achievement name for type milestone
 */
export const getTypeAchievementName = (type: string, milestone: number): string => {
  const typeName = type.charAt(0).toUpperCase() + type.slice(1);
  const names: { [key: number]: string } = {
    1: `${typeName} I`,
    5: `${typeName} II`,
    10: `${typeName} III`,
    50: `${typeName} IV`,
    100: `${typeName} V`,
    500: `${typeName} VI`,
  };
  return names[milestone] || `${typeName} ${milestone}`;
};

/**
 * Get all achievements for a user
 */
export const getUserAchievements = async (userId: string): Promise<Achievement[]> => {
  try {
    const snapshot = await firestore()
      .collection(ACHIEVEMENTS_COLLECTION)
      .where('userId', '==', userId)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Achievement));
  } catch (error) {
    console.error('Failed to get user achievements:', error);
    return [];
  }
};

/**
 * Check if user has a specific achievement
 */
export const hasAchievement = async (
  userId: string,
  achievementType: 'catch_milestone' | 'type_milestone',
  achievementName: string
): Promise<boolean> => {
  try {
    const snapshot = await firestore()
      .collection(ACHIEVEMENTS_COLLECTION)
      .where('userId', '==', userId)
      .where('achievementType', '==', achievementType)
      .where('achievementName', '==', achievementName)
      .limit(1)
      .get();

    return !snapshot.empty;
  } catch (error) {
    console.error('Failed to check achievement:', error);
    return false;
  }
};

/**
 * Unlock an achievement
 */
export const unlockAchievement = async (
  userId: string,
  achievementType: 'catch_milestone' | 'type_milestone',
  achievementName: string,
  milestone: number,
  pokemonType?: string,
  pokemonId?: number
): Promise<void> => {
  try {
    // Check if already unlocked
    const alreadyUnlocked = await hasAchievement(userId, achievementType, achievementName);
    if (alreadyUnlocked) {
      return; // Already has this achievement
    }

    // Get user display name from profile - ensure profile exists
    let userProfile = await getUserProfile(userId);
    if (!userProfile) {
      // Profile doesn't exist, but we can't initialize without email
      // Just use 'Trainer' as fallback
      console.warn(`User profile not found for userId: ${userId}`);
    }
    const displayName = userProfile?.displayName || 'Trainer';

    // Create achievement - only include optional fields if they're defined
    const achievementData: any = {
      userId,
      achievementType,
      achievementName,
      milestone,
      unlockedAt: new Date().toISOString(),
    };

    // Only add optional fields if they're defined
    if (pokemonType !== undefined) {
      achievementData.pokemonType = pokemonType;
    }
    if (pokemonId !== undefined) {
      achievementData.pokemonId = pokemonId;
    }

    await firestore().collection(ACHIEVEMENTS_COLLECTION).add(achievementData);
  } catch (error) {
    console.error('Failed to unlock achievement:', error);
    throw error;
  }
};

/**
 * Check and unlock achievements based on catch count
 */
export const checkCatchAchievements = async (
  userId: string,
  totalCaught: number,
  pokemonId: number
): Promise<Achievement[]> => {
  const unlocked: Achievement[] = [];

  for (const milestone of CATCH_MILESTONES) {
    if (totalCaught >= milestone) {
      const achievementName = getCatchAchievementName(milestone);
      const hasIt = await hasAchievement(userId, 'catch_milestone', achievementName);
      
      if (!hasIt) {
        await unlockAchievement(userId, 'catch_milestone', achievementName, milestone, undefined, pokemonId);
        unlocked.push({
          id: '',
          userId,
          achievementType: 'catch_milestone',
          achievementName,
          milestone,
          unlockedAt: new Date().toISOString(),
          pokemonId,
        });
      }
    }
  }

  return unlocked;
};

/**
 * Check and unlock achievements based on type catch count
 */
export const checkTypeAchievements = async (
  userId: string,
  type: string,
  typeCount: number
): Promise<Achievement[]> => {
  const unlocked: Achievement[] = [];

  for (const milestone of TYPE_MILESTONES) {
    if (typeCount >= milestone) {
      const achievementName = getTypeAchievementName(type, milestone);
      const hasIt = await hasAchievement(userId, 'type_milestone', achievementName);
      
      if (!hasIt) {
        await unlockAchievement(userId, 'type_milestone', achievementName, milestone, type);
        unlocked.push({
          id: '',
          userId,
          achievementType: 'type_milestone',
          achievementName,
          pokemonType: type,
          milestone,
          unlockedAt: new Date().toISOString(),
        });
      }
    }
  }

  return unlocked;
};

/**
 * Get catch count for a user
 */
export const getCatchCount = async (userId: string): Promise<number> => {
  try {
    const snapshot = await firestore()
      .collection('caughtPokemon')
      .where('userId', '==', userId)
      .get();

    return snapshot.size;
  } catch (error) {
    console.error('Failed to get catch count:', error);
    return 0;
  }
};

/**
 * Get catch count by type for a user
 */
export const getCatchCountByType = async (userId: string, type: string): Promise<number> => {
  try {
    const snapshot = await firestore()
      .collection('caughtPokemon')
      .where('userId', '==', userId)
      .get();

    let count = 0;
    snapshot.docs.forEach((doc) => {
      const pokemon = doc.data();
      if (pokemon.types && pokemon.types.some((t: any) => t.type.name === type)) {
        count++;
      }
    });

    return count;
  } catch (error) {
    console.error('Failed to get catch count by type:', error);
    return 0;
  }
};

