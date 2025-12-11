import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FeedPost } from '../services/feed';
import { getCaughtPokemon, CaughtPokemon } from '../services/pokemonStorage';
import { getPokemon, Pokemon } from '../services/pokeapi';
import { getTypeColor } from '../utils/typeColors';
import TypeIcon from '../components/TypeIcon';

// Helper function to parse achievement info from name
const parseAchievementInfo = (achievementName: string): { isCatch: boolean; type?: string; romanNumeral?: string } => {
  if (achievementName.startsWith('Catch ')) {
    const romanNumeral = achievementName.replace('Catch ', '');
    return { isCatch: true, romanNumeral };
  } else {
    // Type achievement: "Fire I", "Normal II", etc.
    const parts = achievementName.split(' ');
    if (parts.length >= 2) {
      const type = parts[0].toLowerCase();
      const romanNumeral = parts[1];
      return { isCatch: false, type, romanNumeral };
    }
  }
  return { isCatch: false };
};

type RootStackParamList = {
  PostDetail: { post: FeedPost };
  MainTabs: undefined;
};

type PostDetailRouteProp = RouteProp<RootStackParamList, 'PostDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const PostDetailScreen = () => {
  const route = useRoute<PostDetailRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { post } = route.params;
  const [loading, setLoading] = useState(true);
  const [pokemon, setPokemon] = useState<Pokemon | null>(null);
  const [caughtPokemon, setCaughtPokemon] = useState<CaughtPokemon | null>(null);

  useEffect(() => {
    loadPostDetails();
  }, [post]);

  const loadPostDetails = async () => {
    try {
      setLoading(true);
      
      if (post.postType === 'catch' && post.pokemonId) {
        // Load Pokemon data
        const pokemonData = await getPokemon(post.pokemonId);
        setPokemon(pokemonData);
        
        // Load caught Pokemon data to get catch date and details
        const caughtPokemonList = await getCaughtPokemon(post.userId);
        const caught = caughtPokemonList.find(
          (p) => p.id === post.pokemonId && p.name === post.pokemonName
        );
        if (caught) {
          setCaughtPokemon(caught);
        }
      }
    } catch (error) {
      console.error('Failed to load post details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: 0 }]}>
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 0) }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Image source={require('../icons/back.png')} style={styles.backIcon} />
          </TouchableOpacity>
          <Text style={styles.headerTitleCentered}>Post Details</Text>
          <View style={styles.backIconPlaceholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
        </View>
      </View>
    );
  }

  if (post.postType === 'achievement') {
    // Achievement post detail
    const achievementInfo = parseAchievementInfo(post.achievementName || '');
    
    return (
      <View style={[styles.container, { paddingTop: 0 }]}>
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 0) }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Image source={require('../icons/back.png')} style={styles.backIcon} />
          </TouchableOpacity>
          <Text style={styles.headerTitleCentered}>Achievement Details</Text>
          <View style={styles.backIconPlaceholder} />
        </View>
        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
            <View style={styles.achievementCard}>
              <View style={styles.achievementIconContainer}>
                {achievementInfo.isCatch ? (
                  <View style={styles.pokeballIconWithBadge}>
                    <Image
                      source={require('../icons/pokeball.png')}
                      style={styles.pokeballIcon}
                      resizeMode="contain"
                    />
                    {achievementInfo.romanNumeral && (
                      <View style={styles.romanNumeralBadge}>
                        <Text style={styles.romanNumeralText}>{achievementInfo.romanNumeral}</Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={styles.typeIconWithBadge}>
                    <TypeIcon type={achievementInfo.type || 'normal'} size={64} />
                    {achievementInfo.romanNumeral && (
                      <View style={styles.romanNumeralBadge}>
                        <Text style={styles.romanNumeralText}>{achievementInfo.romanNumeral}</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
              <Text style={styles.achievementName}>{post.achievementName}</Text>
              <Text style={styles.achievementDate}>
                Achieved on: {formatDate(post.createdAt)}
              </Text>
              <Text style={styles.userName}>By: {post.userDisplayName}</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Catch post detail
  if (!pokemon) {
    return (
      <View style={[styles.container, { paddingTop: 0 }]}>
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 0) }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Image source={require('../icons/back.png')} style={styles.backIcon} />
          </TouchableOpacity>
          <Text style={styles.headerTitleCentered}>Post Details</Text>
          <View style={styles.backIconPlaceholder} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load Pokemon details</Text>
        </View>
      </View>
    );
  }

  const primaryTypeColor = getTypeColor(pokemon.types[0]?.type.name || 'normal');
  const imageUrl = caughtPokemon?.isShiny
    ? (pokemon.sprites.other?.['official-artwork']?.front_shiny ||
        pokemon.sprites.front_shiny ||
        pokemon.sprites.other?.['official-artwork']?.front_default ||
        pokemon.sprites.front_default ||
        'https://via.placeholder.com/200')
    : (pokemon.sprites.other?.['official-artwork']?.front_default ||
        pokemon.sprites.front_default ||
        'https://via.placeholder.com/200');

  return (
    <View style={[styles.container, { paddingTop: 0, backgroundColor: primaryTypeColor }]}>
      <View style={[styles.header, { backgroundColor: primaryTypeColor, paddingTop: Math.max(insets.top, 0), paddingBottom: 8, minHeight: 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image source={require('../icons/back.png')} style={styles.backIconWhite} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.headerTitleRow}>
            {caughtPokemon?.isShiny ? (
              <Text style={styles.shinyIconHeader}>✨</Text>
            ) : (
              <Text style={styles.shinyIconHeader}> </Text>
            )}
            <Text style={styles.headerTitleWhite}>
              {pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}
            </Text>
            {pokemon.types.map((type, index) => (
              <TypeIcon key={index} type={type.type.name} size={24} />
            ))}
          </View>
        </View>
        <View style={styles.backIconPlaceholder} />
      </View>
      <ScrollView style={[styles.scrollView, { backgroundColor: primaryTypeColor }]}>
        <View style={[styles.imageContainer, { backgroundColor: primaryTypeColor + '20' }]}>
          <Image source={{ uri: imageUrl }} style={styles.pokemonImage} />
          {caughtPokemon?.isShiny && (
            <View style={styles.shinyBadge}>
              <Text style={styles.shinyBadgeText}>✨ SHINY</Text>
            </View>
          )}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Catch Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Pokemon ID:</Text>
            <Text style={styles.infoValue}>#{String(pokemon.id).padStart(3, '0')}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Caught by:</Text>
            <Text style={styles.infoValue}>{post.userDisplayName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Caught on:</Text>
            <Text style={styles.infoValue}>
              {caughtPokemon ? formatDate(caughtPokemon.caughtAt) : formatDate(post.createdAt)}
            </Text>
          </View>
          {caughtPokemon && (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Method:</Text>
                <Text style={styles.infoValue}>
                  {caughtPokemon.caughtMethod === 'ar' ? 'AR Mode' : 'Default Background'}
                </Text>
              </View>
              {caughtPokemon.caughtLocation && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Location:</Text>
                  <Text style={styles.infoValue}>
                    {caughtPokemon.caughtLocation.latitude.toFixed(4)}, {caughtPokemon.caughtLocation.longitude.toFixed(4)}
                  </Text>
                </View>
              )}
            </>
          )}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Pokemon Details</Text>
          
          <View style={styles.typesContainer}>
            {pokemon.types.map((type, index) => (
              <View
                key={index}
                style={[styles.typeBadge, { backgroundColor: getTypeColor(type.type.name) }]}
              >
                <Text style={styles.typeText}>{type.type.name}</Text>
              </View>
            ))}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Height:</Text>
            <Text style={styles.infoValue}>{(pokemon.height / 10).toFixed(1)} m</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Weight:</Text>
            <Text style={styles.infoValue}>{(pokemon.weight / 10).toFixed(1)} kg</Text>
          </View>

          <View style={styles.abilitiesSection}>
            <Text style={styles.infoLabel}>Abilities:</Text>
            {pokemon.abilities.map((ability, index) => (
              <Text key={index} style={styles.abilityText}>
                • {ability.ability.name.charAt(0).toUpperCase() + ability.ability.name.slice(1)}
                {ability.is_hidden && ' (Hidden)'}
              </Text>
            ))}
          </View>

          {pokemon.moves && pokemon.moves.length > 0 && (
            <View style={styles.movesSection}>
              <Text style={styles.infoLabel}>Moves ({pokemon.moves.length} total):</Text>
              <View style={styles.movesList}>
                {pokemon.moves.slice(0, 4).map((move: any, index: number) => (
                  <View key={index} style={styles.moveItem}>
                    <Text style={styles.moveText}>
                      {move.move.name.charAt(0).toUpperCase() + move.move.name.slice(1).replace('-', ' ')}
                    </Text>
                  </View>
                ))}
                {pokemon.moves.length > 4 && (
                  <Text style={styles.moreMovesText}>
                    + {pokemon.moves.length - 4} more moves
                  </Text>
                )}
              </View>
            </View>
          )}

          <View style={styles.statsSection}>
            <Text style={styles.infoLabel}>Base Stats:</Text>
            {pokemon.stats.map((stat, index) => (
              <View key={index} style={styles.statRow}>
                <Text style={styles.statName}>
                  {stat.stat.name.replace('-', ' ').charAt(0).toUpperCase() + stat.stat.name.replace('-', ' ').slice(1)}:
                </Text>
                <Text style={styles.statValue}>{stat.base_stat}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingBottom: 8,
    paddingTop: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 20,
  },
  backIcon: {
    width: 24,
    height: 24,
    tintColor: '#3498db',
  },
  backIconWhite: {
    width: 24,
    height: 24,
    tintColor: '#fff',
  },
  backIconPlaceholder: {
    width: 24,
    height: 24,
  },
  headerTitleCentered: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    flex: 1,
  },
  headerTitleWhite: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 7,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  shinyIconHeader: {
    fontSize: 20,
    width: 24,
    textAlign: 'center',
  },
  headerIdWhite: {
    fontSize: 14,
    color: '#fff',
    marginTop: 4,
    opacity: 0.9,
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
  },
  achievementCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  achievementIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  pokeballIconWithBadge: {
    position: 'relative',
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pokeballIcon: {
    width: 80,
    height: 80,
  },
  typeIconWithBadge: {
    position: 'relative',
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  romanNumeralBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#fff',
    borderRadius: 12,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  romanNumeralText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  achievementName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
    textAlign: 'center',
  },
  achievementDate: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  userName: {
    fontSize: 16,
    color: '#3498db',
    fontWeight: '600',
  },
  imageContainer: {
    alignItems: 'center',
    padding: 20,
    marginBottom: 8,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    position: 'relative',
  },
  pokemonImage: {
    width: 250,
    height: 250,
    resizeMode: 'contain',
  },
  shinyBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#f39c12',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
  },
  shinyBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  infoValue: {
    fontSize: 16,
    color: '#555',
    textTransform: 'capitalize',
  },
  typesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  typeBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  typeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  abilitiesSection: {
    marginTop: 12,
    marginBottom: 8,
  },
  abilityText: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  movesSection: {
    marginTop: 12,
    marginBottom: 8,
  },
  movesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  moveItem: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  moveText: {
    fontSize: 12,
    color: '#2c3e50',
    textTransform: 'capitalize',
  },
  moreMovesText: {
    fontSize: 12,
    color: '#7f8c8d',
    fontStyle: 'italic',
    marginTop: 4,
  },
  statsSection: {
    marginTop: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  statName: {
    fontSize: 14,
    color: '#555',
    fontWeight: '600',
    flex: 1,
  },
  statValue: {
    fontSize: 14,
    color: '#555',
    fontWeight: '600',
  },
});

export default PostDetailScreen;

