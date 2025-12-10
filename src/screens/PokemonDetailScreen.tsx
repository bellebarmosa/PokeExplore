import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getPokemon, Pokemon } from '../services/pokeapi';
import { getTypeColor } from '../utils/typeColors';
import TypeIcon from '../components/TypeIcon';

type RootStackParamList = {
  PokemonDetail: { pokemonId: number };
};

type PokemonDetailRouteProp = RouteProp<RootStackParamList, 'PokemonDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const PokemonDetailScreen = () => {
  const route = useRoute<PokemonDetailRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { pokemonId } = route.params;
  const [pokemon, setPokemon] = useState<Pokemon | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageType, setImageType] = useState<'default' | 'shiny'>('default');
  
  // Get primary type color for background
  const primaryTypeColor = pokemon ? getTypeColor(pokemon.types[0]?.type.name || 'normal') : '#f5f5f5';

  useEffect(() => {
    const loadPokemon = async () => {
      try {
        const data = await getPokemon(pokemonId);
        setPokemon(data);
      } catch (error) {
        console.error('Failed to load Pokemon:', error);
      } finally {
        setLoading(false);
      }
    };
    loadPokemon();
  }, [pokemonId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  if (!pokemon) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Pokemon not found</Text>
      </View>
    );
  }

  const imageUrl =
    imageType === 'shiny'
      ? pokemon.sprites.other?.['official-artwork']?.front_shiny ||
        pokemon.sprites.front_shiny ||
        pokemon.sprites.other?.['official-artwork']?.front_default ||
        pokemon.sprites.front_default ||
        'https://via.placeholder.com/200'
      : pokemon.sprites.other?.['official-artwork']?.front_default ||
        pokemon.sprites.front_default ||
        'https://via.placeholder.com/200';

  const statNames: { [key: string]: string } = {
    hp: 'HP',
    attack: 'Attack',
    defense: 'Defense',
    'special-attack': 'Sp. Atk',
    'special-defense': 'Sp. Def',
    speed: 'Speed',
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: primaryTypeColor }]}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16), backgroundColor: primaryTypeColor }]}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>
            {pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}
          </Text>
          <View style={styles.typesContainerHeader}>
            {pokemon.types.map((type, index) => (
              <View key={index} style={styles.typeIconHeader}>
                <TypeIcon type={type.type.name} size={20} />
              </View>
            ))}
          </View>
        </View>
        <Text style={styles.headerId}>#{String(pokemon.id).padStart(3, '0')}</Text>
      </View>

      <View style={[styles.imageContainer, { backgroundColor: primaryTypeColor + '40' }]}>
        <Image source={{ uri: imageUrl }} style={styles.pokemonImage} />
        <TouchableOpacity
          style={styles.shinyButton}
          onPress={() => setImageType(imageType === 'default' ? 'shiny' : 'default')}
        >
          <Text style={styles.shinyButtonText}>
            {imageType === 'default' ? 'Show Shiny' : 'Show Normal'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Types</Text>
          <View style={styles.typesContainer}>
            {pokemon.types.map((type, index) => (
              <View
                key={index}
                style={[styles.typeBadge, { backgroundColor: getTypeColor(type.type.name) }]}
              >
                <TypeIcon type={type.type.name} size={20} />
                <Text style={styles.typeText}>{type.type.name}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Abilities</Text>
          {pokemon.abilities.map((ability, index) => (
            <View key={index} style={styles.abilityItem}>
              <Text style={styles.abilityName}>
                {ability.ability.name.charAt(0).toUpperCase() + ability.ability.name.slice(1)}
              </Text>
              {ability.is_hidden && (
                <Text style={styles.hiddenAbility}>(Hidden)</Text>
              )}
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stats</Text>
          {pokemon.stats.map((stat, index) => (
            <View key={index} style={styles.statItem}>
              <Text style={styles.statName}>
                {statNames[stat.stat.name] || stat.stat.name}
              </Text>
              <View style={styles.statBarContainer}>
                <View
                  style={[
                    styles.statBar,
                    {
                      width: `${(stat.base_stat / 255) * 100}%`,
                      backgroundColor: stat.base_stat >= 100 ? '#27ae60' : stat.base_stat >= 50 ? '#f39c12' : '#e74c3c',
                    },
                  ]}
                />
              </View>
              <Text style={styles.statValue}>{stat.base_stat}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Physical Attributes</Text>
          <View style={styles.attributesContainer}>
            <View style={styles.attributeItem}>
              <Text style={styles.attributeLabel}>Height</Text>
              <Text style={styles.attributeValue}>{(pokemon.height / 10).toFixed(1)} m</Text>
            </View>
            <View style={styles.attributeItem}>
              <Text style={styles.attributeLabel}>Weight</Text>
              <Text style={styles.attributeValue}>{(pokemon.weight / 10).toFixed(1)} kg</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 18,
    color: '#e74c3c',
  },
  header: {
    padding: 16,
    paddingBottom: 20,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 8,
  },
  typesContainerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIconHeader: {
    marginLeft: 4,
  },
  headerId: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  imageContainer: {
    alignItems: 'center',
    padding: 20,
    marginBottom: 8,
    marginHorizontal: 16,
    borderRadius: 12,
  },
  pokemonImage: {
    width: 250,
    height: 250,
    resizeMode: 'contain',
  },
  shinyButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#3498db',
    borderRadius: 20,
  },
  shinyButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  typesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  typeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
    marginLeft: 8,
  },
  abilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  abilityName: {
    fontSize: 16,
    color: '#2c3e50',
    textTransform: 'capitalize',
  },
  hiddenAbility: {
    fontSize: 12,
    color: '#7f8c8d',
    marginLeft: 8,
    fontStyle: 'italic',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statName: {
    width: 80,
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '600',
  },
  statBarContainer: {
    flex: 1,
    height: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  statBar: {
    height: '100%',
    borderRadius: 10,
  },
  statValue: {
    width: 40,
    fontSize: 14,
    color: '#2c3e50',
    textAlign: 'right',
    fontWeight: '600',
  },
  attributesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  attributeItem: {
    alignItems: 'center',
  },
  attributeLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  attributeValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
});

export default PokemonDetailScreen;

