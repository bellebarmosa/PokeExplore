/**
 * PokeAPI Service
 * Documentation: https://pokeapi.co/docs/v2#pokemon
 */

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
 */
export const getPokemon = async (idOrName: string | number): Promise<Pokemon> => {
  const response = await fetch(`${BASE_URL}/pokemon/${idOrName}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch Pokemon: ${response.statusText}`);
  }
  return response.json();
};

/**
 * Fetch list of Pokemon with pagination
 */
export const getPokemonList = async (offset: number = 0, limit: number = 20): Promise<PokemonListResponse> => {
  const response = await fetch(`${BASE_URL}/pokemon?offset=${offset}&limit=${limit}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch Pokemon list: ${response.statusText}`);
  }
  return response.json();
};

/**
 * Fetch all Pokemon types
 */
export const getTypes = async (): Promise<Type[]> => {
  const response = await fetch(`${BASE_URL}/type`);
  if (!response.ok) {
    throw new Error(`Failed to fetch types: ${response.statusText}`);
  }
  const data = await response.json();
  return data.results;
};

/**
 * Fetch all generations
 */
export const getGenerations = async (): Promise<Generation[]> => {
  const response = await fetch(`${BASE_URL}/generation`);
  if (!response.ok) {
    throw new Error(`Failed to fetch generations: ${response.statusText}`);
  }
  const data = await response.json();
  return data.results;
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
 */
export const searchPokemonByName = async (searchTerm: string): Promise<Pokemon[]> => {
  // First, get a large list of Pokemon names
  const allPokemon = await getPokemonList(0, 1000);
  const matchingNames = allPokemon.results.filter(pokemon =>
    pokemon.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fetch full details for matching Pokemon
  const pokemonPromises = matchingNames.slice(0, 20).map(pokemon => {
    const id = pokemon.url.split('/').filter(Boolean).pop();
    return getPokemon(id!);
  });

  return Promise.all(pokemonPromises);
};

/**
 * Filter Pokemon by type
 */
export const getPokemonByType = async (typeName: string): Promise<Pokemon[]> => {
  const response = await fetch(`${BASE_URL}/type/${typeName}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch Pokemon by type: ${response.statusText}`);
  }
  const data = await response.json();
  
  const pokemonPromises = data.pokemon.slice(0, 20).map((item: any) => {
    const id = item.pokemon.url.split('/').filter(Boolean).pop();
    return getPokemon(id);
  });

  return Promise.all(pokemonPromises);
};

/**
 * Filter Pokemon by generation
 */
export const getPokemonByGeneration = async (generationName: string): Promise<Pokemon[]> => {
  const response = await fetch(`${BASE_URL}/generation/${generationName}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch Pokemon by generation: ${response.statusText}`);
  }
  const data = await response.json();
  
  const pokemonPromises = data.pokemon_species.slice(0, 20).map((species: any) => {
    const id = species.url.split('/').filter(Boolean).pop();
    return getPokemon(id);
  });

  return Promise.all(pokemonPromises);
};

