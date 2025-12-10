/**
 * Habitat Detection Utility
 * Detects Pokemon habitat based on user location
 */

export type DetectedHabitat = 
  | 'urban'
  | 'grassland'
  | 'forest'
  | 'cave'
  | 'mountain'
  | 'rough-terrain'
  | 'waters-edge'
  | 'sea'
  | 'rare';

/**
 * Habitat detection based on location
 * Uses reverse geocoding AND Places API to detect natural features
 * 
 * How it works:
 * 1. First, uses Geocoding API to get address information
 * 2. Then, uses Places API to find nearby natural features (mountains, parks, beaches)
 * 3. Prioritizes natural features over administrative areas
 * 4. Checks keywords in addresses and place names
 * 5. Returns the most specific habitat match
 */
export const detectHabitat = async (
  latitude: number,
  longitude: number
): Promise<DetectedHabitat> => {
  try {
    const apiKey = 'AIzaSyDCcInUlyIrYDZh3xMc6I5JI6D_V8YXg04';
    
    // Step 1: Get geocoding data (address information)
    const geocodeResponse = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
    );
    
    if (!geocodeResponse.ok) {
      console.log('Geocoding API failed, defaulting to grassland');
      return 'grassland';
    }
    
    const geocodeData = await geocodeResponse.json();
    
    // Step 2: Use Places API to find nearby natural features (more accurate for terrain)
    let placesData: any = null;
    try {
      const placesResponse = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=1000&type=natural_feature|park&key=${apiKey}`
      );
      if (placesResponse.ok) {
        placesData = await placesResponse.json();
      }
    } catch (placesError) {
      console.warn('Places API call failed, continuing with geocoding only:', placesError);
    }
    
    // Step 3: Analyze results
    // Prioritize Places API results (natural features) over geocoding results (addresses)
    
    // Collect all text to search (from both geocoding and places)
    const allTexts: string[] = [];
    const allTypes: string[] = [];
    
    // Add Places API results first (they're more specific for terrain)
    if (placesData?.results && placesData.results.length > 0) {
      placesData.results.forEach((place: any) => {
        const name = place.name?.toLowerCase() || '';
        const types = place.types || [];
        allTexts.push(name);
        allTypes.push(...types);
        console.log('Places API result:', { name, types });
      });
    }
    
    // Add geocoding results
    if (geocodeData.results && geocodeData.results.length > 0) {
      geocodeData.results.forEach((result: any) => {
        const address = result.formatted_address?.toLowerCase() || '';
        const types = result.types || [];
        allTexts.push(address);
        allTypes.push(...types);
        console.log('Geocoding result:', { address, types });
      });
    }
    
    const combinedText = allTexts.join(' ');
    console.log('Combined search text:', combinedText);
    console.log('All types found:', allTypes);
      
    // PRIORITY ORDER: Check most specific habitats first
    
    // 1. WATER-RELATED AREAS (highest priority - most specific)
    const waterKeywords = ['beach', 'coast', 'coastal', 'shore', 'seashore', 'harbor', 'harbour', 'port', 'lake', 'river', 'ocean', 'sea', 'bay', 'waterfront', 'marina', 'pier', 'wharf', 'waterfall', 'falls', 'stream', 'creek'];
    const hasWaterKeyword = waterKeywords.some(keyword => combinedText.includes(keyword));
    const hasWaterType = allTypes.includes('natural_feature') && 
      (combinedText.includes('beach') || combinedText.includes('coast') || combinedText.includes('water') || combinedText.includes('lake') || combinedText.includes('river'));
    
    if (hasWaterKeyword || hasWaterType) {
      console.log('✅ Detected habitat: WATERS-EDGE', { 
        reason: hasWaterKeyword ? 'keyword match' : 'type match',
        matchedText: combinedText 
      });
      return 'waters-edge';
    }
    
    // 2. MOUNTAIN/HILL AREAS (second priority)
    const mountainKeywords = ['mountain', 'hill', 'peak', 'ridge', 'summit', 'mount', 'volcano', 'cliff', 'canyon', 'valley', 'highland', 'range', 'elevation', 'altitude'];
    const hasMountainKeyword = mountainKeywords.some(keyword => combinedText.includes(keyword));
    const hasMountainType = allTypes.includes('natural_feature') && 
      (combinedText.includes('mountain') || combinedText.includes('hill') || combinedText.includes('peak') || combinedText.includes('mount'));
    
    // Also check if Places API found a natural_feature (likely a mountain)
    const hasNaturalFeature = allTypes.includes('natural_feature') && placesData?.results?.length > 0;
    
    if (hasMountainKeyword || hasMountainType || (hasNaturalFeature && !hasWaterKeyword)) {
      console.log('✅ Detected habitat: MOUNTAIN', { 
        reason: hasMountainKeyword ? 'keyword match' : hasMountainType ? 'type match' : 'natural feature found',
        matchedText: combinedText,
        hasNaturalFeature 
      });
      return 'mountain';
    }
    
    // 3. PARK/FOREST AREAS (third priority)
    const forestKeywords = ['park', 'forest', 'wood', 'woods', 'grove', 'nature', 'reserve', 'wildlife', 'national park', 'state park', 'trail', 'hiking', 'wilderness', 'conservation'];
    const hasForestKeyword = forestKeywords.some(keyword => combinedText.includes(keyword));
    const hasParkType = allTypes.includes('park') || (allTypes.includes('natural_feature') && combinedText.includes('park'));
    
    if (hasForestKeyword || hasParkType) {
      console.log('✅ Detected habitat: FOREST', { 
        reason: hasForestKeyword ? 'keyword match' : 'type match',
        matchedText: combinedText 
      });
      return 'forest';
    }
    
    // 4. URBAN AREAS (lowest priority - only if clearly urban)
    // Only consider urban if:
    // - It's explicitly a city/town AND
    // - No natural features were found nearby AND
    // - It contains urban keywords
    const urbanKeywords = ['city', 'town', 'urban', 'downtown', 'metropolitan', 'municipality', 'street', 'avenue', 'boulevard'];
    const hasUrbanKeyword = urbanKeywords.some(keyword => combinedText.includes(keyword));
    const isAdministrativeArea = allTypes.includes('locality') || allTypes.includes('administrative_area_level_1');
    const hasNoNaturalFeatures = !allTypes.includes('natural_feature') && !allTypes.includes('park') && !placesData?.results?.length;
    
    // Only return urban if it's clearly urban AND no natural features found
    if (hasUrbanKeyword && isAdministrativeArea && hasNoNaturalFeatures) {
      console.log('✅ Detected habitat: URBAN', { 
        reason: 'administrative area with urban keywords, no natural features',
        matchedText: combinedText 
      });
      return 'urban';
    }
    
    // 5. DEFAULT: Grassland for rural/suburban areas
    console.log('✅ Detected habitat: GRASSLAND (default)', { 
      reason: 'no specific habitat indicators found',
      matchedText: combinedText,
      note: 'This is the default for rural/suburban areas'
    });
    return 'grassland';
    
    // Fallback
    return 'urban';
  } catch (error) {
    console.error('Failed to detect habitat:', error);
    // Default to grassland if detection fails (less common than urban)
    return 'grassland';
  }
};

