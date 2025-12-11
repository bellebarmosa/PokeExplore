/**
 * Pokemon Cache Service
 * Handles offline caching of Pokemon data using AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pokemon, PokemonListResponse, Type, Generation } from './pokeapi';

const CACHE_PREFIX = 'pokemon_cache_';
const CACHE_EXPIRY_PREFIX = 'pokemon_cache_expiry_';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const MAX_CACHE_SIZE = 5 * 1024 * 1024; // 5MB total cache size limit
const MAX_ITEM_SIZE = 500 * 1024; // 500KB per item limit

interface CachedData<T> {
  data: T;
  timestamp: number;
}

/**
 * Get cache key for a specific resource
 */
const getCacheKey = (resource: string, identifier?: string | number): string => {
  return identifier 
    ? `${CACHE_PREFIX}${resource}_${identifier}`
    : `${CACHE_PREFIX}${resource}`;
};

const getExpiryKey = (resource: string, identifier?: string | number): string => {
  return identifier 
    ? `${CACHE_EXPIRY_PREFIX}${resource}_${identifier}`
    : `${CACHE_EXPIRY_PREFIX}${resource}`;
};

/**
 * Check if cached data is still valid
 */
const isCacheValid = async (resource: string, identifier?: string | number): Promise<boolean> => {
  try {
    const expiryKey = getExpiryKey(resource, identifier);
    const expiryStr = await AsyncStorage.getItem(expiryKey);
    
    if (!expiryStr) {
      return false;
    }
    
    const expiry = parseInt(expiryStr, 10);
    return Date.now() < expiry;
  } catch (error) {
    console.error('Error checking cache validity:', error);
    return false;
  }
};

/**
 * Get cached data
 */
export const getCachedData = async <T>(
  resource: string,
  identifier?: string | number
): Promise<T | null> => {
  try {
    const isValid = await isCacheValid(resource, identifier);
    if (!isValid) {
      return null;
    }
    
    const cacheKey = getCacheKey(resource, identifier);
    const cachedStr = await AsyncStorage.getItem(cacheKey);
    
    if (!cachedStr) {
      return null;
    }
    
    const cached: CachedData<T> = JSON.parse(cachedStr);
    return cached.data;
  } catch (error) {
    console.error('Error getting cached data:', error);
    return null;
  }
};

/**
 * Evict old cache entries when storage is full
 */
const evictOldCacheEntries = async (): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
    const expiryKeys = keys.filter(key => key.startsWith(CACHE_EXPIRY_PREFIX));
    
    // Get all cache entries with their expiry times
    const entries: Array<{ cacheKey: string; expiryKey: string; expiry: number }> = [];
    
    for (const cacheKey of cacheKeys) {
      // Extract the resource and identifier from the cache key
      // Format: pokemon_cache_{resource}_{identifier} or pokemon_cache_{resource}
      const keyWithoutPrefix = cacheKey.replace(CACHE_PREFIX, '');
      const parts = keyWithoutPrefix.split('_');
      
      let resource: string;
      let identifier: string | undefined;
      
      if (parts.length > 1) {
        // Has identifier - last part is the identifier, rest is resource
        resource = parts[0];
        identifier = parts.slice(1).join('_');
      } else {
        resource = parts[0];
      }
      
      const expiryKey = getExpiryKey(resource, identifier);
      
      if (expiryKeys.includes(expiryKey)) {
        try {
          const expiryStr = await AsyncStorage.getItem(expiryKey);
          if (expiryStr) {
            const expiry = parseInt(expiryStr, 10);
            if (!isNaN(expiry)) {
              entries.push({
                cacheKey,
                expiryKey,
                expiry,
              });
            }
          }
        } catch (error) {
          // Skip this entry if we can't read it
          continue;
        }
      }
    }
    
    // Sort by expiry (oldest first) and remove 25% of entries
    entries.sort((a, b) => a.expiry - b.expiry);
    const toRemove = Math.max(1, Math.ceil(entries.length * 0.25)); // Remove at least 1
    
    const keysToRemove: string[] = [];
    for (let i = 0; i < toRemove && i < entries.length; i++) {
      keysToRemove.push(entries[i].cacheKey);
      keysToRemove.push(entries[i].expiryKey);
    }
    
    if (keysToRemove.length > 0) {
      // Remove in batches to avoid issues
      const batchSize = 50;
      for (let i = 0; i < keysToRemove.length; i += batchSize) {
        const batch = keysToRemove.slice(i, i + batchSize);
        try {
          await AsyncStorage.multiRemove(batch);
        } catch (error) {
          // Continue even if some removals fail
          console.warn('Error removing cache batch:', error);
        }
      }
      console.log(`Evicted ${keysToRemove.length / 2} old cache entries`);
    }
  } catch (error) {
    console.error('Error evicting cache entries:', error);
  }
};

/**
 * Set cached data
 */
export const setCachedData = async <T>(
  resource: string,
  data: T,
  identifier?: string | number
): Promise<void> => {
  try {
    // Skip caching if data is null or undefined
    if (data === null || data === undefined) {
      return;
    }
    
    const cacheKey = getCacheKey(resource, identifier);
    const expiryKey = getExpiryKey(resource, identifier);
    
    // Try to stringify the data first to catch any serialization errors
    let jsonString: string;
    try {
      const cached: CachedData<T> = {
        data,
        timestamp: Date.now(),
      };
      jsonString = JSON.stringify(cached);
    } catch (stringifyError: any) {
      console.error('Error stringifying cache data:', {
        resource,
        identifier,
        error: stringifyError?.message || String(stringifyError),
        errorType: typeof stringifyError,
      });
      return; // Give up if we can't stringify
    }
    
    // Check item size limit
    if (jsonString.length > MAX_ITEM_SIZE) {
      console.warn(`Cache item too large (${jsonString.length} bytes), skipping cache for ${cacheKey}`);
      return;
    }
    
    const expiry = Date.now() + CACHE_DURATION;
    
    // Try multiSet first (more efficient), fallback to individual setItem calls
    try {
      await AsyncStorage.multiSet([
        [cacheKey, jsonString],
        [expiryKey, expiry.toString()],
      ]);
    } catch (multiSetError: any) {
      const errorMessage = multiSetError?.message || String(multiSetError);
      
      // If storage is full, try to evict old entries and retry
      if (errorMessage.includes('full') || errorMessage.includes('SQLITE_FULL')) {
        console.warn('Storage full, evicting old cache entries...');
        await evictOldCacheEntries();
        
        // Retry after eviction
        try {
          await AsyncStorage.multiSet([
            [cacheKey, jsonString],
            [expiryKey, expiry.toString()],
          ]);
          return; // Success after eviction
        } catch (retryError: any) {
          // If still fails, try individual setItem
          try {
            await AsyncStorage.setItem(cacheKey, jsonString);
            await AsyncStorage.setItem(expiryKey, expiry.toString());
            return; // Success with setItem
          } catch (setItemError: any) {
            console.warn('Cache storage full even after eviction, skipping cache:', {
              resource,
              identifier,
            });
            return; // Give up gracefully
          }
        }
      }
      
      // If multiSet fails for other reasons, try individual setItem calls
      try {
        await AsyncStorage.setItem(cacheKey, jsonString);
        await AsyncStorage.setItem(expiryKey, expiry.toString());
      } catch (setItemError: any) {
        const setItemErrorMessage = setItemError?.message || String(setItemError);
        
        // If storage is full, try eviction
        if (setItemErrorMessage.includes('full') || setItemErrorMessage.includes('SQLITE_FULL')) {
          console.warn('Storage full, evicting old cache entries...');
          await evictOldCacheEntries();
          
          // Retry after eviction
          try {
            await AsyncStorage.setItem(cacheKey, jsonString);
            await AsyncStorage.setItem(expiryKey, expiry.toString());
            return; // Success after eviction
          } catch (retryError: any) {
            console.warn('Cache storage full even after eviction, skipping cache:', {
              resource,
              identifier,
            });
            return; // Give up gracefully
          }
        }
        
        // Other errors - log but don't throw
        console.warn('Error in AsyncStorage operation:', {
          resource,
          identifier,
          error: setItemErrorMessage,
        });
        return; // Give up gracefully instead of throwing
      }
    }
  } catch (error: any) {
    // Better error logging
    const errorMessage = error?.message || String(error);
    
    // Don't log storage full errors as errors - they're handled gracefully
    if (errorMessage.includes('full') || errorMessage.includes('SQLITE_FULL')) {
      return; // Already handled
    }
    
    console.warn('Error setting cached data:', {
      resource,
      identifier,
      error: errorMessage,
    });
  }
};

/**
 * Clear cached data for a specific resource
 */
export const clearCachedData = async (
  resource: string,
  identifier?: string | number
): Promise<void> => {
  try {
    const cacheKey = getCacheKey(resource, identifier);
    const expiryKey = getExpiryKey(resource, identifier);
    
    await AsyncStorage.multiRemove([cacheKey, expiryKey]);
  } catch (error) {
    console.error('Error clearing cached data:', error);
  }
};

/**
 * Clear all Pokemon cache
 */
export const clearAllCache = async (): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => 
      key.startsWith(CACHE_PREFIX) || key.startsWith(CACHE_EXPIRY_PREFIX)
    );
    
    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
    }
  } catch (error) {
    console.error('Error clearing all cache:', error);
  }
};

/**
 * Cache Pokemon details
 */
export const cachePokemon = async (pokemon: Pokemon): Promise<void> => {
  await setCachedData('pokemon', pokemon, pokemon.id);
};

/**
 * Get cached Pokemon
 */
export const getCachedPokemon = async (id: number): Promise<Pokemon | null> => {
  return getCachedData<Pokemon>('pokemon', id);
};

/**
 * Cache Pokemon list
 */
export const cachePokemonList = async (
  offset: number,
  limit: number,
  data: PokemonListResponse
): Promise<void> => {
  await setCachedData('pokemon_list', data, `${offset}_${limit}`);
};

/**
 * Get cached Pokemon list
 */
export const getCachedPokemonList = async (
  offset: number,
  limit: number
): Promise<PokemonListResponse | null> => {
  return getCachedData<PokemonListResponse>('pokemon_list', `${offset}_${limit}`);
};

/**
 * Cache types
 */
export const cacheTypes = async (types: Type[]): Promise<void> => {
  await setCachedData('types', types);
};

/**
 * Get cached types
 */
export const getCachedTypes = async (): Promise<Type[] | null> => {
  return getCachedData<Type[]>('types');
};

/**
 * Cache generations
 */
export const cacheGenerations = async (generations: Generation[]): Promise<void> => {
  await setCachedData('generations', generations);
};

/**
 * Get cached generations
 */
export const getCachedGenerations = async (): Promise<Generation[] | null> => {
  return getCachedData<Generation[]>('generations');
};

/**
 * Cache Pokemon by type
 */
export const cachePokemonByType = async (typeName: string, pokemon: Pokemon[]): Promise<void> => {
  await setCachedData('pokemon_by_type', pokemon, typeName);
};

/**
 * Get cached Pokemon by type
 */
export const getCachedPokemonByType = async (typeName: string): Promise<Pokemon[] | null> => {
  return getCachedData<Pokemon[]>('pokemon_by_type', typeName);
};

/**
 * Cache Pokemon by generation
 * Splits large arrays into chunks to avoid size limits
 */
export const cachePokemonByGeneration = async (
  generationName: string,
  pokemon: Pokemon[]
): Promise<void> => {
  // For large arrays, we might need to split them, but for now just cache directly
  // If it fails, it will be caught by setCachedData
  await setCachedData('pokemon_by_generation', pokemon, generationName);
};

/**
 * Get cached Pokemon by generation
 */
export const getCachedPokemonByGeneration = async (
  generationName: string
): Promise<Pokemon[] | null> => {
  return getCachedData<Pokemon[]>('pokemon_by_generation', generationName);
};

/**
 * Cache search results
 */
export const cacheSearchResults = async (query: string, pokemon: Pokemon[]): Promise<void> => {
  await setCachedData('search', pokemon, query.toLowerCase());
};

/**
 * Get cached search results
 */
export const getCachedSearchResults = async (query: string): Promise<Pokemon[] | null> => {
  return getCachedData<Pokemon[]>('search', query.toLowerCase());
};

/**
 * Get cache size (approximate)
 */
export const getCacheSize = async (): Promise<number> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => 
      key.startsWith(CACHE_PREFIX) || key.startsWith(CACHE_EXPIRY_PREFIX)
    );
    
    let totalSize = 0;
    const items = await AsyncStorage.multiGet(cacheKeys);
    
    for (const [, value] of items) {
      if (value) {
        totalSize += value.length;
      }
    }
    
    return totalSize;
  } catch (error) {
    console.error('Error calculating cache size:', error);
    return 0;
  }
};

