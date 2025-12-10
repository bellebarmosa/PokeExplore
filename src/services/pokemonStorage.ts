/**
 * Pokemon Storage Service
 * Stores caught Pokemon using Firebase Firestore
 */

import firestore from '@react-native-firebase/firestore';
import { Pokemon } from './pokeapi';
import { useAuth } from '../contexts/AuthContext';

export interface CaughtPokemon extends Pokemon {
  caughtAt: string;
  caughtLocation?: {
    latitude: number;
    longitude: number;
  };
  caughtMethod: 'default' | 'ar';
  isShiny: boolean;
  userId: string; // Store user ID to associate Pokemon with user
}

const COLLECTION_NAME = 'caughtPokemon';

/**
 * Get all caught Pokemon for the current user
 */
export const getCaughtPokemon = async (userId: string): Promise<CaughtPokemon[]> => {
  try {
    const snapshot = await firestore()
      .collection(COLLECTION_NAME)
      .where('userId', '==', userId)
      .get();

    // Sort by caughtAt in descending order (newest first) in JavaScript
    const pokemon = snapshot.docs.map((doc) => doc.data() as CaughtPokemon);
    return pokemon.sort((a, b) => {
      const dateA = new Date(a.caughtAt).getTime();
      const dateB = new Date(b.caughtAt).getTime();
      return dateB - dateA; // Descending order (newest first)
    });
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
  userId: string,
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
      userId,
    };

    // Check if Pokemon is already caught by this user
    const existing = await firestore()
      .collection(COLLECTION_NAME)
      .where('userId', '==', userId)
      .where('id', '==', pokemon.id)
      .get();

    if (existing.empty) {
      // Add new Pokemon
      await firestore()
        .collection(COLLECTION_NAME)
        .add(caughtPokemon);
    } else {
      // Update existing Pokemon (in case user wants to update shiny status, etc.)
      const docId = existing.docs[0].id;
      await firestore()
        .collection(COLLECTION_NAME)
        .doc(docId)
        .update(caughtPokemon);
    }
  } catch (error) {
    console.error('Failed to add caught Pokemon:', error);
    throw error;
  }
};

/**
 * Check if a Pokemon is already caught by the user
 */
export const isPokemonCaught = async (pokemonId: number, userId: string): Promise<boolean> => {
  try {
    const snapshot = await firestore()
      .collection(COLLECTION_NAME)
      .where('userId', '==', userId)
      .where('id', '==', pokemonId)
      .limit(1)
      .get();

    return !snapshot.empty;
  } catch (error) {
    console.error('Failed to check if Pokemon is caught:', error);
    return false;
  }
};

/**
 * Remove a caught Pokemon
 */
export const removeCaughtPokemon = async (pokemonId: number, userId: string): Promise<void> => {
  try {
    const snapshot = await firestore()
      .collection(COLLECTION_NAME)
      .where('userId', '==', userId)
      .where('id', '==', pokemonId)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      await snapshot.docs[0].ref.delete();
    }
  } catch (error) {
    console.error('Failed to remove caught Pokemon:', error);
    throw error;
  }
};
