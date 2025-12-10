import React from 'react';
import { Image, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import PokedexScreen from '../screens/PokedexScreen';
import HuntScreen from '../screens/HuntScreen';
import ARScreen from '../screens/ARScreen';
import FeedScreen from '../screens/FeedScreen';
import ProfileScreen from '../screens/ProfileScreen';

export type TabParamList = {
  Hunt: undefined;
  Pokedex: undefined;
  AR: undefined;
  Feed: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

const TabNavigator = () => {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#3498db',
        tabBarInactiveTintColor: '#7f8c8d',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          paddingBottom: Math.max(insets.bottom, 10),
          paddingTop: 10,
          height: 70 + Math.max(insets.bottom - 10, 0),
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Hunt"
        component={HuntScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('../icons/radar.png')}
              style={[styles.tabIcon, { opacity: focused ? 1 : 0.5 }]}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tab.Screen
        name="Pokedex"
        component={PokedexScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('../icons/pokedex.png')}
              style={[styles.tabIcon, { opacity: focused ? 1 : 0.5 }]}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tab.Screen
        name="AR"
        component={ARScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('../icons/ar.png')}
              style={[styles.tabIcon, { opacity: focused ? 1 : 0.5 }]}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tab.Screen
        name="Feed"
        component={FeedScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('../icons/feed.png')}
              style={[styles.tabIcon, { opacity: focused ? 1 : 0.5 }]}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('../icons/profile.png')}
              style={[styles.tabIcon, { opacity: focused ? 1 : 0.5 }]}
              resizeMode="contain"
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabIcon: {
    width: 24,
    height: 24,
  },
});

export default TabNavigator;

