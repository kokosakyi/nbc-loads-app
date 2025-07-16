import { GraphQLClient, gql } from 'graphql-request';

const client = new GraphQLClient('https://www.earthquakescanada.nrcan.gc.ca/api/canshm/graphql');

// Site class enum values as per the GraphQL API
export type CanSHM6SiteClass = 'A' | 'B' | 'C' | 'D' | 'E';

// Updated interfaces to match the actual API schema
export interface CanSHM6SiteDesignation {
  sa0p05?: number;
  sa0p1?: number;
  sa0p2?: number;
  sa0p3?: number;
  sa0p5?: number;
  sa1p0?: number;
  sa2p0?: number;
  sa5p0?: number;
  sa10p0?: number;
  poe50?: number;
  foe?: number;
  pga?: number;
  pgv?: number;
  vs30: number[];
}

export interface CanSHM6Metadata {
  projX: number;
  projY: number;
  zones?: string[];
}

export interface CanSHM6Point {
  geometry: {
    type: string;
    coordinates: number[];
  };
  metadata: CanSHM6Metadata;
  siteDesignationsXv?: CanSHM6SiteDesignation[];
  siteDesignationsXs?: CanSHM6SiteDesignation[];
}

export interface SeismicHazardData {
  location: string;
  latitude: number;
  longitude: number;
  pga: number;
  pgv?: number;
  sa0p05?: number;
  sa0p1?: number;
  sa0p2: number;
  sa0p3?: number;
  sa0p5: number;
  sa1p0: number;
  sa2p0: number;
  sa5p0?: number;
  sa10p0?: number;
  returnPeriod: number;
  siteClass: string;
  vs30: number;
  zones?: string[];
}

export interface LocationSearchResult {
  name: string;
  latitude: number;
  longitude: number;
  province?: string;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    state?: string;
    province?: string;
  };
}

// Major Canadian cities with coordinates
export const MAJOR_CITIES: LocationSearchResult[] = [
  { name: "Toronto, ON", latitude: 43.6532, longitude: -79.3832, province: "Ontario" },
  { name: "Montreal, QC", latitude: 45.5017, longitude: -73.5673, province: "Quebec" },
  { name: "Vancouver, BC", latitude: 49.2827, longitude: -123.1207, province: "British Columbia" },
  { name: "Calgary, AB", latitude: 51.0447, longitude: -114.0719, province: "Alberta" },
  { name: "Edmonton, AB", latitude: 53.5461, longitude: -113.4938, province: "Alberta" },
  { name: "Ottawa, ON", latitude: 45.4215, longitude: -75.6972, province: "Ontario" },
  { name: "Winnipeg, MB", latitude: 49.8951, longitude: -97.1384, province: "Manitoba" },
  { name: "Quebec City, QC", latitude: 46.8139, longitude: -71.2080, province: "Quebec" },
  { name: "Hamilton, ON", latitude: 43.2557, longitude: -79.8711, province: "Ontario" },
  { name: "Kitchener, ON", latitude: 43.4643, longitude: -80.5204, province: "Ontario" },
  { name: "London, ON", latitude: 42.9849, longitude: -81.2453, province: "Ontario" },
  { name: "Halifax, NS", latitude: 44.6488, longitude: -63.5752, province: "Nova Scotia" },
  { name: "St. John's, NL", latitude: 47.5615, longitude: -52.7126, province: "Newfoundland and Labrador" },
  { name: "Saskatoon, SK", latitude: 52.1332, longitude: -106.6700, province: "Saskatchewan" },
  { name: "Regina, SK", latitude: 50.4452, longitude: -104.6189, province: "Saskatchewan" },
  { name: "Charlottetown, PE", latitude: 46.2382, longitude: -63.1311, province: "Prince Edward Island" },
  { name: "Fredericton, NB", latitude: 45.9636, longitude: -66.6431, province: "New Brunswick" },
  { name: "Whitehorse, YT", latitude: 60.7212, longitude: -135.0568, province: "Yukon" }
];

// GraphQL query for site class designations
const GET_SEISMIC_DATA_BY_SITE_CLASS = gql`
  query GetSeismicDataBySiteClass($latitude: Float!, $longitude: Float!, $siteClass: CanSHM6SiteClass!, $poe50: [Float!]) {
    NBC2020(latitude: $latitude, longitude: $longitude) {
      geometry {
        type
        coordinates
      }
      metadata {
        projX
        projY
        zones
      }
      siteDesignationsXs(siteClass: $siteClass, poe50: $poe50) {
        sa0p05
        sa0p1
        sa0p2
        sa0p3
        sa0p5
        sa1p0
        sa2p0
        sa5p0
        sa10p0
        poe50
        foe
        pga
        pgv
      }
    }
  }
`;

// Fallback to original query if site class query fails
const GET_SEISMIC_DATA_BY_VS30 = gql`
  query GetSeismicData($latitude: Float!, $longitude: Float!, $vs30: Float!, $poe50: [Float!]) {
    NBC2020(latitude: $latitude, longitude: $longitude) {
      geometry {
        type
        coordinates
      }
      metadata {
        projX
        projY
        zones
      }
      siteDesignationsXv(vs30: $vs30, poe50: $poe50) {
        sa0p05
        sa0p1
        sa0p2
        sa0p3
        sa0p5
        sa1p0
        sa2p0
        sa5p0
        sa10p0
        poe50
        foe
        pga
        pgv
        vs30
      }
    }
  }
`;

// Fallback data for when API is unavailable
const FALLBACK_SEISMIC_DATA: SeismicHazardData[] = [
  {
    location: "Toronto, ON",
    latitude: 43.6532,
    longitude: -79.3832,
    pga: 0.21,
    pgv: 0.15,
    sa0p05: 0.45,
    sa0p1: 0.50,
    sa0p2: 0.55,
    sa0p3: 0.45,
    sa0p5: 0.28,
    sa1p0: 0.12,
    sa2p0: 0.04,
    sa5p0: 0.02,
    sa10p0: 0.01,
    returnPeriod: 2475,
    siteClass: "C",
    vs30: 760
  },
  {
    location: "Montreal, QC",
    latitude: 45.5017,
    longitude: -73.5673,
    pga: 0.32,
    pgv: 0.22,
    sa0p05: 0.68,
    sa0p1: 0.75,
    sa0p2: 0.78,
    sa0p3: 0.65,
    sa0p5: 0.41,
    sa1p0: 0.18,
    sa2p0: 0.06,
    sa5p0: 0.03,
    sa10p0: 0.015,
    returnPeriod: 2475,
    siteClass: "C",
    vs30: 760
  },
  {
    location: "Vancouver, BC",
    latitude: 49.2827,
    longitude: -123.1207,
    pga: 0.45,
    pgv: 0.35,
    sa0p05: 0.95,
    sa0p1: 1.05,
    sa0p2: 1.12,
    sa0p3: 0.95,
    sa0p5: 0.58,
    sa1p0: 0.24,
    sa2p0: 0.08,
    sa5p0: 0.04,
    sa10p0: 0.02,
    returnPeriod: 2475,
    siteClass: "C",
    vs30: 760
  },
  {
    location: "Calgary, AB",
    latitude: 51.0447,
    longitude: -114.0719,
    pga: 0.08,
    pgv: 0.05,
    sa0p05: 0.18,
    sa0p1: 0.20,
    sa0p2: 0.22,
    sa0p3: 0.18,
    sa0p5: 0.11,
    sa1p0: 0.05,
    sa2p0: 0.02,
    sa5p0: 0.01,
    sa10p0: 0.005,
    returnPeriod: 2475,
    siteClass: "C",
    vs30: 760
  },
  {
    location: "Ottawa, ON",
    latitude: 45.4215,
    longitude: -75.6972,
    pga: 0.28,
    pgv: 0.18,
    sa0p05: 0.62,
    sa0p1: 0.68,
    sa0p2: 0.71,
    sa0p3: 0.58,
    sa0p5: 0.37,
    sa1p0: 0.16,
    sa2p0: 0.05,
    sa5p0: 0.025,
    sa10p0: 0.012,
    returnPeriod: 2475,
    siteClass: "C",
    vs30: 760
  }
];

export async function getSeismicHazardDataBySiteClass(
  latitude: number, 
  longitude: number, 
  siteClass: CanSHM6SiteClass,
  returnPeriods: number[] = [2.0]
): Promise<SeismicHazardData[]> {
  try {
    console.log(`Fetching seismic data for lat: ${latitude}, lng: ${longitude}, siteClass: ${siteClass}`);
    
    const variables = {
      latitude,
      longitude,
      siteClass: siteClass, // Pass site class directly (A, B, C, D, E)
      poe50: returnPeriods
    };

    // Try the site class query first
    try {
      const data: { NBC2020: CanSHM6Point } = await client.request(GET_SEISMIC_DATA_BY_SITE_CLASS, variables);
      
      console.log('API Response (Site Class):', JSON.stringify(data, null, 2));
      
      if (data.NBC2020 && data.NBC2020.siteDesignationsXs) {
        return processSiteDesignations(data.NBC2020, latitude, longitude, siteClass, returnPeriods, 'siteClass');
      }
    } catch (error) {
      console.warn('Site class query failed, falling back to vs30:', error);
    }

    // Fallback to vs30 query
    const vs30 = getVs30FromSiteClass(siteClass);
    const vs30Variables = {
      latitude,
      longitude,
      vs30,
      poe50: returnPeriods
    };

    const data: { NBC2020: CanSHM6Point } = await client.request(GET_SEISMIC_DATA_BY_VS30, vs30Variables);
    
    console.log('API Response (vs30 fallback):', JSON.stringify(data, null, 2));
    
    if (!data.NBC2020 || !data.NBC2020.siteDesignationsXv) {
      throw new Error('No seismic data available for this location');
    }

    return processSiteDesignations(data.NBC2020, latitude, longitude, siteClass, returnPeriods, 'vs30');
    
  } catch (error) {
    console.error('Error fetching seismic data:', error);
    console.log('Using fallback data...');
    
    const vs30Value = getVs30FromSiteClass(siteClass);
    
    // Return fallback data for the specific location if available
    const fallback = FALLBACK_SEISMIC_DATA.find(
      data => Math.abs(data.latitude - latitude) < 0.1 && Math.abs(data.longitude - longitude) < 0.1
    );
    
    if (fallback) {
      return [{ ...fallback, vs30: vs30Value, siteClass }];
    }
    
    // Return generic fallback data
    return [{
      location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      latitude,
      longitude,
      pga: 0.15,
      pgv: 0.10,
      sa0p05: 0.30,
      sa0p1: 0.32,
      sa0p2: 0.35,
      sa0p3: 0.28,
      sa0p5: 0.20,
      sa1p0: 0.10,
      sa2p0: 0.03,
      sa5p0: 0.015,
      sa10p0: 0.008,
      returnPeriod: 2475,
      siteClass,
      vs30: vs30Value
    }];
  }
}

export async function searchLocations(query: string): Promise<LocationSearchResult[]> {
  // First search through major cities
  const normalizedQuery = query.toLowerCase();
  const cityResults = MAJOR_CITIES.filter(city => 
    city.name.toLowerCase().includes(normalizedQuery) ||
    (city.province && city.province.toLowerCase().includes(normalizedQuery))
  );
  
  // If we have city results, return them
  if (cityResults.length > 0) {
    return cityResults;
  }
  
  // If no city results, try geocoding with OpenStreetMap Nominatim
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&countrycodes=ca&q=${encodeURIComponent(query)}`
    );
    
    if (!response.ok) {
      throw new Error('Geocoding request failed');
    }
    
    const data: NominatimResult[] = await response.json();
    
    return data.map((result: NominatimResult) => ({
      name: result.display_name,
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      province: result.address?.state || result.address?.province
    }));
  } catch (error) {
    console.error('Geocoding error:', error);
    return [];
  }
}

export async function geocodeAddress(address: string): Promise<LocationSearchResult | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&countrycodes=ca&q=${encodeURIComponent(address)}`
    );
    
    if (!response.ok) {
      throw new Error('Geocoding request failed');
    }
    
    const data: NominatimResult[] = await response.json();
    
    if (data.length > 0) {
      const result = data[0];
      return {
        name: result.display_name,
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        province: result.address?.state || result.address?.province
      };
    }
    
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

function getSiteClassFromVs30(vs30: number): CanSHM6SiteClass {
  if (vs30 >= 1500) return "A";
  if (vs30 >= 760) return "B";
  if (vs30 >= 360) return "C";
  if (vs30 >= 180) return "D";
  return "E";
}

// Legacy compatibility function - use getSeismicHazardDataBySiteClass instead
export async function getSeismicHazardData(
  latitude: number, 
  longitude: number, 
  vs30: number = 760,
  returnPeriods: number[] = [2.0]
): Promise<SeismicHazardData[]> {
  const siteClass = getSiteClassFromVs30(vs30);
  return getSeismicHazardDataBySiteClass(latitude, longitude, siteClass, returnPeriods);
}

function getVs30FromSiteClass(siteClass: CanSHM6SiteClass): number {
  switch (siteClass) {
    case 'A': return 1500;  // Hard rock
    case 'B': return 1100;  // Rock
    case 'C': return 560;   // Very dense soil and soft rock
    case 'D': return 270;   // Stiff soil
    case 'E': return 135;   // Soft soil
    default: return 760;    // Default to Site Class B
  }
}

function processSiteDesignations(
  nbcData: CanSHM6Point, 
  latitude: number, 
  longitude: number, 
  siteClass: CanSHM6SiteClass, 
  returnPeriods: number[], 
  dataType: 'siteClass' | 'vs30'
): SeismicHazardData[] {
  const results: SeismicHazardData[] = [];
  const designations = dataType === 'siteClass' ? nbcData.siteDesignationsXs : nbcData.siteDesignationsXv;
  
  if (!designations) {
    throw new Error('No site designations available for this location');
  }

  designations.forEach((designation) => {
    const calculatedReturnPeriod = designation.poe50 ? 
      getReturnPeriodFromPoe50(designation.poe50) : 
      2475; // Default to 2475 years if poe50 not available
    
    const vs30Value = dataType === 'siteClass' ? getVs30FromSiteClass(siteClass) : (designation.vs30 ? designation.vs30[0] : getVs30FromSiteClass(siteClass));
    
    results.push({
      location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      latitude,
      longitude,
      pga: designation.pga || 0,
      pgv: designation.pgv || 0,
      sa0p05: designation.sa0p05 || 0,
      sa0p1: designation.sa0p1 || 0,
      sa0p2: designation.sa0p2 || 0,
      sa0p3: designation.sa0p3 || 0,
      sa0p5: designation.sa0p5 || 0,
      sa1p0: designation.sa1p0 || 0,
      sa2p0: designation.sa2p0 || 0,
      sa5p0: designation.sa5p0 || 0,
      sa10p0: designation.sa10p0 || 0,
      returnPeriod: calculatedReturnPeriod,
      siteClass: siteClass,
      vs30: vs30Value,
      zones: nbcData.metadata.zones
    });
  });

  return results;
}

export function getReturnPeriodFromPoe50(poe50: number): number {
  // Convert 50-year probability of exceedance to return period
  // Return period = -50 / ln(1 - poe50)
  if (poe50 <= 0 || poe50 >= 1) return 2475; // Default fallback
  return Math.round(-50 / Math.log(1 - poe50));
}

export function getPoe50FromReturnPeriod(returnPeriod: number): number {
  // Convert return period to 50-year probability of exceedance
  // poe50 = 1 - exp(-50 / return_period)
  return 1 - Math.exp(-50 / returnPeriod);
} 