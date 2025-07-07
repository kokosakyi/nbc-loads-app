import type { MetaFunction } from "@remix-run/node";
import { useState } from "react";

export const meta: MetaFunction = () => {
    return [
        { title: "Live Load Calculator - NBC 2020 Structural Loads" },
        { name: "description", content: "Professional live load calculator with occupancy classifications and automatic load reductions per NBC 4.1.5" },
    ];
};

interface OccupancyType {
    code: string;
    name: string;
    category: string;
    uniformLoad: number; // kN/m²
    concentratedLoad?: number; // kN
    description: string;
    examples: string[];
    reductionAllowed: boolean;
    dynamicFactor?: number;
}

interface LoadArea {
    id: string;
    name: string;
    area: number; // m²
    occupancy: OccupancyType;
    tributaryArea?: number;
    reduction: number; // percentage
    finalLoad: number; // kN/m²
    totalLoad: number; // kN
    notes?: string;
}

const occupancyTypes: OccupancyType[] = [
    // Residential
    {
        code: "A1",
        name: "Assembly - Fixed Seating",
        category: "Assembly",
        uniformLoad: 2.4,
        concentratedLoad: 1.3,
        description: "Theatres, churches, auditoriums with fixed seating",
        examples: ["Movie theatre", "Church sanctuary", "Concert hall"],
        reductionAllowed: true
    },
    {
        code: "A2",
        name: "Assembly - Movable Seating",
        category: "Assembly",
        uniformLoad: 4.8,
        concentratedLoad: 1.3,
        description: "Assembly areas with movable seating",
        examples: ["Banquet hall", "Conference room", "Gym with bleachers"],
        reductionAllowed: true
    },
    {
        code: "A3",
        name: "Assembly - Without Seating",
        category: "Assembly",
        uniformLoad: 4.8,
        concentratedLoad: 1.3,
        description: "Assembly areas without fixed seating",
        examples: ["Dance floor", "Lobby", "Museum gallery"],
        reductionAllowed: true
    },
    {
        code: "B1",
        name: "Care or Detention",
        category: "Institutional",
        uniformLoad: 1.9,
        concentratedLoad: 1.3,
        description: "Hospitals, nursing homes, detention facilities",
        examples: ["Hospital room", "Nursing home", "Prison cell"],
        reductionAllowed: true
    },
    {
        code: "C",
        name: "Residential",
        category: "Residential",
        uniformLoad: 1.9,
        concentratedLoad: 1.8,
        description: "Dwelling units, hotel rooms, dormitories",
        examples: ["Apartment", "Hotel room", "House", "Dormitory"],
        reductionAllowed: true
    },
    {
        code: "D",
        name: "Business and Personal Services",
        category: "Commercial",
        uniformLoad: 2.4,
        concentratedLoad: 1.3,
        description: "Offices, banks, professional services",
        examples: ["Office space", "Bank", "Medical clinic", "Hair salon"],
        reductionAllowed: true
    },
    {
        code: "E",
        name: "Mercantile",
        category: "Commercial",
        uniformLoad: 4.8,
        concentratedLoad: 1.3,
        description: "Retail stores, shops, markets",
        examples: ["Retail store", "Shopping mall", "Grocery store"],
        reductionAllowed: true
    },
    {
        code: "F1",
        name: "Industrial - Low Hazard",
        category: "Industrial",
        uniformLoad: 6.0,
        concentratedLoad: 4.5,
        description: "Light manufacturing, low hazard industrial",
        examples: ["Electronics assembly", "Food processing", "Textile mill"],
        reductionAllowed: false
    },
    {
        code: "F2",
        name: "Industrial - Medium Hazard",
        category: "Industrial",
        uniformLoad: 12.0,
        concentratedLoad: 9.0,
        description: "Heavy manufacturing, medium hazard industrial",
        examples: ["Auto assembly", "Heavy machinery", "Chemical plant"],
        reductionAllowed: false
    }
];

const specialOccupancies = [
    {
        name: "Corridors and Lobbies",
        load: 4.8,
        description: "Same as occupancy served but not less than 4.8 kN/m²"
    },
    {
        name: "Stairs and Exits",
        load: 4.8,
        description: "4.8 kN/m² minimum for egress components"
    },
    {
        name: "Storage Areas",
        load: 6.0,
        description: "6.0 kN/m² or actual anticipated load, whichever is greater"
    },
    {
        name: "Parking Garages",
        load: 2.4,
        description: "2.4 kN/m² for passenger cars, 3.6 kN/m² for trucks"
    }
];

export default function LiveLoadCalculator() {
    const [step, setStep] = useState(1);
    const [selectedOccupancy, setSelectedOccupancy] = useState<OccupancyType | null>(null);
    const [loadAreas, setLoadAreas] = useState<LoadArea[]>([]);
    const [showAreaForm, setShowAreaForm] = useState(false);

    // Form state
    const [areaName, setAreaName] = useState("");
    const [areaSize, setAreaSize] = useState("");
    const [tributaryArea, setTributaryArea] = useState("");
    const [customLoad, setCustomLoad] = useState("");
    const [notes, setNotes] = useState("");

    const calculateReduction = (occupancy: OccupancyType, tribArea: number): number => {
        if (!occupancy.reductionAllowed || tribArea < 20) return 0;

        // NBC 4.1.5.9 - Live load reduction
        const reduction = Math.min(40, (tribArea - 20) * 0.5);
        return reduction;
    };

    const addLoadArea = () => {
        if (!selectedOccupancy || !areaName || !areaSize) return;

        const area = parseFloat(areaSize);
        const tribArea = parseFloat(tributaryArea) || area;
        const reduction = calculateReduction(selectedOccupancy, tribArea);
        const baseLoad = customLoad ? parseFloat(customLoad) : selectedOccupancy.uniformLoad;
        const finalLoad = baseLoad * (1 - reduction / 100);
        const totalLoad = finalLoad * area;

        const newArea: LoadArea = {
            id: Date.now().toString(),
            name: areaName,
            area,
            occupancy: selectedOccupancy,
            tributaryArea: tribArea,
            reduction,
            finalLoad,
            totalLoad,
            notes
        };

        setLoadAreas([...loadAreas, newArea]);
        resetForm();
    };

    const resetForm = () => {
        setAreaName("");
        setAreaSize("");
        setTributaryArea("");
        setCustomLoad("");
        setNotes("");
        setShowAreaForm(false);
    };

    const getTotalLiveLoad = (): number => {
        return loadAreas.reduce((sum, area) => sum + area.totalLoad, 0);
    };

    const occupancyCategories = Array.from(new Set(occupancyTypes.map(o => o.category)));

    if (step === 1) {
        return (
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4 flex items-center">
                        <span className="mr-3">👥</span>
                        Live Load Calculator - Occupancy Classification
                    </h1>
                    <p className="text-lg text-gray-600">
                        Select the occupancy classification for your building areas according to NBC Table 4.1.5.3.
                    </p>
                </div>

                <div className="grid lg:grid-cols-4 gap-6">
                    {occupancyCategories.map((category) => (
                        <div key={category} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">{category}</h2>
                            <div className="space-y-3">
                                {occupancyTypes.filter(o => o.category === category).map((occupancy) => (
                                    <button
                                        key={occupancy.code}
                                        onClick={() => {
                                            setSelectedOccupancy(occupancy);
                                            setStep(2);
                                        }}
                                        className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="font-medium text-gray-900">{occupancy.code}</div>
                                            <div className="text-sm font-semibold text-blue-600">
                                                {occupancy.uniformLoad} kN/m²
                                            </div>
                                        </div>
                                        <div className="text-sm text-gray-800 font-medium mb-1">{occupancy.name}</div>
                                        <div className="text-xs text-gray-600">{occupancy.description}</div>
                                        <div className="text-xs text-gray-500 mt-2">
                                            Examples: {occupancy.examples.slice(0, 2).join(", ")}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Special Occupancies */}
                <div className="mt-12 bg-yellow-50 rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Special Considerations</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {specialOccupancies.map((special) => (
                            <div key={special.name} className="bg-white rounded-lg p-4 border border-yellow-200">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-medium text-gray-900">{special.name}</h3>
                                    <span className="text-sm font-semibold text-yellow-700">{special.load} kN/m²</span>
                                </div>
                                <p className="text-sm text-gray-600">{special.description}</p>
                            </div>
                        ))}
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
                            <span className="mr-3">👥</span>
                            Live Load Calculator
                        </h1>
                        <p className="text-lg text-gray-600">
                            {selectedOccupancy?.code} - {selectedOccupancy?.name}
                        </p>
                    </div>
                    <button
                        onClick={() => setStep(1)}
                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        ← Change Occupancy
                    </button>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Load Areas Panel */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Selected Occupancy Info */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Occupancy Details</h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <div className="bg-blue-50 rounded-lg p-4">
                                    <div className="text-sm text-blue-600 font-medium">Uniform Live Load</div>
                                    <div className="text-2xl font-bold text-blue-800">
                                        {selectedOccupancy?.uniformLoad} kN/m²
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div className="bg-green-50 rounded-lg p-4">
                                    <div className="text-sm text-green-600 font-medium">Concentrated Load</div>
                                    <div className="text-2xl font-bold text-green-800">
                                        {selectedOccupancy?.concentratedLoad || "N/A"} kN
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4">
                            <div className="text-sm text-gray-600">
                                <span className="font-medium">Load Reduction:</span> {selectedOccupancy?.reductionAllowed ? "Allowed per NBC 4.1.5.9" : "Not permitted"}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                                <span className="font-medium">Examples:</span> {selectedOccupancy?.examples.join(", ")}
                            </div>
                        </div>
                    </div>

                    {/* Area Input Form */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Load Areas</h3>
                            <button
                                onClick={() => setShowAreaForm(true)}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                                + Add Area
                            </button>
                        </div>

                        {showAreaForm && (
                            <div className="border border-gray-200 rounded-lg p-4 mb-6 bg-gray-50">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="area-name" className="block text-sm font-medium text-gray-700 mb-1">
                                            Area Name
                                        </label>
                                        <input
                                            id="area-name"
                                            type="text"
                                            value={areaName}
                                            onChange={(e) => setAreaName(e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                            placeholder="e.g., Main Office Area"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="area-size" className="block text-sm font-medium text-gray-700 mb-1">
                                            Area Size (m²)
                                        </label>
                                        <input
                                            id="area-size"
                                            type="number"
                                            step="0.1"
                                            value={areaSize}
                                            onChange={(e) => setAreaSize(e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                            placeholder="100"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="tributary-area" className="block text-sm font-medium text-gray-700 mb-1">
                                            Tributary Area (m²)
                                        </label>
                                        <input
                                            id="tributary-area"
                                            type="number"
                                            step="0.1"
                                            value={tributaryArea}
                                            onChange={(e) => setTributaryArea(e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                            placeholder="Same as area size if not specified"
                                        />
                                        <div className="text-xs text-gray-500 mt-1">
                                            Used for load reduction calculations
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="custom-load" className="block text-sm font-medium text-gray-700 mb-1">
                                            Custom Load (kN/m²)
                                        </label>
                                        <input
                                            id="custom-load"
                                            type="number"
                                            step="0.1"
                                            value={customLoad}
                                            onChange={(e) => setCustomLoad(e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                            placeholder={`Default: ${selectedOccupancy?.uniformLoad}`}
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                                            Notes (optional)
                                        </label>
                                        <input
                                            id="notes"
                                            type="text"
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                            placeholder="Additional notes about this area"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-3 mt-4">
                                    <button
                                        onClick={resetForm}
                                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={addLoadArea}
                                        disabled={!areaName || !areaSize}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
                                    >
                                        Add Area
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Load Areas List */}
                        <div className="space-y-3">
                            {loadAreas.map((area) => (
                                <div key={area.id} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-medium text-gray-900">{area.name}</h4>
                                        <button
                                            onClick={() => setLoadAreas(loadAreas.filter(a => a.id !== area.id))}
                                            className="text-red-600 hover:text-red-800 transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>

                                    <div className="grid md:grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-600">Area:</span>
                                            <div className="font-medium">{area.area} m²</div>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Base Load:</span>
                                            <div className="font-medium">{area.occupancy.uniformLoad} kN/m²</div>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Reduction:</span>
                                            <div className="font-medium text-orange-600">{area.reduction.toFixed(1)}%</div>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Final Load:</span>
                                            <div className="font-medium text-blue-600">{area.finalLoad.toFixed(2)} kN/m²</div>
                                        </div>
                                    </div>

                                    <div className="mt-2 pt-2 border-t border-gray-100">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">
                                                Tributary: {area.tributaryArea} m² • Total Load: <span className="font-semibold text-blue-600">{area.totalLoad.toFixed(1)} kN</span>
                                            </span>
                                        </div>
                                        {area.notes && (
                                            <div className="text-xs text-gray-500 mt-1">{area.notes}</div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Results Panel */}
                <div className="space-y-6">
                    {/* Total Load */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Live Load Summary</h2>
                        <div className="text-center mb-4">
                            <div className="text-4xl font-bold text-blue-600 mb-2">
                                {getTotalLiveLoad().toFixed(1)}
                            </div>
                            <div className="text-lg text-gray-600">kN Total</div>
                        </div>

                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Number of Areas:</span>
                                <span className="font-medium">{loadAreas.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Total Area:</span>
                                <span className="font-medium">{loadAreas.reduce((sum, area) => sum + area.area, 0).toFixed(1)} m²</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Average Load:</span>
                                <span className="font-medium">
                                    {loadAreas.length > 0
                                        ? (getTotalLiveLoad() / loadAreas.reduce((sum, area) => sum + area.area, 0)).toFixed(2)
                                        : "0"
                                    } kN/m²
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Code References */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Code References</h2>
                        <div className="space-y-3 text-sm">
                            <div>
                                <span className="font-medium text-blue-600">NBC Table 4.1.5.3</span>
                                <p className="text-gray-600">Minimum specified live loads</p>
                            </div>
                            <div>
                                <span className="font-medium text-blue-600">NBC 4.1.5.9</span>
                                <p className="text-gray-600">Live load reduction</p>
                            </div>
                            <div>
                                <span className="font-medium text-blue-600">NBC 4.1.5.10</span>
                                <p className="text-gray-600">Concentrated loads</p>
                            </div>
                        </div>
                    </div>

                    {/* Reduction Calculator */}
                    <div className="bg-blue-50 rounded-lg p-6">
                        <h3 className="font-semibold text-blue-900 mb-3">Load Reduction Formula</h3>
                        <div className="text-sm text-blue-800">
                            <p className="mb-2">R = (A - 20) × 0.5%</p>
                            <p className="mb-2">Where:</p>
                            <ul className="list-disc list-inside space-y-1 text-xs">
                                <li>R = Reduction percentage (max 40%)</li>
                                <li>A = Tributary area in m²</li>
                                <li>Minimum A = 20 m² for any reduction</li>
                                <li>Only applies when reduction is permitted</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 