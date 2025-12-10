/**
 * Generation Ranges Utility
 * Maps Pokemon generations to National Pokedex number ranges
 * Based on Bulbapedia: https://bulbapedia.bulbagarden.net/wiki/List_of_Pokémon_by_National_Pokédex_number
 */

export interface GenerationRange {
  start: number;
  end: number;
  name: string;
}

/**
 * Generation ranges based on National Pokedex numbers
 */
export const GENERATION_RANGES: { [key: string]: GenerationRange } = {
  'generation-i': { start: 1, end: 151, name: 'Kanto' },
  'generation-ii': { start: 152, end: 251, name: 'Johto' },
  'generation-iii': { start: 252, end: 386, name: 'Hoenn' },
  'generation-iv': { start: 387, end: 493, name: 'Sinnoh' },
  'generation-v': { start: 494, end: 649, name: 'Unova' },
  'generation-vi': { start: 650, end: 721, name: 'Kalos' },
  'generation-vii': { start: 722, end: 809, name: 'Alola' },
  'generation-viii': { start: 810, end: 905, name: 'Galar' },
  'generation-ix': { start: 906, end: 1025, name: 'Paldea' },
};

/**
 * Get the generation range for a given generation name
 */
export const getGenerationRange = (generationName: string): GenerationRange | null => {
  return GENERATION_RANGES[generationName] || null;
};

/**
 * Check if a Pokemon ID belongs to a specific generation
 */
export const isPokemonInGeneration = (pokemonId: number, generationName: string): boolean => {
  const range = getGenerationRange(generationName);
  if (!range) return false;
  return pokemonId >= range.start && pokemonId <= range.end;
};

/**
 * Get all Pokemon IDs for a specific generation
 */
export const getPokemonIdsForGeneration = (generationName: string): number[] => {
  const range = getGenerationRange(generationName);
  if (!range) return [];
  
  const ids: number[] = [];
  for (let id = range.start; id <= range.end; id++) {
    ids.push(id);
  }
  return ids;
};

