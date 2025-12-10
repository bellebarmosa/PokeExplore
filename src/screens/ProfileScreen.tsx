import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  ScrollView,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getCaughtPokemon, CaughtPokemon } from '../services/pokemonStorage';
import { getTypeColor } from '../utils/typeColors';

const ProfileScreen = () => {
  const { user, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const [caughtPokemon, setCaughtPokemon] = useState<CaughtPokemon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadCaughtPokemon();
    }
  }, [user]);

  const loadCaughtPokemon = async () => {
    if (!user) return;
    try {
      const pokemon = await getCaughtPokemon(user.uid);
      setCaughtPokemon(pokemon);
    } catch (error) {
      console.error('Failed to load caught Pokemon:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const renderPokemonItem = ({ item }: { item: CaughtPokemon }) => {
    // Use shiny sprite if caught as shiny
    const imageUrl = item.isShiny
      ? (item.sprites.other?.['official-artwork']?.front_shiny ||
          item.sprites.front_shiny ||
          item.sprites.other?.['official-artwork']?.front_default ||
          item.sprites.front_default ||
          'https://via.placeholder.com/200')
      : (item.sprites.other?.['official-artwork']?.front_default ||
          item.sprites.front_default ||
          'https://via.placeholder.com/200');

    return (
      <View style={[styles.pokemonCard, item.isShiny && styles.shinyCard]}>
        {item.isShiny && (
          <View style={styles.shinyIndicator}>
            <Text style={styles.shinyIndicatorText}>✨ SHINY</Text>
          </View>
        )}
        <Image source={{ uri: imageUrl }} style={styles.pokemonImage} />
        <Text style={styles.pokemonName}>
          {item.isShiny ? '✨ ' : ''}
          {item.name.charAt(0).toUpperCase() + item.name.slice(1)}
        </Text>
        <Text style={styles.pokemonId}>#{String(item.id).padStart(3, '0')}</Text>
        <View style={styles.typesContainer}>
          {item.types.map((type, index) => (
            <View
              key={index}
              style={[styles.typeBadge, { backgroundColor: getTypeColor(type.type.name) }]}
            >
              <Text style={styles.typeText}>{type.type.name}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.caughtDate}>
          Caught: {new Date(item.caughtAt).toLocaleDateString()}
        </Text>
        <Text style={styles.caughtMethod}>
          Method: {item.caughtMethod === 'ar' ? 'AR' : 'Default'}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {user && (
            <>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                  {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.name}>{user.displayName || 'User'}</Text>
              <Text style={styles.email}>{user.email}</Text>
            </>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Caught Pokemon ({caughtPokemon.length})</Text>
            {loading ? (
              <Text style={styles.loadingText}>Loading...</Text>
            ) : caughtPokemon.length === 0 ? (
              <Text style={styles.emptyText}>No Pokemon caught yet. Go hunting!</Text>
            ) : (
              <FlatList
                data={caughtPokemon}
                renderItem={renderPokemonItem}
                keyExtractor={(item) => item.id.toString()}
                numColumns={2}
                scrollEnabled={false}
                contentContainerStyle={styles.pokemonList}
              />
            )}
          </View>

          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutButtonText}>Sign Out</Text>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 40,
    color: '#fff',
    fontWeight: 'bold',
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 32,
  },
  section: {
    width: '100%',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  pokemonList: {
    paddingBottom: 8,
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
  shinyCard: {
    borderWidth: 2,
    borderColor: '#f39c12',
  },
  shinyIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#f39c12',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    zIndex: 1,
  },
  shinyIndicatorText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  pokemonImage: {
    width: 100,
    height: 100,
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
  caughtDate: {
    fontSize: 10,
    color: '#7f8c8d',
    marginTop: 8,
  },
  caughtMethod: {
    fontSize: 10,
    color: '#3498db',
    marginTop: 4,
    fontWeight: '600',
  },
  signOutButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 32,
  },
  signOutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;
