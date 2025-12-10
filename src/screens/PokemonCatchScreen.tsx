import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pokemon } from '../services/pokeapi';
import { addCaughtPokemon } from '../services/pokemonStorage';
import { getTypeColor } from '../utils/typeColors';

type RootStackParamList = {
  PokemonCatch: { pokemon: Pokemon; location: { latitude: number; longitude: number }; isShiny: boolean };
  MainTabs: undefined;
};

type PokemonCatchRouteProp = RouteProp<RootStackParamList, 'PokemonCatch'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const PokemonCatchScreen = () => {
  const route = useRoute<PokemonCatchRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { pokemon, location, isShiny } = route.params;
  const [catching, setCatching] = useState(false);
  const [catchMethod, setCatchMethod] = useState<'default' | 'ar' | null>(null);

  // Use shiny sprite if isShiny is true
  const imageUrl = isShiny
    ? (pokemon.sprites.other?.['official-artwork']?.front_shiny ||
        pokemon.sprites.front_shiny ||
        pokemon.sprites.other?.['official-artwork']?.front_default ||
        pokemon.sprites.front_default ||
        'https://via.placeholder.com/200')
    : (pokemon.sprites.other?.['official-artwork']?.front_default ||
        pokemon.sprites.front_default ||
        'https://via.placeholder.com/200');

  const handleCatch = async (method: 'default' | 'ar') => {
    try {
      setCatching(true);
      setCatchMethod(method);

      // Simulate catch animation/delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Save caught Pokemon
      await addCaughtPokemon(pokemon, location, method, isShiny);

      Alert.alert(
        'Pokemon Caught!',
        `You caught ${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}!`,
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('MainTabs');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Failed to catch Pokemon:', error);
      Alert.alert('Error', 'Failed to catch Pokemon. Please try again.');
    } finally {
      setCatching(false);
      setCatchMethod(null);
    }
  };

  if (catchMethod === 'ar') {
    // AR mode - placeholder for now
    return (
      <View style={styles.container}>
        <View style={styles.arContainer}>
          <Text style={styles.arText}>AR Mode</Text>
          <Text style={styles.arSubtext}>Point your camera at the Pokemon</Text>
          <TouchableOpacity
            style={styles.catchButton}
            onPress={() => handleCatch('ar')}
            disabled={catching}
          >
            {catching ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.catchButtonText}>Catch!</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <Text style={styles.headerTitle}>
          {isShiny ? '✨ ' : ''}
          {pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}
          {isShiny ? ' (Shiny!)' : ''}
        </Text>
        <Text style={styles.headerId}>#{String(pokemon.id).padStart(3, '0')}</Text>
      </View>

      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUrl }} style={styles.pokemonImage} />
      </View>

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

      <View style={styles.catchOptions}>
        <Text style={styles.catchOptionsTitle}>Choose Catch Method:</Text>
        
        <TouchableOpacity
          style={[styles.catchMethodButton, styles.defaultButton]}
          onPress={() => handleCatch('default')}
          disabled={catching}
        >
          {catching && catchMethod === 'default' ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.catchMethodButtonText}>Default Background</Text>
              <Text style={styles.catchMethodButtonSubtext}>Catch with default background</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.catchMethodButton, styles.arButton]}
          onPress={() => setCatchMethod('ar')}
          disabled={catching}
        >
          <Text style={styles.catchMethodButtonText}>AR Mode</Text>
          <Text style={styles.catchMethodButtonSubtext}>Catch using camera (AR)</Text>
        </TouchableOpacity>
      </View>
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
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
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
  typesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
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
  catchOptions: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  catchOptionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
    textAlign: 'center',
  },
  catchMethodButton: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  defaultButton: {
    backgroundColor: '#3498db',
  },
  arButton: {
    backgroundColor: '#9b59b6',
  },
  catchMethodButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  catchMethodButtonSubtext: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
  },
  arContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  arText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  arSubtext: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
    marginBottom: 32,
  },
  catchButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  catchButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default PokemonCatchScreen;

