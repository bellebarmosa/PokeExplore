import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Platform,
  PermissionsAndroid,
  ScrollView,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { useAuth } from '../contexts/AuthContext';
import { Pokemon, getPokemonSpecies } from '../services/pokeapi';
import { addCaughtPokemon } from '../services/pokemonStorage';
import { getTypeColor } from '../utils/typeColors';

type RootStackParamList = {
  PokemonCatch: { pokemon: Pokemon; location: { latitude: number; longitude: number }; isShiny: boolean; autoStartAR?: boolean };
  MainTabs: undefined;
};

type PokemonCatchRouteProp = RouteProp<RootStackParamList, 'PokemonCatch'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAX_ATTEMPTS = 5;
const CATCH_RATE = 0.75; // 75% success rate

const PokemonCatchScreen = () => {
  const route = useRoute<PokemonCatchRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { pokemon, location, isShiny, autoStartAR } = route.params;
  const [catching, setCatching] = useState(false);
  const [catchMethod, setCatchMethod] = useState<'default' | 'ar' | null>(autoStartAR ? 'ar' : null);
  const [attempts, setAttempts] = useState(0);
  const [throwing, setThrowing] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [pokemonHabitat, setPokemonHabitat] = useState<string | null>(null);
  const [pokemonInfo, setPokemonInfo] = useState<any>(null);
  
  // Camera setup
  const { hasPermission: cameraPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  
  // Load Pokemon species data (habitat, etc.)
  useEffect(() => {
    const loadPokemonInfo = async () => {
      try {
        const speciesData = await getPokemonSpecies(pokemon.id);
        setPokemonInfo(speciesData);
        if (speciesData.habitat) {
          setPokemonHabitat(speciesData.habitat.name);
        }
      } catch (error) {
        console.error('Failed to load Pokemon species:', error);
      }
    };
    loadPokemonInfo();
  }, [pokemon.id]);
  
  // Animation values
  const pokeballAnim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const pokeballScale = useRef(new Animated.Value(1)).current;
  const pokemonShake = useRef(new Animated.Value(0)).current;

  // Request camera permission
  useEffect(() => {
    const requestCameraPermission = async () => {
      if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.CAMERA,
            {
              title: 'Camera Permission',
              message: 'PokeExplore needs access to your camera for AR mode.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          setHasPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
        } catch (err) {
          console.warn(err);
          setHasPermission(false);
        }
      } else {
        if (!cameraPermission) {
          const permission = await requestPermission();
          setHasPermission(permission);
        } else {
          setHasPermission(true);
        }
      }
    };

    if (catchMethod === 'ar') {
      requestCameraPermission();
    }
  }, [catchMethod, cameraPermission, requestPermission]);

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

  // Get primary type color for background
  const primaryTypeColor = getTypeColor(pokemon.types[0]?.type.name || 'normal');

  const handleCatch = async (method: 'default' | 'ar') => {
    try {
      setCatching(true);
      setCatchMethod(method);

      // Simulate catch animation/delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Save caught Pokemon to Firebase
      if (user) {
        await addCaughtPokemon(pokemon, user.uid, location, method, isShiny);
      } else {
        throw new Error('User not authenticated');
      }

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

  const throwPokeball = () => {
    if (throwing || attempts >= MAX_ATTEMPTS) return;

    setThrowing(true);
    setAttempts(prev => prev + 1);

    // Reset animation values
    pokeballAnim.setValue({ x: 0, y: 0 });
    pokeballScale.setValue(1);

    // Animate pokeball throw
    Animated.sequence([
      // Throw animation
      Animated.parallel([
        Animated.timing(pokeballAnim, {
          toValue: { x: SCREEN_WIDTH / 2 - 25, y: SCREEN_HEIGHT / 2 - 100 },
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pokeballScale, {
          toValue: 0.8,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      // Hit animation
      Animated.parallel([
        Animated.spring(pokeballScale, {
          toValue: 1.2,
          friction: 3,
          useNativeDriver: true,
        }),
        // Pokemon shake
        Animated.sequence([
          Animated.timing(pokemonShake, {
            toValue: 10,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(pokemonShake, {
            toValue: -10,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(pokemonShake, {
            toValue: 0,
            duration: 50,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start(() => {
      // Check if caught (75% chance)
      const caught = Math.random() < CATCH_RATE;

      if (caught) {
        // Success!
        handleCatch('ar');
      } else {
        // Failed - check if max attempts reached
        if (attempts + 1 >= MAX_ATTEMPTS) {
          // Pokemon fled
          Alert.alert(
            'Pokemon Fled!',
            `${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)} fled!`,
            [
              {
                text: 'OK',
                onPress: () => {
                  setCatchMethod(null);
                  setAttempts(0);
                  setThrowing(false);
                  navigation.navigate('MainTabs');
                },
              },
            ]
          );
        } else {
          // Try again
          setThrowing(false);
          // Reset animations
          pokeballAnim.setValue({ x: 0, y: 0 });
          pokeballScale.setValue(1);
          pokemonShake.setValue(0);
        }
      }
    });
  };

  if (catchMethod === 'ar') {
    if (!hasPermission) {
      return (
        <View style={styles.arContainer}>
          <View style={styles.permissionContainer}>
            <Text style={styles.permissionText}>Camera permission required</Text>
            <Text style={styles.permissionSubtext}>
              Please grant camera permission to use AR mode
            </Text>
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={() => {
                setCatchMethod(null);
                navigation.navigate('MainTabs');
              }}
            >
              <Text style={styles.permissionButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (!device) {
      return (
        <View style={styles.arContainer}>
          <View style={styles.permissionContainer}>
            <Text style={styles.permissionText}>No camera available</Text>
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={() => {
                setCatchMethod(null);
                navigation.navigate('MainTabs');
              }}
            >
              <Text style={styles.permissionButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.arContainer}>
        {/* Real Camera Feed */}
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
        />

        {/* Pokemon Overlay */}
        <Animated.View
          style={[
            styles.pokemonOverlay,
            {
              transform: [
                { translateX: pokemonShake },
              ],
            },
          ]}
        >
          <Image
            source={{ uri: imageUrl }}
            style={styles.arPokemonImage}
            resizeMode="contain"
          />
          {isShiny && (
            <View style={styles.shinyIndicatorAR}>
              <Text style={styles.shinyIndicatorTextAR}>✨ SHINY</Text>
            </View>
          )}
        </Animated.View>

        {/* Pokeball Animation */}
        <Animated.View
          style={[
            styles.pokeballContainer,
            {
              transform: [
                { translateX: pokeballAnim.x },
                { translateY: pokeballAnim.y },
                { scale: pokeballScale },
              ],
            },
          ]}
        >
          <Text style={styles.pokeballEmoji}>⚪</Text>
        </Animated.View>

        {/* UI Overlay */}
        <View style={[styles.arUIOverlay, { paddingTop: Math.max(insets.top, 16) }]}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              setCatchMethod(null);
              setAttempts(0);
              setThrowing(false);
            }}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.arPokemonName}>
            {isShiny ? '✨ ' : ''}
            {pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}
          </Text>
          <Text style={styles.attemptsText}>
            Attempts: {attempts}/{MAX_ATTEMPTS}
          </Text>
        </View>

        {/* Throw Button */}
        <View style={[styles.throwButtonContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <TouchableOpacity
            style={[styles.throwButton, (throwing || attempts >= MAX_ATTEMPTS) && styles.throwButtonDisabled]}
            onPress={throwPokeball}
            disabled={throwing || attempts >= MAX_ATTEMPTS}
          >
            {throwing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.throwButtonText}>
                {attempts >= MAX_ATTEMPTS ? 'Max Attempts Reached' : 'Throw Pokeball'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            {isShiny ? '✨ ' : ''}
            {pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}
            {isShiny ? ' (Shiny!)' : ''}
          </Text>
          <Text style={styles.headerId}>#{String(pokemon.id).padStart(3, '0')}</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Default Background with Type Color */}
        <View style={[styles.imageContainer, { backgroundColor: primaryTypeColor + '20' }]}>
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

        {/* Pokemon Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Information</Text>
          
          {/* Habitat */}
          {pokemonHabitat && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Habitat:</Text>
              <Text style={styles.infoValue}>
                {pokemonHabitat.charAt(0).toUpperCase() + pokemonHabitat.slice(1).replace('-', ' ')}
              </Text>
            </View>
          )}

          {/* Height & Weight */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Height:</Text>
            <Text style={styles.infoValue}>{(pokemon.height / 10).toFixed(1)} m</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Weight:</Text>
            <Text style={styles.infoValue}>{(pokemon.weight / 10).toFixed(1)} kg</Text>
          </View>

          {/* Abilities */}
          <View style={styles.abilitiesSection}>
            <Text style={styles.infoLabel}>Abilities:</Text>
            {pokemon.abilities.map((ability, index) => (
              <Text key={index} style={styles.abilityText}>
                • {ability.ability.name.charAt(0).toUpperCase() + ability.ability.name.slice(1)}
                {ability.is_hidden && ' (Hidden)'}
              </Text>
            ))}
          </View>

          {/* Base Stats */}
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
                <Text style={styles.catchMethodButtonSubtext}>Catch with type-colored background</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.catchMethodButton, styles.arButton]}
            onPress={() => {
              setCatchMethod('ar');
              setAttempts(0);
              setThrowing(false);
            }}
            disabled={catching}
          >
            <Text style={styles.catchMethodButtonText}>AR Mode</Text>
            <Text style={styles.catchMethodButtonSubtext}>Catch using camera (AR)</Text>
          </TouchableOpacity>
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
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#3498db',
    fontWeight: '600',
  },
  headerContent: {
    flex: 1,
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
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    alignItems: 'center',
    padding: 20,
    marginBottom: 8,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
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
  infoSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
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
  catchOptions: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
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
  // AR Mode Styles
  arContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  permissionSubtext: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  pokemonOverlay: {
    position: 'absolute',
    top: SCREEN_HEIGHT / 2 - 150,
    left: SCREEN_WIDTH / 2 - 100,
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arPokemonImage: {
    width: 200,
    height: 200,
  },
  shinyIndicatorAR: {
    position: 'absolute',
    top: -10,
    backgroundColor: '#f39c12',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
  },
  shinyIndicatorTextAR: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  pokeballContainer: {
    position: 'absolute',
    bottom: 100,
    left: SCREEN_WIDTH / 2 - 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  pokeballEmoji: {
    fontSize: 50,
  },
  arUIOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: Math.max(16, 0),
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  arPokemonName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    marginTop: 50,
  },
  attemptsText: {
    fontSize: 16,
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    marginTop: 8,
  },
  throwButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  throwButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  throwButtonDisabled: {
    backgroundColor: '#7f8c8d',
    opacity: 0.6,
  },
  throwButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default PokemonCatchScreen;
