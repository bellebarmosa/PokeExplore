import React from 'react';
import { View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Try to import SVG icons - they may not be available until Metro is restarted
let BugIcon: any;
let DarkIcon: any;
let DragonIcon: any;
let ElectricIcon: any;
let FairyIcon: any;
let FightingIcon: any;
let FireIcon: any;
let FlyingIcon: any;
let GhostIcon: any;
let GrassIcon: any;
let GroundIcon: any;
let IceIcon: any;
let NormalIcon: any;
let PoisonIcon: any;
let PsychicIcon: any;
let RockIcon: any;
let SteelIcon: any;
let WaterIcon: any;

try {
  BugIcon = require('../icons/bug.svg').default;
  DarkIcon = require('../icons/dark.svg').default;
  DragonIcon = require('../icons/dragon.svg').default;
  ElectricIcon = require('../icons/electric.svg').default;
  FairyIcon = require('../icons/fairy.svg').default;
  FightingIcon = require('../icons/fighting.svg').default;
  FireIcon = require('../icons/fire.svg').default;
  FlyingIcon = require('../icons/flying.svg').default;
  GhostIcon = require('../icons/ghost.svg').default;
  GrassIcon = require('../icons/grass.svg').default;
  GroundIcon = require('../icons/ground.svg').default;
  IceIcon = require('../icons/ice.svg').default;
  NormalIcon = require('../icons/normal.svg').default;
  PoisonIcon = require('../icons/poison.svg').default;
  PsychicIcon = require('../icons/psychic.svg').default;
  RockIcon = require('../icons/rock.svg').default;
  SteelIcon = require('../icons/steel.svg').default;
  WaterIcon = require('../icons/water.svg').default;
} catch (e) {
  // SVG imports failed - will use fallback icons
  console.warn('SVG icons not loaded, using fallback icons');
}

interface TypeIconProps {
  type: string;
  size?: number;
}

// Fallback icon mapping
const getFallbackIcon = (type: string): string => {
  const icons: { [key: string]: string } = {
    normal: 'circle',
    fire: 'fire',
    water: 'water',
    electric: 'lightning-bolt',
    grass: 'leaf',
    ice: 'snowflake',
    fighting: 'sword-cross',
    poison: 'skull',
    ground: 'terrain',
    flying: 'airplane',
    psychic: 'eye',
    bug: 'bug',
    rock: 'mountain',
    ghost: 'ghost',
    dragon: 'dragon',
    dark: 'weather-night',
    steel: 'shield',
    fairy: 'sparkles',
  };
  return icons[type.toLowerCase()] || 'circle';
};

// Type color mapping
const getTypeColor = (type: string): string => {
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

const TypeIcon: React.FC<TypeIconProps> = ({ type, size = 24 }) => {
  const typeLower = type.toLowerCase();
  const iconProps = { width: size, height: size };
  const typeColor = getTypeColor(type);

  const getIcon = () => {
    // Check if SVG component is valid (is a function/component)
    const isValidComponent = (comp: any) => {
      return comp && (typeof comp === 'function' || typeof comp === 'object');
    };

    let IconComponent: any = null;

    switch (typeLower) {
      case 'bug':
        IconComponent = BugIcon;
        break;
      case 'dark':
        IconComponent = DarkIcon;
        break;
      case 'dragon':
        IconComponent = DragonIcon;
        break;
      case 'electric':
        IconComponent = ElectricIcon;
        break;
      case 'fairy':
        IconComponent = FairyIcon;
        break;
      case 'fighting':
        IconComponent = FightingIcon;
        break;
      case 'fire':
        IconComponent = FireIcon;
        break;
      case 'flying':
        IconComponent = FlyingIcon;
        break;
      case 'ghost':
        IconComponent = GhostIcon;
        break;
      case 'grass':
        IconComponent = GrassIcon;
        break;
      case 'ground':
        IconComponent = GroundIcon;
        break;
      case 'ice':
        IconComponent = IceIcon;
        break;
      case 'normal':
        IconComponent = NormalIcon;
        break;
      case 'poison':
        IconComponent = PoisonIcon;
        break;
      case 'psychic':
        IconComponent = PsychicIcon;
        break;
      case 'rock':
        IconComponent = RockIcon;
        break;
      case 'steel':
        IconComponent = SteelIcon;
        break;
      case 'water':
        IconComponent = WaterIcon;
        break;
      default:
        IconComponent = NormalIcon;
    }

    // If SVG component is valid, use it; otherwise use fallback
    if (isValidComponent(IconComponent)) {
      return <IconComponent {...iconProps} />;
    } else {
      // Fallback to MaterialCommunityIcons
      return (
        <View style={[styles.fallbackContainer, { backgroundColor: typeColor }]}>
          <Icon name={getFallbackIcon(type)} size={size * 0.7} color="#fff" />
        </View>
      );
    }
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {getIcon()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default TypeIcon;
