# Habitat-Based Pokemon Spawning

## Overview

The Pokemon spawning system now uses habitat detection to spawn Pokemon appropriate to your real-world location. Instead of random Pokemon, you'll encounter Pokemon that match the environment you're in!

## How It Works

1. **Location Detection**: When you open the Hunt screen, the app detects your current location
2. **Habitat Analysis**: Uses Google Maps Geocoding API to analyze your surroundings
3. **Habitat Matching**: Determines which Pokemon habitat matches your location
4. **Pokemon Spawning**: Spawns up to 10 Pokemon from the appropriate habitat

## Detected Habitats

The system detects the following habitats based on your location:

### 🏙️ Urban
- **When detected**: Cities, towns, neighborhoods, areas with buildings
- **Keywords**: "city", "town", "urban", "downtown", "street", "avenue", "road", "building"
- **Example Pokemon**: Pidgey, Rattata, Meowth, Grimer, Koffing, Magnemite

### 🌊 Waters-Edge
- **When detected**: Beaches, coasts, shores, harbors, ports, lakes, rivers
- **Keywords**: "beach", "coast", "shore", "harbor", "port", "lake", "river", "ocean", "sea"
- **Example Pokemon**: Psyduck, Poliwag, Tentacool, Magikarp, Goldeen

### ⛰️ Mountain
- **When detected**: Mountain areas, hills, peaks, ridges, summits
- **Keywords**: "mountain", "hill", "peak", "ridge", "summit"
- **Example Pokemon**: Geodude, Onix, Machop, Zubat, Clefairy

### 🌲 Forest
- **When detected**: Parks, forests, woods, groves, nature reserves
- **Keywords**: "park", "forest", "wood", "grove", "nature"
- **Example Pokemon**: Caterpie, Weedle, Pikachu, Oddish, Bellsprout

### 🌾 Grassland
- **When detected**: Rural areas, open fields, countryside (default for non-urban areas)
- **Example Pokemon**: Pidgey, Nidoran, Vulpix, Growlithe, Ponyta

### 🕳️ Cave
- **When detected**: Underground areas, caves (rare)
- **Example Pokemon**: Zubat, Geodude, Onix, Machop

### 🌊 Sea
- **When detected**: Open ocean areas (rare)
- **Example Pokemon**: Tentacool, Staryu, Horsea, Shellder

### ⚠️ Rare
- **When detected**: Special or unknown areas
- **Example Pokemon**: Various rare Pokemon

## Technical Details

### Habitat Detection

The system uses Google Maps Geocoding API to:
1. Reverse geocode your coordinates (latitude/longitude)
2. Analyze address components and formatted address
3. Match keywords and location types to determine habitat
4. Fallback to "urban" if detection fails

### Pokemon Fetching

1. Fetches Pokemon species from the detected habitat using PokeAPI
2. Gets Pokemon details for each species
3. Randomly selects up to 10 Pokemon from the habitat
4. Falls back to random Pokemon if habitat has fewer than 10 species

### API Endpoints Used

- **PokeAPI**: `https://pokeapi.co/api/v2/pokemon-habitat/{habitatName}`
- **Google Maps Geocoding**: `https://maps.googleapis.com/maps/api/geocode/json`

## Configuration

### Google Maps API Key

The habitat detection uses your existing Google Maps API key configured in:
- `android/app/src/main/AndroidManifest.xml`
- The key is: `AIzaSyDCcInUlyIrYDZh3xMc6I5JI6D_V8YXg04`

### Required APIs

Make sure these APIs are enabled in Google Cloud Console:
- ✅ Maps SDK for Android
- ✅ Geocoding API (for reverse geocoding)

## Usage

1. **Open Hunt Screen**: Tap the "Hunt" tab
2. **Grant Location Permission**: Allow location access when prompted
3. **Wait for Detection**: The app detects your habitat (usually takes 1-2 seconds)
4. **View Pokemon**: See up to 10 Pokemon appropriate to your location on the map
5. **Refresh**: Tap "Refresh" to respawn Pokemon (may detect different habitat if you moved)

## Fallback Behavior

If habitat detection fails:
- Defaults to "urban" habitat
- Falls back to random Pokemon if habitat lookup fails
- Ensures you always see Pokemon even if detection has issues

## Example Scenarios

### Scenario 1: City Center
- **Location**: Downtown area with many buildings
- **Detected Habitat**: Urban
- **Pokemon**: Pidgey, Rattata, Meowth, Grimer, Koffing, etc.

### Scenario 2: Beach
- **Location**: Coastal area, beach
- **Detected Habitat**: Waters-Edge
- **Pokemon**: Psyduck, Poliwag, Tentacool, Magikarp, etc.

### Scenario 3: Mountain Trail
- **Location**: Mountain or hill area
- **Detected Habitat**: Mountain
- **Pokemon**: Geodude, Onix, Machop, Zubat, etc.

### Scenario 4: Park
- **Location**: City park or nature area
- **Detected Habitat**: Forest
- **Pokemon**: Caterpie, Weedle, Pikachu, Oddish, etc.

## Troubleshooting

### No Pokemon Spawning
- Check location permissions are granted
- Verify internet connection
- Check Google Maps API key is valid
- Try refreshing the map

### Wrong Habitat Detected
- The detection uses address data from Google Maps
- Some areas may be misclassified
- You can refresh to try again
- The system will fallback to random Pokemon if needed

### API Errors
- Verify Geocoding API is enabled in Google Cloud Console
- Check API key has proper permissions
- Ensure API key billing is set up (Geocoding API may require billing)

## Future Enhancements

Potential improvements:
- More precise habitat detection using satellite imagery
- Time-based spawning (different Pokemon at day/night)
- Weather-based spawning
- User preference to override habitat
- Habitat indicators on the map

