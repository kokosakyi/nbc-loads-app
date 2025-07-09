import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useState, useEffect } from "react";
import { getSeismicHazardWithFallback, searchLocations, MAJOR_CITIES, type SeismicHazardData } from "~/utils/seismic-api";
import { MapPinIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export const meta: MetaFunction = () => {
    return [
        { title: "Seismic Load Calculator - NBC 2020 Structural Loads" },
        { name: "description", content: "Professional seismic load calculator with Canadian seismic hazard maps and equivalent static force method per NBC 4.1.8" },
    ];
};

// Loader to fetch seismic data
export const loader = async ({ request }: LoaderFunctionArgs) => {
    const url = new URL(request.url);
    const latitude = url.searchParams.get('latitude');
    const longitude = url.searchParams.get('longitude');
    const returnPeriod = url.searchParams.get('returnPeriod') || '2475';
    const siteClass = url.searchParams.get('siteClass') || 'C';

    if (latitude && longitude) {
        try {
            const seismicData = await getSeismicHazardWithFallback(
                parseFloat(latitude),
                parseFloat(longitude),
                parseInt(returnPeriod),
                siteClass
            );

            return json({
                seismicData,
                majorCities: MAJOR_CITIES,
                error: null
            });
        } catch (error) {
            return json({
                seismicData: null,
                majorCities: MAJOR_CITIES,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    return json({
        seismicData: null,
        majorCities: MAJOR_CITIES,
        error: null
    });
};

// Action to handle location search
export const action = async ({ request }: LoaderFunctionArgs) => {
    const formData = await request.formData();
    const query = formData.get('query') as string;

    if (!query) {
        return json({ locations: [] });
    }

    try {
        const locations = await searchLocations(query);
        return json({ locations });
    } catch (error) {
        return json({
            locations: [],
            error: error instanceof Error ? error.message : 'Search failed'
        });
    }
};

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
    siteClass: "A" | "B" | "C" | "D" | "E" | "F";
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
    const { seismicData, majorCities, error } = useLoaderData<typeof loader>();

    const [selectedCity, setSelectedCity] = useState<typeof MAJOR_CITIES[0] | null>(null);
    const [customLocation, setCustomLocation] = useState({
        latitude: '',
        longitude: '',
        name: ''
    });
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
    const [currentSeismicData, setCurrentSeismicData] = useState<SeismicHazardData | null>(seismicData);
    const [step, setStep] = useState(1);
    const [seismicResults, setSeismicResults] = useState<SeismicResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Update seismic data when loader data changes
    useEffect(() => {
        if (seismicData) {
            setCurrentSeismicData(seismicData);
        }
    }, [seismicData]);

    // Function to fetch seismic data for a location
    const fetchSeismicData = (latitude: number, longitude: number) => {
        setIsLoading(true);
        const params = new URLSearchParams({
            latitude: latitude.toString(),
            longitude: longitude.toString(),
            returnPeriod: '2475',
            siteClass: buildingParams.siteClass
        });

        // Navigate to the same route with query parameters to trigger the loader
        window.location.href = `/seismic-load-calculator?${params.toString()}`;
    };

    const handleCitySelect = (city: typeof MAJOR_CITIES[0]) => {
        setSelectedCity(city);
        setCustomLocation({ latitude: '', longitude: '', name: '' });
        fetchSeismicData(city.latitude, city.longitude);
    };

    const handleCustomLocationSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (customLocation.latitude && customLocation.longitude) {
            fetchSeismicData(
                parseFloat(customLocation.latitude),
                parseFloat(customLocation.longitude)
            );
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
        const SaDesign02 = (2 / 3) * Fa * currentSeismicData.Sa02;
        const SaDesign10 = (2 / 3) * Fv * currentSeismicData.Sa10;

        // Importance factor
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
                calculation: `S(0.2) = (2/3) × ${Fa} × ${currentSeismicData.Sa02.toFixed(3)} = ${SaDesign02.toFixed(3)}`
            },
            {
                parameter: "Site-Modified Spectral Acceleration (1.0s)",
                value: SaDesign10,
                unit: "g",
                description: "Design spectral acceleration at 1.0s period",
                calculation: `S(1.0) = (2/3) × ${Fv} × ${currentSeismicData.Sa10.toFixed(3)} = ${SaDesign10.toFixed(3)}`
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
        setStep(3);
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
                        {[1, 2, 3].map((stepNum) => (
                            <div key={stepNum} className={`flex items-center ${stepNum < 3 ? 'mr-4' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${step >= stepNum ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-400'
                                    }`}>
                                    {stepNum}
                                </div>
                                <span className={`ml-2 ${step >= stepNum ? 'text-orange-500' : 'text-gray-400'}`}>
                                    {stepNum === 1 && "Location"}
                                    {stepNum === 2 && "Parameters"}
                                    {stepNum === 3 && "Results"}
                                </span>
                                {stepNum < 3 && <div className="w-8 h-px bg-gray-700 ml-4"></div>}
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

                {/* Step 1: Location Selection */}
                {step === 1 && (
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
                                {majorCities.map((city) => (
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

                        {/* Custom Location */}
                        <div className="border-t border-gray-700 pt-8">
                            <h3 className="text-lg font-semibold mb-4">Custom Location</h3>
                            <form onSubmit={handleCustomLocationSubmit} className="space-y-4">
                                <div className="grid md:grid-cols-3 gap-4">
                                    <div>
                                        <label htmlFor="location-name" className="block text-sm font-medium mb-2">Location Name</label>
                                        <input
                                            id="location-name"
                                            type="text"
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
                            </form>
                        </div>

                        {/* Current Seismic Data Display */}
                        {currentSeismicData && (
                            <div className="mt-8 bg-gray-800 rounded-lg p-6">
                                <h3 className="text-lg font-semibold mb-4">Current Seismic Hazard Data</h3>
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-orange-500">{currentSeismicData.PGA.toFixed(3)}</div>
                                        <div className="text-sm text-gray-400">PGA (g)</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-orange-500">{currentSeismicData.Sa02.toFixed(3)}</div>
                                        <div className="text-sm text-gray-400">Sa(0.2s) (g)</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-orange-500">{currentSeismicData.Sa10.toFixed(3)}</div>
                                        <div className="text-sm text-gray-400">Sa(1.0s) (g)</div>
                                    </div>
                                </div>
                                <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-400">
                                    <div>
                                        <p><strong>Location:</strong> {currentSeismicData.location}</p>
                                        <p><strong>Coordinates:</strong> {currentSeismicData.latitude.toFixed(4)}, {currentSeismicData.longitude.toFixed(4)}</p>
                                    </div>
                                    <div>
                                        <p><strong>Return Period:</strong> {currentSeismicData.returnPeriod} years</p>
                                        <p><strong>Site Class:</strong> {currentSeismicData.siteClass}</p>
                                        <p><strong>Seismic Zone:</strong> {getSeismicZone(currentSeismicData.Sa02)}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end mt-8">
                            <button
                                onClick={() => setStep(2)}
                                disabled={!currentSeismicData}
                                className="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                            >
                                Next: Building Parameters
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Building Parameters */}
                {step === 2 && (
                    <div className="engineering-card">
                        <h2 className="text-2xl font-bold mb-6">Building Parameters</h2>

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

                                <div>
                                    <label htmlFor="importance-category" className="block text-sm font-medium mb-2">Importance Category</label>
                                    <select
                                        id="importance-category"
                                        value={buildingParams.importance}
                                        onChange={(e) => setBuildingParams({ ...buildingParams, importance: e.target.value as BuildingParameters["importance"] })}
                                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Normal">Normal</option>
                                        <option value="High">High</option>
                                        <option value="Post-disaster">Post-disaster</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label htmlFor="site-class" className="block text-sm font-medium mb-2">Site Class</label>
                                    <select
                                        id="site-class"
                                        value={buildingParams.siteClass}
                                        onChange={(e) => setBuildingParams({ ...buildingParams, siteClass: e.target.value as BuildingParameters["siteClass"] })}
                                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    >
                                        <option value="A">A - Hard Rock</option>
                                        <option value="B">B - Rock</option>
                                        <option value="C">C - Very Dense Soil</option>
                                        <option value="D">D - Stiff Soil</option>
                                        <option value="E">E - Soft Soil</option>
                                        <option value="F">F - Very Soft Soil</option>
                                    </select>
                                </div>

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
                                onClick={() => setStep(1)}
                                className="px-6 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
                            >
                                Back to Location
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

                {/* Step 3: Results */}
                {step === 3 && (
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
                                onClick={() => setStep(2)}
                                className="px-6 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
                            >
                                Back to Parameters
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 