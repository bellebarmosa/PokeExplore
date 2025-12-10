import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Geolocation from '@react-native-community/geolocation';
import { getPokemon, Pokemon } from '../services/pokeapi';

type RootStackParamList = {
  MainTabs: undefined;
  PokemonCatch: { pokemon: Pokemon; location: { latitude: number; longitude: number }; isShiny: boolean };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

const ARScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [locationPermission, setLocationPermission] = useState(false);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  useEffect(() => {
    if (locationPermission) {
      loadNearestPokemon();
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
          // If permission denied, still load a random Pokemon
          loadRandomPokemon();
        }
      } catch (err) {
        console.warn(err);
        loadRandomPokemon();
      }
    } else {
      // iOS permissions are handled via Info.plist
      setLocationPermission(true);
    }
  };

  const loadNearestPokemon = () => {
    setLoading(true);
    Geolocation.getCurrentPosition(
      (position) => {
        const userLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        
        // Get a random Pokemon (simulating nearest)
        // In a real implementation, you'd calculate distance to nearby Pokemon
        loadRandomPokemon(userLocation);
      },
      (error) => {
        console.error('Location error:', error);
        // Fallback to random Pokemon if location fails
        loadRandomPokemon({ latitude: 0, longitude: 0 });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const loadRandomPokemon = async (location: { latitude: number; longitude: number }) => {
    try {
      setLoading(true);
      // Get random Pokemon ID (1-1025)
      const randomId = Math.floor(Math.random() * 1025) + 1;
      
      // 5% chance for shiny
      const isShiny = Math.random() < 0.05;

      const pokemon = await getPokemon(randomId);
      
      // Navigate directly to AR catch screen with auto-start AR mode
      navigation.navigate('PokemonCatch', {
        pokemon,
        location,
        isShiny,
        autoStartAR: true, // Automatically start in AR mode
      });
    } catch (error) {
      console.error('Failed to load Pokemon:', error);
      Alert.alert('Error', 'Failed to load Pokemon. Please try again.');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading Pokemon...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>AR</Text>
      <Text style={styles.subtitle}>No Pokemon available</Text>
      <Text style={styles.retryText} onPress={() => loadRandomPokemon({ latitude: 0, longitude: 0 })}>
        Tap to load Pokemon
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#7f8c8d',
  },
  retryText: {
    fontSize: 16,
    color: '#3498db',
    textDecorationLine: 'underline',
  },
});

export default ARScreen;
