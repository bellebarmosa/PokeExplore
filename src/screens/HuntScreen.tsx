import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  PermissionsAndroid,
  Platform,
  Image,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getPokemon, Pokemon } from '../services/pokeapi';

type RootStackParamList = {
  MainTabs: undefined;
  PokemonCatch: { pokemon: Pokemon; location: { latitude: number; longitude: number }; isShiny: boolean };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

interface PokemonMarker {
  id: number;
  pokemon: Pokemon;
  latitude: number;
  longitude: number;
  isShiny: boolean;
}

const MAX_POKEMON = 10;
const SPAWN_RADIUS = 0.01; // ~1km radius

const HuntScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [pokemonMarkers, setPokemonMarkers] = useState<PokemonMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationPermission, setLocationPermission] = useState(false);

  // Request location permission
  useEffect(() => {
    requestLocationPermission();
  }, []);

  // Get user location and spawn Pokemon
  useEffect(() => {
    if (locationPermission) {
      getUserLocation();
    }
  }, [locationPermission]);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'PokeExplore needs access to your location to show nearby Pokemon.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          setLocationPermission(true);
        } else {
          Alert.alert('Permission Denied', 'Location permission is required to hunt Pokemon.');
        }
      } catch (err) {
        console.warn(err);
      }
    } else {
      // iOS permissions are handled via Info.plist
      setLocationPermission(true);
    }
  };

  const getUserLocation = () => {
    setLoading(true);
    Geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setUserLocation(location);
        spawnPokemon(location);
        
        // Center map on user location (zoomed in)
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            ...location,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }, 1000);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Location error:', error);
        Alert.alert('Location Error', 'Failed to get your location. Please enable location services.');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const spawnPokemon = async (location: { latitude: number; longitude: number }) => {
    try {
      // Get random Pokemon IDs (1-1025 is the current PokeAPI range)
      const randomIds = new Set<number>();
      while (randomIds.size < MAX_POKEMON) {
        randomIds.add(Math.floor(Math.random() * 1025) + 1);
      }

      // Fetch Pokemon data
      const pokemonPromises = Array.from(randomIds).map((id) => getPokemon(id));
      const pokemonList = await Promise.all(pokemonPromises);

      // Create markers with random positions around user
      const markers: PokemonMarker[] = pokemonList.map((pokemon) => {
        // Generate random position within spawn radius
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.random() * SPAWN_RADIUS;
        const latOffset = distance * Math.cos(angle);
        const lngOffset = distance * Math.sin(angle);

        // 1 in 20 chance for shiny (5% chance)
        const isShiny = Math.random() < 0.05;

        return {
          id: pokemon.id,
          pokemon,
          latitude: location.latitude + latOffset,
          longitude: location.longitude + lngOffset,
          isShiny,
        };
      });

      setPokemonMarkers(markers);
    } catch (error) {
      console.error('Failed to spawn Pokemon:', error);
      Alert.alert('Error', 'Failed to load nearby Pokemon. Please try again.');
    }
  };

  const handlePokemonMarkerPress = (marker: PokemonMarker) => {
    if (userLocation) {
      navigation.navigate('PokemonCatch', {
        pokemon: marker.pokemon,
        location: userLocation,
        isShiny: marker.isShiny,
      });
    }
  };

  const handleRefresh = () => {
    if (userLocation) {
      spawnPokemon(userLocation);
    } else {
      getUserLocation();
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Hunt</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh} disabled={loading}>
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {loading && !userLocation ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Getting your location...</Text>
        </View>
      ) : userLocation ? (
        <MapView
          ref={mapRef}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          style={styles.map}
          initialRegion={{
            ...userLocation,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
          showsUserLocation={true}
          showsMyLocationButton={true}
        >
          {/* User location marker */}
          <Marker
            coordinate={userLocation}
            title="You are here"
            pinColor="#3498db"
          />

          {/* Pokemon markers */}
          {pokemonMarkers.map((marker) => {
            // Get sprite URL - prefer shiny if isShiny is true
            let imageUrl: string | null = null;
            
            if (marker.isShiny) {
              // Try shiny sprites first
              imageUrl =
                marker.pokemon.sprites.front_shiny ||
                marker.pokemon.sprites.other?.['official-artwork']?.front_shiny ||
                null;
            }
            
            // Fallback to normal sprites if shiny not available or not shiny
            if (!imageUrl) {
              imageUrl =
                marker.pokemon.sprites.front_default ||
                marker.pokemon.sprites.other?.['official-artwork']?.front_default ||
                `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${marker.pokemon.id}.png`;
            }
            
            // Ensure imageUrl is never null
            const finalImageUrl = imageUrl || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${marker.pokemon.id}.png`;
            
            const pokemonName = marker.pokemon.name.charAt(0).toUpperCase() + marker.pokemon.name.slice(1);
            const title = marker.isShiny ? `✨ ${pokemonName} (Shiny!)` : pokemonName;
            
            return (
              <Marker
                key={marker.id}
                coordinate={{
                  latitude: marker.latitude,
                  longitude: marker.longitude,
                }}
                title={title}
                description={`#${String(marker.pokemon.id).padStart(3, '0')}`}
                onPress={() => handlePokemonMarkerPress(marker)}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <View style={[styles.pokemonMarker, marker.isShiny && styles.shinyMarker]}>
                  <Image
                    source={{ uri: finalImageUrl }}
                    style={styles.pokemonMarkerImage}
                    resizeMode="contain"
                    onError={(error) => {
                      console.error('Failed to load Pokemon image:', finalImageUrl, error);
                    }}
                  />
                  {marker.isShiny && (
                    <View style={styles.shinyBadge}>
                      <Text style={styles.shinyBadgeText}>✨</Text>
                    </View>
                  )}
                </View>
              </Marker>
            );
          })}
        </MapView>
      ) : (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Location permission required</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestLocationPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 8,
  },
  refreshButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#7f8c8d',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 16,
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
  pokemonMarker: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#3498db',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
  },
  shinyMarker: {
    borderColor: '#f39c12',
    borderWidth: 4,
  },
  pokemonMarkerImage: {
    width: 54,
    height: 54,
  },
  shinyBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#f39c12',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  shinyBadgeText: {
    fontSize: 10,
  },
});

export default HuntScreen;
