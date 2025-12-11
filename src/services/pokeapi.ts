/**
 * PokeAPI Service
 * Documentation: https://pokeapi.co/docs/v2#pokemon
 */

import {
  getCachedPokemon,
  cachePokemon,
  getCachedPokemonList,
  cachePokemonList,
  getCachedTypes,
  cacheTypes,
  getCachedGenerations,
  cacheGenerations,
  getCachedPokemonByType,
  cachePokemonByType,
  getCachedPokemonByGeneration,
  cachePokemonByGeneration,
  getCachedSearchResults,
  cacheSearchResults,
} from './pokemonCache';

const BASE_URL = 'https://pokeapi.co/api/v2';

export interface Pokemon {
  id: number;
  name: string;
  types: Array<{
    slot: number;
    type: {
      name: string;
      url: string;
    };
  }>;
  abilities: Array<{
    ability: {
      name: string;
      url: string;
    };
    is_hidden: boolean;
    slot: number;
  }>;
  stats: Array<{
    base_stat: number;
    effort: number;
    stat: {
      name: string;
      url: string;
    };
  }>;
  sprites: {
    front_default: string | null;
    front_shiny: string | null;
    back_default: string | null;
    back_shiny: string | null;
    other: {
      'official-artwork': {
        front_default: string | null;
        front_shiny: string | null;
      };
    };
  };
  height: number;
  weight: number;
  moves?: Array<{
    move: {
      name: string;
      url: string;
    };
  }>;
}

export interface PokemonListItem {
  name: string;
  url: string;
}

export interface PokemonListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: PokemonListItem[];
}

export interface Type {
  name: string;
  url: string;
}

export interface Generation {
  name: string;
  url: string;
}

export interface Habitat {
  name: string;
  url: string;
}

export interface HabitatDetail {
  id: number;
  name: string;
  names: Array<{
    language: {
      name: string;
      url: string;
    };
    name: string;
  }>;
  pokemon_species: Array<{
    name: string;
    url: string;
  }>;
}

/**
 * Fetch a single Pokemon by ID or name
 * Uses cache first, then falls back to API
 */
export const getPokemon = async (idOrName: string | number): Promise<Pokemon> => {
  // If it's a number, try cache first
  if (typeof idOrName === 'number') {
    const cached = await getCachedPokemon(idOrName);
    if (cached) {
      return cached;
    }
  }
  
  try {
    const response = await fetch(`${BASE_URL}/pokemon/${idOrName}`);
    if (!response.ok) {
      // If offline and we have a cached version (even expired), return it
      if (typeof idOrName === 'number') {
        const expiredCache = await getCachedPokemon(idOrName);
        if (expiredCache) {
          return expiredCache;
        }
      }
      throw new Error(`Failed to fetch Pokemon: ${response.statusText}`);
    }
    const data = await response.json();
    
    // Cache the Pokemon if we got an ID
    if (data.id) {
      await cachePokemon(data);
    }
    
    return data;
  } catch (error) {
    // If network error and we have cached data, return it even if expired
    if (typeof idOrName === 'number') {
      const cached = await getCachedPokemon(idOrName);
      if (cached) {
        return cached;
      }
    }
    throw error;
  }
};

/**
 * Fetch list of Pokemon with pagination
 * Uses cache first, then falls back to API
 */
export const getPokemonList = async (offset: number = 0, limit: number = 20): Promise<PokemonListResponse> => {
  const cached = await getCachedPokemonList(offset, limit);
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(`${BASE_URL}/pokemon?offset=${offset}&limit=${limit}`);
    if (!response.ok) {
      // If offline, try to return expired cache
      const expiredCache = await getCachedPokemonList(offset, limit);
      if (expiredCache) {
        return expiredCache;
      }
      throw new Error(`Failed to fetch Pokemon list: ${response.statusText}`);
    }
    const data = await response.json();
    
    // Cache the response
    await cachePokemonList(offset, limit, data);
    
    return data;
  } catch (error) {
    // If network error, try to return cached data even if expired
    const cached = await getCachedPokemonList(offset, limit);
    if (cached) {
      return cached;
    }
    throw error;
  }
};

/**
 * Fetch all Pokemon types
 * Uses cache first, then falls back to API
 */
export const getTypes = async (): Promise<Type[]> => {
  const cached = await getCachedTypes();
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(`${BASE_URL}/type`);
    if (!response.ok) {
      // If offline, try to return expired cache
      const expiredCache = await getCachedTypes();
      if (expiredCache) {
        return expiredCache;
      }
      throw new Error(`Failed to fetch types: ${response.statusText}`);
    }
    const data = await response.json();
    const results = data.results;
    
    // Cache the results
    await cacheTypes(results);
    
    return results;
  } catch (error) {
    // If network error, try to return cached data even if expired
    const cached = await getCachedTypes();
    if (cached) {
      return cached;
    }
    throw error;
  }
};

/**
 * Fetch all generations
 * Uses cache first, then falls back to API
 */
export const getGenerations = async (): Promise<Generation[]> => {
  const cached = await getCachedGenerations();
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(`${BASE_URL}/generation`);
    if (!response.ok) {
      // If offline, try to return expired cache
      const expiredCache = await getCachedGenerations();
      if (expiredCache) {
        return expiredCache;
      }
      throw new Error(`Failed to fetch generations: ${response.statusText}`);
    }
    const data = await response.json();
    const results = data.results;
    
    // Cache the results
    await cacheGenerations(results);
    
    return results;
  } catch (error) {
    // If network error, try to return cached data even if expired
    const cached = await getCachedGenerations();
    if (cached) {
      return cached;
    }
    throw error;
  }
};

/**
 * Fetch all Pokemon habitats
 */
export const getHabitats = async (): Promise<Habitat[]> => {
  const response = await fetch(`${BASE_URL}/pokemon-habitat`);
  if (!response.ok) {
    throw new Error(`Failed to fetch habitats: ${response.statusText}`);
  }
  const data = await response.json();
  return data.results;
};

/**
 * Get Pokemon species data (includes habitat)
 */
export const getPokemonSpecies = async (pokemonId: number): Promise<any> => {
  const response = await fetch(`${BASE_URL}/pokemon-species/${pokemonId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch Pokemon species: ${response.statusText}`);
  }
  return response.json();
};

/**
 * Get Pokemon by habitat
 */
export const getPokemonByHabitat = async (habitatName: string): Promise<Pokemon[]> => {
  try {
    const response = await fetch(`${BASE_URL}/pokemon-habitat/${habitatName}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch habitat: ${response.statusText}`);
    }
    const data: HabitatDetail = await response.json();
    
    // Get random Pokemon from this habitat (up to MAX_POKEMON)
    const speciesList = data.pokemon_species;
    const randomSpecies = speciesList
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(10, speciesList.length));
    
    // Fetch Pokemon details
    const pokemonPromises = randomSpecies.map(async (species) => {
      // Extract Pokemon ID from species URL
      const speciesId = species.url.split('/').filter(Boolean).pop();
      // Get species details to find the Pokemon ID
      const speciesResponse = await fetch(`${BASE_URL}/pokemon-species/${speciesId}`);
      if (!speciesResponse.ok) {
        throw new Error(`Failed to fetch species: ${speciesResponse.statusText}`);
      }
      const speciesData = await speciesResponse.json();
      // Get the first Pokemon variant (usually the base form)
      const pokemonId = speciesData.varieties[0]?.pokemon?.url?.split('/').filter(Boolean).pop();
      if (pokemonId) {
        return getPokemon(pokemonId);
      }
      return null;
    });
    
    const results = await Promise.all(pokemonPromises);
    return results.filter((p): p is Pokemon => p !== null);
  } catch (error) {
    console.error('Failed to get Pokemon by habitat:', error);
    throw error;
  }
};

/**
 * Search Pokemon by name (fuzzy search)
 * Uses cache first, then falls back to API
 */
export const searchPokemonByName = async (searchTerm: string): Promise<Pokemon[]> => {
  const normalizedQuery = searchTerm.toLowerCase().trim();
  
  // Check cache first
  const cached = await getCachedSearchResults(normalizedQuery);
  if (cached) {
    return cached;
  }
  
  try {
    // First, get a large list of Pokemon names
    const allPokemon = await getPokemonList(0, 1000);
    const matchingNames = allPokemon.results.filter(pokemon =>
      pokemon.name.toLowerCase().includes(normalizedQuery)
    );

    // Fetch full details for matching Pokemon
    const pokemonPromises = matchingNames.slice(0, 20).map(pokemon => {
      const id = pokemon.url.split('/').filter(Boolean).pop();
      return getPokemon(id!);
    });

    const results = await Promise.all(pokemonPromises);
    
    // Cache the search results
    await cacheSearchResults(normalizedQuery, results);
    
    return results;
  } catch (error) {
    // If network error, try to return cached data even if expired
    const cached = await getCachedSearchResults(normalizedQuery);
    if (cached) {
      return cached;
    }
    throw error;
  }
};

/**
 * Filter Pokemon by type
 * Returns ALL Pokemon of the specified type (not limited to 20)
 * Uses cache first, then falls back to API
 */
export const getPokemonByType = async (typeName: string): Promise<Pokemon[]> => {
  // Ensure type name is lowercase (PokeAPI requires lowercase)
  const normalizedTypeName = typeName.toLowerCase();
  
  // Check cache first
  const cached = await getCachedPokemonByType(normalizedTypeName);
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(`${BASE_URL}/type/${normalizedTypeName}`);
    if (!response.ok) {
      // If offline, try to return expired cache
      const expiredCache = await getCachedPokemonByType(normalizedTypeName);
      if (expiredCache) {
        return expiredCache;
      }
      throw new Error(`Failed to fetch Pokemon by type: ${response.statusText}`);
    }
    const data = await response.json();
    
    // Fetch ALL Pokemon of this type, not just first 20
    // Handle errors for individual Pokemon fetches so one failure doesn't break everything
    const pokemonPromises = data.pokemon.map(async (item: any) => {
      try {
        const id = item.pokemon.url.split('/').filter(Boolean).pop();
        if (!id) {
          return null;
        }
        return await getPokemon(id); // This will also use cache
      } catch (error) {
        console.warn(`Failed to fetch Pokemon with ID from type ${normalizedTypeName}:`, error);
        return null;
      }
    });

    const results = await Promise.all(pokemonPromises);
    const filteredResults = results.filter((p): p is Pokemon => p !== null);
    
    // Cache the results
    await cachePokemonByType(normalizedTypeName, filteredResults);
    
    return filteredResults;
  } catch (error) {
    // If network error, try to return cached data even if expired
    const cached = await getCachedPokemonByType(normalizedTypeName);
    if (cached) {
      return cached;
    }
    throw error;
  }
};

/**
 * Filter Pokemon by generation
 * Returns ALL Pokemon of the specified generation using National Pokedex ranges
 * Uses cache first, then falls back to API
 */
export const getPokemonByGeneration = async (generationName: string): Promise<Pokemon[]> => {
  // Check cache first
  const cached = await getCachedPokemonByGeneration(generationName);
  if (cached) {
    return cached;
  }
  
  try {
    // Import generation ranges utility
    const generationRanges = await import('../utils/generationRanges');
    
    // Use National Pokedex ranges for accurate generation filtering
    const pokemonIds = generationRanges.getPokemonIdsForGeneration(generationName);
    
    let results: Pokemon[] = [];
    
    if (pokemonIds.length > 0) {
      // Fetch all Pokemon in this generation range
      const pokemonPromises = pokemonIds.map(async (id: number) => {
        try {
          return await getPokemon(id); // This will also use cache
        } catch (error) {
          // Some IDs might not exist, skip them
          return null;
        }
      });
      
      const fetchedResults = await Promise.all(pokemonPromises);
      results = fetchedResults.filter((p): p is Pokemon => p !== null);
    } else {
      // Fallback to PokeAPI generation endpoint if range not found
      const response = await fetch(`${BASE_URL}/generation/${generationName}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch Pokemon by generation: ${response.statusText}`);
      }
      const data = await response.json();
      
      // Fetch ALL Pokemon species in this generation
      const pokemonPromises = data.pokemon_species.map(async (species: any) => {
        const speciesId = species.url.split('/').filter(Boolean).pop();
        try {
          // Get species details to find the Pokemon ID
          const speciesResponse = await fetch(`${BASE_URL}/pokemon-species/${speciesId}`);
          if (!speciesResponse.ok) {
            return null;
          }
          const speciesData = await speciesResponse.json();
          // Get the first Pokemon variant (usually the base form)
          const pokemonId = speciesData.varieties[0]?.pokemon?.url?.split('/').filter(Boolean).pop();
          if (pokemonId) {
            return await getPokemon(pokemonId); // This will also use cache
          }
          return null;
        } catch (error) {
          return null;
        }
      });
      
      const fetchedResults = await Promise.all(pokemonPromises);
      results = fetchedResults.filter((p): p is Pokemon => p !== null);
    }
    
    // Cache the results
    await cachePokemonByGeneration(generationName, results);
    
    return results;
  } catch (error) {
    // If network error, try to return cached data even if expired
    const cached = await getCachedPokemonByGeneration(generationName);
    if (cached) {
      return cached;
    }
    throw error;
  }
};

