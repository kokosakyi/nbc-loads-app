import type { MetaFunction } from "@remix-run/node";
import { useState } from "react";
import {

    MapPinIcon
} from "@heroicons/react/24/outline";

import snowWindLoadsData from "~/data/snow_wind_loads.json";

export const meta: MetaFunction = () => {
    return [
        { title: "Wind Load Calculator - NBC 2020 Structural Loads" },
        { name: "description", content: "Professional wind load calculator with Canadian wind zones, building geometry, and pressure calculations per NBC 4.1.7" },
    ];
};

interface WindLoadData {
    province: string;
    location: string;
    pw_10: number;
    pw_50: number;
}

interface ImportanceFactors {
    category: "low" | "normal" | "high" | "post-disaster";
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
    const [selectedProvince, setSelectedProvince] = useState<string>("");
    const [selectedLocation, setSelectedLocation] = useState<WindLoadData | null>(null);
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

    // Get unique provinces from the data
    const provinces = Array.from(new Set(snowWindLoadsData.map(item => item.province))).sort();

    // Get locations for selected province
    const locationsForProvince = selectedProvince
        ? snowWindLoadsData.filter(item => item.province === selectedProvince).sort((a, b) => a.location.localeCompare(b.location))
        : [];


    return (
        <div className="min-h-screen bg-gray-900 dark:bg-gray-900 light:bg-gray-50 text-white dark:text-white light:text-gray-900">
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white dark:text-white light:text-gray-900 mb-2">Wind Load Calculator</h1>
                    <p className="text-gray-400 dark:text-gray-400 light:text-gray-600">Calculate wind loads per NBC 2020 Section 4.1.7</p>
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

                {/* Basic Wind Load Calculator */}
                {(<>
                    {/* Step 1: Location Selection */}
                    {step === 1 && (
                        <div className="engineering-card">
                            <h2 className="text-2xl font-bold text-white dark:text-white light:text-gray-900 mb-6 flex items-center">
                                <MapPinIcon className="h-6 w-6 mr-2 text-orange-500" />
                                Select Location
                            </h2>

                            <div className="grid md:grid-cols-2 gap-8">
                                {/* Province and Location Selection */}
                                <div className="space-y-6">
                                    <div>
                                        <label htmlFor="province-select" className="block text-sm font-medium text-gray-300 mb-2">
                                            Province/Territory
                                        </label>
                                        <select
                                            id="province-select"
                                            value={selectedProvince}
                                            onChange={(e) => {
                                                setSelectedProvince(e.target.value);
                                                setSelectedLocation(null);
                                            }}
                                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        >
                                            <option value="">Select a province...</option>
                                            {provinces.map(province => (
                                                <option key={province} value={province}>{province}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {selectedProvince && (
                                        <div>
                                            <label htmlFor="location-select" className="block text-sm font-medium text-gray-300 mb-2">
                                                Location ({locationsForProvince.length} available)
                                            </label>
                                            <select
                                                id="location-select"
                                                value={selectedLocation?.location || ""}
                                                onChange={(e) => {
                                                    const location = locationsForProvince.find(loc => loc.location === e.target.value);
                                                    setSelectedLocation(location || null);
                                                }}
                                                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            >
                                                <option value="">Select a location...</option>
                                                {locationsForProvince.map(location => (
                                                    <option key={location.location} value={location.location}>
                                                        {location.location}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>

                                {/* Selected Location Details */}
                                {selectedLocation && (
                                    <div className="bg-gray-800 rounded-lg p-6">
                                        <h3 className="text-lg font-semibold text-white mb-4">Location Details</h3>
                                        <div className="space-y-3">
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Location:</span>
                                                <span className="text-white font-medium">{selectedLocation.location}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Province:</span>
                                                <span className="text-white font-medium">{selectedLocation.province}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Elevation:</span>
                                                <span className="text-white font-medium">{selectedLocation.elevation} m</span>
                                            </div>
                                            <div className="border-t border-gray-700 pt-3">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">Specified Wind Pressure (Pw: 1/50) :</span>
                                                    <span className="text-orange-500 font-bold">{selectedLocation.pw_50} kPa</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">Specified Wind Pressure (Pw: 1/10) :</span>
                                                    <span className="text-orange-500 font-bold">{selectedLocation.pw_10} kPa</span>
                                                </div>

                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>


                        </div>
                    )}
                </>)}










            </div>
        </div>
    );





} 