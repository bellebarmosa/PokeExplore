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

