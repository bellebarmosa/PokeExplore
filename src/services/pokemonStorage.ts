/**
 * Pokemon Storage Service
 * Stores caught Pokemon using AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pokemon } from './pokeapi';

const CAUGHT_POKEMON_KEY = '@pokeexplore:caught_pokemon';

export interface CaughtPokemon extends Pokemon {
  caughtAt: string;
  caughtLocation?: {
    latitude: number;
    longitude: number;
  };
  caughtMethod: 'default' | 'ar';
  isShiny: boolean;
}

/**
 * Get all caught Pokemon
 */
export const getCaughtPokemon = async (): Promise<CaughtPokemon[]> => {
  try {
    const data = await AsyncStorage.getItem(CAUGHT_POKEMON_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Failed to get caught Pokemon:', error);
    return [];
  }
};

/**
 * Add a caught Pokemon
 */
export const addCaughtPokemon = async (
  pokemon: Pokemon,
  location?: { latitude: number; longitude: number },
  method: 'default' | 'ar' = 'default',
  isShiny: boolean = false
): Promise<void> => {
  try {
    const caughtPokemon: CaughtPokemon = {
      ...pokemon,
      caughtAt: new Date().toISOString(),
      caughtLocation: location,
      caughtMethod: method,
      isShiny,
    };

    const existing = await getCaughtPokemon();
    // Check if Pokemon is already caught (by ID)
    const isAlreadyCaught = existing.some((p) => p.id === pokemon.id);
    
    if (!isAlreadyCaught) {
      const updated = [...existing, caughtPokemon];
      await AsyncStorage.setItem(CAUGHT_POKEMON_KEY, JSON.stringify(updated));
    }
  } catch (error) {
    console.error('Failed to add caught Pokemon:', error);
    throw error;
  }
};

/**
 * Check if a Pokemon is already caught
 */
export const isPokemonCaught = async (pokemonId: number): Promise<boolean> => {
  try {
    const caught = await getCaughtPokemon();
    return caught.some((p) => p.id === pokemonId);
  } catch (error) {
    console.error('Failed to check if Pokemon is caught:', error);
    return false;
  }
};

/**
 * Remove a caught Pokemon
 */
export const removeCaughtPokemon = async (pokemonId: number): Promise<void> => {
  try {
    const existing = await getCaughtPokemon();
    const updated = existing.filter((p) => p.id !== pokemonId);
    await AsyncStorage.setItem(CAUGHT_POKEMON_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to remove caught Pokemon:', error);
    throw error;
  }
};

