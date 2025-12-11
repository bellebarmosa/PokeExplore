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
  Platform,
  PermissionsAndroid,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Voice from '@react-native-voice/voice';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
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
import { getCaughtPokemon, isPokemonCaught } from '../services/pokemonStorage';

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
const POKEDEX_RED = '#e83030'; // Define the red color

const PokedexScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
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
  const [isListening, setIsListening] = useState(false);
  const [hasMicPermission, setHasMicPermission] = useState(false);
  const [caughtPokemonIds, setCaughtPokemonIds] = useState<Set<number>>(new Set());
  const [caughtCount, setCaughtCount] = useState<number>(0);

  // Load caught Pokemon IDs
  useEffect(() => {
    const loadCaughtPokemon = async () => {
      if (user) {
        try {
          const caught = await getCaughtPokemon(user.uid);
          const caughtIds = new Set(caught.map(p => p.id));
          setCaughtPokemonIds(caughtIds);
          setCaughtCount(caughtIds.size);
        } catch (error) {
          console.error('Failed to load caught Pokemon:', error);
        }
      }
    };
    loadCaughtPokemon();
  }, [user]);

  // Request microphone permission
  useEffect(() => {
    const requestMicPermission = async () => {
      if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            {
              title: 'Microphone Permission',
              message: 'PokeExplore needs access to your microphone for voice search.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          setHasMicPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
        } catch (err) {
          console.warn('Microphone permission error:', err);
          setHasMicPermission(false);
        }
      } else {
        // iOS permissions are handled automatically by the library
        setHasMicPermission(true);
      }
    };
    requestMicPermission();
  }, []);

  // Voice recognition handlers
  useEffect(() => {
    // Check if Voice module is available and properly initialized
    try {
      if (!Voice) {
        console.warn('Voice module not available');
        return;
      }

      // Check if Voice methods exist (indicates native module is linked)
      if (typeof Voice.onSpeechStart === 'undefined' || typeof Voice.start !== 'function') {
        console.warn('Voice module not properly linked - native methods not available');
        return;
      }

      Voice.onSpeechStart = () => {
        setIsListening(true);
      };
      Voice.onSpeechEnd = () => {
        setIsListening(false);
      };
      Voice.onSpeechResults = (e) => {
        if (e.value && e.value.length > 0) {
          const spokenText = e.value[0].toLowerCase().trim();
          setSearchQuery(spokenText);
          if (Voice && typeof Voice.stop === 'function') {
            Voice.stop().catch((err) => console.error('Error stopping voice:', err));
          }
        }
      };
      Voice.onSpeechError = (e) => {
        console.error('Speech recognition error:', e);
        setIsListening(false);
        if (e.error?.code !== '7') { // Error 7 is user cancellation
          Alert.alert('Voice Search Error', 'Failed to recognize speech. Please try again.');
        }
        if (Voice && typeof Voice.stop === 'function') {
          Voice.stop().catch((err) => console.error('Error stopping voice:', err));
        }
      };
    } catch (error) {
      console.error('Failed to set up voice recognition:', error);
    }

    return () => {
      try {
        if (Voice && typeof Voice.destroy === 'function') {
          Voice.destroy()
            .then(() => {
              if (Voice && typeof Voice.removeAllListeners === 'function') {
                Voice.removeAllListeners();
              }
            })
            .catch((err) => console.error('Error cleaning up voice:', err));
        }
      } catch (error) {
        console.error('Error in voice cleanup:', error);
      }
    };
  }, []);

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
          } catch (error: any) {
            const errorMessage = error?.message || 'Unknown error';
            if (errorMessage.includes('Failed to fetch') || errorMessage.includes('Network')) {
              Alert.alert(
                'Offline Mode',
                'You are offline. Showing cached data if available. Please check your internet connection.'
              );
            } else {
              Alert.alert('Error', 'Pokemon not found');
            }
            allPokemon = [];
            count = 0;
          }
        } else {
          // Search by name
          try {
            allPokemon = await searchPokemonByName(query);
            count = allPokemon.length;
          } catch (error: any) {
            const errorMessage = error?.message || 'Unknown error';
            if (errorMessage.includes('Failed to fetch') || errorMessage.includes('Network')) {
              Alert.alert(
                'Offline Mode',
                'You are offline. Showing cached data if available. Please check your internet connection.'
              );
            }
            allPokemon = [];
            count = 0;
          }
        }
      } else {
        // No search query - use filters or default list
        if (selectedType !== 'all' || selectedGeneration !== 'all') {
          // Apply type and/or generation filters
          try {
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
          } catch (error: any) {
            const errorMessage = error?.message || 'Unknown error';
            if (errorMessage.includes('Failed to fetch') || errorMessage.includes('Network')) {
              Alert.alert(
                'Offline Mode',
                'You are offline. Showing cached data if available. Please check your internet connection.'
              );
            }
            allPokemon = [];
            count = 0;
          }
        } else {
          // Default: paginated list from API
          try {
            const offset = (page - 1) * ITEMS_PER_PAGE;
            const response = await getPokemonList(offset, ITEMS_PER_PAGE);
            count = response.count;
            
            const pokemonPromises = response.results.map(async (item) => {
              const id = item.url.split('/').filter(Boolean).pop();
              return getPokemon(id!);
            });
            
            allPokemon = await Promise.all(pokemonPromises);
          } catch (error: any) {
            const errorMessage = error?.message || 'Unknown error';
            if (errorMessage.includes('Failed to fetch') || errorMessage.includes('Network')) {
              Alert.alert(
                'Offline Mode',
                'You are offline. Showing cached data if available. Please check your internet connection.'
              );
            }
            allPokemon = [];
            count = 0;
          }
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
      // Use the total count from API (1025) or the filtered count
      const finalCount = searchQuery.trim() || selectedType !== 'all' || selectedGeneration !== 'all' 
        ? count 
        : (count || 1025); // Default to 1025 if count is null
      setTotalCount(finalCount);
      if (finalCount !== null) {
        setTotalPages(Math.ceil(finalCount / ITEMS_PER_PAGE));
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

  const startVoiceSearch = async () => {
    try {
      // Check if Voice module is available
      if (!Voice) {
        Alert.alert(
          'Voice Search Unavailable',
          'Voice recognition is not available. Please rebuild the app after installing the voice module.'
        );
        return;
      }

      // Check if Voice methods are available (indicates native module is linked)
      if (typeof Voice.start !== 'function' || typeof Voice.onSpeechStart === 'undefined') {
        Alert.alert(
          'Voice Search Not Linked',
          'Voice recognition module is not properly linked. Please rebuild the app:\n\n1. Stop the Metro bundler\n2. Run: cd android && ./gradlew clean\n3. Run: npx react-native run-android\n\nIf the issue persists, try:\n- Uninstall the app from your device\n- Rebuild and reinstall'
        );
        return;
      }

      if (!hasMicPermission) {
        Alert.alert(
          'Microphone Permission Required',
          'Please grant microphone permission to use voice search.'
        );
        return;
      }

      if (isListening) {
        try {
          if (typeof Voice.stop === 'function') {
            await Voice.stop();
          }
          setIsListening(false);
        } catch (stopError) {
          console.error('Error stopping voice:', stopError);
          setIsListening(false);
        }
      } else {
        try {
          await Voice.start('en-US');
        } catch (startError: any) {
          console.error('Error starting voice:', startError);
          setIsListening(false);
          const errorMessage = startError?.message || String(startError) || '';
          
          // Handle specific error cases
          if (errorMessage.includes('permission') || startError?.code === 'permission_denied') {
            Alert.alert('Permission Denied', 'Microphone permission is required for voice search.');
          } else if (errorMessage.includes('null') || errorMessage.includes('startSpeech')) {
            Alert.alert(
              'Module Not Linked',
              'Voice recognition native module is not properly linked. Please rebuild the app.'
            );
          } else if (errorMessage.includes('not available')) {
            Alert.alert('Not Available', 'Voice recognition is not available on this device.');
          } else {
            Alert.alert('Error', `Failed to start voice search. Please try again.`);
          }
        }
      }
    } catch (error: any) {
      console.error('Voice search error:', error);
      setIsListening(false);
      const errorMessage = error?.message || String(error) || 'Unknown error';
      
      if (errorMessage.includes('null') || errorMessage.includes('startSpeech')) {
        Alert.alert(
          'Module Not Linked',
          'Voice recognition native module is not properly linked. Please rebuild the app:\n\n1. Stop the Metro bundler\n2. Run: cd android && ./gradlew clean\n3. Run: npx react-native run-android'
        );
      } else {
        Alert.alert('Error', `Failed to start voice search: ${errorMessage}`);
      }
    }
  };

  const renderPokemonItem = ({ item }: { item: Pokemon }) => {
    const imageUrl = item.sprites.other?.['official-artwork']?.front_default || 
                    item.sprites.front_default || 
                    'https://via.placeholder.com/200';
    const isCaught = caughtPokemonIds.has(item.id);

    return (
      <TouchableOpacity
        style={styles.pokemonCard}
        onPress={() => handlePokemonPress(item)}
        activeOpacity={0.7}
      >
        {isCaught && (
          <View style={styles.caughtBadge}>
            <Text style={styles.caughtBadgeText}>✓ Caught</Text>
          </View>
        )}
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
        <Text style={styles.statusText}>
          Caught {caughtCount} of 1025 total Pokemon
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or ID..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity
            style={[styles.micButton, isListening && styles.micButtonActive]}
            onPress={startVoiceSearch}
            disabled={!hasMicPermission}
          >
            {isListening ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Image
                source={require('../icons/mic.png')}
                style={styles.micIcon}
                resizeMode="contain"
              />
            )}
          </TouchableOpacity>
        </View>
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

      {(searchQuery.trim() || selectedType !== 'all' || selectedGeneration !== 'all') && (
        <View style={styles.resetContainer}>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={() => {
              setSearchQuery('');
              setSelectedType('all');
              setSelectedGeneration('all');
            }}
          >
            <Text style={styles.resetButtonText}>Reset Filters</Text>
          </TouchableOpacity>
        </View>
      )}

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
    backgroundColor: '#e83030',
  },
  header: {
    backgroundColor: '#e83030',
    paddingTop: 8,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#c02020',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginTop: 4,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: POKEDEX_RED, // Red theme
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)', // Lighter border for red theme
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff', // White background for input
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    color: '#2c3e50', // Dark text color
    marginRight: 8,
  },
  micButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButtonActive: {
    backgroundColor: '#e74c3c',
  },
  micIcon: {
    width: 24,
    height: 24,
  },
  filtersContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
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
  resetContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#e83030',
    borderBottomWidth: 1,
    borderBottomColor: '#c02020',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#fff',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  resetButtonText: {
    color: '#e83030',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
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
    position: 'relative',
  },
  caughtBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#27ae60',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  caughtBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
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
    backgroundColor: '#e83030',
    borderTopWidth: 1,
    borderTopColor: '#c02020',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  paginationInfo: {
    alignItems: 'center',
    marginBottom: 12,
  },
  paginationText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  paginationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paginationButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  paginationButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  paginationButtonText: {
    color: '#e83030',
    fontSize: 16,
    fontWeight: '600',
  },
  paginationButtonTextDisabled: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  pageNumberContainer: {
    flex: 1,
    alignItems: 'center',
  },
  pageNumberText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});

export default PokedexScreen;

