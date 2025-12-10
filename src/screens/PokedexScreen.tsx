import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import TypePicker from '../components/TypePicker';
import RegionPicker from '../components/RegionPicker';
import {
  getPokemonList,
  getTypes,
  getGenerations,
  searchPokemonByName,
  getPokemonByType,
  getPokemonByGeneration,
  getPokemon,
  Pokemon,
} from '../services/pokeapi';
import { isPokemonInGeneration } from '../utils/generationRanges';

// Type color mapping
const getTypeColor = (type: string): string => {
  const colors: { [key: string]: string } = {
    normal: '#A8A878',
    fire: '#F08030',
    water: '#6890F0',
    electric: '#F8D030',
    grass: '#78C850',
    ice: '#98D8D8',
    fighting: '#C03028',
    poison: '#A040A0',
    ground: '#E0C068',
    flying: '#A890F0',
    psychic: '#F85888',
    bug: '#A8B820',
    rock: '#B8A038',
    ghost: '#705898',
    dragon: '#7038F8',
    dark: '#705848',
    steel: '#B8B8D0',
    fairy: '#EE99AC',
  };
  return colors[type.toLowerCase()] || '#A8A878';
};

type RootStackParamList = {
  MainTabs: undefined;
  PokemonDetail: { pokemonId: number };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

const ITEMS_PER_PAGE = 10;

const PokedexScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const [pokemonList, setPokemonList] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedGeneration, setSelectedGeneration] = useState<string>('all');
  const [types, setTypes] = useState<Array<{ name: string; url: string }>>([]);
  const [generations, setGenerations] = useState<Array<{ name: string; url: string }>>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Load types and generations on mount
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [typesData, generationsData] = await Promise.all([
          getTypes(),
          getGenerations(),
        ]);
        setTypes(typesData);
        setGenerations(generationsData);
      } catch (error) {
        console.error('Failed to load filters:', error);
      }
    };
    loadFilters();
  }, []);

  // Store all filtered Pokemon for pagination
  const [allFilteredPokemon, setAllFilteredPokemon] = useState<Pokemon[]>([]);

  // Load Pokemon data
  const loadPokemon = useCallback(async (page: number) => {
    try {
      setLoading(true);
      let allPokemon: Pokemon[] = [];
      let count: number | null = null;

      // Check if we have search query
      if (searchQuery.trim()) {
        const query = searchQuery.trim();
        if (/^\d+$/.test(query)) {
          // Search by ID
          try {
            const pokemonData = await getPokemon(parseInt(query, 10));
            allPokemon = [pokemonData];
            count = 1;
          } catch (error) {
            Alert.alert('Error', 'Pokemon not found');
            allPokemon = [];
            count = 0;
          }
        } else {
          // Search by name
          allPokemon = await searchPokemonByName(query);
          count = allPokemon.length;
        }
      } else {
        // No search query - use filters or default list
        if (selectedType !== 'all' || selectedGeneration !== 'all') {
          // Apply type and/or generation filters
          if (selectedType !== 'all' && selectedGeneration !== 'all') {
            // Both filters: get Pokemon by type AND generation
            const [typePokemon, genPokemon] = await Promise.all([
              getPokemonByType(selectedType),
              getPokemonByGeneration(selectedGeneration)
            ]);
            
            // Find intersection: Pokemon that are in both lists
            const genIds = new Set(genPokemon.map(p => p.id));
            allPokemon = typePokemon.filter(p => genIds.has(p.id));
          } else if (selectedType !== 'all') {
            // Only type filter
            allPokemon = await getPokemonByType(selectedType);
          } else if (selectedGeneration !== 'all') {
            // Only generation filter
            allPokemon = await getPokemonByGeneration(selectedGeneration);
          }
          count = allPokemon.length;
        } else {
          // Default: paginated list from API
          const offset = (page - 1) * ITEMS_PER_PAGE;
          const response = await getPokemonList(offset, ITEMS_PER_PAGE);
          count = response.count;
          
          const pokemonPromises = response.results.map(async (item) => {
            const id = item.url.split('/').filter(Boolean).pop();
            return getPokemon(id!);
          });
          
          allPokemon = await Promise.all(pokemonPromises);
        }
      }

      // Apply additional filters to search results
      if (searchQuery.trim() && allPokemon.length > 0) {
        let filtered = allPokemon;
        
        // Apply type filter if selected
        if (selectedType !== 'all') {
          filtered = filtered.filter(p => 
            p.types.some(t => t.type.name.toLowerCase() === selectedType.toLowerCase())
          );
        }
        
        // Apply generation filter if selected
        if (selectedGeneration !== 'all') {
          filtered = filtered.filter(p => 
            isPokemonInGeneration(p.id, selectedGeneration)
          );
        }
        
        allPokemon = filtered;
        count = allPokemon.length;
      }

      // Store all filtered Pokemon for pagination
      setAllFilteredPokemon(allPokemon);

      // Paginate the results
      let pokemon: Pokemon[] = [];
      if (searchQuery.trim() || selectedType !== 'all' || selectedGeneration !== 'all') {
        // Paginate filtered results
        const startIndex = (page - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        pokemon = allPokemon.slice(startIndex, endIndex);
      } else {
        // Use API paginated results directly
        pokemon = allPokemon;
      }

      setPokemonList(pokemon);
      setTotalCount(count);
      if (count !== null) {
        setTotalPages(Math.ceil(count / ITEMS_PER_PAGE));
      }
    } catch (error) {
      console.error('Failed to load Pokemon:', error);
      Alert.alert('Error', 'Failed to load Pokemon. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedType, selectedGeneration]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
    setPokemonList([]);
    setTotalCount(null);
  }, [searchQuery, selectedType, selectedGeneration]);

  // Load data when page changes or when filters change (after reset)
  useEffect(() => {
    if (currentPage > 0) {
      loadPokemon(currentPage);
    }
  }, [currentPage, loadPokemon]);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePokemonPress = (pokemon: Pokemon) => {
    navigation.navigate('PokemonDetail', { pokemonId: pokemon.id });
  };

  const renderPokemonItem = ({ item }: { item: Pokemon }) => {
    const imageUrl = item.sprites.other?.['official-artwork']?.front_default || 
                    item.sprites.front_default || 
                    'https://via.placeholder.com/200';

    return (
      <TouchableOpacity
        style={styles.pokemonCard}
        onPress={() => handlePokemonPress(item)}
        activeOpacity={0.7}
      >
        <Image source={{ uri: imageUrl }} style={styles.pokemonImage} />
        <Text style={styles.pokemonName}>{item.name.charAt(0).toUpperCase() + item.name.slice(1)}</Text>
        <Text style={styles.pokemonId}>#{String(item.id).padStart(3, '0')}</Text>
        <View style={styles.typesContainer}>
          {item.types.map((type, index) => (
            <View key={index} style={[styles.typeBadge, { backgroundColor: getTypeColor(type.type.name) }]}>
              <Text style={styles.typeText}>{type.type.name}</Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Pokedex</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or ID..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filtersContainer}>
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Type:</Text>
          <TypePicker
            selectedValue={selectedType}
            onValueChange={setSelectedType}
            types={types}
          />
        </View>

        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Region:</Text>
          <RegionPicker
            selectedValue={selectedGeneration}
            onValueChange={setSelectedGeneration}
            generations={generations}
          />
        </View>
      </View>

      {loading && pokemonList.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
        </View>
      ) : pokemonList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No Pokemon found</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={pokemonList}
            renderItem={renderPokemonItem}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            contentContainerStyle={styles.listContainer}
            refreshing={loading}
            onRefresh={() => loadPokemon(currentPage)}
          />
          {totalCount !== null && totalCount > 0 && (
            <View style={[styles.paginationContainer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
              <View style={styles.paginationInfo}>
                <Text style={styles.paginationText}>
                  Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount}
                </Text>
              </View>
              <View style={styles.paginationButtons}>
                <TouchableOpacity
                  style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
                  onPress={handlePreviousPage}
                  disabled={currentPage === 1 || loading}
                >
                  <Text style={[styles.paginationButtonText, currentPage === 1 && styles.paginationButtonTextDisabled]}>
                    Previous
                  </Text>
                </TouchableOpacity>
                <View style={styles.pageNumberContainer}>
                  <Text style={styles.pageNumberText}>
                    Page {currentPage} of {totalPages}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
                  onPress={handleNextPage}
                  disabled={currentPage === totalPages || loading}
                >
                  <Text style={[styles.paginationButtonText, currentPage === totalPages && styles.paginationButtonTextDisabled]}>
                    Next
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 8,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 8,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filtersContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterGroup: {
    flex: 1,
    marginRight: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  listContainer: {
    padding: 8,
  },
  pokemonCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 8,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pokemonImage: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
  },
  pokemonName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 8,
    textAlign: 'center',
  },
  pokemonId: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
  },
  typesContainer: {
    flexDirection: 'row',
    marginTop: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginHorizontal: 2,
  },
  typeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  footerLoader: {
    marginVertical: 20,
  },
  paginationContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  paginationInfo: {
    alignItems: 'center',
    marginBottom: 12,
  },
  paginationText: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  paginationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paginationButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  paginationButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
  paginationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  paginationButtonTextDisabled: {
    color: '#7f8c8d',
  },
  pageNumberContainer: {
    flex: 1,
    alignItems: 'center',
  },
  pageNumberText: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '600',
  },
});

export default PokedexScreen;

