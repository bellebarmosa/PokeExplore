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
import { getPokemon, Pokemon } from '../services/pokeapi';

type RootStackParamList = {
  PokemonDetail: { pokemonId: number };
};

type PokemonDetailRouteProp = RouteProp<RootStackParamList, 'PokemonDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const PokemonDetailScreen = () => {
  const route = useRoute<PokemonDetailRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { pokemonId } = route.params;
  const [pokemon, setPokemon] = useState<Pokemon | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageType, setImageType] = useState<'default' | 'shiny'>('default');

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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}
        </Text>
        <Text style={styles.headerId}>#{String(pokemon.id).padStart(3, '0')}</Text>
      </View>

      <View style={styles.imageContainer}>
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

// Export getTypeColor function
export const getTypeColor = (type: string): string => {
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
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  headerId: {
    fontSize: 18,
    color: '#7f8c8d',
    marginTop: 4,
  },
  imageContainer: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 8,
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
    backgroundColor: '#fff',
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

