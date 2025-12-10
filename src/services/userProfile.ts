/**
 * User Profile Service
 * Manages user profile information
 */

import firestore from '@react-native-firebase/firestore';

export interface UserProfile {
  userId: string;
  displayName: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

const USERS_COLLECTION = 'users';

/**
 * Get user profile
 */
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const doc = await firestore().collection(USERS_COLLECTION).doc(userId).get();
    
    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    const profile = {
      userId: doc.id,
      ...data,
    } as UserProfile;

    // Fix: If displayName is email prefix, update it to 'Trainer'
    if (profile.displayName && profile.email && profile.displayName === profile.email.split('@')[0]) {
      console.log(`Fixing profile: ${userId} has email prefix as displayName, updating to 'Trainer'`);
      await firestore().collection(USERS_COLLECTION).doc(userId).update({
        displayName: 'Trainer',
        updatedAt: new Date().toISOString(),
      });
      profile.displayName = 'Trainer';
    }

    return profile;
  } catch (error) {
    console.error('Failed to get user profile:', error);
    return null;
  }
};

/**
 * Create or update user profile
 */
export const updateUserProfile = async (
  userId: string,
  email: string,
  displayName: string
): Promise<void> => {
  try {
    const userRef = firestore().collection(USERS_COLLECTION).doc(userId);
    const userDoc = await userRef.get();

    // Use set with merge to create or update
    // This ensures the document exists even if there's a race condition
    const profileData: any = {
      userId,
      displayName,
      updatedAt: new Date().toISOString(),
    };

    if (userDoc.exists) {
      // Update existing profile - only update displayName and updatedAt
      await userRef.update({
        displayName,
        updatedAt: new Date().toISOString(),
      });
    } else {
      // Create new profile with all fields
      profileData.email = email;
      profileData.createdAt = new Date().toISOString();
      await userRef.set(profileData);
    }
  } catch (error) {
    console.error('Failed to update user profile:', error);
    // If update fails, try set with merge as fallback
    try {
      await firestore().collection(USERS_COLLECTION).doc(userId).set({
        userId,
        email,
        displayName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (fallbackError) {
      console.error('Fallback update also failed:', fallbackError);
      throw error; // Throw original error
    }
  }
};

/**
 * Initialize user profile (called on first login/signup)
 */
export const initializeUserProfile = async (
  userId: string,
  email: string,
  displayName?: string
): Promise<void> => {
  try {
    const userRef = firestore().collection(USERS_COLLECTION).doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      // Create new profile with default display name
      // Use provided displayName, or 'Trainer' as default (never use email prefix)
      const defaultName = displayName || 'Trainer';
      await userRef.set({
        userId,
        email,
        displayName: defaultName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } else {
      // If profile exists but displayName is email prefix, update it to 'Trainer'
      const existingData = userDoc.data();
      if (existingData?.displayName && existingData.displayName === email?.split('@')[0]) {
        await userRef.update({
          displayName: 'Trainer',
          updatedAt: new Date().toISOString(),
        });
      }
    }
  } catch (error) {
    console.error('Failed to initialize user profile:', error);
    throw error;
  }
};

