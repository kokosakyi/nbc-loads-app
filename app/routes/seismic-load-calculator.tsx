import type { MetaFunction } from "@remix-run/node";
import { useState } from "react";

export const meta: MetaFunction = () => {
    return [
        { title: "Seismic Load Calculator - NBC 2020 Structural Loads" },
        { name: "description", content: "Professional seismic load calculator with Canadian seismic hazard maps and equivalent static force method per NBC 4.1.8" },
    ];
};

interface SeismicData {
    province: string;
    city: string;
    PGA: number; // Peak Ground Acceleration (g)
    Sa02: number; // Spectral acceleration at 0.2s (g)
    Sa10: number; // Spectral acceleration at 1.0s (g)
    zone: string;
    description: string;
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

const canadianSeismicData: SeismicData[] = [
    // British Columbia - High seismic region
    { province: "BC", city: "Vancouver", PGA: 0.23, Sa02: 0.65, Sa10: 0.25, zone: "High", description: "Active seismic region" },
    { province: "BC", city: "Victoria", PGA: 0.27, Sa02: 0.75, Sa10: 0.30, zone: "High", description: "Southern Vancouver Island" },
    { province: "BC", city: "Prince George", PGA: 0.05, Sa02: 0.12, Sa10: 0.05, zone: "Low", description: "Northern BC interior" },
    { province: "BC", city: "Kamloops", PGA: 0.08, Sa02: 0.20, Sa10: 0.08, zone: "Moderate", description: "Interior BC" },

    // Alberta - Low to moderate
    { province: "AB", city: "Calgary", PGA: 0.03, Sa02: 0.08, Sa10: 0.03, zone: "Low", description: "Stable continental region" },
    { province: "AB", city: "Edmonton", PGA: 0.03, Sa02: 0.08, Sa10: 0.03, zone: "Low", description: "Central Alberta" },

    // Saskatchewan
    { province: "SK", city: "Regina", PGA: 0.03, Sa02: 0.08, Sa10: 0.03, zone: "Low", description: "Stable prairie region" },
    { province: "SK", city: "Saskatoon", PGA: 0.03, Sa02: 0.08, Sa10: 0.03, zone: "Low", description: "Central Saskatchewan" },

    // Manitoba
    { province: "MB", city: "Winnipeg", PGA: 0.03, Sa02: 0.08, Sa10: 0.03, zone: "Low", description: "Stable continental region" },

    // Ontario - Varies by region
    { province: "ON", city: "Toronto", PGA: 0.05, Sa02: 0.12, Sa10: 0.05, zone: "Low", description: "Great Lakes region" },
    { province: "ON", city: "Ottawa", PGA: 0.18, Sa02: 0.35, Sa10: 0.15, zone: "Moderate", description: "Ottawa-Montreal seismic zone" },
    { province: "ON", city: "Sudbury", PGA: 0.03, Sa02: 0.08, Sa10: 0.03, zone: "Low", description: "Canadian Shield" },
    { province: "ON", city: "Thunder Bay", PGA: 0.03, Sa02: 0.08, Sa10: 0.03, zone: "Low", description: "Northwestern Ontario" },

    // Quebec - Moderate to high
    { province: "QC", city: "Montreal", PGA: 0.18, Sa02: 0.35, Sa10: 0.15, zone: "Moderate", description: "St. Lawrence valley" },
    { province: "QC", city: "Quebec City", PGA: 0.22, Sa02: 0.45, Sa10: 0.20, zone: "High", description: "Charlevoix seismic zone" },
    { province: "QC", city: "Saguenay", PGA: 0.25, Sa02: 0.50, Sa10: 0.22, zone: "High", description: "Saguenay graben" },

    // Atlantic Provinces
    { province: "NB", city: "Fredericton", PGA: 0.12, Sa02: 0.25, Sa10: 0.10, zone: "Moderate", description: "Maritime seismic zone" },
    { province: "NS", city: "Halifax", PGA: 0.08, Sa02: 0.18, Sa10: 0.08, zone: "Low", description: "Atlantic coastal region" },
    { province: "PE", city: "Charlottetown", PGA: 0.10, Sa02: 0.20, Sa10: 0.09, zone: "Moderate", description: "Maritime region" },
    { province: "NL", city: "St. John's", PGA: 0.05, Sa02: 0.12, Sa10: 0.05, zone: "Low", description: "Atlantic Canada" },

    // Territories
    { province: "YT", city: "Whitehorse", PGA: 0.15, Sa02: 0.30, Sa10: 0.12, zone: "Moderate", description: "Cordilleran seismic zone" },
    { province: "NT", city: "Yellowknife", PGA: 0.03, Sa02: 0.08, Sa10: 0.03, zone: "Low", description: "Canadian Shield" },
    { province: "NU", city: "Iqaluit", PGA: 0.03, Sa02: 0.08, Sa10: 0.03, zone: "Low", description: "Arctic region" }
];

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

const importanceFactors = {
    "Low": { Ie: 0.8, description: "Storage facilities, temporary structures" },
    "Normal": { Ie: 1.0, description: "Most buildings including residential, office" },
    "High": { Ie: 1.3, description: "Schools, assembly buildings >300 people" },
    "Post-disaster": { Ie: 1.5, description: "Hospitals, fire stations, emergency facilities" }
};

const siteFactors = {
    // Site coefficients Fa (short period)
    A: { Fa: 1.0, description: "Hard rock, shear wave velocity > 1500 m/s" },
    B: { Fa: 1.0, description: "Rock, shear wave velocity 760-1500 m/s" },
    C: { Fa: 1.0, description: "Very dense soil/soft rock, 360-760 m/s" },
    D: { Fa: 1.0, description: "Stiff soil, 180-360 m/s" },
    E: { Fa: 1.0, description: "Soil profile with < 3m soft clay" },
    F: { Fa: 1.0, description: "Soils requiring site-specific analysis" }
};

export default function SeismicLoadCalculator() {
    const [step, setStep] = useState(1);
    const [selectedLocation, setSelectedLocation] = useState<SeismicData | null>(null);
    const [customSeismic, setCustomSeismic] = useState({
        location: "",
        PGA: "",
        Sa02: "",
        Sa10: ""
    });

    const [buildingParams, setBuildingParams] = useState<BuildingParameters>({
        importance: "Normal",
        height: 20,
        floors: 5,
        weight: 5000,
        structuralSystem: "Steel Moment Frame - Ductile",
        ductility: "Ductile",
        irregularities: {
            vertical: false,
            horizontal: false
        },
        siteClass: "C"
    });

    const [seismicResults, setSeismicResults] = useState<SeismicResult[]>([]);
    const [showResults, setShowResults] = useState(false);

    const calculateSeismicLoads = () => {
        if (!selectedLocation && !customSeismic.PGA) return;

        const seismicData = selectedLocation ? selectedLocation : {
            PGA: parseFloat(customSeismic.PGA),
            Sa02: parseFloat(customSeismic.Sa02),
            Sa10: parseFloat(customSeismic.Sa10)
        };

        const system = structuralSystems.find(s => s.name === buildingParams.structuralSystem)!;
        const Ie = importanceFactors[buildingParams.importance].Ie;

        // Site-modified spectral accelerations (simplified)
        const Fa = siteFactors[buildingParams.siteClass].Fa;
        const Fv = 1.0; // Simplified - would vary by site class and Sa values

        const SaS = seismicData.Sa02 * Fa;
        const Sa1 = seismicData.Sa10 * Fv;

        // Design spectral accelerations
        const SDS = (2 / 3) * SaS;
        const SD1 = (2 / 3) * Sa1;

        // Fundamental period approximation
        const Ta = 0.05 * Math.pow(buildingParams.height, 0.75); // seconds

        // Response spectrum period parameters
        const TL = 8.0; // Long-period transition (simplified)
        const TS = SD1 / SDS;
        const T0 = 0.2 * TS;

        // Design spectral response acceleration
        let Sa: number;
        if (Ta <= T0) {
            Sa = SDS * (0.4 + 0.6 * Ta / T0);
        } else if (Ta <= TS) {
            Sa = SDS;
        } else if (Ta <= TL) {
            Sa = SD1 / Ta;
        } else {
            Sa = SD1 * TL / Math.pow(Ta, 2);
        }

        // Irregularity factors
        const Jx = (buildingParams.irregularities.horizontal || buildingParams.irregularities.vertical) ? 1.5 : 1.0;

        // Base shear
        const V = (Sa * Ie * buildingParams.weight) / (system.Rd * system.Ro) * Jx;

        // Minimum base shear check
        const Vmin = Math.max(
            0.025 * Ie * buildingParams.weight,
            (seismicData.PGA * Ie * buildingParams.weight) / (system.Rd * system.Ro)
        );

        const Vdesign = Math.max(V, Vmin);

        // Story forces (simplified uniform distribution)
        const storyForce = Vdesign / buildingParams.floors;

        const results: SeismicResult[] = [
            { parameter: "Peak Ground Acceleration", value: seismicData.PGA, unit: "g", description: "PGA from seismic hazard map" },
            { parameter: "Short Period Sa", value: seismicData.Sa02, unit: "g", description: "Spectral acceleration at T=0.2s" },
            { parameter: "Long Period Sa", value: seismicData.Sa10, unit: "g", description: "Spectral acceleration at T=1.0s" },
            { parameter: "Design Short Sa", value: SDS, unit: "g", description: "SDS = (2/3) × Sa(0.2s) × Fa", calculation: `(2/3) × ${seismicData.Sa02} × ${Fa}` },
            { parameter: "Design Long Sa", value: SD1, unit: "g", description: "SD1 = (2/3) × Sa(1.0s) × Fv", calculation: `(2/3) × ${seismicData.Sa10} × ${Fv}` },
            { parameter: "Fundamental Period", value: Ta, unit: "s", description: "Ta = 0.05 × h^0.75", calculation: `0.05 × ${buildingParams.height}^0.75` },
            { parameter: "Design Sa", value: Sa, unit: "g", description: "Spectral acceleration for fundamental period" },
            { parameter: "Importance Factor", value: Ie, unit: "", description: `${buildingParams.importance} importance category` },
            { parameter: "Ductility Factor", value: system.Rd, unit: "", description: `${system.name}` },
            { parameter: "Overstrength Factor", value: system.Ro, unit: "", description: "System overstrength factor" },
            { parameter: "Irregularity Factor", value: Jx, unit: "", description: buildingParams.irregularities.horizontal || buildingParams.irregularities.vertical ? "Building has irregularities" : "Regular building" },
            { parameter: "Calculated Base Shear", value: V, unit: "kN", description: "V = Sa × Ie × W / (Rd × Ro) × Jx" },
            { parameter: "Minimum Base Shear", value: Vmin, unit: "kN", description: "Minimum required by code" },
            { parameter: "Design Base Shear", value: Vdesign, unit: "kN", description: "Maximum of calculated and minimum" },
            { parameter: "Average Story Force", value: storyForce, unit: "kN", description: "Distributed uniformly (simplified)" }
        ];

        setSeismicResults(results);
        setShowResults(true);
    };

    const getSystemsByCategory = (category: string) => {
        return structuralSystems.filter(s => s.category === category);
    };

    const systemCategories = Array.from(new Set(structuralSystems.map(s => s.category)));

    if (step === 1) {
        return (
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4 flex items-center">
                        <span className="mr-3">🌍</span>
                        Seismic Load Calculator - Site Hazard
                    </h1>
                    <p className="text-lg text-gray-600">
                        Select your location to determine seismic hazard parameters according to NBC Figure 4.1.8.18.
                    </p>
                </div>

                {/* Canadian Cities */}
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Major Canadian Cities</h2>
                    <div className="grid lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 gap-4">
                        {canadianSeismicData.map((location) => (
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
                                    <div className={`px-2 py-1 rounded text-xs font-medium ${location.zone === "Low" ? "bg-green-100 text-green-800" :
                                            location.zone === "Moderate" ? "bg-yellow-100 text-yellow-800" :
                                                location.zone === "High" ? "bg-orange-100 text-orange-800" :
                                                    "bg-red-100 text-red-800"
                                        }`}>
                                        {location.zone}
                                    </div>
                                </div>
                                <div className="text-sm space-y-1">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">PGA:</span>
                                        <span className="font-medium text-blue-600">{location.PGA}g</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Sa(0.2):</span>
                                        <span className="font-medium text-blue-600">{location.Sa02}g</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Sa(1.0):</span>
                                        <span className="font-medium text-blue-600">{location.Sa10}g</span>
                                    </div>
                                </div>
                                <div className="text-xs text-gray-500 mt-2">{location.description}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Custom Location */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Custom Location</h2>
                    <p className="text-gray-600 mb-4">
                        Enter seismic parameters from NBC Figure 4.1.8.18 or site-specific study.
                    </p>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label htmlFor="custom-location" className="block text-sm font-medium text-gray-700 mb-1">
                                Location Name
                            </label>
                            <input
                                id="custom-location"
                                type="text"
                                value={customSeismic.location}
                                onChange={(e) => setCustomSeismic({ ...customSeismic, location: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter location"
                            />
                        </div>

                        <div>
                            <label htmlFor="pga" className="block text-sm font-medium text-gray-700 mb-1">
                                PGA (g)
                            </label>
                            <input
                                id="pga"
                                type="number"
                                step="0.01"
                                value={customSeismic.PGA}
                                onChange={(e) => setCustomSeismic({ ...customSeismic, PGA: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                placeholder="0.20"
                            />
                        </div>

                        <div>
                            <label htmlFor="sa02" className="block text-sm font-medium text-gray-700 mb-1">
                                Sa(0.2s) (g)
                            </label>
                            <input
                                id="sa02"
                                type="number"
                                step="0.01"
                                value={customSeismic.Sa02}
                                onChange={(e) => setCustomSeismic({ ...customSeismic, Sa02: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                placeholder="0.50"
                            />
                        </div>

                        <div>
                            <label htmlFor="sa10" className="block text-sm font-medium text-gray-700 mb-1">
                                Sa(1.0s) (g)
                            </label>
                            <input
                                id="sa10"
                                type="number"
                                step="0.01"
                                value={customSeismic.Sa10}
                                onChange={(e) => setCustomSeismic({ ...customSeismic, Sa10: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                placeholder="0.20"
                            />
                        </div>
                    </div>

                    <div className="mt-4">
                        <button
                            onClick={() => {
                                if (customSeismic.location && customSeismic.PGA && customSeismic.Sa02 && customSeismic.Sa10) {
                                    setStep(2);
                                }
                            }}
                            disabled={!customSeismic.location || !customSeismic.PGA || !customSeismic.Sa02 || !customSeismic.Sa10}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400"
                        >
                            Continue with Custom Parameters
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
                            <span className="mr-3">🌍</span>
                            Seismic Load Calculator
                        </h1>
                        <p className="text-lg text-gray-600">
                            {selectedLocation ?
                                `${selectedLocation.city}, ${selectedLocation.province} • PGA = ${selectedLocation.PGA}g` :
                                `${customSeismic.location} • PGA = ${customSeismic.PGA}g`
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
                    {/* Building Parameters */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Building Parameters</h2>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="importance" className="block text-sm font-medium text-gray-700 mb-1">
                                        Importance Category
                                    </label>
                                    <select
                                        id="importance"
                                        value={buildingParams.importance}
                                        onChange={(e) => setBuildingParams({ ...buildingParams, importance: e.target.value as BuildingParameters["importance"] })}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                    >
                                        {Object.entries(importanceFactors).map(([key, value]) => (
                                            <option key={key} value={key}>
                                                {key} (Ie = {value.Ie})
                                            </option>
                                        ))}
                                    </select>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {importanceFactors[buildingParams.importance].description}
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="building-height" className="block text-sm font-medium text-gray-700 mb-1">
                                        Building Height (m)
                                    </label>
                                    <input
                                        id="building-height"
                                        type="number"
                                        value={buildingParams.height}
                                        onChange={(e) => setBuildingParams({ ...buildingParams, height: parseFloat(e.target.value) || 0 })}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="floors" className="block text-sm font-medium text-gray-700 mb-1">
                                        Number of Floors
                                    </label>
                                    <input
                                        id="floors"
                                        type="number"
                                        value={buildingParams.floors}
                                        onChange={(e) => setBuildingParams({ ...buildingParams, floors: parseInt(e.target.value) || 1 })}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="seismic-weight" className="block text-sm font-medium text-gray-700 mb-1">
                                        Seismic Weight (kN)
                                    </label>
                                    <input
                                        id="seismic-weight"
                                        type="number"
                                        value={buildingParams.weight}
                                        onChange={(e) => setBuildingParams({ ...buildingParams, weight: parseFloat(e.target.value) || 0 })}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                    />
                                    <div className="text-xs text-gray-500 mt-1">
                                        Dead load + applicable portion of live load
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="site-class" className="block text-sm font-medium text-gray-700 mb-1">
                                        Site Class
                                    </label>
                                    <select
                                        id="site-class"
                                        value={buildingParams.siteClass}
                                        onChange={(e) => setBuildingParams({ ...buildingParams, siteClass: e.target.value as BuildingParameters["siteClass"] })}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                    >
                                        {Object.entries(siteFactors).map(([key, value]) => (
                                            <option key={key} value={key}>
                                                Site Class {key}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {siteFactors[buildingParams.siteClass].description}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Structural Irregularities
                                    </label>
                                    <div className="space-y-2">
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={buildingParams.irregularities.vertical}
                                                onChange={(e) => setBuildingParams({
                                                    ...buildingParams,
                                                    irregularities: { ...buildingParams.irregularities, vertical: e.target.checked }
                                                })}
                                                className="mr-2"
                                            />
                                            <span className="text-sm text-gray-700">Vertical irregularity</span>
                                        </label>

                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={buildingParams.irregularities.horizontal}
                                                onChange={(e) => setBuildingParams({
                                                    ...buildingParams,
                                                    irregularities: { ...buildingParams.irregularities, horizontal: e.target.checked }
                                                })}
                                                className="mr-2"
                                            />
                                            <span className="text-sm text-gray-700">Horizontal irregularity</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Structural System */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Structural System</h2>

                        <div className="space-y-4">
                            {systemCategories.map((category) => (
                                <div key={category}>
                                    <h3 className="text-lg font-medium text-gray-800 mb-2">{category} Systems</h3>
                                    <div className="grid gap-3">
                                        {getSystemsByCategory(category).map((system) => (
                                            <label key={system.name} className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                                <input
                                                    type="radio"
                                                    name="structuralSystem"
                                                    value={system.name}
                                                    checked={buildingParams.structuralSystem === system.name}
                                                    onChange={(e) => setBuildingParams({
                                                        ...buildingParams,
                                                        structuralSystem: e.target.value,
                                                        ductility: system.ductility
                                                    })}
                                                    className="mt-1 mr-3"
                                                />
                                                <div className="flex-1">
                                                    <div className="font-medium text-gray-900">{system.name}</div>
                                                    <div className="text-sm text-gray-600">{system.description}</div>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        Rd = {system.Rd}, Ro = {system.Ro}, Height limit: {system.heightLimit}m
                                                    </div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6">
                            <button
                                onClick={calculateSeismicLoads}
                                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                                Calculate Seismic Loads
                            </button>
                        </div>
                    </div>
                </div>

                {/* Results Panel */}
                <div className="space-y-6">
                    {/* Load Summary */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Seismic Load Summary</h2>
                        {showResults && seismicResults.length > 0 ? (
                            <div>
                                <div className="text-center mb-4">
                                    <div className="text-4xl font-bold text-blue-600 mb-2">
                                        {seismicResults.find(r => r.parameter === "Design Base Shear")?.value.toFixed(0) || "0"}
                                    </div>
                                    <div className="text-lg text-gray-600">kN Base Shear</div>
                                </div>

                                <div className="space-y-3">
                                    {[
                                        "Design Base Shear",
                                        "Average Story Force",
                                        "Design Sa",
                                        "Fundamental Period",
                                        "Ductility Factor"
                                    ].map((param) => {
                                        const result = seismicResults.find(r => r.parameter === param);
                                        if (!result) return null;

                                        return (
                                            <div key={param} className="p-3 bg-gray-50 rounded-lg">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="font-medium text-gray-900">{result.parameter}</span>
                                                    <span className="text-blue-600 font-semibold">
                                                        {result.value.toFixed(result.unit === "s" ? 3 : 2)} {result.unit}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-gray-600">{result.description}</div>
                                                {result.calculation && (
                                                    <div className="text-xs text-gray-500 mt-1 font-mono">{result.calculation}</div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 py-8">
                                Configure parameters and click "Calculate Seismic Loads" to see results
                            </div>
                        )}
                    </div>

                    {/* Code References */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Code References</h2>
                        <div className="space-y-3 text-sm">
                            <div>
                                <span className="font-medium text-blue-600">NBC 4.1.8</span>
                                <p className="text-gray-600">Earthquake loads and effects</p>
                            </div>
                            <div>
                                <span className="font-medium text-blue-600">NBC 4.1.8.3</span>
                                <p className="text-gray-600">Equivalent static force procedure</p>
                            </div>
                            <div>
                                <span className="font-medium text-blue-600">NBC Table 4.1.8.9</span>
                                <p className="text-gray-600">Ductility and overstrength factors</p>
                            </div>
                            <div>
                                <span className="font-medium text-blue-600">NBC Figure 4.1.8.18</span>
                                <p className="text-gray-600">Seismic hazard values for Canada</p>
                            </div>
                        </div>
                    </div>

                    {/* Response Spectrum */}
                    {showResults && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Spectrum</h3>
                            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                                <div className="text-center text-gray-500">
                                    <div className="text-4xl mb-2">📈</div>
                                    <div>Design Response Spectrum</div>
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