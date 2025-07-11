import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Form, useSubmit, useActionData } from "@remix-run/react";
import { useState, useEffect } from "react";
import {
    MapPinIcon,
    ExclamationTriangleIcon
} from "@heroicons/react/24/outline";
import {
    getSeismicHazardData,
    getSeismicHazardDataBySiteClass,
    searchLocations,
    geocodeAddress,
    MAJOR_CITIES,
    type SeismicHazardData,
    type LocationSearchResult
} from "~/utils/seismic-api";

export const meta: MetaFunction = () => {
    return [
        { title: "Seismic Load Calculator - NBC 2020 Structural Loads" },
        { name: "description", content: "Professional seismic load calculator with Canadian seismic hazard maps and equivalent static force method per NBC 4.1.8" },
    ];
};

// Loader to fetch seismic data
export async function loader({ request }: LoaderFunctionArgs) {
    const url = new URL(request.url);
    const lat = url.searchParams.get("lat");
    const lng = url.searchParams.get("lng");
    const vs30 = url.searchParams.get("vs30") || "760";
    const returnPeriods = url.searchParams.get("returnPeriods") || "2.0";

    if (lat && lng) {
        try {
            const latitude = parseFloat(lat);
            const longitude = parseFloat(lng);
            const vs30Value = parseFloat(vs30);
            const returnPeriodsArray = returnPeriods.split(',').map(p => parseFloat(p));

            const seismicData = await getSeismicHazardData(latitude, longitude, vs30Value, returnPeriodsArray);
            return json({ seismicData, error: null });
        } catch (error) {
            console.error("Error in loader:", error);
            return json({ seismicData: null, error: "Failed to fetch seismic data" });
        }
    }

    return json({ seismicData: null, error: null });
}

// Action to handle location search
export async function action({ request }: ActionFunctionArgs) {
    const formData = await request.formData();
    const intent = formData.get("intent");

    if (intent === "search-location") {
        const query = formData.get("query") as string;
        if (query) {
            try {
                const results = await searchLocations(query);
                return json({ searchResults: results, error: null });
            } catch (error) {
                return json({ searchResults: [], error: "Failed to search locations" });
            }
        }
    }

    if (intent === "get-seismic-data") {
        const lat = formData.get("latitude") as string;
        const lng = formData.get("longitude") as string;
        const siteClass = formData.get("siteClass") as string || "C";
        const returnPeriods = formData.get("returnPeriods") as string || "2.0";

        if (lat && lng) {
            try {
                const latitude = parseFloat(lat);
                const longitude = parseFloat(lng);
                const returnPeriodsArray = returnPeriods.split(',').map(p => parseFloat(p));

                const seismicData = await getSeismicHazardDataBySiteClass(latitude, longitude, siteClass, returnPeriodsArray);
                return json({ seismicData, error: null });
            } catch (error) {
                console.error("Error fetching seismic data:", error);
                return json({ seismicData: null, error: "Failed to fetch seismic data" });
            }
        }
    }

    return json({ error: "Invalid request" });
}

interface BuildingParameters {
    importance: "Low" | "Normal" | "High" | "Post-disaster";
    height: number; // m
    floors: number;
    weight: number; // kN
    structuralSystem: string;
    ductility: "Limited" | "Moderate" | "Ductile";
    irregularities: {
        vertical: boolean;
        horizontal: boolean;
    };
    siteClass: "A" | "B" | "C" | "D" | "E";
}

interface StructuralSystem {
    name: string;
    category: string;
    Rd: number;
    Ro: number;
    description: string;
    heightLimit: number; // m
    ductility: "Limited" | "Moderate" | "Ductile";
}

interface SeismicResult {
    parameter: string;
    value: number;
    unit: string;
    description: string;
    calculation?: string;
}

const structuralSystems: StructuralSystem[] = [
    // Steel systems
    {
        name: "Steel Moment Frame - Ductile",
        category: "Steel",
        Rd: 5.0,
        Ro: 1.5,
        description: "Ductile moment-resisting frame",
        heightLimit: 60,
        ductility: "Ductile"
    },
    {
        name: "Steel Moment Frame - Limited Ductility",
        category: "Steel",
        Rd: 3.5,
        Ro: 1.3,
        description: "Limited ductility moment frame",
        heightLimit: 40,
        ductility: "Limited"
    },
    {
        name: "Steel Braced Frame - Ductile",
        category: "Steel",
        Rd: 4.0,
        Ro: 1.5,
        description: "Ductile concentrically braced frame",
        heightLimit: 60,
        ductility: "Ductile"
    },
    {
        name: "Steel Braced Frame - Limited Ductility",
        category: "Steel",
        Rd: 2.0,
        Ro: 1.3,
        description: "Limited ductility braced frame",
        heightLimit: 40,
        ductility: "Limited"
    },

    // Concrete systems
    {
        name: "RC Moment Frame - Ductile",
        category: "Concrete",
        Rd: 4.0,
        Ro: 1.6,
        description: "Ductile reinforced concrete moment frame",
        heightLimit: 60,
        ductility: "Ductile"
    },
    {
        name: "RC Shear Wall - Ductile",
        category: "Concrete",
        Rd: 3.5,
        Ro: 1.6,
        description: "Ductile reinforced concrete shear wall",
        heightLimit: 60,
        ductility: "Ductile"
    },
    {
        name: "RC Shear Wall - Moderate Ductility",
        category: "Concrete",
        Rd: 2.0,
        Ro: 1.4,
        description: "Moderate ductility shear wall",
        heightLimit: 40,
        ductility: "Moderate"
    },

    // Wood systems
    {
        name: "Wood Frame - Conventional",
        category: "Wood",
        Rd: 3.0,
        Ro: 1.7,
        description: "Conventional wood frame construction",
        heightLimit: 15,
        ductility: "Moderate"
    },
    {
        name: "Wood Shear Wall",
        category: "Wood",
        Rd: 2.0,
        Ro: 1.5,
        description: "Wood structural panel shear wall",
        heightLimit: 20,
        ductility: "Limited"
    },

    // Masonry systems
    {
        name: "Masonry Shear Wall - Ductile",
        category: "Masonry",
        Rd: 2.0,
        Ro: 1.5,
        description: "Ductile reinforced masonry shear wall",
        heightLimit: 40,
        ductility: "Ductile"
    },
    {
        name: "Unreinforced Masonry",
        category: "Masonry",
        Rd: 1.0,
        Ro: 1.0,
        description: "Unreinforced masonry bearing wall",
        heightLimit: 15,
        ductility: "Limited"
    }
];

export default function SeismicLoadCalculator() {
    const { seismicData, error } = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();
    const submit = useSubmit();

    const [selectedCity, setSelectedCity] = useState<typeof MAJOR_CITIES[0] | null>(null);
    const [customLocation, setCustomLocation] = useState({
        latitude: '',
        longitude: '',
        name: ''
    });
    const [addressSearch, setAddressSearch] = useState('');
    const [addressSuggestions, setAddressSuggestions] = useState<LocationSearchResult[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [buildingParams, setBuildingParams] = useState<BuildingParameters>({
        importance: "Normal",
        height: 20,
        floors: 5,
        weight: 10000,
        structuralSystem: "Steel Moment Frame - Ductile",
        ductility: "Ductile",
        irregularities: {
            vertical: false,
            horizontal: false
        },
        siteClass: "C"
    });
    const [currentSeismicData, setCurrentSeismicData] = useState<SeismicHazardData | null>(
        seismicData && seismicData.length > 0 ? seismicData[0] : null
    );
    const [step, setStep] = useState(1);
    const [seismicResults, setSeismicResults] = useState<SeismicResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Update seismic data when loader data changes
    useEffect(() => {
        if (seismicData && seismicData.length > 0) {
            console.log('Available seismic data records:', seismicData.map(record => ({
                returnPeriod: record.returnPeriod,
                pga: record.pga,
                sa0p2: record.sa0p2,
                sa1p0: record.sa1p0
            })));

            // For NBC 2020 seismic design, we want the record closest to the 2475-year return period (2% in 50 years)
            // This corresponds to the design values used in NBC 2020
            let designRecord = seismicData.find(record =>
                record.returnPeriod >= 2000 && record.returnPeriod <= 3000
            );

            // If no record found in the ideal range, find the one closest to 2475 years
            if (!designRecord) {
                designRecord = seismicData.reduce((closest, current) => {
                    const closestDiff = Math.abs(closest.returnPeriod - 2475);
                    const currentDiff = Math.abs(current.returnPeriod - 2475);
                    return currentDiff < closestDiff ? current : closest;
                });
            }

            console.log('Selected design record:', {
                returnPeriod: designRecord.returnPeriod,
                pga: designRecord.pga,
                sa0p2: designRecord.sa0p2,
                sa1p0: designRecord.sa1p0
            });

            setCurrentSeismicData(designRecord);
        }
    }, [seismicData]);

    // Handle action data from form submissions
    useEffect(() => {
        if (actionData && 'seismicData' in actionData && actionData.seismicData) {
            console.log('Action data seismic results:', actionData.seismicData);

            // Process the seismic data similar to the loader data
            const seismicResults = actionData.seismicData as SeismicHazardData[];
            if (seismicResults && seismicResults.length > 0) {
                // Find the design record (closest to 2475 years or first available)
                let designRecord = seismicResults.find((record: SeismicHazardData) =>
                    record.returnPeriod >= 2000 && record.returnPeriod <= 3000
                );

                if (!designRecord) {
                    designRecord = seismicResults.reduce((closest: SeismicHazardData, current: SeismicHazardData) => {
                        const closestDiff = Math.abs(closest.returnPeriod - 2475);
                        const currentDiff = Math.abs(current.returnPeriod - 2475);
                        return currentDiff < closestDiff ? current : closest;
                    });
                }

                setCurrentSeismicData(designRecord);
            }
            setIsLoading(false);
        } else if (actionData && 'error' in actionData && actionData.error) {
            console.error('Action error:', actionData.error);
            setIsLoading(false);
        }
    }, [actionData]);





    // Function to fetch seismic data for a location
    const fetchSeismicData = (latitude: number, longitude: number) => {
        setIsLoading(true);

        const formData = new FormData();
        formData.append('intent', 'get-seismic-data');
        formData.append('latitude', latitude.toString());
        formData.append('longitude', longitude.toString());
        formData.append('siteClass', buildingParams.siteClass);
        formData.append('returnPeriods', '2.0');

        submit(formData, { method: "post" });
    };

    const handleCitySelect = (city: typeof MAJOR_CITIES[0]) => {
        setSelectedCity(city);
        setCustomLocation({ latitude: '', longitude: '', name: '' });
        setAddressSearch('');
        fetchSeismicData(city.latitude, city.longitude);
    };

    const handleAddressInputChange = async (value: string) => {
        setAddressSearch(value);

        if (value.length >= 3) {
            try {
                const suggestions = await searchLocations(value);
                setAddressSuggestions(suggestions);
                setShowSuggestions(true);
            } catch (error) {
                console.error('Failed to fetch suggestions:', error);
                setAddressSuggestions([]);
                setShowSuggestions(false);
            }
        } else {
            setAddressSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const handleSuggestionSelect = (suggestion: LocationSearchResult) => {
        setAddressSearch(suggestion.name);
        setCustomLocation({
            latitude: suggestion.latitude.toString(),
            longitude: suggestion.longitude.toString(),
            name: suggestion.name
        });
        setSelectedCity(null);
        setShowSuggestions(false);
        fetchSeismicData(suggestion.latitude, suggestion.longitude);
    };

    const handleAddressSearch = async () => {
        if (!addressSearch.trim()) return;

        setIsLoading(true);
        try {
            const result = await geocodeAddress(addressSearch);
            if (result) {
                setCustomLocation({
                    latitude: result.latitude.toString(),
                    longitude: result.longitude.toString(),
                    name: result.name
                });
                setSelectedCity(null);
                setShowSuggestions(false);
                fetchSeismicData(result.latitude, result.longitude);
            } else {
                alert('Address not found. Please try a different address or enter coordinates manually.');
            }
        } catch (error) {
            console.error('Address search failed:', error);
            alert('Address search failed. Please try again or enter coordinates manually.');
        } finally {
            setIsLoading(false);
        }
    };

    const calculateSeismicLoads = () => {
        if (!currentSeismicData) return;

        const results: SeismicResult[] = [];

        // Get the selected structural system
        const selectedSystem = structuralSystems.find(system => system.name === buildingParams.structuralSystem);
        if (!selectedSystem) return;

        // Site coefficients (simplified - in real application, these would be calculated based on site class and spectral values)
        const Fa = buildingParams.siteClass === 'A' ? 0.8 :
            buildingParams.siteClass === 'B' ? 1.0 :
                buildingParams.siteClass === 'C' ? 1.2 :
                    buildingParams.siteClass === 'D' ? 1.6 :
                        buildingParams.siteClass === 'E' ? 2.5 : 3.5;

        const Fv = buildingParams.siteClass === 'A' ? 0.8 :
            buildingParams.siteClass === 'B' ? 1.0 :
                buildingParams.siteClass === 'C' ? 1.8 :
                    buildingParams.siteClass === 'D' ? 2.4 :
                        buildingParams.siteClass === 'E' ? 3.5 : 3.5;

        // Design spectral accelerations
        const SaDesign02 = (2 / 3) * Fa * currentSeismicData.sa0p2;
        const SaDesign10 = (2 / 3) * Fv * currentSeismicData.sa1p0;

        // Importance factor (I_E)
        const Ie = buildingParams.importance === "Low" ? 0.8 :
            buildingParams.importance === "Normal" ? 1.0 :
                buildingParams.importance === "High" ? 1.3 : 1.5;

        // Natural period approximation (simplified)
        const Ta = buildingParams.height < 12 ? 0.1 * Math.pow(buildingParams.height, 0.75) : 0.1 * Math.pow(buildingParams.height, 0.75);

        // Base shear calculation
        const V = (SaDesign02 * Ie * buildingParams.weight) / (selectedSystem.Rd * selectedSystem.Ro);

        // Minimum base shear
        const Vmin = Math.max(
            0.005 * buildingParams.weight,
            (SaDesign10 * Ie * buildingParams.weight) / (selectedSystem.Rd * selectedSystem.Ro)
        );

        const VDesign = Math.max(V, Vmin);

        results.push(
            {
                parameter: "Site-Modified Spectral Acceleration (0.2s)",
                value: SaDesign02,
                unit: "g",
                description: "Design spectral acceleration at 0.2s period",
                calculation: `S(0.2) = (2/3) × ${Fa} × ${currentSeismicData.sa0p2.toFixed(3)} = ${SaDesign02.toFixed(3)}`
            },
            {
                parameter: "Site-Modified Spectral Acceleration (1.0s)",
                value: SaDesign10,
                unit: "g",
                description: "Design spectral acceleration at 1.0s period",
                calculation: `S(1.0) = (2/3) × ${Fv} × ${currentSeismicData.sa1p0.toFixed(3)} = ${SaDesign10.toFixed(3)}`
            },
            {
                parameter: "Fundamental Period",
                value: Ta,
                unit: "s",
                description: "Approximate fundamental period of the structure",
                calculation: `Ta = 0.1 × ${buildingParams.height}^0.75 = ${Ta.toFixed(3)} s`
            },
            {
                parameter: "Importance Factor",
                value: Ie,
                unit: "",
                description: "Seismic importance factor",
                calculation: `Ie = ${Ie} (${buildingParams.importance} importance)`
            },
            {
                parameter: "Base Shear",
                value: VDesign,
                unit: "kN",
                description: "Design base shear force",
                calculation: `V = max(${V.toFixed(1)}, ${Vmin.toFixed(1)}) = ${VDesign.toFixed(1)} kN`
            }
        );

        setSeismicResults(results);
        setStep(4);
    };

    const getSystemsByCategory = (category: string) => {
        return structuralSystems.filter(system => system.category === category);
    };

    const getSeismicZone = (sa02: number): string => {
        if (sa02 >= 0.75) return "Very High";
        if (sa02 >= 0.35) return "High";
        if (sa02 >= 0.15) return "Moderate";
        if (sa02 >= 0.05) return "Low";
        return "Very Low";
    };

    const resetCalculator = () => {
        setStep(1);
        setSelectedCity(null);
        setCustomLocation({ latitude: '', longitude: '', name: '' });
        setAddressSearch('');
        setAddressSuggestions([]);
        setShowSuggestions(false);
        setCurrentSeismicData(null);
        setSeismicResults([]);
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold mb-2">Seismic Load Calculator</h1>
                    <p className="text-gray-400">Calculate seismic loads per NBC 2020 Section 4.1.8</p>
                    <p className="text-sm text-gray-500 mt-2">Powered by Earthquakes Canada API</p>
                </div>

                {/* Progress Steps */}
                <div className="mb-8">
                    <div className="flex justify-center space-x-4">
                        {[1, 2, 3, 4].map((stepNum) => (
                            <div key={stepNum} className={`flex items-center ${stepNum < 4 ? 'mr-4' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${step >= stepNum ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-400'
                                    }`}>
                                    {stepNum}
                                </div>
                                <span className={`ml-2 ${step >= stepNum ? 'text-orange-500' : 'text-gray-400'}`}>
                                    {stepNum === 1 && "Basic Parameters"}
                                    {stepNum === 2 && "Location"}
                                    {stepNum === 3 && "Building Details"}
                                    {stepNum === 4 && "Results"}
                                </span>
                                {stepNum < 4 && <div className="w-8 h-px bg-gray-700 ml-4"></div>}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-gray-800 rounded-lg p-6 flex items-center space-x-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                            <p className="text-white">Fetching seismic data...</p>
                        </div>
                    </div>
                )}

                {/* Step 1: Basic Parameters */}
                {step === 1 && (
                    <div className="engineering-card">
                        <h2 className="text-2xl font-bold mb-6">Basic Seismic Parameters</h2>
                        <p className="text-gray-400 mb-6">
                            Select the importance category and site class. These parameters will be used to fetch the appropriate seismic data.
                        </p>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div>
                                <label htmlFor="importance-category" className="block text-lg font-medium mb-4">Importance Category</label>
                                <select
                                    id="importance-category"
                                    value={buildingParams.importance}
                                    onChange={(e) => setBuildingParams({ ...buildingParams, importance: e.target.value as BuildingParameters["importance"] })}
                                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-lg"
                                >
                                    <option value="Low">Low (I_E = 0.8)</option>
                                    <option value="Normal">Normal (I_E = 1.0)</option>
                                    <option value="High">High (I_E = 1.3)</option>
                                    <option value="Post-disaster">Post-Disaster (I_E = 1.5)</option>
                                </select>
                                <div className="mt-3 p-3 bg-gray-800 rounded-lg text-sm text-gray-300">
                                    <h4 className="font-medium text-white mb-2">Importance Categories:</h4>
                                    <ul className="space-y-1 text-xs">
                                        <li><strong>Low:</strong> Agricultural buildings, temporary structures</li>
                                        <li><strong>Normal:</strong> Residential, commercial buildings</li>
                                        <li><strong>High:</strong> Schools, hospitals, emergency facilities</li>
                                        <li><strong>Post-Disaster:</strong> Fire stations, emergency response centers</li>
                                    </ul>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="site-class" className="block text-lg font-medium mb-4">Site Class</label>
                                <select
                                    id="site-class"
                                    value={buildingParams.siteClass}
                                    onChange={(e) => setBuildingParams({ ...buildingParams, siteClass: e.target.value as BuildingParameters["siteClass"] })}
                                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-lg"
                                >
                                    <option value="A">A - Hard rock</option>
                                    <option value="B">B - Rock</option>
                                    <option value="C">C - Very dense soil and soft rock</option>
                                    <option value="D">D - Stiff soil</option>
                                    <option value="E">E - Soft soil</option>
                                </select>
                                <div className="mt-3 p-3 bg-gray-800 rounded-lg text-sm text-gray-300">
                                    <h4 className="font-medium text-white mb-2">Site Class vs30 Values:</h4>
                                    <ul className="space-y-1 text-xs">
                                        <li><strong>A:</strong> vs30 ≥ 1500 m/s (Hard rock)</li>
                                        <li><strong>B:</strong> vs30 = 760-1500 m/s (Rock)</li>
                                        <li><strong>C:</strong> vs30 = 360-760 m/s (Dense soil/soft rock)</li>
                                        <li><strong>D:</strong> vs30 = 180-360 m/s (Stiff soil)</li>
                                        <li><strong>E:</strong> vs30 &lt; 180 m/s (Soft soil)</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end mt-8">
                            <button
                                onClick={() => setStep(2)}
                                className="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
                            >
                                Next: Select Location
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Location Selection */}
                {step === 2 && (
                    <div className="engineering-card">
                        <h2 className="text-2xl font-bold mb-6 flex items-center">
                            <MapPinIcon className="h-6 w-6 mr-2 text-orange-500" />
                            Select Location
                        </h2>

                        {/* Error Display */}
                        {error && (
                            <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6 flex items-center">
                                <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
                                <div>
                                    <p className="text-red-200 font-medium">API Error</p>
                                    <p className="text-red-300 text-sm">{error}</p>
                                    <p className="text-red-400 text-xs mt-1">Using fallback data where available</p>
                                </div>
                            </div>
                        )}

                        {/* Major Cities */}
                        <div className="mb-8">
                            <h3 className="text-lg font-semibold mb-4">Major Canadian Cities</h3>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {MAJOR_CITIES.map((city) => (
                                    <button
                                        key={`${city.name}-${city.province}`}
                                        onClick={() => handleCitySelect(city)}
                                        className={`p-4 border-2 rounded-lg text-left transition-all ${selectedCity?.name === city.name
                                            ? 'border-orange-500 bg-orange-500/10'
                                            : 'border-gray-700 hover:border-gray-600'
                                            }`}
                                    >
                                        <div className="font-semibold">{city.name}</div>
                                        <div className="text-sm text-gray-400">{city.province}</div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {city.latitude.toFixed(4)}, {city.longitude.toFixed(4)}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Address Search */}
                        <div className="border-t border-gray-700 pt-8">
                            <h3 className="text-lg font-semibold mb-4">Search by Address</h3>
                            <div className="relative">
                                <div className="flex gap-4">
                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            value={addressSearch}
                                            onChange={(e) => handleAddressInputChange(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleAddressSearch()}
                                            onFocus={() => addressSuggestions.length > 0 && setShowSuggestions(true)}
                                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            placeholder="Enter address (e.g., 123 Main St, Toronto, ON)"
                                        />
                                        {/* Autocomplete suggestions */}
                                        {showSuggestions && addressSuggestions.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 bg-gray-800 border border-gray-700 rounded-md mt-1 z-10 max-h-60 overflow-y-auto">
                                                {addressSuggestions.map((suggestion, index) => (
                                                    <button
                                                        key={index}
                                                        onClick={() => handleSuggestionSelect(suggestion)}
                                                        className="w-full px-3 py-2 text-left hover:bg-gray-700 focus:bg-gray-700 focus:outline-none border-b border-gray-700 last:border-b-0"
                                                    >
                                                        <div className="font-medium text-white">{suggestion.name}</div>
                                                        {suggestion.province && (
                                                            <div className="text-sm text-gray-400">{suggestion.province}</div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={handleAddressSearch}
                                        disabled={!addressSearch.trim() || isLoading}
                                        className="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Search
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Custom Location */}
                        <div className="border-t border-gray-700 pt-8">
                            <h3 className="text-lg font-semibold mb-4">Or Enter Coordinates Manually</h3>
                            <Form method="post" className="space-y-4" onSubmit={(e) => {
                                setIsLoading(true);
                                const formData = new FormData(e.currentTarget);
                                formData.append('siteClass', buildingParams.siteClass);
                                formData.append('returnPeriods', '2.0');
                            }}>
                                <input type="hidden" name="intent" value="get-seismic-data" />
                                <div className="grid md:grid-cols-3 gap-4">
                                    <div>
                                        <label htmlFor="location-name" className="block text-sm font-medium mb-2">Location Name</label>
                                        <input
                                            id="location-name"
                                            type="text"
                                            name="name"
                                            value={customLocation.name}
                                            onChange={(e) => setCustomLocation({ ...customLocation, name: e.target.value })}
                                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            placeholder="Enter location name"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="location-latitude" className="block text-sm font-medium mb-2">Latitude</label>
                                        <input
                                            id="location-latitude"
                                            type="number"
                                            step="0.0001"
                                            name="latitude"
                                            value={customLocation.latitude}
                                            onChange={(e) => setCustomLocation({ ...customLocation, latitude: e.target.value })}
                                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            placeholder="45.4215"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="location-longitude" className="block text-sm font-medium mb-2">Longitude</label>
                                        <input
                                            id="location-longitude"
                                            type="number"
                                            step="0.0001"
                                            name="longitude"
                                            value={customLocation.longitude}
                                            onChange={(e) => setCustomLocation({ ...customLocation, longitude: e.target.value })}
                                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            placeholder="-75.6972"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={!customLocation.latitude || !customLocation.longitude}
                                    className="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                                >
                                    Get Seismic Data
                                </button>
                            </Form>
                        </div>

                        {/* Current Seismic Data Display */}
                        {currentSeismicData && (
                            <div className="mt-8 bg-gray-800 rounded-lg p-6">
                                <h3 className="text-lg font-semibold mb-4">Retrieved Seismic Hazard Data Summary</h3>
                                <div className="mb-4">
                                    <p className="text-sm text-gray-400 mb-2">
                                        <strong>Return Period:</strong> {currentSeismicData.returnPeriod} years (2% probability of exceedance in 50 years)
                                    </p>
                                </div>

                                {/* Main seismic parameters */}
                                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                    <div className="text-center bg-gray-700 rounded-lg p-4">
                                        <div className="text-2xl font-bold text-orange-500">{currentSeismicData.pga.toFixed(3)}</div>
                                        <div className="text-sm text-gray-400">PGA (g)</div>
                                    </div>
                                    <div className="text-center bg-gray-700 rounded-lg p-4">
                                        <div className="text-2xl font-bold text-orange-500">{currentSeismicData.pgv?.toFixed(3) || 'N/A'}</div>
                                        <div className="text-sm text-gray-400">PGV (m/s)</div>
                                    </div>
                                    <div className="text-center bg-gray-700 rounded-lg p-4">
                                        <div className="text-2xl font-bold text-orange-500">{currentSeismicData.sa0p2.toFixed(3)}</div>
                                        <div className="text-sm text-gray-400">Sa(0.2s) (g)</div>
                                    </div>
                                    <div className="text-center bg-gray-700 rounded-lg p-4">
                                        <div className="text-2xl font-bold text-orange-500">{currentSeismicData.sa1p0.toFixed(3)}</div>
                                        <div className="text-sm text-gray-400">Sa(1.0s) (g)</div>
                                    </div>
                                </div>

                                {/* Additional spectral accelerations */}
                                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                    <div className="text-center bg-gray-700 rounded-lg p-4">
                                        <div className="text-2xl font-bold text-orange-500">{currentSeismicData.sa0p5?.toFixed(3) || 'N/A'}</div>
                                        <div className="text-sm text-gray-400">Sa(0.5s) (g)</div>
                                    </div>
                                    <div className="text-center bg-gray-700 rounded-lg p-4">
                                        <div className="text-2xl font-bold text-orange-500">{currentSeismicData.sa2p0.toFixed(3)}</div>
                                        <div className="text-sm text-gray-400">Sa(2.0s) (g)</div>
                                    </div>
                                    <div className="text-center bg-gray-700 rounded-lg p-4">
                                        <div className="text-2xl font-bold text-orange-500">{currentSeismicData.sa5p0?.toFixed(3) || 'N/A'}</div>
                                        <div className="text-sm text-gray-400">Sa(5.0s) (g)</div>
                                    </div>
                                    <div className="text-center bg-gray-700 rounded-lg p-4">
                                        <div className="text-2xl font-bold text-orange-500">{currentSeismicData.sa10p0?.toFixed(3) || 'N/A'}</div>
                                        <div className="text-sm text-gray-400">Sa(10.0s) (g)</div>
                                    </div>
                                </div>

                                {/* Location information */}
                                <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-400">
                                    <div>
                                        <p><strong>Location:</strong> {currentSeismicData.location}</p>
                                        <p><strong>Coordinates:</strong> {currentSeismicData.latitude.toFixed(4)}, {currentSeismicData.longitude.toFixed(4)}</p>
                                    </div>
                                    <div>
                                        <p><strong>Site Class:</strong> {currentSeismicData.siteClass}</p>
                                        <p><strong>Seismic Zone:</strong> {getSeismicZone(currentSeismicData.sa0p2)}</p>
                                        {currentSeismicData.zones && <p><strong>Seismic Zones:</strong> {currentSeismicData.zones.join(', ')}</p>}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between mt-8">
                            <button
                                onClick={() => setStep(1)}
                                className="px-6 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
                            >
                                Back: Basic Parameters
                            </button>
                            <button
                                onClick={() => setStep(3)}
                                disabled={!currentSeismicData}
                                className="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                            >
                                Next: Building Details
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Building Details */}
                {step === 3 && (
                    <div className="engineering-card">
                        <h2 className="text-2xl font-bold mb-6">Building Details</h2>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <label htmlFor="building-height" className="block text-sm font-medium mb-2">Building Height (m)</label>
                                    <input
                                        id="building-height"
                                        type="number"
                                        value={buildingParams.height}
                                        onChange={(e) => setBuildingParams({ ...buildingParams, height: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="building-floors" className="block text-sm font-medium mb-2">Number of Floors</label>
                                    <input
                                        id="building-floors"
                                        type="number"
                                        value={buildingParams.floors}
                                        onChange={(e) => setBuildingParams({ ...buildingParams, floors: parseInt(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="seismic-weight" className="block text-sm font-medium mb-2">Seismic Weight (kN)</label>
                                    <input
                                        id="seismic-weight"
                                        type="number"
                                        value={buildingParams.weight}
                                        onChange={(e) => setBuildingParams({ ...buildingParams, weight: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    />
                                </div>


                            </div>

                            <div className="space-y-6">

                                <div>
                                    <label htmlFor="structural-system" className="block text-sm font-medium mb-2">Structural System</label>
                                    <select
                                        id="structural-system"
                                        value={buildingParams.structuralSystem}
                                        onChange={(e) => setBuildingParams({ ...buildingParams, structuralSystem: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    >
                                        <optgroup label="Steel Systems">
                                            {getSystemsByCategory("Steel").map(system => (
                                                <option key={system.name} value={system.name}>{system.name}</option>
                                            ))}
                                        </optgroup>
                                        <optgroup label="Concrete Systems">
                                            {getSystemsByCategory("Concrete").map(system => (
                                                <option key={system.name} value={system.name}>{system.name}</option>
                                            ))}
                                        </optgroup>
                                        <optgroup label="Wood Systems">
                                            {getSystemsByCategory("Wood").map(system => (
                                                <option key={system.name} value={system.name}>{system.name}</option>
                                            ))}
                                        </optgroup>
                                        <optgroup label="Masonry Systems">
                                            {getSystemsByCategory("Masonry").map(system => (
                                                <option key={system.name} value={system.name}>{system.name}</option>
                                            ))}
                                        </optgroup>
                                    </select>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="vertical-irregularity"
                                            checked={buildingParams.irregularities.vertical}
                                            onChange={(e) => setBuildingParams({
                                                ...buildingParams,
                                                irregularities: {
                                                    ...buildingParams.irregularities,
                                                    vertical: e.target.checked
                                                }
                                            })}
                                            className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor="vertical-irregularity" className="ml-2 text-sm text-gray-300">
                                            Vertical irregularity
                                        </label>
                                    </div>

                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="horizontal-irregularity"
                                            checked={buildingParams.irregularities.horizontal}
                                            onChange={(e) => setBuildingParams({
                                                ...buildingParams,
                                                irregularities: {
                                                    ...buildingParams.irregularities,
                                                    horizontal: e.target.checked
                                                }
                                            })}
                                            className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor="horizontal-irregularity" className="ml-2 text-sm text-gray-300">
                                            Horizontal irregularity
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Selected System Details */}
                        {(() => {
                            const selectedSystem = structuralSystems.find(s => s.name === buildingParams.structuralSystem);
                            return selectedSystem ? (
                                <div className="mt-8 bg-gray-800 rounded-lg p-6">
                                    <h3 className="text-lg font-semibold mb-4">Selected System Details</h3>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <p><strong>System:</strong> {selectedSystem.name}</p>
                                            <p><strong>Category:</strong> {selectedSystem.category}</p>
                                            <p><strong>Ductility:</strong> {selectedSystem.ductility}</p>
                                        </div>
                                        <div>
                                            <p><strong>Rd:</strong> {selectedSystem.Rd}</p>
                                            <p><strong>Ro:</strong> {selectedSystem.Ro}</p>
                                            <p><strong>Height Limit:</strong> {selectedSystem.heightLimit} m</p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-400 mt-4">{selectedSystem.description}</p>
                                </div>
                            ) : null;
                        })()}

                        <div className="flex justify-between mt-8">
                            <button
                                onClick={() => setStep(2)}
                                className="px-6 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
                            >
                                Back: Location
                            </button>
                            <button
                                onClick={calculateSeismicLoads}
                                className="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
                            >
                                Calculate Seismic Loads
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 4: Results */}
                {step === 4 && (
                    <div className="engineering-card">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">Seismic Load Results</h2>
                            <button
                                onClick={resetCalculator}
                                className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
                            >
                                New Calculation
                            </button>
                        </div>

                        {/* Results Display */}
                        <div className="space-y-6">
                            {seismicResults.map((result, index) => (
                                <div key={index} className="bg-gray-800 rounded-lg p-6">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-lg font-semibold text-white">{result.parameter}</h3>
                                        <div className="text-right">
                                            <span className="text-2xl font-bold text-orange-500">
                                                {result.value.toFixed(3)}
                                            </span>
                                            <span className="text-gray-400 ml-2">{result.unit}</span>
                                        </div>
                                    </div>
                                    <p className="text-gray-400 text-sm mb-2">{result.description}</p>
                                    {result.calculation && (
                                        <p className="text-gray-500 text-sm font-mono bg-gray-900 p-2 rounded">
                                            {result.calculation}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-between mt-8">
                            <button
                                onClick={() => setStep(3)}
                                className="px-6 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
                            >
                                Back: Building Details
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 