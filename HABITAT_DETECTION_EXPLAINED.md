# How Habitat Detection Works

## Overview

The habitat detection system uses **two Google Maps APIs** to determine what type of Pokemon should spawn at your location:

1. **Geocoding API** - Gets address information from coordinates
2. **Places API** - Finds nearby natural features (mountains, parks, beaches)

## Detection Process (Step-by-Step)

### Step 1: Get Your Location
- Uses your device's GPS coordinates (latitude, longitude)

### Step 2: Call Geocoding API
- Sends your coordinates to Google's Geocoding API
- Gets back address information like:
  - Formatted address (e.g., "Mount Malindang, Misamis Occidental, Philippines")
  - Address components (city, state, country)
  - Location types (locality, natural_feature, park, etc.)

### Step 3: Call Places API (NEW!)
- Searches for nearby natural features within 1km radius
- Looks specifically for:
  - `natural_feature` types (mountains, hills, beaches, etc.)
  - `park` types (national parks, state parks, etc.)
- This is **more accurate** for terrain detection than just addresses

### Step 4: Analyze Results
The system checks results in this **priority order** (most specific first):

#### 1. **WATERS-EDGE** (Highest Priority)
- **Keywords**: beach, coast, lake, river, ocean, sea, bay, waterfall, etc.
- **Types**: `natural_feature` with water-related keywords
- **Example**: "Cobra Falls", "Beach Road", "Lake Tahoe"

#### 2. **MOUNTAIN** (Second Priority)
- **Keywords**: mountain, hill, peak, ridge, summit, mount, volcano, cliff, canyon, valley, range
- **Types**: `natural_feature` with mountain-related keywords
- **Places API**: If a natural feature is found nearby, it's likely a mountain
- **Example**: "Mount Malindang", "Hill Station", "Mountain Range"

#### 3. **FOREST** (Third Priority)
- **Keywords**: park, forest, wood, nature reserve, wildlife, trail, hiking
- **Types**: `park` or `natural_feature` with forest-related keywords
- **Example**: "National Park", "Forest Reserve", "Nature Trail"

#### 4. **URBAN** (Lowest Priority - Only if clearly urban)
- **Only returns urban if**:
  - It's an administrative area (city/town) **AND**
  - Contains urban keywords (city, town, downtown) **AND**
  - **NO natural features found nearby** (this is key!)
- **Example**: "Downtown Manila", "City Center"

#### 5. **GRASSLAND** (Default)
- Returns this if no specific habitat indicators are found
- Used for rural/suburban areas

## Why It Was Detecting "Urban" on Mountains

The old logic had these problems:

1. ❌ **Checked urban first** - If the address contained words like "street" or "road" (which most addresses do), it would return "urban" immediately
2. ❌ **Only used Geocoding API** - Addresses often include nearby city names, even when you're on a mountain
3. ❌ **Didn't prioritize natural features** - Administrative areas (cities) were checked before natural features

## How It's Fixed Now

1. ✅ **Uses Places API** - Finds actual natural features near you (mountains, parks, beaches)
2. ✅ **Prioritizes natural features** - Checks for mountains/water/forest BEFORE checking for urban
3. ✅ **Only returns urban if no natural features found** - Even if the address mentions a city, if there's a mountain nearby, it detects "mountain"
4. ✅ **Better keyword matching** - Expanded lists of keywords for each habitat type
5. ✅ **Detailed logging** - Console shows exactly why each habitat was detected

## Console Logging

When you test the app, check the console logs. You'll see:

```
Places API result: { name: 'Mount Malindang', types: ['natural_feature', 'establishment'] }
Geocoding result: { address: 'Mount Malindang Range Natural Park...', types: ['natural_feature', 'park'] }
Combined search text: mount malindang range natural park...
All types found: ['natural_feature', 'park', 'establishment']
✅ Detected habitat: MOUNTAIN { reason: 'natural feature found', matchedText: '...' }
```

## Required Google Cloud APIs

Make sure these APIs are enabled in your Google Cloud Console:

1. ✅ **Maps SDK for Android** (already enabled)
2. ✅ **Geocoding API** (for reverse geocoding)
3. ✅ **Places API** (NEW - for finding natural features)

To enable Places API:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" > "Library"
3. Search for "Places API"
4. Click "Enable"

## Testing Tips

1. **Check console logs** - They show exactly what the APIs return
2. **Try different locations**:
   - On a mountain peak → Should detect "mountain"
   - Near a beach → Should detect "waters-edge"
   - In a park → Should detect "forest"
   - In a city center → Should detect "urban"
3. **If it's still wrong**: Check the console logs to see what keywords/types were found

## Troubleshooting

**Q: Still detecting "urban" on a mountain?**
- Check console logs - what keywords/types were found?
- Is Places API enabled in Google Cloud Console?
- Try refreshing - Places API might need a moment to find nearby features

**Q: Not detecting water near a beach?**
- Make sure the location is actually near the water (within 1km)
- Check if the beach name contains water keywords
- Check console logs to see what was found

**Q: API errors?**
- Make sure Geocoding API and Places API are both enabled
- Check that your API key has permissions for both APIs
- Verify the API key is correct in the code

