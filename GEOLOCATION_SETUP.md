# Geolocation Feature Setup

## Overview
The geolocation-based Pokemon discovery feature has been implemented. Users can now:
- See their current location on a map
- View up to 10 random Pokemon spawned around them
- Catch Pokemon using either default background or AR mode
- View all caught Pokemon in their profile

## Features Implemented

### 1. Hunt Screen (`src/screens/HuntScreen.tsx`)
- Displays user's current location on a map
- Spawns up to 10 random Pokemon within ~1km radius
- Shows Pokemon markers on the map
- Tap a Pokemon marker to catch it

### 2. Pokemon Catch Screen (`src/screens/PokemonCatchScreen.tsx`)
- Shows Pokemon details before catching
- Two catch methods:
  - **Default Background**: Catch with default background
  - **AR Mode**: Catch using camera (placeholder for now)
- Saves caught Pokemon with location and method

### 3. Pokemon Storage (`src/services/pokemonStorage.ts`)
- Uses AsyncStorage to persist caught Pokemon
- Stores Pokemon data, catch location, catch method, and timestamp
- Prevents duplicate catches (by Pokemon ID)

### 4. Profile Screen Updates (`src/screens/ProfileScreen.tsx`)
- Displays all caught Pokemon in a grid
- Shows Pokemon stats, types, catch date, and catch method
- Displays total count of caught Pokemon

## Configuration Required

### Android - Google Maps API Key

1. Get a Google Maps API key from [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the following APIs:
   - Maps SDK for Android
   - Maps SDK for iOS (if using iOS)
3. Update `android/app/src/main/AndroidManifest.xml`:
   ```xml
   <meta-data
       android:name="com.google.android.geo.API_KEY"
       android:value="YOUR_GOOGLE_MAPS_API_KEY"/>
   ```
   Replace `YOUR_GOOGLE_MAPS_API_KEY` with your actual API key.

### iOS - Google Maps API Key (Optional)

If you want to use Google Maps on iOS instead of Apple Maps:

1. Get a Google Maps API key (same as Android)
2. Enable Maps SDK for iOS
3. Add to `ios/AwesomeProject/AppDelegate.swift`:
   ```swift
   import GoogleMaps
   
   // In didFinishLaunchingWithOptions:
   GMSServices.provideAPIKey("YOUR_GOOGLE_MAPS_API_KEY")
   ```

**Note**: iOS uses Apple Maps by default, which doesn't require an API key. Google Maps is optional.

## Permissions

### Android
Location permissions are already added to `AndroidManifest.xml`:
- `ACCESS_FINE_LOCATION`
- `ACCESS_COARSE_LOCATION`

The app will request permission at runtime.

### iOS
Location permission description is added to `Info.plist`:
- `NSLocationWhenInUseUsageDescription`
- `NSLocationAlwaysAndWhenInUseUsageDescription`

The app will request permission at runtime.

## Testing

1. **Grant Location Permission**: When you first open the Hunt screen, grant location permission
2. **View Map**: Your current location should appear on the map
3. **Spawn Pokemon**: Up to 10 random Pokemon will spawn around you
4. **Catch Pokemon**: Tap a Pokemon marker to open the catch screen
5. **Choose Method**: Select either "Default Background" or "AR Mode"
6. **View Profile**: Go to Profile tab to see all caught Pokemon

## Notes

- Pokemon spawn within a ~1km radius of your location
- Pokemon IDs are randomly selected from 1-1025 (current PokeAPI range)
- Caught Pokemon are stored locally using AsyncStorage
- AR mode is currently a placeholder - full AR implementation can be added later
- The map refreshes Pokemon positions when you tap the "Refresh" button

## Next Steps (Optional Enhancements)

1. **AR Implementation**: Integrate a proper AR library (e.g., ViroReact, react-native-arcore)
2. **Camera Integration**: Add camera functionality for AR mode
3. **Biome-based Spawning**: Spawn Pokemon based on real-world biomes (urban, rural, water, etc.)
4. **Notifications**: Add push notifications for nearby Pokemon
5. **Cloud Sync**: Move storage from AsyncStorage to Firebase for cross-device sync

