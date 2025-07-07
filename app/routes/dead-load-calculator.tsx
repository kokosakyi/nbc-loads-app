import { useState } from "react";
import type { MetaFunction } from "@remix-run/node";
import deadLoadsData from "../data/dead_loads.json";

export const meta: MetaFunction = () => {
    return [
        { title: "Dead Load Calculator - NBC 2020 Structural Loads" },
        { name: "description", content: "Calculate dead loads by building material assemblies with cumulative weight analysis" },
    ];
};

interface DeadLoadMaterial {
    material: string;
    value: number;
    units: string;
    category: string;
}

interface AssemblyItem {
    id: string;
    material: DeadLoadMaterial;
    thickness?: number;
    calculatedLoad: number;
}

export default function DeadLoadCalculator() {
    const [assembly, setAssembly] = useState<AssemblyItem[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>("Ceilings");
    const [showThicknessInput, setShowThicknessInput] = useState<string | null>(null);
    const [currentThickness, setCurrentThickness] = useState<string>("100");

    // Custom material inputs
    const [customMaterial, setCustomMaterial] = useState<string>("");
    const [customValue, setCustomValue] = useState<string>("");
    const [customUnits, setCustomUnits] = useState<string>("kPa");
    const [customThickness, setCustomThickness] = useState<string>("100");

    // Get unique categories from the JSON data
    const categories = [...new Set(deadLoadsData.map(item => item.category))].sort();

    // Filter materials by selected category
    const filteredMaterials = deadLoadsData.filter(
        material => material.category === selectedCategory
    );

    const addToAssembly = (material: DeadLoadMaterial) => {
        if (material.units === "kN/m3") {
            // Show thickness input for kN/m3 materials
            setShowThicknessInput(material.material);
            setCurrentThickness("100");
        } else {
            // Direct add for kPa materials
            const calculatedLoad = material.value;
            const newItem: AssemblyItem = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                material,
                thickness: undefined,
                calculatedLoad,
            };
            setAssembly(prev => [...prev, newItem]);
        }
    };

    const confirmAddWithThickness = (material: DeadLoadMaterial) => {
        const thicknessMm = parseFloat(currentThickness);
        const validThicknessMm = thicknessMm >= 1 ? thicknessMm : 1;
        const thicknessM = validThicknessMm / 1000; // Convert mm to m
        const calculatedLoad = material.value * thicknessM;

        const newItem: AssemblyItem = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            material,
            thickness: validThicknessMm, // Store thickness in mm for display
            calculatedLoad,
        };

        setAssembly(prev => [...prev, newItem]);
        setShowThicknessInput(null);
        setCurrentThickness("100");
    };

    const cancelThicknessInput = () => {
        setShowThicknessInput(null);
        setCurrentThickness("100");
    };

    const addCustomMaterial = () => {
        if (!customMaterial.trim() || !customValue.trim()) {
            alert("Please enter both material name and value");
            return;
        }

        const value = parseFloat(customValue);
        if (isNaN(value) || value <= 0) {
            alert("Please enter a valid positive number for the value");
            return;
        }

        const material: DeadLoadMaterial = {
            material: customMaterial.trim(),
            value: value,
            units: customUnits,
            category: "Custom"
        };

        let thickness: number | undefined;
        let calculatedLoad: number;

        if (customUnits === "kN/m3") {
            const thicknessMm = parseFloat(customThickness);
            if (isNaN(thicknessMm) || thicknessMm < 1) {
                alert("Please enter a valid thickness of at least 1mm");
                return;
            }
            thickness = thicknessMm; // Store thickness in mm for display
            const thicknessM = thicknessMm / 1000; // Convert mm to m for calculation
            calculatedLoad = value * thicknessM;
        } else {
            calculatedLoad = value;
        }

        const newItem: AssemblyItem = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            material,
            thickness,
            calculatedLoad,
        };

        setAssembly(prev => [...prev, newItem]);

        // Reset form
        setCustomMaterial("");
        setCustomValue("");
        setCustomUnits("kPa");
        setCustomThickness("100");
    };

    const removeFromAssembly = (id: string) => {
        setAssembly(prev => prev.filter(item => item.id !== id));
    };

    const totalDeadLoad = assembly.reduce((total, item) => total + item.calculatedLoad, 0);

    const handlePrint = () => {
        // Create a new window for printing
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Dead Load Calculator - Assembly Report</title>
                <style>
                    body {
                        font-family: 'Arial', sans-serif;
                        margin: 0;
                        padding: 20px;
                        background: white;
                        color: #000;
                        font-size: 12px;
                        line-height: 1.4;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 30px;
                        border-bottom: 2px solid #b4641e;
                        padding-bottom: 15px;
                    }
                    .header h1 {
                        margin: 0;
                        font-size: 24px;
                        color: #000;
                        font-weight: bold;
                    }
                    .header p {
                        margin: 5px 0 0 0;
                        color: #666;
                        font-size: 14px;
                    }
                    .assembly-section {
                        margin-bottom: 25px;
                    }
                    .section-title {
                        font-size: 16px;
                        font-weight: bold;
                        margin-bottom: 10px;
                        color: #b4641e;
                        border-bottom: 1px solid #ddd;
                        padding-bottom: 5px;
                    }
                    .assembly-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 20px;
                    }
                    .assembly-table th {
                        background: #f5f5f5;
                        border: 1px solid #ddd;
                        padding: 8px;
                        text-align: left;
                        font-weight: bold;
                        font-size: 11px;
                    }
                    .assembly-table td {
                        border: 1px solid #ddd;
                        padding: 8px;
                        font-size: 11px;
                    }
                    .assembly-table tr:nth-child(even) {
                        background: #f9f9f9;
                    }
                    .total-section {
                        background: #f5f5f5;
                        border: 2px solid #b4641e;
                        padding: 15px;
                        text-align: center;
                        margin-top: 20px;
                    }
                    .total-value {
                        font-size: 20px;
                        font-weight: bold;
                        color: #b4641e;
                        margin: 10px 0;
                    }
                    .footer {
                        margin-top: 30px;
                        text-align: center;
                        color: #666;
                        font-size: 10px;
                        border-top: 1px solid #ddd;
                        padding-top: 10px;
                    }
                    .number-col { width: 40px; text-align: center; }
                    .material-col { width: 250px; }
                    .value-col { width: 80px; text-align: right; }
                    .units-col { width: 60px; text-align: center; }
                    .thickness-col { width: 80px; text-align: right; }
                    .load-col { width: 80px; text-align: right; font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Dead Load Calculator - Assembly Report</h1>
                    <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
                </div>
                
                <div class="assembly-section">
                    <div class="section-title">Material Assembly (${assembly.length} items)</div>
                    ${assembly.length === 0 ? '<p>No materials in assembly</p>' : `
                        <table class="assembly-table">
                            <thead>
                                <tr>
                                    <th class="number-col">#</th>
                                    <th class="material-col">Material</th>
                                    <th class="value-col">Value</th>
                                    <th class="units-col">Units</th>
                                    <th class="thickness-col">Thickness</th>
                                    <th class="load-col">Load (kPa)</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${assembly.map((item, index) => `
                                    <tr>
                                        <td class="number-col">${index + 1}</td>
                                        <td class="material-col">${item.material.material}</td>
                                        <td class="value-col">${item.material.value}</td>
                                        <td class="units-col">${item.material.units}</td>
                                        <td class="thickness-col">${item.thickness ? `${item.thickness}mm` : '-'}</td>
                                        <td class="load-col">${item.calculatedLoad.toFixed(2)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    `}
                </div>

                <div class="total-section">
                    <div class="section-title">Total Dead Load</div>
                    <div class="total-value">${totalDeadLoad.toFixed(2)} kPa</div>
                    <p>Based on ${assembly.length} material${assembly.length !== 1 ? 's' : ''}</p>
                </div>

                <div class="footer">
                    <p>NBC 2020 Structural Loads - Dead Load Calculator</p>
                    <p>This report was generated automatically and should be verified by a qualified structural engineer.</p>
                </div>
            </body>
            </html>
        `;

        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    };

    return (
        <div className="min-h-screen pt-16">
            <div className="max-w-6xl mx-auto p-4">
                <h1 className="text-3xl font-bold mb-6 text-white">Dead Load Calculator</h1>

                {/* Custom Material Entry */}
                <div className="mb-6 p-4 engineering-card">
                    <h2 className="text-lg font-semibold mb-4 text-white">Add Custom Material</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label htmlFor="custom-material" className="block text-sm font-medium text-white mb-1">
                                Material Name:
                            </label>
                            <input
                                id="custom-material"
                                type="text"
                                value={customMaterial}
                                onChange={(e) => setCustomMaterial(e.target.value)}
                                placeholder="Enter material name"
                                className="w-full p-2 border border-orange-600 rounded bg-black text-white focus:ring-2 focus:ring-orange-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="custom-value" className="block text-sm font-medium text-white mb-1">
                                Value:
                            </label>
                            <input
                                id="custom-value"
                                type="text"
                                value={customValue}
                                onChange={(e) => setCustomValue(e.target.value)}
                                placeholder="Enter value"
                                className="w-full p-2 border border-orange-600 rounded bg-black text-white focus:ring-2 focus:ring-orange-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="custom-units" className="block text-sm font-medium text-white mb-1">
                                Units:
                            </label>
                            <select
                                id="custom-units"
                                value={customUnits}
                                onChange={(e) => setCustomUnits(e.target.value)}
                                className="w-full p-2 border border-orange-600 rounded bg-black text-white focus:ring-2 focus:ring-orange-500"
                            >
                                <option value="kPa">kPa</option>
                                <option value="kN/m3">kN/m³</option>
                            </select>
                        </div>
                        {customUnits === "kN/m3" && (
                            <div>
                                <label htmlFor="custom-thickness" className="block text-sm font-medium text-white mb-1">
                                    Thickness (mm):
                                </label>
                                <input
                                    id="custom-thickness"
                                    type="text"
                                    value={customThickness}
                                    onChange={(e) => setCustomThickness(e.target.value)}
                                    placeholder="100"
                                    className="w-full p-2 border border-orange-600 rounded bg-black text-white focus:ring-2 focus:ring-orange-500"
                                />
                            </div>
                        )}
                    </div>
                    <button
                        onClick={addCustomMaterial}
                        className="mt-4 bg-orange-600 text-white py-2 px-4 rounded hover:bg-orange-700 transition-colors"
                    >
                        Add Custom Material
                    </button>
                </div>

                {/* Category Selection */}
                <div className="mb-6 p-4 engineering-card">
                    <label htmlFor="category-select" className="block text-sm font-medium text-white mb-2">
                        Select Material Category:
                    </label>
                    <select
                        id="category-select"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full p-2 border border-orange-600 rounded bg-black text-white focus:ring-2 focus:ring-orange-500"
                    >
                        {categories.map((category) => (
                            <option key={category} value={category}>
                                {category}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Materials List */}
                    <div className="p-4 engineering-card">
                        <h2 className="text-xl font-semibold mb-4 text-white">
                            Available Materials ({filteredMaterials.length})
                        </h2>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {filteredMaterials.map((material, index) => (
                                <div key={`${material.material}-${index}`} className="p-3 bg-gray-900 border border-orange-600 rounded">
                                    <div className="text-white">
                                        <div className="font-medium mb-1">{material.material}</div>
                                        <div className="text-sm text-orange-400 mb-2">
                                            {material.value} {material.units}
                                        </div>

                                        {/* Thickness input for kN/m3 materials when selected */}
                                        {showThicknessInput === material.material && (
                                            <div className="mb-2 p-2 border border-orange-600 rounded bg-gray-800">
                                                <label htmlFor={`thickness-input-${index}`} className="block text-xs text-gray-300 mb-1">
                                                    Enter Thickness (mm):
                                                </label>
                                                <input
                                                    id={`thickness-input-${index}`}
                                                    type="text"
                                                    value={currentThickness}
                                                    onChange={(e) => setCurrentThickness(e.target.value)}
                                                    className="w-full p-1 border border-orange-600 rounded text-sm bg-black text-white focus:ring-2 focus:ring-orange-500 mb-2"
                                                    placeholder="100"
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => confirmAddWithThickness(material)}
                                                        className="flex-1 bg-orange-600 text-white py-1 px-2 rounded hover:bg-orange-700 transition-colors text-xs"
                                                    >
                                                        Add
                                                    </button>
                                                    <button
                                                        onClick={cancelThicknessInput}
                                                        className="flex-1 bg-gray-600 text-white py-1 px-2 rounded hover:bg-gray-700 transition-colors text-xs"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {showThicknessInput !== material.material && (
                                            <button
                                                onClick={() => addToAssembly(material)}
                                                className="w-full bg-orange-600 text-white py-2 px-3 rounded hover:bg-orange-700 transition-colors text-sm"
                                            >
                                                Add to Assembly
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Assembly and Results */}
                    <div className="space-y-6">
                        {/* Assembly */}
                        <div className="p-4 engineering-card">
                            <h2 className="text-xl font-semibold mb-4 text-white">
                                Assembly ({assembly.length} items)
                            </h2>
                            {assembly.length === 0 ? (
                                <p className="text-gray-300">No materials added yet. Add materials from the left panel.</p>
                            ) : (
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {assembly.map((item, index) => (
                                        <div key={item.id} className="p-3 bg-gray-900 border border-orange-600 rounded">
                                            <div className="flex justify-between items-start">
                                                <div className="text-white flex-1">
                                                    <div className="font-medium">{index + 1}. {item.material.material}</div>
                                                    <div className="text-sm text-gray-300">
                                                        {item.material.value} {item.material.units}
                                                        {item.thickness && ` × ${item.thickness}mm`}
                                                    </div>
                                                    <div className="text-sm font-medium text-orange-400">
                                                        Load: {item.calculatedLoad.toFixed(2)} kPa
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => removeFromAssembly(item.id)}
                                                    className="text-red-400 hover:text-red-300 text-sm font-medium ml-2"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Total Dead Load */}
                        <div className="p-4 engineering-card">
                            <h2 className="text-xl font-semibold mb-4 text-white">Total Dead Load</h2>
                            <div className="text-3xl font-bold text-orange-400">
                                {totalDeadLoad.toFixed(2)} kPa
                            </div>
                            <div className="text-sm text-gray-300 mt-2 mb-4">
                                Based on {assembly.length} material{assembly.length !== 1 ? 's' : ''}
                            </div>
                            {assembly.length > 0 && (
                                <button
                                    onClick={handlePrint}
                                    className="w-full bg-orange-600 text-white py-2 px-4 rounded hover:bg-orange-700 transition-colors"
                                >
                                    📄 Print Assembly Report
                                </button>
                            )}
                        </div>

                        {/* Clear Assembly */}
                        {assembly.length > 0 && (
                            <button
                                onClick={() => setAssembly([])}
                                className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors"
                            >
                                Clear Assembly
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
} 