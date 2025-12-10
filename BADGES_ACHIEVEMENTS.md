# Badges & Achievements System

## Overview

The badges and achievements system tracks user progress and unlocks achievements based on Pokemon catches. Achievements are automatically checked on every catch and displayed in the user's profile and global feed.

## Achievement Types

### 1. Catch Milestones
- **Catch I**: Catch 1 Pokemon
- **Catch II**: Catch 5 Pokemon
- **Catch III**: Catch 10 Pokemon
- **Catch IV**: Catch 50 Pokemon
- **Catch V**: Catch 100 Pokemon
- **Catch VI**: Catch 500 Pokemon

### 2. Type Milestones
For each Pokemon type (Normal, Fire, Water, etc.), there are 6 milestone levels:
- **{Type} I**: Catch 1 Pokemon of this type
- **{Type} II**: Catch 5 Pokemon of this type
- **{Type} III**: Catch 10 Pokemon of this type
- **{Type} IV**: Catch 50 Pokemon of this type
- **{Type} V**: Catch 100 Pokemon of this type
- **{Type} VI**: Catch 500 Pokemon of this type

## Features

### Automatic Achievement Checking
- When a user catches a Pokemon, the system automatically:
  1. Checks total catch count for catch milestones
  2. Checks type-specific catch counts for type milestones
  3. Unlocks any new achievements
  4. Creates feed posts for newly unlocked achievements
  5. Creates a feed post for the catch itself

### Profile Page
The profile page displays:
- **User Information**: Editable display name, email
- **Latest Feed Posts**: 5 most recent feed posts (achievements or catches)
- **Latest Achievements**: 5 most recently unlocked achievements
- **All Achievements**: Complete list of all unlocked achievements
- **Latest Caught Pokemon**: 5 most recently caught Pokemon
- **All Caught Pokemon**: Complete list of all caught Pokemon

### Feed Page
The global feed shows:
- Achievement posts: "User X has achieved 'Fire I' achievement on date"
- Catch posts: "User X has caught a 'Pikachu' on date"
- Posts are sorted by date (newest first)
- Pull-to-refresh functionality

## Technical Implementation

### Services

#### `achievements.ts`
- `getUserAchievements(userId)`: Get all achievements for a user
- `checkCatchAchievements(userId, totalCaught, pokemonId)`: Check and unlock catch milestones
- `checkTypeAchievements(userId, type, typeCount)`: Check and unlock type milestones
- `unlockAchievement(...)`: Unlock a specific achievement
- `hasAchievement(...)`: Check if user has a specific achievement

#### `feed.ts`
- `createAchievementFeedPost(...)`: Create a feed post for an achievement
- `createCatchFeedPost(...)`: Create a feed post for a catch
- `getFeedPosts(limit)`: Get global feed posts
- `getUserFeedPosts(userId, limit)`: Get feed posts for a specific user

#### `userProfile.ts`
- `getUserProfile(userId)`: Get user profile
- `updateUserProfile(userId, email, displayName)`: Update user profile
- `initializeUserProfile(userId, email, displayName?)`: Initialize user profile on first login

### Firestore Collections

#### `achievements`
```typescript
{
  id: string;
  userId: string;
  achievementType: 'catch_milestone' | 'type_milestone';
  achievementName: string;
  pokemonType?: string;
  milestone: number;
  unlockedAt: string;
  pokemonId?: number;
}
```

#### `feed`
```typescript
{
  id: string;
  userId: string;
  userDisplayName: string;
  postType: 'achievement' | 'catch';
  achievementName?: string;
  pokemonName?: string;
  pokemonId?: number;
  pokemonSprite?: string;
  createdAt: string;
}
```

#### `users`
```typescript
{
  userId: string;
  displayName: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}
```

## Firestore Rules

Updated rules allow:
- Users to read/write their own achievements
- All authenticated users to read feed posts (global feed)
- Users to create feed posts only for themselves
- Users to read/write their own profile

See `FIRESTORE_RULES.md` for complete rules.

## User Flow

1. **User catches a Pokemon**
   - Pokemon is saved to `caughtPokemon` collection
   - Catch count is checked
   - Type counts are checked
   - New achievements are unlocked
   - Feed posts are created

2. **User views Profile**
   - Profile loads user info, achievements, feed posts, and caught Pokemon
   - User can edit their display name
   - All achievements are displayed

3. **User views Feed**
   - Global feed shows all achievement and catch posts
   - Posts are sorted by date (newest first)
   - User can pull to refresh

## Future Enhancements

Potential improvements:
- Achievement badges/icons
- Achievement progress indicators
- Special event achievements
- Leaderboards
- Achievement sharing to social media
- Achievement categories (explorer, collector, etc.)

