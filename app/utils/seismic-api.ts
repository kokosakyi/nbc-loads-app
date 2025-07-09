import { GraphQLClient } from 'graphql-request';

const CANSHM_ENDPOINT = 'https://www.earthquakescanada.nrcan.gc.ca/api/canshm/graphql';

const client = new GraphQLClient(CANSHM_ENDPOINT);

export interface SeismicHazardData {
  location: string;
  latitude: number;
  longitude: number;
  PGA: number;        // Peak Ground Acceleration (g)
  Sa02: number;       // Spectral acceleration at 0.2s (g)
  Sa10: number;       // Spectral acceleration at 1.0s (g)
  Sa20: number;       // Spectral acceleration at 2.0s (g)
  Sa50: number;       // Spectral acceleration at 5.0s (g)
  returnPeriod: number;
  probabilityLevel: number;
  siteClass: string;
}

export interface LocationSearchResult {
  name: string;
  province: string;
  latitude: number;
  longitude: number;
  type: string;
}

// GraphQL response types
interface SeismicHazardResponse {
  seismicHazard: SeismicHazardData;
}

interface LocationSearchResponse {
  searchLocations: LocationSearchResult[];
}

// GraphQL query to get seismic hazard values
const GET_SEISMIC_HAZARD = `
  query GetSeismicHazard($latitude: Float!, $longitude: Float!, $returnPeriod: Int, $siteClass: String) {
    seismicHazard(
      latitude: $latitude, 
      longitude: $longitude, 
      returnPeriod: $returnPeriod, 
      siteClass: $siteClass
    ) {
      location
      latitude
      longitude
      PGA
      Sa02: spectralAcceleration(period: 0.2)
      Sa10: spectralAcceleration(period: 1.0)
      Sa20: spectralAcceleration(period: 2.0)
      Sa50: spectralAcceleration(period: 5.0)
      returnPeriod
      probabilityLevel
      siteClass
      hazardModel
      modelVersion
    }
  }
`;

// Query to search for locations
const SEARCH_LOCATIONS = `
  query SearchLocations($query: String!) {
    searchLocations(query: $query) {
      name
      province
      latitude
      longitude
      type
    }
  }
`;

export async function getSeismicHazard(
  latitude: number,
  longitude: number,
  returnPeriod: number = 2475, // Default to 2475 years (2% in 50 years)
  siteClass: string = 'C'
): Promise<SeismicHazardData> {
  try {
    const data = await client.request(GET_SEISMIC_HAZARD, {
      latitude,
      longitude,
      returnPeriod,
      siteClass
    }) as SeismicHazardResponse;

    return data.seismicHazard;
  } catch (error) {
    console.error('Error fetching seismic hazard data:', error);
    throw new Error('Failed to fetch seismic hazard data');
  }
}

export async function searchLocations(query: string): Promise<LocationSearchResult[]> {
  try {
    const data = await client.request(SEARCH_LOCATIONS, { query }) as LocationSearchResponse;
    return data.searchLocations;
  } catch (error) {
    console.error('Error searching locations:', error);
    throw new Error('Failed to search locations');
  }
}

// Utility function to get coordinates for major Canadian cities
export const MAJOR_CITIES = [
  { name: 'Vancouver', province: 'BC', latitude: 49.2827, longitude: -123.1207 },
  { name: 'Calgary', province: 'AB', latitude: 51.0447, longitude: -114.0719 },
  { name: 'Toronto', province: 'ON', latitude: 43.6532, longitude: -79.3832 },
  { name: 'Montreal', province: 'QC', latitude: 45.5017, longitude: -73.5673 },
  { name: 'Halifax', province: 'NS', latitude: 44.6488, longitude: -63.5752 },
  { name: 'Ottawa', province: 'ON', latitude: 45.4215, longitude: -75.6972 },
  { name: 'Quebec City', province: 'QC', latitude: 46.8139, longitude: -71.2080 },
  { name: 'Winnipeg', province: 'MB', latitude: 49.8951, longitude: -97.1384 },
  { name: 'Edmonton', province: 'AB', latitude: 53.5461, longitude: -113.4938 },
  { name: 'Victoria', province: 'BC', latitude: 48.4284, longitude: -123.3656 },
  { name: 'Saskatoon', province: 'SK', latitude: 52.1332, longitude: -106.6700 },
  { name: 'Regina', province: 'SK', latitude: 50.4452, longitude: -104.6189 },
  { name: 'Fredericton', province: 'NB', latitude: 45.9636, longitude: -66.6431 },
  { name: 'Charlottetown', province: 'PE', latitude: 46.2382, longitude: -63.1311 },
  { name: "St. John's", province: 'NL', latitude: 47.5615, longitude: -52.7126 },
  { name: 'Whitehorse', province: 'YT', latitude: 60.7212, longitude: -135.0568 },
  { name: 'Yellowknife', province: 'NT', latitude: 62.4540, longitude: -114.3718 },
  { name: 'Iqaluit', province: 'NU', latitude: 63.7467, longitude: -68.5170 },
];

// Fallback data in case API is unavailable
export const FALLBACK_SEISMIC_DATA: Record<string, Omit<SeismicHazardData, 'location'>> = {
  'Vancouver': { 
    latitude: 49.2827, longitude: -123.1207,
    PGA: 0.23, Sa02: 0.65, Sa10: 0.25, Sa20: 0.15, Sa50: 0.08,
    returnPeriod: 2475, probabilityLevel: 0.02, siteClass: 'C'
  },
  'Calgary': { 
    latitude: 51.0447, longitude: -114.0719,
    PGA: 0.03, Sa02: 0.08, Sa10: 0.03, Sa20: 0.02, Sa50: 0.01,
    returnPeriod: 2475, probabilityLevel: 0.02, siteClass: 'C'
  },
  'Toronto': { 
    latitude: 43.6532, longitude: -79.3832,
    PGA: 0.05, Sa02: 0.12, Sa10: 0.05, Sa20: 0.03, Sa50: 0.02,
    returnPeriod: 2475, probabilityLevel: 0.02, siteClass: 'C'
  },
  'Montreal': { 
    latitude: 45.5017, longitude: -73.5673,
    PGA: 0.18, Sa02: 0.35, Sa10: 0.15, Sa20: 0.08, Sa50: 0.04,
    returnPeriod: 2475, probabilityLevel: 0.02, siteClass: 'C'
  },
  'Ottawa': { 
    latitude: 45.4215, longitude: -75.6972,
    PGA: 0.18, Sa02: 0.35, Sa10: 0.15, Sa20: 0.08, Sa50: 0.04,
    returnPeriod: 2475, probabilityLevel: 0.02, siteClass: 'C'
  },
  'Quebec City': { 
    latitude: 46.8139, longitude: -71.2080,
    PGA: 0.22, Sa02: 0.45, Sa10: 0.20, Sa20: 0.10, Sa50: 0.05,
    returnPeriod: 2475, probabilityLevel: 0.02, siteClass: 'C'
  },
  'Halifax': { 
    latitude: 44.6488, longitude: -63.5752,
    PGA: 0.08, Sa02: 0.18, Sa10: 0.08, Sa20: 0.04, Sa50: 0.02,
    returnPeriod: 2475, probabilityLevel: 0.02, siteClass: 'C'
  },
  'Victoria': { 
    latitude: 48.4284, longitude: -123.3656,
    PGA: 0.27, Sa02: 0.75, Sa10: 0.30, Sa20: 0.18, Sa50: 0.10,
    returnPeriod: 2475, probabilityLevel: 0.02, siteClass: 'C'
  },
  'Winnipeg': { 
    latitude: 49.8951, longitude: -97.1384,
    PGA: 0.03, Sa02: 0.08, Sa10: 0.03, Sa20: 0.02, Sa50: 0.01,
    returnPeriod: 2475, probabilityLevel: 0.02, siteClass: 'C'
  },
  'Edmonton': { 
    latitude: 53.5461, longitude: -113.4938,
    PGA: 0.03, Sa02: 0.08, Sa10: 0.03, Sa20: 0.02, Sa50: 0.01,
    returnPeriod: 2475, probabilityLevel: 0.02, siteClass: 'C'
  },
};

export async function getSeismicHazardWithFallback(
  latitude: number,
  longitude: number,
  returnPeriod: number = 2475,
  siteClass: string = 'C'
): Promise<SeismicHazardData> {
  try {
    // First try to get data from the API
    return await getSeismicHazard(latitude, longitude, returnPeriod, siteClass);
  } catch (error) {
    console.warn('API unavailable, using fallback data:', error);
    
    // Find closest major city as fallback
    const closestCity = MAJOR_CITIES.reduce((closest, city) => {
      const distance = Math.sqrt(
        Math.pow(city.latitude - latitude, 2) + 
        Math.pow(city.longitude - longitude, 2)
      );
      const closestDistance = Math.sqrt(
        Math.pow(closest.latitude - latitude, 2) + 
        Math.pow(closest.longitude - longitude, 2)
      );
      return distance < closestDistance ? city : closest;
    });

    const fallbackData = FALLBACK_SEISMIC_DATA[closestCity.name];
    if (fallbackData) {
      return {
        location: `${closestCity.name}, ${closestCity.province} (Fallback)`,
        ...fallbackData
      };
    }

    throw new Error('No fallback data available');
  }
} 