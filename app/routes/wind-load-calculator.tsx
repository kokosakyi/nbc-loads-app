import type { MetaFunction } from "@remix-run/node";
import { useState } from "react";
import {
    RectangleStackIcon,
    Square3Stack3DIcon,
    ArrowPathIcon,
    PuzzlePieceIcon
} from "@heroicons/react/24/outline";

export const meta: MetaFunction = () => {
    return [
        { title: "Wind Load Calculator - NBC 2020 Structural Loads" },
        { name: "description", content: "Professional wind load calculator with Canadian wind zones, building geometry, and pressure calculations per NBC 4.1.7" },
    ];
};

interface WindData {
    province: string;
    city: string;
    windSpeed: number; // m/s
    zone: string;
    description: string;
}

interface BuildingGeometry {
    length: number; // m
    width: number; // m
    height: number; // m
    roofType: "flat" | "gable" | "hip" | "shed";
    roofSlope: number; // degrees
    openingRatio: number; // percentage
}

interface SiteParameters {
    exposure: "A" | "B" | "C" | "D";
    topography: "normal" | "hill" | "ridge" | "escarpment";
    terrainCategory: 1 | 2 | 3 | 4;
}

interface PressureCoefficient {
    surface: string;
    Cp: number;
    description: string;
    zones: string[];
}

interface WindLoadResult {
    id: string;
    surface: string;
    pressure: number; // kN/m²
    force: number; // kN
    description: string;
    coefficient: number;
    area: number;
}

const canadianWindData: WindData[] = [
    // British Columbia
    { province: "BC", city: "Vancouver", windSpeed: 32, zone: "Moderate", description: "Coastal region" },
    { province: "BC", city: "Victoria", windSpeed: 35, zone: "High", description: "Exposed coastal area" },
    { province: "BC", city: "Prince Rupert", windSpeed: 40, zone: "Very High", description: "North coast" },

    // Alberta
    { province: "AB", city: "Calgary", windSpeed: 38, zone: "High", description: "Prairie region with chinooks" },
    { province: "AB", city: "Edmonton", windSpeed: 32, zone: "Moderate", description: "Central Alberta" },
    { province: "AB", city: "Lethbridge", windSpeed: 42, zone: "Very High", description: "Windy corridor" },

    // Saskatchewan
    { province: "SK", city: "Regina", windSpeed: 38, zone: "High", description: "Open prairie" },
    { province: "SK", city: "Saskatoon", windSpeed: 36, zone: "High", description: "Prairie region" },

    // Manitoba
    { province: "MB", city: "Winnipeg", windSpeed: 35, zone: "High", description: "Prairie winds" },
    { province: "MB", city: "Thompson", windSpeed: 32, zone: "Moderate", description: "Northern forest region" },

    // Ontario
    { province: "ON", city: "Toronto", windSpeed: 30, zone: "Moderate", description: "Great Lakes region" },
    { province: "ON", city: "Ottawa", windSpeed: 28, zone: "Moderate", description: "Inland location" },
    { province: "ON", city: "Windsor", windSpeed: 32, zone: "Moderate", description: "Great Lakes influence" },
    { province: "ON", city: "Thunder Bay", windSpeed: 30, zone: "Moderate", description: "Lake Superior region" },

    // Quebec
    { province: "QC", city: "Montreal", windSpeed: 28, zone: "Moderate", description: "St. Lawrence valley" },
    { province: "QC", city: "Quebec City", windSpeed: 30, zone: "Moderate", description: "River valley location" },
    { province: "QC", city: "Gaspe", windSpeed: 45, zone: "Very High", description: "Exposed peninsula" },

    // Atlantic Provinces
    { province: "NB", city: "Fredericton", windSpeed: 30, zone: "Moderate", description: "River valley" },
    { province: "NS", city: "Halifax", windSpeed: 40, zone: "Very High", description: "Atlantic coast" },
    { province: "PE", city: "Charlottetown", windSpeed: 38, zone: "High", description: "Island location" },
    { province: "NL", city: "St. John's", windSpeed: 45, zone: "Extreme", description: "Atlantic coast, high winds" },

    // Territories
    { province: "YT", city: "Whitehorse", windSpeed: 28, zone: "Moderate", description: "Mountain valley" },
    { province: "NT", city: "Yellowknife", windSpeed: 30, zone: "Moderate", description: "Continental location" },
    { province: "NU", city: "Iqaluit", windSpeed: 35, zone: "High", description: "Arctic coastal winds" }
];

const exposureCategories = {
    A: {
        name: "Urban/Forest",
        description: "Dense urban areas, forest",
        alpha: 0.15,
        zg: 460
    },
    B: {
        name: "Suburban",
        description: "Suburban areas, wooded terrain",
        alpha: 0.20,
        zg: 370
    },
    C: {
        name: "Open",
        description: "Open terrain with scattered obstructions",
        alpha: 0.28,
        zg: 270
    },
    D: {
        name: "Flat Open",
        description: "Flat, unobstructed areas",
        alpha: 0.40,
        zg: 210
    }
};

const buildingShapes = [
    { type: "rectangular", name: "Rectangular", icon: RectangleStackIcon, description: "Standard rectangular building" },
    { type: "L-shape", name: "L-Shaped", icon: Square3Stack3DIcon, description: "L-shaped building plan" },
    { type: "circular", name: "Circular", icon: ArrowPathIcon, description: "Circular or cylindrical building" },
    { type: "complex", name: "Complex", icon: PuzzlePieceIcon, description: "Irregular or complex shape" }
];

const pressureCoefficients: PressureCoefficient[] = [
    // Main Wind Force Resisting System (MWFRS)
    { surface: "Windward Wall", Cp: 0.8, description: "Wall facing the wind", zones: ["1", "2"] },
    { surface: "Leeward Wall", Cp: -0.5, description: "Wall opposite to wind", zones: ["3"] },
    { surface: "Side Wall", Cp: -0.7, description: "Walls parallel to wind", zones: ["4", "5"] },
    { surface: "Flat Roof", Cp: -0.7, description: "Flat or low-slope roof", zones: ["1", "2", "3"] },
    { surface: "Windward Roof", Cp: -0.9, description: "Windward slope of pitched roof", zones: ["1"] },
    { surface: "Leeward Roof", Cp: -0.5, description: "Leeward slope of pitched roof", zones: ["2"] },

    // Components and Cladding (C&C)
    { surface: "Wall Corner", Cp: -1.0, description: "Corner regions of walls", zones: ["4", "5"] },
    { surface: "Wall Interior", Cp: -0.6, description: "Interior regions of walls", zones: ["4", "5"] },
    { surface: "Roof Corner", Cp: -2.0, description: "Roof corner regions", zones: ["1"] },
    { surface: "Roof Edge", Cp: -1.2, description: "Roof edge regions", zones: ["2"] },
    { surface: "Roof Interior", Cp: -0.9, description: "Interior roof regions", zones: ["3"] }
];

export default function WindLoadCalculator() {
    const [step, setStep] = useState(1);
    const [selectedLocation, setSelectedLocation] = useState<WindData | null>(null);
    const [customWind, setCustomWind] = useState({
        location: "",
        windSpeed: ""
    });

    const [buildingGeom, setBuildingGeom] = useState<BuildingGeometry>({
        length: 30,
        width: 20,
        height: 12,
        roofType: "flat",
        roofSlope: 0,
        openingRatio: 15
    });

    const [siteParams, setSiteParams] = useState<SiteParameters>({
        exposure: "B",
        topography: "normal",
        terrainCategory: 2
    });

    const [analysisType, setAnalysisType] = useState<"mwfrs" | "cc">("mwfrs");
    const [windResults, setWindResults] = useState<WindLoadResult[]>([]);
    const [showResults, setShowResults] = useState(false);

    const calculateWindPressure = (height: number, windSpeed: number, exposure: keyof typeof exposureCategories): number => {
        // Simplified wind pressure calculation: q = 0.613 * Kz * Kzt * Kd * V²
        const exposureData = exposureCategories[exposure];

        // Velocity pressure exposure coefficient (Kz)
        const Kz = Math.pow(height / 10, 2 * exposureData.alpha);

        // Topographic factor (Kzt) - simplified
        const Kzt = siteParams.topography === "normal" ? 1.0 : 1.15;

        // Wind directionality factor (Kd)
        const Kd = 0.85;

        // Velocity pressure in Pa, convert to kN/m²
        const q = 0.613 * Kz * Kzt * Kd * Math.pow(windSpeed, 2) / 1000;

        return q;
    };

    const calculateWindLoads = () => {
        if (!selectedLocation && !customWind.windSpeed) return;

        const windSpeed = selectedLocation ? selectedLocation.windSpeed : parseFloat(customWind.windSpeed);
        const qz = calculateWindPressure(buildingGeom.height, windSpeed, siteParams.exposure);

        const results: WindLoadResult[] = [];

        if (analysisType === "mwfrs") {
            // Main Wind Force Resisting System
            const wallArea = buildingGeom.width * buildingGeom.height;
            const endWallArea = buildingGeom.length * buildingGeom.height;
            const roofArea = buildingGeom.length * buildingGeom.width;

            // Windward wall
            const windwardPressure = qz * 0.8;
            results.push({
                id: "windward",
                surface: "Windward Wall",
                pressure: windwardPressure,
                force: windwardPressure * wallArea,
                description: `Wind pressure on ${buildingGeom.width}m × ${buildingGeom.height}m wall`,
                coefficient: 0.8,
                area: wallArea
            });

            // Leeward wall
            const leewardPressure = qz * (-0.5);
            results.push({
                id: "leeward",
                surface: "Leeward Wall",
                pressure: leewardPressure,
                force: leewardPressure * wallArea,
                description: `Suction on opposite ${buildingGeom.width}m × ${buildingGeom.height}m wall`,
                coefficient: -0.5,
                area: wallArea
            });

            // Side walls
            const sidePressure = qz * (-0.7);
            results.push({
                id: "sidewall1",
                surface: "Side Wall 1",
                pressure: sidePressure,
                force: sidePressure * endWallArea,
                description: `Suction on ${buildingGeom.length}m × ${buildingGeom.height}m side wall`,
                coefficient: -0.7,
                area: endWallArea
            });

            results.push({
                id: "sidewall2",
                surface: "Side Wall 2",
                pressure: sidePressure,
                force: sidePressure * endWallArea,
                description: `Suction on ${buildingGeom.length}m × ${buildingGeom.height}m side wall`,
                coefficient: -0.7,
                area: endWallArea
            });

            // Roof
            const roofCp = buildingGeom.roofType === "flat" ? -0.7 : -0.9;
            const roofPressure = qz * roofCp;
            results.push({
                id: "roof",
                surface: buildingGeom.roofType === "flat" ? "Flat Roof" : "Roof",
                pressure: roofPressure,
                force: roofPressure * roofArea,
                description: `${buildingGeom.roofType} roof pressure on ${buildingGeom.length}m × ${buildingGeom.width}m area`,
                coefficient: roofCp,
                area: roofArea
            });

        } else {
            // Components and Cladding
            const effectiveArea = 10; // m² - typical window/panel size

            pressureCoefficients.slice(6).forEach((coeff, index) => {
                const pressure = qz * coeff.Cp;
                results.push({
                    id: `cc_${index}`,
                    surface: coeff.surface,
                    pressure,
                    force: pressure * effectiveArea,
                    description: `${coeff.description} (${effectiveArea}m² effective area)`,
                    coefficient: coeff.Cp,
                    area: effectiveArea
                });
            });
        }

        setWindResults(results);
        setShowResults(true);
    };

    const getMaxPressure = (): number => {
        return Math.max(...windResults.map(r => Math.abs(r.pressure)));
    };

    const getTotalWindForce = (): number => {
        // For MWFRS, sum windward and leeward (both act in same direction)
        if (analysisType === "mwfrs") {
            const windward = windResults.find(r => r.id === "windward");
            const leeward = windResults.find(r => r.id === "leeward");
            return (windward?.force || 0) + Math.abs(leeward?.force || 0);
        } else {
            return Math.max(...windResults.map(r => Math.abs(r.force)));
        }
    };

    if (step === 1) {
        return (
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4 flex items-center">
                        <span className="mr-3">💨</span>
                        Wind Load Calculator - Location & Wind Speed
                    </h1>
                    <p className="text-lg text-gray-600">
                        Select your location to determine design wind speeds according to NBC Figure C-3.
                    </p>
                </div>

                {/* Canadian Cities */}
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Major Canadian Cities</h2>
                    <div className="grid lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 gap-4">
                        {canadianWindData.map((location) => (
                            <button
                                key={`${location.province}-${location.city}`}
                                onClick={() => {
                                    setSelectedLocation(location);
                                    setStep(2);
                                }}
                                className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="font-semibold text-gray-900">{location.city}</div>
                                        <div className="text-sm text-gray-600">{location.province}</div>
                                    </div>
                                    <div className={`px-2 py-1 rounded text-xs font-medium ${location.zone === "Moderate" ? "bg-blue-100 text-blue-800" :
                                        location.zone === "High" ? "bg-yellow-100 text-yellow-800" :
                                            location.zone === "Very High" ? "bg-orange-100 text-orange-800" :
                                                "bg-red-100 text-red-800"
                                        }`}>
                                        {location.zone}
                                    </div>
                                </div>
                                <div className="text-sm">
                                    <div className="text-blue-600 font-medium">{location.windSpeed} m/s</div>
                                    <div className="text-gray-500">Design wind speed</div>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">{location.description}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Custom Location */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Custom Location</h2>
                    <p className="text-gray-600 mb-4">
                        Enter custom wind speed from NBC Figure C-3 or local wind study.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="custom-location" className="block text-sm font-medium text-gray-700 mb-1">
                                Location Name
                            </label>
                            <input
                                id="custom-location"
                                type="text"
                                value={customWind.location}
                                onChange={(e) => setCustomWind({ ...customWind, location: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter location name"
                            />
                        </div>

                        <div>
                            <label htmlFor="wind-speed" className="block text-sm font-medium text-gray-700 mb-1">
                                Design Wind Speed (m/s)
                            </label>
                            <input
                                id="wind-speed"
                                type="number"
                                step="1"
                                value={customWind.windSpeed}
                                onChange={(e) => setCustomWind({ ...customWind, windSpeed: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g., 35"
                            />
                        </div>
                    </div>

                    <div className="mt-4">
                        <button
                            onClick={() => {
                                if (customWind.location && customWind.windSpeed) {
                                    setStep(2);
                                }
                            }}
                            disabled={!customWind.location || !customWind.windSpeed}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400"
                        >
                            Continue with Custom Wind Speed
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
                            <span className="mr-3">💨</span>
                            Wind Load Calculator
                        </h1>
                        <p className="text-lg text-gray-600">
                            {selectedLocation ?
                                `${selectedLocation.city}, ${selectedLocation.province} • ${selectedLocation.windSpeed} m/s design wind speed` :
                                `${customWind.location} • ${customWind.windSpeed} m/s design wind speed`
                            }
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setStep(1);
                            setShowResults(false);
                        }}
                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        ← Change Location
                    </button>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Input Panel */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Building Geometry */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Building Geometry</h2>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="building-length" className="block text-sm font-medium text-gray-700 mb-1">
                                        Building Length (m)
                                    </label>
                                    <input
                                        id="building-length"
                                        type="number"
                                        value={buildingGeom.length}
                                        onChange={(e) => setBuildingGeom({ ...buildingGeom, length: parseFloat(e.target.value) || 0 })}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="building-width" className="block text-sm font-medium text-gray-700 mb-1">
                                        Building Width (m)
                                    </label>
                                    <input
                                        id="building-width"
                                        type="number"
                                        value={buildingGeom.width}
                                        onChange={(e) => setBuildingGeom({ ...buildingGeom, width: parseFloat(e.target.value) || 0 })}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="building-height" className="block text-sm font-medium text-gray-700 mb-1">
                                        Building Height (m)
                                    </label>
                                    <input
                                        id="building-height"
                                        type="number"
                                        value={buildingGeom.height}
                                        onChange={(e) => setBuildingGeom({ ...buildingGeom, height: parseFloat(e.target.value) || 0 })}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="roof-type" className="block text-sm font-medium text-gray-700 mb-1">
                                        Roof Type
                                    </label>
                                    <select
                                        id="roof-type"
                                        value={buildingGeom.roofType}
                                        onChange={(e) => setBuildingGeom({ ...buildingGeom, roofType: e.target.value as BuildingGeometry["roofType"] })}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="flat">Flat Roof</option>
                                        <option value="gable">Gable Roof</option>
                                        <option value="hip">Hip Roof</option>
                                        <option value="shed">Shed Roof</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="roof-slope" className="block text-sm font-medium text-gray-700 mb-1">
                                        Roof Slope (degrees)
                                    </label>
                                    <input
                                        id="roof-slope"
                                        type="number"
                                        value={buildingGeom.roofSlope}
                                        onChange={(e) => setBuildingGeom({ ...buildingGeom, roofSlope: parseFloat(e.target.value) || 0 })}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="opening-ratio" className="block text-sm font-medium text-gray-700 mb-1">
                                        Opening Ratio (%)
                                    </label>
                                    <input
                                        id="opening-ratio"
                                        type="number"
                                        value={buildingGeom.openingRatio}
                                        onChange={(e) => setBuildingGeom({ ...buildingGeom, openingRatio: parseFloat(e.target.value) || 0 })}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                    />
                                    <div className="text-xs text-gray-500 mt-1">
                                        Percentage of wall area that is openings
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Site Parameters */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Site Parameters</h2>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="exposure-category" className="block text-sm font-medium text-gray-700 mb-1">
                                    Exposure Category
                                </label>
                                <select
                                    id="exposure-category"
                                    value={siteParams.exposure}
                                    onChange={(e) => setSiteParams({ ...siteParams, exposure: e.target.value as SiteParameters["exposure"] })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                >
                                    {Object.entries(exposureCategories).map(([key, value]) => (
                                        <option key={key} value={key}>
                                            {key} - {value.name}
                                        </option>
                                    ))}
                                </select>
                                <div className="text-xs text-gray-500 mt-1">
                                    {exposureCategories[siteParams.exposure].description}
                                </div>
                            </div>

                            <div>
                                <label htmlFor="topography" className="block text-sm font-medium text-gray-700 mb-1">
                                    Topography
                                </label>
                                <select
                                    id="topography"
                                    value={siteParams.topography}
                                    onChange={(e) => setSiteParams({ ...siteParams, topography: e.target.value as SiteParameters["topography"] })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="normal">Normal (flat terrain)</option>
                                    <option value="hill">Hill or Ridge</option>
                                    <option value="ridge">Sharp Ridge</option>
                                    <option value="escarpment">Escarpment</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Analysis Type */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Analysis Type</h2>

                        <div className="space-y-3">
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="analysisType"
                                    value="mwfrs"
                                    checked={analysisType === "mwfrs"}
                                    onChange={(e) => setAnalysisType(e.target.value as typeof analysisType)}
                                    className="mr-3"
                                />
                                <div>
                                    <div className="font-medium text-gray-900">Main Wind Force Resisting System (MWFRS)</div>
                                    <div className="text-sm text-gray-600">Overall structural system design</div>
                                </div>
                            </label>

                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="analysisType"
                                    value="cc"
                                    checked={analysisType === "cc"}
                                    onChange={(e) => setAnalysisType(e.target.value as typeof analysisType)}
                                    className="mr-3"
                                />
                                <div>
                                    <div className="font-medium text-gray-900">Components and Cladding (C&C)</div>
                                    <div className="text-sm text-gray-600">Individual elements like windows, panels</div>
                                </div>
                            </label>
                        </div>

                        <div className="mt-6">
                            <button
                                onClick={calculateWindLoads}
                                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                                Calculate Wind Loads
                            </button>
                        </div>
                    </div>
                </div>

                {/* Results Panel */}
                <div className="space-y-6">
                    {/* Load Summary */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Wind Load Summary</h2>
                        {showResults && windResults.length > 0 ? (
                            <div>
                                <div className="text-center mb-4">
                                    <div className="text-4xl font-bold text-blue-600 mb-2">
                                        {getMaxPressure().toFixed(2)}
                                    </div>
                                    <div className="text-lg text-gray-600">kN/m² Max Pressure</div>
                                </div>

                                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                                    <div className="text-sm font-medium text-blue-900">Total {analysisType === "mwfrs" ? "Base Shear" : "Component Force"}</div>
                                    <div className="text-2xl font-bold text-blue-600">{getTotalWindForce().toFixed(1)} kN</div>
                                </div>

                                <div className="space-y-3">
                                    {windResults.map((result) => (
                                        <div key={result.id} className="p-3 bg-gray-50 rounded-lg">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-medium text-gray-900">{result.surface}</span>
                                                <span className={`font-semibold ${result.pressure >= 0 ? "text-red-600" : "text-blue-600"}`}>
                                                    {result.pressure >= 0 ? "+" : ""}{result.pressure.toFixed(2)} kN/m²
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-600 mb-1">{result.description}</div>
                                            <div className="text-xs text-gray-500">
                                                Cp = {result.coefficient} • Area = {result.area.toFixed(1)}m² • Force = {Math.abs(result.force).toFixed(1)} kN
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 py-8">
                                Configure parameters and click "Calculate Wind Loads" to see results
                            </div>
                        )}
                    </div>

                    {/* Code References */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Code References</h2>
                        <div className="space-y-3 text-sm">
                            <div>
                                <span className="font-medium text-blue-600">NBC 4.1.7</span>
                                <p className="text-gray-600">Wind loads</p>
                            </div>
                            <div>
                                <span className="font-medium text-blue-600">NBC Figure C-3</span>
                                <p className="text-gray-600">Design wind speeds for Canada</p>
                            </div>
                            <div>
                                <span className="font-medium text-blue-600">NBC 4.1.7.1</span>
                                <p className="text-gray-600">Wind pressure calculation</p>
                            </div>
                            <div>
                                <span className="font-medium text-blue-600">NBC 4.1.7.4</span>
                                <p className="text-gray-600">Pressure coefficients</p>
                            </div>
                        </div>
                    </div>

                    {/* Wind Flow Visualization */}
                    {showResults && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pressure Distribution</h3>
                            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                                <div className="text-center text-gray-500">
                                    <div className="text-4xl mb-2">💨</div>
                                    <div>Wind Flow Visualization</div>
                                    <div className="text-sm">(Coming in Phase 2)</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 