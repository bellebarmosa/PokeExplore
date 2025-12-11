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
import PushNotification from 'react-native-push-notification';
import { getPokemon, Pokemon, getPokemonByHabitat } from '../services/pokeapi';
import { detectHabitat } from '../utils/habitatDetection';

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

/**
 * Calculate distance between two coordinates in kilometers using Haversine formula
 */
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

const HuntScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [pokemonMarkers, setPokemonMarkers] = useState<PokemonMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationPermission, setLocationPermission] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState<Set<number>>(new Set());

  // Configure push notifications
  useEffect(() => {
    // Configure notification channel for Android
    if (Platform.OS === 'android') {
      PushNotification.createChannel(
        {
          channelId: 'pokemon-nearby',
          channelName: 'Pokemon Nearby',
          channelDescription: 'Notifications for nearby Pokemon',
          playSound: true,
          soundName: 'default',
          importance: 4, // High importance
          vibrate: true,
        },
        (created) => console.log(`Notification channel created: ${created}`)
      );
    }

    // Configure push notification
    PushNotification.configure({
      onRegister: function (token) {
        console.log('TOKEN:', token);
      },
      onNotification: function (notification) {
        console.log('NOTIFICATION:', notification);
        // Handle notification tap if needed
        if (notification.userInteraction) {
          // User tapped the notification
          console.log('User tapped notification');
        }
      },
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },
      popInitialNotification: true,
      requestPermissions: Platform.OS === 'ios',
    });

    // For iOS, request notification permissions
    if (Platform.OS === 'ios') {
      PushNotification.requestPermissions();
    }

    // Request notification permission for Android
    if (Platform.OS === 'android') {
      requestNotificationPermission();
    }
  }, []);

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

  const requestNotificationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: 'Notification Permission',
            message: 'PokeExplore needs notification permission to alert you about nearby Pokemon.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Notification permission granted');
        }
      } catch (err) {
        console.warn('Notification permission error:', err);
      }
    }
  };

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

  const spawnPokemon = async (location: { latitude: number; longitude: number }, isRefresh: boolean = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // Detect habitat based on location
      const habitat = await detectHabitat(location.latitude, location.longitude);
      console.log('Detected habitat for location:', habitat, location);
      
      // Get Pokemon based on detected habitat
      let pokemonList: Pokemon[] = [];
      try {
        pokemonList = await getPokemonByHabitat(habitat);
        
        // If we don't have enough Pokemon from habitat, fill with random ones
        if (pokemonList.length < MAX_POKEMON) {
          const needed = MAX_POKEMON - pokemonList.length;
          const randomIds = new Set<number>();
          while (randomIds.size < needed) {
            randomIds.add(Math.floor(Math.random() * 1025) + 1);
          }
          const randomPokemon = await Promise.all(
            Array.from(randomIds).map((id) => getPokemon(id))
          );
          pokemonList = [...pokemonList, ...randomPokemon];
        }
        
        // Limit to MAX_POKEMON
        pokemonList = pokemonList.slice(0, MAX_POKEMON);
      } catch (habitatError) {
        console.error('Failed to get Pokemon by habitat, using random:', habitatError);
        // Fallback to random Pokemon if habitat lookup fails
        const randomIds = new Set<number>();
        while (randomIds.size < MAX_POKEMON) {
          randomIds.add(Math.floor(Math.random() * 1025) + 1);
        }
        pokemonList = await Promise.all(
          Array.from(randomIds).map((id) => getPokemon(id))
        );
      }

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

      // Preload images before setting markers
      const preloadImages = async () => {
        const imagePromises = markers.map((marker) => {
          return new Promise<void>((resolve) => {
            let imageUrl: string | null = null;
            
            if (marker.isShiny) {
              imageUrl =
                marker.pokemon.sprites.front_shiny ||
                marker.pokemon.sprites.other?.['official-artwork']?.front_shiny ||
                null;
            }
            
            if (!imageUrl) {
              imageUrl =
                marker.pokemon.sprites.front_default ||
                marker.pokemon.sprites.other?.['official-artwork']?.front_default ||
                `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${marker.pokemon.id}.png`;
            }
            
            const finalImageUrl = imageUrl || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${marker.pokemon.id}.png`;
            
            // Use Image.prefetch to cache the image
            Image.prefetch(finalImageUrl)
              .then(() => {
                resolve();
              })
              .catch((error) => {
                console.warn('Failed to preload image:', finalImageUrl, error);
                // Still resolve to show marker even if preload fails
                resolve();
              });
          });
        });
        
        // Wait for all images to be prefetched, then set markers
        await Promise.all(imagePromises);
        
        // Set markers after images are preloaded
        setPokemonMarkers(markers);
        
        // Force a small delay to ensure images are cached
        setTimeout(() => {
          setImagesLoaded(new Set(markers.map(m => m.id)));
        }, 100);
        
        // Notify user about nearest 5 Pokemon (only on initial spawn, not refresh)
        if (!isRefresh) {
          notifyNearestPokemon(markers, location);
        }
      };
      
      await preloadImages();
    } catch (error) {
      console.error('Failed to spawn Pokemon:', error);
      Alert.alert('Error', 'Failed to load nearby Pokemon. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
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
      spawnPokemon(userLocation, true);
    } else {
      getUserLocation();
    }
  };

  /**
   * Notify user about the nearest 5 Pokemon
   */
  const notifyNearestPokemon = (
    markers: PokemonMarker[],
    userLocation: { latitude: number; longitude: number }
  ) => {
    if (markers.length === 0) return;

    // Calculate distances and sort by nearest
    const pokemonWithDistance = markers.map((marker) => {
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        marker.latitude,
        marker.longitude
      );
      return {
        ...marker,
        distance,
      };
    });

    // Sort by distance (nearest first) and take top 5
    const nearest5 = pokemonWithDistance
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);

    // Format notification message - keep it concise for notification bar
    const pokemonList = nearest5
      .map((p, index) => {
        const name = p.pokemon.name.charAt(0).toUpperCase() + p.pokemon.name.slice(1);
        const shinyText = p.isShiny ? '✨' : '';
        const distanceText = p.distance < 0.1 
          ? `${Math.round(p.distance * 1000)}m` 
          : `${p.distance.toFixed(2)}km`;
        return `${index + 1}. ${name}${shinyText} ${distanceText}`;
      })
      .join(', ');

    const title = nearest5.length === 1 
      ? 'Pokemon Nearby!' 
      : `${nearest5.length} Pokemon Nearby!`;

    // Send push notification
    PushNotification.localNotification({
      channelId: 'pokemon-nearby',
      title: title,
      message: pokemonList,
      playSound: true,
      soundName: 'default',
      importance: 'high',
      priority: 'high',
      vibrate: true,
      vibration: 300,
      userInfo: {
        type: 'pokemon_nearby',
        count: nearest5.length,
      },
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Hunt</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh} disabled={loading || refreshing}>
          {refreshing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.refreshButtonText}>Refresh</Text>
          )}
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
          region={{
            ...userLocation,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
          showsUserLocation={true}
          showsMyLocationButton={true}
          key={`map-${pokemonMarkers.length}`}
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
                key={`${marker.id}-${marker.latitude}-${marker.longitude}`}
                coordinate={{
                  latitude: marker.latitude,
                  longitude: marker.longitude,
                }}
                title={title}
                description={`#${String(marker.pokemon.id).padStart(3, '0')}`}
                onPress={() => handlePokemonMarkerPress(marker)}
                anchor={{ x: 0.5, y: 0.5 }}
                tracksViewChanges={false}
              >
                <View style={[styles.pokemonMarker, marker.isShiny && styles.shinyMarker]}>
                  <Image
                    source={{ uri: finalImageUrl }}
                    style={styles.pokemonMarkerImage}
                    resizeMode="contain"
                    onLoad={() => {
                      // Image loaded successfully
                    }}
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
