import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getCaughtPokemon, CaughtPokemon } from '../services/pokemonStorage';
import { getTypeColor } from '../utils/typeColors';
import { getUserAchievements, Achievement } from '../services/achievements';
import { getUserFeedPosts, FeedPost } from '../services/feed';
import { getUserProfile, updateUserProfile } from '../services/userProfile';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import TypeIcon from '../components/TypeIcon';

const ProfileScreen = () => {
  const { user, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const [caughtPokemon, setCaughtPokemon] = useState<CaughtPokemon[]>([]);
  const [latestCaughtPokemon, setLatestCaughtPokemon] = useState<CaughtPokemon[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [latestAchievements, setLatestAchievements] = useState<Achievement[]>([]);
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [savedDisplayName, setSavedDisplayName] = useState(''); // Store the saved display name
  const [savingName, setSavingName] = useState(false);
  const [expandedSections, setExpandedSections] = useState<{
    allAchievements: boolean;
    allPokemon: boolean;
    allPosts: boolean;
  }>({
    allAchievements: false,
    allPokemon: false,
    allPosts: false,
  });

  useEffect(() => {
    if (user) {
      loadProfileData();
    }
  }, [user]);

  const loadProfileData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      
      // Load user profile
      const userProfile = await getUserProfile(user.uid);
      if (userProfile && userProfile.displayName) {
        // Only use profile display name if it exists and is not empty
        setDisplayName(userProfile.displayName);
        setSavedDisplayName(userProfile.displayName); // Store the saved name
      } else {
        // Only fallback to email if no profile exists
        const defaultName = user.displayName || 'Trainer';
        setDisplayName(defaultName);
        setSavedDisplayName(defaultName);
      }

      // Load caught Pokemon
      const pokemon = await getCaughtPokemon(user.uid);
      setCaughtPokemon(pokemon);
      setLatestCaughtPokemon(pokemon.slice(0, 5));

      // Load achievements
      const userAchievements = await getUserAchievements(user.uid);
      setAchievements(userAchievements);
      setLatestAchievements(
        userAchievements.sort((a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime()).slice(0, 5)
      );

      // Load feed posts
      const posts = await getUserFeedPosts(user.uid, 5);
      setFeedPosts(posts);
    } catch (error) {
      console.error('Failed to load profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveName = async () => {
    if (!user || !displayName.trim()) {
      Alert.alert('Error', 'Please enter a valid name');
      return;
    }

    try {
      setSavingName(true);
      const updatedName = displayName.trim();
      await updateUserProfile(user.uid, user.email || '', updatedName);
      setSavedDisplayName(updatedName); // Update saved name
      setDisplayName(updatedName); // Ensure display name is set
      setEditingName(false);
      // Reload profile data to ensure everything is in sync
      await loadProfileData();
      Alert.alert('Success', 'Name updated successfully. Note: Existing feed posts will keep their original display name.');
    } catch (error) {
      console.error('Failed to update name:', error);
      Alert.alert('Error', 'Failed to update name. Please try again.');
    } finally {
      setSavingName(false);
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
      <View style={styles.pokemonCard}>
        {item.isShiny && (
          <View style={styles.shinyIndicator}>
            <Text style={styles.shinyIndicatorText}>✨</Text>
          </View>
        )}
        <Image source={{ uri: imageUrl }} style={styles.pokemonImage} />
        <Text style={styles.pokemonName}>
          {item.name.charAt(0).toUpperCase() + item.name.slice(1)}
        </Text>
        <Text style={styles.pokemonId}>#{String(item.id).padStart(3, '0')}</Text>
      </View>
    );
  };

  // Helper function to convert milestone to roman numeral
  const getRomanNumeral = (milestone: number): string => {
    const romanNumerals: { [key: number]: string } = {
      1: 'I',
      5: 'II',
      10: 'III',
      50: 'IV',
      100: 'V',
      500: 'VI',
    };
    return romanNumerals[milestone] || '';
  };

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

  const renderAchievementItem = ({ item }: { item: Achievement }) => {
    const isCatchAchievement = item.achievementType === 'catch_milestone';
    const romanNumeral = getRomanNumeral(item.milestone);

    return (
      <View style={styles.achievementCard}>
        <View style={styles.achievementIconContainer}>
          {isCatchAchievement ? (
            <View style={styles.pokeballIconWithBadge}>
              <Image
                source={require('../icons/pokeball.png')}
                style={styles.pokeballIcon}
                resizeMode="contain"
              />
              {romanNumeral && (
                <View style={styles.romanNumeralBadge}>
                  <Text style={styles.romanNumeralText}>{romanNumeral}</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.typeIconWithBadge}>
              <TypeIcon type={item.pokemonType || 'normal'} size={24} />
              {romanNumeral && (
                <View style={styles.romanNumeralBadge}>
                  <Text style={styles.romanNumeralText}>{romanNumeral}</Text>
                </View>
              )}
            </View>
          )}
        </View>
        <Text style={styles.achievementName}>{item.achievementName}</Text>
        <Text style={styles.achievementDate}>
          {new Date(item.unlockedAt).toLocaleDateString()}
        </Text>
      </View>
    );
  };

  const renderFeedPostItem = ({ item }: { item: FeedPost }) => {
    if (item.postType === 'achievement' && item.achievementName) {
      const achievementInfo = parseAchievementInfo(item.achievementName);
      
      return (
        <View style={styles.feedPostCard}>
          {achievementInfo.isCatch ? (
            <View style={styles.pokeballIconWithBadgeFeed}>
              <Image
                source={require('../icons/pokeball.png')}
                style={styles.pokeballIconFeed}
                resizeMode="contain"
              />
              {achievementInfo.romanNumeral && (
                <View style={styles.romanNumeralBadgeFeedSmall}>
                  <Text style={styles.romanNumeralTextFeedSmall}>{achievementInfo.romanNumeral}</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.typeIconWithBadgeFeed}>
              <TypeIcon type={achievementInfo.type || 'normal'} size={20} />
              {achievementInfo.romanNumeral && (
                <View style={styles.romanNumeralBadgeFeedSmall}>
                  <Text style={styles.romanNumeralTextFeedSmall}>{achievementInfo.romanNumeral}</Text>
                </View>
              )}
            </View>
          )}
          <View style={styles.feedPostContent}>
            <Text style={styles.feedPostText}>
              <Text style={styles.feedPostUserName}>{item.userDisplayName}</Text> has achieved "
              {item.achievementName}" achievement
            </Text>
            <Text style={styles.feedPostDate}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
      );
    } else {
      return (
        <View style={styles.feedPostCard}>
          <Image
            source={{ uri: item.pokemonSprite || 'https://via.placeholder.com/50' }}
            style={styles.feedPostImage}
          />
          <View style={styles.feedPostContent}>
            <Text style={styles.feedPostText}>
              <Text style={styles.feedPostUserName}>{item.userDisplayName}</Text> has caught a "
              {item.pokemonName?.charAt(0).toUpperCase() + item.pokemonName?.slice(1)}"
            </Text>
            <Text style={styles.feedPostDate}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
      );
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {user && (
            <>
              <View style={styles.avatarWrapper}>
                <View style={styles.avatarContainer}>
                  <Text style={styles.avatarText}>
                    {(savedDisplayName || displayName || 'T').charAt(0).toUpperCase()}
                  </Text>
                </View>
                {!editingName && (
                  <TouchableOpacity
                    style={styles.editIconButton}
                    onPress={() => setEditingName(true)}
                  >
                    <Image
                      source={require('../icons/edit.png')}
                      style={styles.editIcon}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                )}
              </View>
              
              {editingName ? (
                <View style={styles.nameEditContainer}>
                  <TextInput
                    style={styles.nameInput}
                    value={displayName}
                    onChangeText={setDisplayName}
                    placeholder="Enter your name"
                    autoFocus
                  />
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSaveName}
                    disabled={savingName}
                  >
                    {savingName ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.saveButtonText}>Save</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setEditingName(false);
                      setDisplayName(savedDisplayName); // Reset to saved name
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={styles.name}>{savedDisplayName || displayName}</Text>
              )}
              
              <Text style={styles.email}>{user.email}</Text>
            </>
          )}

          {/* Latest Posts */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Latest Posts</Text>
            {feedPosts.length === 0 ? (
              <Text style={styles.emptyText}>No feed posts yet</Text>
            ) : (
              <FlatList
                data={feedPosts}
                renderItem={renderFeedPostItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            )}
          </View>

          {/* Latest Achievements */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Latest Achievements</Text>
            {latestAchievements.length === 0 ? (
              <Text style={styles.emptyText}>No achievements yet</Text>
            ) : (
              <FlatList
                data={latestAchievements}
                renderItem={renderAchievementItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            )}
          </View>

          {/* Latest Caught Pokemon */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Latest Caught Pokemon</Text>
            {latestCaughtPokemon.length === 0 ? (
              <Text style={styles.emptyText}>No Pokemon caught yet. Go hunting!</Text>
            ) : (
              <FlatList
                data={latestCaughtPokemon}
                renderItem={renderPokemonItem}
                keyExtractor={(item) => item.id.toString()}
                numColumns={3}
                scrollEnabled={false}
                contentContainerStyle={styles.pokemonList}
              />
            )}
          </View>

          {/* All Posts (Collapsible) */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => setExpandedSections(prev => ({ ...prev, allPosts: !prev.allPosts }))}
            >
              <Text style={styles.sectionTitle}>All Posts</Text>
              <Image
                source={require('../icons/dropdown.png')}
                style={[
                  styles.dropdownIcon,
                  expandedSections.allPosts && styles.dropdownIconExpanded
                ]}
                resizeMode="contain"
              />
            </TouchableOpacity>
            {expandedSections.allPosts && (
              <>
                {feedPosts.length === 0 ? (
                  <Text style={styles.emptyText}>No feed posts yet</Text>
                ) : (
                  <FlatList
                    data={feedPosts}
                    renderItem={renderFeedPostItem}
                    keyExtractor={(item) => item.id}
                    scrollEnabled={false}
                  />
                )}
              </>
            )}
          </View>

          {/* All Achievements (Collapsible) */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => setExpandedSections(prev => ({ ...prev, allAchievements: !prev.allAchievements }))}
            >
              <Text style={styles.sectionTitle}>All Achievements ({achievements.length})</Text>
              <Image
                source={require('../icons/dropdown.png')}
                style={[
                  styles.dropdownIcon,
                  expandedSections.allAchievements && styles.dropdownIconExpanded
                ]}
                resizeMode="contain"
              />
            </TouchableOpacity>
            {expandedSections.allAchievements && (
              <>
                {achievements.length === 0 ? (
                  <Text style={styles.emptyText}>No achievements yet. Start catching Pokemon!</Text>
                ) : (
                  <View style={styles.achievementsGrid}>
                    {achievements.map((achievement) => {
                      const isCatchAchievement = achievement.achievementType === 'catch_milestone';
                      const romanNumeral = getRomanNumeral(achievement.milestone);
                      
                      return (
                        <View key={achievement.id} style={styles.achievementBadge}>
                          {isCatchAchievement ? (
                            <View style={styles.pokeballIconWithBadgeSmall}>
                              <Image
                                source={require('../icons/pokeball.png')}
                                style={styles.pokeballIconSmall}
                                resizeMode="contain"
                              />
                              {romanNumeral && (
                                <View style={styles.romanNumeralBadgeSmall}>
                                  <Text style={styles.romanNumeralTextSmall}>{romanNumeral}</Text>
                                </View>
                              )}
                            </View>
                          ) : (
                            <View style={styles.typeIconWithBadgeSmall}>
                              <TypeIcon type={achievement.pokemonType || 'normal'} size={20} />
                              {romanNumeral && (
                                <View style={styles.romanNumeralBadgeSmall}>
                                  <Text style={styles.romanNumeralTextSmall}>{romanNumeral}</Text>
                                </View>
                              )}
                            </View>
                          )}
                          <Text style={styles.achievementBadgeText}>{achievement.achievementName}</Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </>
            )}
          </View>

          {/* All Caught Pokemon (Collapsible) */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => setExpandedSections(prev => ({ ...prev, allPokemon: !prev.allPokemon }))}
            >
              <Text style={styles.sectionTitle}>All Caught Pokemon ({caughtPokemon.length})</Text>
              <Image
                source={require('../icons/dropdown.png')}
                style={[
                  styles.dropdownIcon,
                  expandedSections.allPokemon && styles.dropdownIconExpanded
                ]}
                resizeMode="contain"
              />
            </TouchableOpacity>
            {expandedSections.allPokemon && (
              <>
                {caughtPokemon.length === 0 ? (
                  <Text style={styles.emptyText}>No Pokemon caught yet. Go hunting!</Text>
                ) : (
                  <FlatList
                    data={caughtPokemon}
                    renderItem={renderPokemonItem}
                    keyExtractor={(item) => item.id.toString()}
                    numColumns={3}
                    scrollEnabled={false}
                    contentContainerStyle={styles.pokemonList}
                  />
                )}
              </>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    color: '#fff',
    fontWeight: 'bold',
  },
  editIconButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#3498db',
  },
  editIcon: {
    width: 18,
    height: 18,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2c3e50',
    marginRight: 8,
  },
  nameEditContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  nameInput: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 8,
  },
  saveButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  cancelButtonText: {
    color: '#7f8c8d',
    fontSize: 16,
  },
  email: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 32,
  },
  section: {
    width: '100%',
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  dropdownIcon: {
    width: 24,
    height: 24,
  },
  dropdownIconExpanded: {
    transform: [{ rotate: '180deg' }],
  },
  emptyText: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  feedPostCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  feedPostImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  pokeballIconWithBadgeFeed: {
    position: 'relative',
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pokeballIconFeed: {
    width: 20,
    height: 20,
  },
  typeIconWithBadgeFeed: {
    position: 'relative',
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  romanNumeralBadgeFeedSmall: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#fff',
    borderRadius: 6,
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  romanNumeralTextFeedSmall: {
    fontSize: 6,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  feedPostContent: {
    flex: 1,
  },
  feedPostText: {
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 4,
  },
  feedPostUserName: {
    fontWeight: '600',
    color: '#3498db',
  },
  feedPostDate: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  achievementIconContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pokeballIconWithBadge: {
    position: 'relative',
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pokeballIcon: {
    width: 24,
    height: 24,
  },
  typeIconWithBadge: {
    position: 'relative',
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  romanNumeralBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#fff',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  romanNumeralText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  achievementName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 12,
    flex: 1,
  },
  achievementDate: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  achievementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  pokeballIconWithBadgeSmall: {
    position: 'relative',
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pokeballIconSmall: {
    width: 20,
    height: 20,
  },
  typeIconWithBadgeSmall: {
    position: 'relative',
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  romanNumeralBadgeSmall: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#fff',
    borderRadius: 6,
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  romanNumeralTextSmall: {
    fontSize: 6,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  achievementBadgeText: {
    fontSize: 12,
    color: '#2c3e50',
    marginLeft: 6,
    fontWeight: '600',
  },
  pokemonList: {
    paddingBottom: 8,
  },
  pokemonCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    margin: 4,
    padding: 8,
    alignItems: 'center',
    position: 'relative',
    minWidth: 100,
  },
  shinyIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    zIndex: 1,
  },
  shinyIndicatorText: {
    fontSize: 12,
  },
  pokemonImage: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
  },
  pokemonName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 4,
    textAlign: 'center',
  },
  pokemonId: {
    fontSize: 10,
    color: '#7f8c8d',
    marginTop: 2,
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
