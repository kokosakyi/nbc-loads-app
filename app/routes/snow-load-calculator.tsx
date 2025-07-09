import type { MetaFunction } from "@remix-run/node";
import { useState, useEffect } from "react";
import {
    MapPinIcon
} from "@heroicons/react/24/outline";
import snowWindLoadsData from "~/data/snow_wind_loads.json";

// Extend Window interface to include MathJax
declare global {
    interface Window {
        MathJax?: {
            typesetPromise?: () => Promise<void>;
            typeset?: () => void;
            Hub?: {
                Queue: (commands: unknown[]) => void;
            };
        };
        MathJaxReady?: boolean;
    }
}

export const meta: MetaFunction = () => {
    return [
        { title: "Snow Load Calculator - NBC 2020 Structural Loads" },
        { name: "description", content: "Professional snow load calculator with Canadian snow zones, roof geometry, and drift calculations per NBC 4.1.6" },
    ];
};

interface SnowWindLoadData {
    location: string;
    elevation: number;
    design_temp_1: number;
    design_temp_2: number;
    design_temp_3: number;
    design_temp_4: number;
    days_below_18: number;
    min_rain: number;
    one_day_rain: number;
    annual_rain: number;
    moist_index: number;
    ann_tot_ppn: number;
    driving_rain_wind_pressure: number;
    ss: number;    // Snow load (kPa)
    sr: number;    // Rain load (kPa)
    pw_10: number;
    pw_50: number;
    province: string;
}

interface RoofParameters {
    length: number; // m (larger plan dimension)
    width: number; // m (smaller plan dimension)
    slope: number; // degrees
    height: number; // m above ground
    isSlippery: boolean; // for Cs calculation
    terrainType: "open" | "rural" | "exposed_north"; // for Cw calculation
}

interface ImportanceFactors {
    category: "low" | "normal" | "high" | "post-disaster";
}

interface CalculationFactors {
    Is_uls: number; // ULS Importance factor
    Is_sls: number; // SLS Importance factor
    Cb: number; // Basic roof snow load factor
    Cw: number; // Wind exposure factor
    Cs: number; // Slope factor
    Ca: number; // Accumulation factor
    gamma: number; // Specific weight of snow (kN/m³)
    lc: number; // Characteristic length (m)
    roofShapeFactor: number; // Roof type shape factor
}

interface SnowLoadCase {
    id: string;
    name: string;
    description: string;
    loadValue: number; // kN/m²
    designCase: "uls" | "sls";
    distribution: "uniform" | "triangular" | "trapezoidal";
    driftLoad?: number;
}






export default function SnowLoadCalculator() {
    const [step, setStep] = useState(1); // Start at step 1 (location selection)
    const [selectedProvince, setSelectedProvince] = useState<string>("");
    const [selectedLocation, setSelectedLocation] = useState<SnowWindLoadData | null>(null);
    const [customLocation, setCustomLocation] = useState({
        name: "",
        groundSnowLoad: "",
        rainLoad: ""
    });

    const [roofParams, setRoofParams] = useState<RoofParameters>({
        length: 20,
        width: 15,
        slope: 0,
        height: 6,
        isSlippery: false,
        terrainType: "open"
    });

    const [importanceFactors, setImportanceFactors] = useState<ImportanceFactors>({
        category: "normal"
    });

    const [calculationFactors, setCalculationFactors] = useState<CalculationFactors | null>(null);

    const [snowLoadCases, setSnowLoadCases] = useState<SnowLoadCase[]>([]);
    const [showResults, setShowResults] = useState(false);

    // Trigger MathJax re-rendering when calculations are updated
    useEffect(() => {
        if (typeof window !== 'undefined' && showResults) {
            let retryCount = 0;
            const maxRetries = 30; // Try for up to 6 seconds

            const renderMath = () => {
                try {
                    console.log('Attempting to render MathJax...');

                    // Check if MathJax is available
                    if (window.MathJax) {
                        console.log('MathJax found, attempting to render...');
                        const mathJax = window.MathJax;

                        // Try MathJax v3 typesetPromise
                        if (typeof mathJax.typesetPromise === 'function') {
                            console.log('Using MathJax.typesetPromise()');
                            mathJax.typesetPromise()
                                .then(() => {
                                    console.log('MathJax rendering completed successfully');
                                })
                                .catch((err: Error) => {
                                    console.log('MathJax typesetPromise failed:', err);
                                    // Fallback to typeset
                                    if (typeof mathJax.typeset === 'function') {
                                        console.log('Falling back to MathJax.typeset()');
                                        mathJax.typeset();
                                    }
                                });
                            return; // Exit successfully
                        }

                        // Try MathJax v3 typeset
                        if (typeof mathJax.typeset === 'function') {
                            console.log('Using MathJax.typeset()');
                            mathJax.typeset();
                            return; // Exit successfully
                        }

                        // Try MathJax v2 Hub.Queue
                        if (mathJax.Hub && mathJax.Hub.Queue) {
                            console.log('Using MathJax v2 Hub.Queue');
                            mathJax.Hub.Queue(["Typeset", mathJax.Hub]);
                            return; // Exit successfully
                        }

                        console.log('MathJax found but no known rendering method available');
                    }

                    // If we get here, MathJax isn't ready or available
                    retryCount++;
                    if (retryCount < maxRetries) {
                        console.log(`MathJax not available yet, retry ${retryCount}/${maxRetries}`);
                        setTimeout(renderMath, 200);
                    } else {
                        console.log('MathJax failed to initialize after maximum retries');
                    }

                } catch (error) {
                    console.log('MathJax error:', error);
                    retryCount++;
                    if (retryCount < maxRetries) {
                        console.log(`Retrying after error, attempt ${retryCount}/${maxRetries}`);
                        setTimeout(renderMath, 200);
                    } else {
                        console.log('MathJax failed after maximum retries due to errors');
                    }
                }
            };

            // Initial delay to ensure DOM is rendered
            const timer = setTimeout(renderMath, 1000);
            return () => clearTimeout(timer);
        }
    }, [calculationFactors, snowLoadCases, showResults]);

    // Force MathJax to render on initial page load
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const forceRender = () => {
                if (window.MathJax && typeof window.MathJax.typeset === 'function') {
                    console.log('Force rendering MathJax on page load');
                    window.MathJax.typeset();
                } else if (window.MathJax && typeof window.MathJax.typesetPromise === 'function') {
                    console.log('Force rendering MathJax with typesetPromise on page load');
                    window.MathJax.typesetPromise();
                }
            };

            // Try immediately
            forceRender();

            // Try again after a delay
            const timer = setTimeout(forceRender, 2000);
            return () => clearTimeout(timer);
        }
    }, []); // Only run once on mount

    // Get unique provinces from the data
    const provinces = Array.from(new Set(snowWindLoadsData.map(item => item.province))).sort();

    // Get locations for selected province
    const locationsForProvince = selectedProvince
        ? snowWindLoadsData.filter(item => item.province === selectedProvince).sort((a, b) => a.location.localeCompare(b.location))
        : [];

    // NBC 2020 Calculation Functions
    const calculateImportanceFactors = (): { uls: number; sls: number } => {
        const importanceTable = {
            low: { uls: 0.8, sls: 0.9 },
            normal: { uls: 1.0, sls: 0.9 },
            high: { uls: 1.15, sls: 0.9 },
            "post-disaster": { uls: 1.25, sls: 0.9 }
        };
        return importanceTable[importanceFactors.category];
    };

    const calculateSpecificWeightOfSnow = (Ss: number): number => {
        // Article 4.1.6.13: γ = 4.0 kN/m³ or 0.43Ss + 2.2 kN/m³, whichever is lesser
        return Math.min(4.0, 0.43 * Ss + 2.2);
    };

    const calculateCharacteristicLength = (): number => {
        // lc = 2w - w²/l where w = smaller dimension, l = larger dimension
        const w = Math.min(roofParams.width, roofParams.length);
        const l = Math.max(roofParams.width, roofParams.length);
        return 2 * w - (w * w) / l;
    };

    const calculateBasicRoofSnowLoadFactor = (Ss: number, lc: number, Cw: number): number => {
        const gamma = calculateSpecificWeightOfSnow(Ss);

        // Check if building height < 1 + Ss/γ
        if (roofParams.height < (1 + Ss / gamma)) {
            return 1.0;
        }

        // Calculate Cb based on characteristic length
        const threshold = 70 / (Cw * Cw);

        if (lc <= threshold) {
            return 0.8;
        } else {
            return (1 / Cw) * (1 - (1 - 0.8 * Cw) * Math.exp(-(lc * Cw * Cw - 70) / 100));
        }
    };

    const calculateWindExposureFactor = (): number => {
        // Base Cw = 1.0, with reductions for specific conditions
        let Cw = 1.0;

        // Reductions for Low and Normal importance categories only
        if (importanceFactors.category === "low" || importanceFactors.category === "normal") {
            if (roofParams.terrainType === "rural") {
                Cw = 0.75;
            } else if (roofParams.terrainType === "exposed_north") {
                Cw = 0.5;
            }
        }

        return Cw;
    };

    const calculateSlopeFactor = (): number => {
        const alpha = roofParams.slope;

        if (roofParams.isSlippery) {
            // Slippery roof provisions (Sentence 6)
            if (alpha <= 15) return 1.0;
            if (alpha <= 60) return (60 - alpha) / 45;
            return 0;
        } else {
            // Regular roof provisions (Sentence 5)
            if (alpha <= 30) return 1.0;
            if (alpha <= 70) return (70 - alpha) / 40;
            return 0;
        }
    };

    const calculateAccumulationFactor = (): number => {
        // For basic snow load calculator, Ca is always 1.0
        // This represents the basic roof accumulation factor per NBC 2020
        return 1.0;
    };

    const calculateSnowLoads = () => {
        if (!selectedLocation && !customLocation.groundSnowLoad) return;

        const Ss = selectedLocation ? selectedLocation.ss : parseFloat(customLocation.groundSnowLoad);
        const Sr = selectedLocation ? selectedLocation.sr : parseFloat(customLocation.rainLoad || "0");

        // Calculate all NBC 2020 factors
        const { uls: Is_uls, sls: Is_sls } = calculateImportanceFactors();
        const Cw = calculateWindExposureFactor();
        const lc = calculateCharacteristicLength();
        const Cb = calculateBasicRoofSnowLoadFactor(Ss, lc, Cw);
        const Cs = calculateSlopeFactor();
        const Ca = calculateAccumulationFactor();
        const gamma = calculateSpecificWeightOfSnow(Ss);

        // Store calculation factors for display
        const factors: CalculationFactors = { Is_uls, Is_sls, Cb, Cw, Cs, Ca, gamma, lc, roofShapeFactor: Ca };
        setCalculationFactors(factors);


        // NBC 2020 Formula: S = Is * [Ss * (Cb * Cw * Cs * Ca) + Sr]
        const snowLoad_uls = Is_uls * (Ss * (Cb * Cw * Cs * Ca) + Sr);
        const snowLoad_sls = Is_sls * (Ss * (Cb * Cw * Cs * Ca) + Sr);

        const cases: SnowLoadCase[] = [{
            id: "nbc-balanced-uls",
            name: "NBC 2020 Snow Load - (ULS)",
            description: `S = I_s \\times [S_s \\times (C_b \\times C_w \\times C_s \\times C_a) + S_r] = ${Is_uls.toFixed(2)} \\times [${Ss} \\times (${Cb.toFixed(3)} \\times ${Cw} \\times ${Cs.toFixed(2)} \\times ${Ca}) + ${Sr}]`,
            loadValue: snowLoad_uls,
            designCase: "uls",

            distribution: "uniform"
        }, {
            id: "nbc-balanced-sls",
            name: "NBC 2020 Snow Load - (SLS)",
            description: `S = I_s \\times [S_s \\times (C_b \\times C_w \\times C_s \\times C_a) + S_r] = ${Is_sls.toFixed(2)} \\times [${Ss} \\times (${Cb.toFixed(3)} \\times ${Cw} \\times ${Cs.toFixed(2)} \\times ${Ca}) + ${Sr}]`,
            loadValue: snowLoad_sls,
            designCase: "sls",

            distribution: "uniform"
        }];


        setSnowLoadCases(cases);
        setShowResults(true);
    };





    const getMaxSnowLoad = (): number => {
        return Math.max(...snowLoadCases.map(sc => sc.loadValue));
    };

    const getSnowLoadZone = (ss: number): string => {
        if (ss <= 1.0) return "Very Low";
        if (ss <= 2.0) return "Low";
        if (ss <= 3.0) return "Moderate";
        if (ss <= 4.0) return "High";
        return "Very High";
    };

    const resetCalculator = () => {
        setStep(1);
        setSelectedProvince("");
        setSelectedLocation(null);
        setCustomLocation({ name: "", groundSnowLoad: "", rainLoad: "" });
        setRoofParams({
            length: 20,
            width: 15,
            slope: 0,
            height: 6,
            isSlippery: false,
            terrainType: "open"
        });
        setImportanceFactors({
            category: "normal"
        });
        setCalculationFactors(null);
        setSnowLoadCases([]);
        setShowResults(false);
    };

    const printResults = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const locationName = selectedLocation?.location || customLocation.name;
        const ss = selectedLocation?.ss || parseFloat(customLocation.groundSnowLoad);
        const sr = selectedLocation?.sr || parseFloat(customLocation.rainLoad || "0");

        if (!calculationFactors) return;

        const w = Math.min(roofParams.width, roofParams.length);
        const l = Math.max(roofParams.width, roofParams.length);
        const criticalHeight = (1 + ss / calculationFactors.gamma).toFixed(2);
        const threshold = (70 / (calculationFactors.Cw * calculationFactors.Cw)).toFixed(2);

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>NBC 2020 Snow Load Calculation Report</title>
                <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
                <script>
                    window.MathJax = {
                        tex: {
                            inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
                            displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']]
                        },
                        chtml: {
                            scale: 0.9,
                            displayAlign: 'left',
                            displayIndent: '0em'
                        }
                    };
                </script>
                <style>
                    body { 
                        font-family: 'Times New Roman', Times, serif; 
                        margin: 20px; 
                        line-height: 1.6;
                        color: #333;
                    }
                    .header { 
                        text-align: center; 
                        margin-bottom: 40px; 
                        border-bottom: 3px solid #b4641e;
                        padding-bottom: 20px;
                    }
                    .header h1 { 
                        color: #b4641e; 
                        margin-bottom: 10px;
                        font-size: 28px;
                    }
                    .section { 
                        margin-bottom: 30px; 
                        page-break-inside: avoid;
                    }
                    .section h3 { 
                        color: #b4641e; 
                        border-bottom: 2px solid #b4641e; 
                        padding-bottom: 8px; 
                        margin-bottom: 15px;
                        font-size: 18px;
                    }
                    .section h4 {
                        color: #333;
                        margin-bottom: 12px;
                        font-size: 16px;
                        font-weight: bold;
                    }
                    table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin-bottom: 20px; 
                        font-size: 14px;
                    }
                    th, td { 
                        border: 1px solid #ddd; 
                        padding: 10px; 
                        text-align: left; 
                    }
                    th { 
                        background-color: #f8f8f8; 
                        font-weight: bold;
                        color: #333;
                    }
                    .value { 
                        font-weight: bold; 
                        color: #b4641e; 
                    }
                    .calc-step {
                        background-color: #fafafa;
                        border: 1px solid #e0e0e0;
                        border-radius: 8px;
                        padding: 20px;
                        margin-bottom: 20px;
                        page-break-inside: avoid;
                    }
                    .calc-step h4 {
                        color: #b4641e;
                        margin-bottom: 15px;
                        border-bottom: 1px solid #e0e0e0;
                        padding-bottom: 8px;
                    }
                    .formula-box {
                        background-color: #f0f8ff;
                        border: 2px solid #b4641e;
                        border-radius: 8px;
                        padding: 15px;
                        margin: 15px 0;
                        text-align: center;
                    }
                    .final-result {
                        background-color: #fff3cd;
                        border: 3px solid #b4641e;
                        border-radius: 10px;
                        padding: 20px;
                        margin: 20px 0;
                        text-align: center;
                        font-size: 18px;
                        font-weight: bold;
                    }
                    .footer { 
                        margin-top: 50px; 
                        font-size: 12px; 
                        color: #666; 
                        border-top: 1px solid #ddd;
                        padding-top: 20px;
                    }
                    .page-break { 
                        page-break-before: always; 
                    }
                    @media print {
                        body { margin: 0.5in; }
                        .section { page-break-inside: avoid; }
                        .calc-step { page-break-inside: avoid; }
                    }
                    .mjx-chtml { 
                        font-size: 1.1em !important; 
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>NBC 2020 Snow Load Calculation Report</h1>
                    <p><strong>Professional Engineering Calculation</strong></p>
                    <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
                </div>
                
                <div class="section">
                    <h3>1. Project Information</h3>
                    <table>
                        <tr><td><strong>Location</strong></td><td class="value">${locationName}</td></tr>
                        ${selectedLocation ? `<tr><td><strong>Province</strong></td><td class="value">${selectedLocation.province}</td></tr>` : ''}
                        ${selectedLocation ? `<tr><td><strong>Elevation</strong></td><td class="value">${selectedLocation.elevation} m</td></tr>` : ''}
                        <tr><td><strong>Ground Snow Load (Ss)</strong></td><td class="value">${ss} kPa</td></tr>
                        <tr><td><strong>Rain Load (Sr)</strong></td><td class="value">${sr} kPa</td></tr>
                        <tr><td><strong>Snow Load Zone</strong></td><td class="value">${getSnowLoadZone(ss)}</td></tr>
                        <tr><td><strong>Importance Category</strong></td><td class="value">${importanceFactors.category.charAt(0).toUpperCase() + importanceFactors.category.slice(1)}</td></tr>
                    </table>
                </div>
                
                <div class="section">
                    <h3>2. Building Parameters</h3>
                    <table>
                        <tr><td><strong>Dimensions</strong></td><td class="value">${roofParams.length} × ${roofParams.width} m</td></tr>
                        <tr><td><strong>Roof Area</strong></td><td class="value">${(roofParams.length * roofParams.width).toFixed(1)} m²</td></tr>
                        <tr><td><strong>Slope</strong></td><td class="value">${roofParams.slope}°</td></tr>
                        <tr><td><strong>Height above Ground</strong></td><td class="value">${roofParams.height} m</td></tr>
                        <tr><td><strong>Surface Type</strong></td><td class="value">${roofParams.isSlippery ? 'Slippery' : 'Regular'}</td></tr>
                        <tr><td><strong>Terrain Type</strong></td><td class="value">${roofParams.terrainType.charAt(0).toUpperCase() + roofParams.terrainType.slice(1).replace('_', ' ')}</td></tr>
                    </table>
                </div>

                <div class="page-break"></div>
                
                <div class="section">
                    <h3>3. NBC 2020 Step-by-Step Calculation per Clause 4.1.6</h3>
                    
                    <div class="formula-box">
                        <h4>Main NBC 2020 Formula</h4>
                        $$S = I_s \\times [S_s \\times (C_b \\times C_w \\times C_s \\times C_a) + S_r]$$
                    </div>

                    <div class="calc-step">
                        <h4>Step 1: Basic Parameters</h4>
                        <p><strong>Ground snow load:</strong></p>
                        $$S_s = ${ss} \\text{ kPa}$$
                        
                        <p><strong>Rain load:</strong></p>
                        $$S_r = ${sr} \\text{ kPa}$$
                        
                        <p><strong>Specific weight of snow (Article 4.1.6.13):</strong></p>
                        $$\\gamma = \\min(4.0, 0.43 \\times S_s + 2.2)$$
                        $$\\gamma = \\min(4.0, 0.43 \\times ${ss} + 2.2) = ${calculationFactors.gamma.toFixed(2)} \\text{ kN/m³}$$
                    </div>

                    <div class="calc-step">
                        <h4>Step 2: Importance Factor (Is)</h4>
                        <p><strong>Building category:</strong> ${importanceFactors.category.charAt(0).toUpperCase() + importanceFactors.category.slice(1)} importance</p>
                        <p><strong>From NBC 2020 Table 4.1.6.2-A:</strong></p>
                        $$I_s \\text{ (ULS)} = ${calculationFactors.Is_uls.toFixed(2)}$$
                        $$I_s \\text{ (SLS)} = ${calculationFactors.Is_sls.toFixed(2)}$$
                    </div>

                    <div class="calc-step">
                        <h4>Step 3: Characteristic Length (lc)</h4>
                        <p><strong>Formula:</strong></p>
                        $$l_c = 2w - \\frac{w^2}{l}$$
                        <p>Where: w = ${w} m (smaller dimension), l = ${l} m (larger dimension)</p>
                        $$l_c = 2 \\times ${w} - \\frac{${w}^2}{${l}} = ${calculationFactors.lc.toFixed(2)} \\text{ m}$$
                    </div>

                    <div class="calc-step">
                        <h4>Step 4: Wind Exposure Factor (Cw)</h4>
                        <p><strong>Base factor:</strong> Cw = 1.0</p>
                        <p><strong>Terrain type:</strong> ${roofParams.terrainType.charAt(0).toUpperCase() + roofParams.terrainType.slice(1).replace('_', ' ')}</p>
                        <p><strong>Importance category:</strong> ${importanceFactors.category.charAt(0).toUpperCase() + importanceFactors.category.slice(1)}</p>
                        ${roofParams.terrainType === 'rural' && (importanceFactors.category === 'low' || importanceFactors.category === 'normal') ?
                '<p><strong>Reduction applied:</strong> Cw = 0.75 (rural terrain for Low/Normal importance)</p>' :
                roofParams.terrainType === 'exposed_north' && (importanceFactors.category === 'low' || importanceFactors.category === 'normal') ?
                    '<p><strong>Reduction applied:</strong> Cw = 0.5 (exposed north for Low/Normal importance)</p>' :
                    '<p><strong>No reduction applied</strong></p>'
            }
                        $$C_w = ${calculationFactors.Cw.toFixed(2)}$$
                    </div>

                    <div class="calc-step">
                        <h4>Step 5: Basic Roof Snow Load Factor (Cb)</h4>
                        <p><strong>Building height:</strong> h = ${roofParams.height} m</p>
                        <p><strong>Critical height:</strong> 1 + Ss/γ = 1 + ${ss}/${calculationFactors.gamma.toFixed(2)} = ${criticalHeight} m</p>
                        
                        ${roofParams.height < parseFloat(criticalHeight) ? `
                            <p><strong>Since h < 1 + Ss/γ:</strong></p>
                            $$C_b = 1.0$$
                        ` : `
                            <p><strong>Since h ≥ 1 + Ss/γ, calculate based on characteristic length:</strong></p>
                            <p><strong>Threshold:</strong></p>
                            $$\\frac{70}{C_w^2} = \\frac{70}{${calculationFactors.Cw}^2} = ${threshold} \\text{ m}$$
                            
                            ${calculationFactors.lc <= parseFloat(threshold) ? `
                                <p><strong>Since lc ≤ 70/Cw²:</strong></p>
                                $$C_b = 0.8$$
                            ` : `
                                <p><strong>Since lc > 70/Cw², use exponential formula:</strong></p>
                                $$C_b = \\frac{1}{C_w} \\times \\left[1 - (1 - 0.8 \\times C_w) \\times e^{-\\frac{l_c \\times C_w^2 - 70}{100}}\\right]$$
                                $$C_b = ${calculationFactors.Cb.toFixed(3)}$$
                            `}
                        `}
                    </div>

                    <div class="calc-step">
                        <h4>Step 6: Slope Factor (Cs)</h4>
                        <p><strong>Roof slope:</strong> α = ${roofParams.slope}°</p>
                        <p><strong>Surface type:</strong> ${roofParams.isSlippery ? 'Slippery' : 'Regular'} roof</p>
                        
                        ${roofParams.isSlippery ? `
                            <p><strong>Slippery roof provisions (NBC 2020 Sentence 6):</strong></p>
                            ${roofParams.slope <= 15 ? `
                                <p>Since α ≤ 15°:</p>
                                $$C_s = 1.0$$
                            ` : roofParams.slope <= 60 ? `
                                $$C_s = \\frac{60° - \\alpha}{45°} = \\frac{60° - ${roofParams.slope}°}{45°} = ${calculationFactors.Cs.toFixed(2)}$$
                            ` : `
                                <p>Since α > 60°:</p>
                                $$C_s = 0$$
                            `}
                        ` : `
                            <p><strong>Regular roof provisions (NBC 2020 Sentence 5):</strong></p>
                            ${roofParams.slope <= 30 ? `
                                <p>Since α ≤ 30°:</p>
                                $$C_s = 1.0$$
                            ` : roofParams.slope <= 70 ? `
                                $$C_s = \\frac{70° - \\alpha}{40°} = \\frac{70° - ${roofParams.slope}°}{40°} = ${calculationFactors.Cs.toFixed(2)}$$
                            ` : `
                                <p>Since α > 70°:</p>
                                $$C_s = 0$$
                            `}
                        `}
                    </div>

                    <div class="calc-step">
                        <h4>Step 7: Accumulation Factor (Ca)</h4>
                        <p><strong>For basic snow load calculator:</strong> The accumulation factor is set to 1.0</p>
                        <p><strong>This represents the basic roof accumulation factor per NBC 2020:</strong></p>
                        $$C_a = ${calculationFactors.Ca.toFixed(2)}$$
                    </div>

                    <div class="calc-step">
                        <h4>Step 8: Final Snow Load Calculation</h4>
                        <p><strong>Substituting all values into the main formula:</strong></p>
                        $$S = I_s \\times [S_s \\times (C_b \\times C_w \\times C_s \\times C_a) + S_r]$$
                        
                        <p><strong>Step-by-step substitution:</strong></p>
                        $$S = ${calculationFactors.Is_uls.toFixed(2)} \\times [${ss} \\times (${calculationFactors.Cb.toFixed(3)} \\times ${calculationFactors.Cw.toFixed(2)} \\times ${calculationFactors.Cs.toFixed(2)} \\times ${calculationFactors.Ca.toFixed(2)}) + ${sr}]$$
                        
                        $$S = ${calculationFactors.Is_sls.toFixed(2)} \\times [${ss} \\times (${calculationFactors.Cb.toFixed(3)} \\times ${calculationFactors.Cw.toFixed(2)} \\times ${calculationFactors.Cs.toFixed(2)} \\times ${calculationFactors.Ca.toFixed(2)}) + ${sr}]$$
                        
                        $$S = ${calculationFactors.Is_uls.toFixed(2)} \\times [${ss} \\times ${(calculationFactors.Cb * calculationFactors.Cw * calculationFactors.Cs * calculationFactors.Ca).toFixed(4)} + ${sr}]$$
                        
                        $$S = ${calculationFactors.Is_sls.toFixed(2)} \\times [${ss} \\times ${(calculationFactors.Cb * calculationFactors.Cw * calculationFactors.Cs * calculationFactors.Ca).toFixed(4)} + ${sr}]$$
                        
                        $$S = ${calculationFactors.Is_uls.toFixed(2)} \\times [${(ss * calculationFactors.Cb * calculationFactors.Cw * calculationFactors.Cs * calculationFactors.Ca).toFixed(2)} + ${sr}]$$
                        
                        $$S = ${calculationFactors.Is_sls.toFixed(2)} \\times [${(ss * calculationFactors.Cb * calculationFactors.Cw * calculationFactors.Cs * calculationFactors.Ca).toFixed(2)} + ${sr}]$$
                        
                        $$S = ${calculationFactors.Is_uls.toFixed(2)} \\times ${(ss * calculationFactors.Cb * calculationFactors.Cw * calculationFactors.Cs * calculationFactors.Ca + sr).toFixed(2)}$$
                        
                        $$S = ${calculationFactors.Is_sls.toFixed(2)} \\times ${(ss * calculationFactors.Cb * calculationFactors.Cw * calculationFactors.Cs * calculationFactors.Ca + sr).toFixed(2)}$$
                    </div>

                    <div class="final-result">
                        <h4>Final Snow Load Results</h4>
                        <div style="display: flex; justify-content: space-around; margin-top: 20px;">
                            <div>
                                <h5 style="color: #b4641e; margin-bottom: 10px;">Ultimate Limit State (ULS):</h5>
                                $$\\boxed{S_{ULS} = ${snowLoadCases.find(sc => sc.designCase === "uls")?.loadValue.toFixed(2)} \\text{ kPa}}$$
                            </div>
                            <div>
                                <h5 style="color: #4a90e2; margin-bottom: 10px;">Serviceability Limit State (SLS):</h5>
                                $$\\boxed{S_{SLS} = ${snowLoadCases.find(sc => sc.designCase === "sls")?.loadValue.toFixed(2)} \\text{ kPa}}$$
                            </div>
                        </div>
                    </div>
                </div>

                <div class="page-break"></div>
                
                <div class="section">
                    <h3>4. Load Cases Summary</h3>
                    <table>
                        <tr><th>Load Case</th><th>Description</th><th>Load Value (kPa)</th><th>Distribution</th></tr>
                        ${snowLoadCases.map(sc => `
                            <tr>
                                <td><strong>${sc.name}</strong></td>
                                <td>${sc.description}</td>
                                <td class="value">${sc.loadValue.toFixed(2)}</td>
                                <td>${sc.distribution.charAt(0).toUpperCase() + sc.distribution.slice(1)}</td>
                            </tr>
                        `).join('')}
                    </table>
                </div>
                
                <div class="section">
                    <h3>5. Design Summary</h3>
                    <table>
                        <tr><td><strong>Maximum Snow Load</strong></td><td class="value">${getMaxSnowLoad().toFixed(2)} kPa</td></tr>
                        <tr><td><strong>Total Roof Area</strong></td><td class="value">${(roofParams.length * roofParams.width).toFixed(1)} m²</td></tr>
                        <tr><td><strong>Maximum Total Load</strong></td><td class="value">${(getMaxSnowLoad() * roofParams.length * roofParams.width).toFixed(1)} kN</td></tr>
                        <tr><td><strong>Load per Unit Length</strong></td><td class="value">${(getMaxSnowLoad() * roofParams.width).toFixed(2)} kN/m</td></tr>
                    </table>
                </div>

                <div class="section">
                    <h3>6. Calculation Factors Summary</h3>
                    <table>
                        <tr><td><strong>Importance Factor (Is-ULS)</strong></td><td class="value">${calculationFactors.Is_uls.toFixed(2)}</td></tr>
                        <tr><td><strong>Importance Factor (Is-SLS)</strong></td><td class="value">${calculationFactors.Is_sls.toFixed(2)}</td></tr>
                        <tr><td><strong>Basic Roof Factor (Cb)</strong></td><td class="value">${calculationFactors.Cb.toFixed(3)}</td></tr>
                        <tr><td><strong>Wind Exposure Factor (Cw)</strong></td><td class="value">${calculationFactors.Cw.toFixed(2)}</td></tr>
                        <tr><td><strong>Slope Factor (Cs)</strong></td><td class="value">${calculationFactors.Cs.toFixed(2)}</td></tr>
                        <tr><td><strong>Accumulation Factor (Ca)</strong></td><td class="value">${calculationFactors.Ca.toFixed(2)}</td></tr>
                        <tr><td><strong>Specific Weight of Snow (γ)</strong></td><td class="value">${calculationFactors.gamma.toFixed(2)} kN/m³</td></tr>
                        <tr><td><strong>Characteristic Length (lc)</strong></td><td class="value">${calculationFactors.lc.toFixed(2)} m</td></tr>
                    </table>
                </div>
                
                <div class="footer">
                    <p><strong>Note:</strong> This calculation is based on NBC 2020 provisions (Clause 4.1.6) and is intended for preliminary design purposes only. 
                    Professional engineering judgment should be applied for final design decisions. All calculations should be reviewed by a qualified Professional Engineer.</p>
                    <p><strong>References:</strong></p>
                    <ul>
                        <li>National Building Code of Canada 2020, Section 4.1.6 - Snow Loads</li>
                        <li>NBC 2020 Table 4.1.6.2-A - Importance Factors for Snow Loads</li>
                    </ul>
                    <p><strong>Generated by:</strong> NBC 2020 Structural Loads Calculator | ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
                </div>
            </body>
            </html>
        `);

        printWindow.document.close();

        // Wait for MathJax to load and render, then print
        setTimeout(() => {
            try {
                // MathJax is dynamically loaded in the print window
                const printWindowMathJax = (printWindow as Window).MathJax;
                if (printWindowMathJax && typeof printWindowMathJax.typesetPromise === 'function') {
                    printWindowMathJax.typesetPromise().then(() => {
                        setTimeout(() => printWindow.print(), 1000);
                    }).catch(() => {
                        setTimeout(() => printWindow.print(), 2000);
                    });
                } else {
                    setTimeout(() => printWindow.print(), 2000);
                }
            } catch (error) {
                // Fallback if MathJax fails
                setTimeout(() => printWindow.print(), 2000);
            }
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-gray-900 dark:bg-gray-900 light:bg-gray-50 text-white dark:text-white light:text-gray-900">
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white dark:text-white light:text-gray-900 mb-2">Snow Load Calculator</h1>
                    <p className="text-gray-400 dark:text-gray-400 light:text-gray-600">Calculate snow loads per NBC 2020 Section 4.1.6</p>
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

                {/* Basic Snow Load Calculator */}
                {(
                    <>
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
                                                        <span className="text-gray-400">Ground Snow Load (Ss):</span>
                                                        <span className="text-orange-500 font-bold">{selectedLocation.ss} kPa</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-400">Rain Load (Sr):</span>
                                                        <span className="text-orange-500 font-bold">{selectedLocation.sr} kPa</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-400">Snow Load Zone:</span>
                                                        <span className="text-white font-medium">{getSnowLoadZone(selectedLocation.ss)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Custom Location Option */}
                                <div className="mt-8 border-t border-gray-700 pt-8">
                                    <h3 className="text-lg font-semibold text-white mb-4">Or Enter Custom Values</h3>
                                    <div className="grid md:grid-cols-3 gap-4">
                                        <div>
                                            <label htmlFor="custom-location-name" className="block text-sm font-medium text-gray-300 mb-2">
                                                Location Name
                                            </label>
                                            <input
                                                id="custom-location-name"
                                                type="text"
                                                value={customLocation.name}
                                                onChange={(e) => setCustomLocation({ ...customLocation, name: e.target.value })}
                                                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                                                placeholder="Custom location"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="custom-ground-snow" className="block text-sm font-medium text-gray-300 mb-2">
                                                Ground Snow Load (Ss) - kPa
                                            </label>
                                            <input
                                                id="custom-ground-snow"
                                                type="number"
                                                step="0.1"
                                                value={customLocation.groundSnowLoad}
                                                onChange={(e) => setCustomLocation({ ...customLocation, groundSnowLoad: e.target.value })}
                                                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                                                placeholder="0.0"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="custom-rain-load" className="block text-sm font-medium text-gray-300 mb-2">
                                                Rain Load (Sr) - kPa
                                            </label>
                                            <input
                                                id="custom-rain-load"
                                                type="number"
                                                step="0.1"
                                                value={customLocation.rainLoad}
                                                onChange={(e) => setCustomLocation({ ...customLocation, rainLoad: e.target.value })}
                                                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                                                placeholder="0.0"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end mt-8">
                                    <button
                                        onClick={() => setStep(2)}
                                        disabled={!selectedLocation && !customLocation.groundSnowLoad}
                                        className="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Next: Set Parameters
                                    </button>
                                </div>
                            </div>
                        )}



                        {/* Step 2: Parameters */}
                        {step === 2 && (
                            <div className="engineering-card">
                                <h2 className="text-2xl font-bold text-white dark:text-white light:text-gray-900 mb-6">Roof Parameters</h2>

                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div>
                                            <label htmlFor="roof-length" className="block text-sm font-medium text-gray-300 mb-2">
                                                Length (m)
                                            </label>
                                            <input
                                                id="roof-length"
                                                type="number"
                                                value={roofParams.length}
                                                onChange={(e) => setRoofParams({ ...roofParams, length: parseFloat(e.target.value) || 0 })}
                                                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="roof-width" className="block text-sm font-medium text-gray-300 mb-2">
                                                Width (m)
                                            </label>
                                            <input
                                                id="roof-width"
                                                type="number"
                                                value={roofParams.width}
                                                onChange={(e) => setRoofParams({ ...roofParams, width: parseFloat(e.target.value) || 0 })}
                                                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="roof-slope" className="block text-sm font-medium text-gray-300 mb-2">
                                                Slope (degrees)
                                            </label>
                                            <input
                                                id="roof-slope"
                                                type="number"
                                                value={roofParams.slope}
                                                onChange={(e) => setRoofParams({ ...roofParams, slope: parseFloat(e.target.value) || 0 })}
                                                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="roof-height" className="block text-sm font-medium text-gray-300 mb-2">
                                                Height above ground (m)
                                            </label>
                                            <input
                                                id="roof-height"
                                                type="number"
                                                value={roofParams.height}
                                                onChange={(e) => setRoofParams({ ...roofParams, height: parseFloat(e.target.value) || 0 })}
                                                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <label htmlFor="importance-category" className="block text-sm font-medium text-gray-300 mb-2">
                                                Importance Category
                                            </label>
                                            <select
                                                id="importance-category"
                                                value={importanceFactors.category}
                                                onChange={(e) => setImportanceFactors({ ...importanceFactors, category: e.target.value as ImportanceFactors["category"] })}
                                                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            >
                                                <option value="low">Low</option>
                                                <option value="normal">Normal</option>
                                                <option value="high">High</option>
                                                <option value="post-disaster">Post-disaster</option>
                                            </select>
                                            <p className="text-sm text-gray-400 mt-1">
                                                Per NBC 2020 Table 4.1.6.2-A. Both ULS and SLS loads will be calculated automatically.
                                            </p>
                                        </div>

                                        <div>
                                            <label htmlFor="terrain-type" className="block text-sm font-medium text-gray-300 mb-2">
                                                Terrain Type
                                            </label>
                                            <select
                                                id="terrain-type"
                                                value={roofParams.terrainType}
                                                onChange={(e) => setRoofParams({ ...roofParams, terrainType: e.target.value as RoofParameters["terrainType"] })}
                                                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            >
                                                <option value="open">Open Terrain</option>
                                                <option value="rural">Rural</option>
                                                <option value="exposed_north">Exposed North</option>
                                            </select>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id="slippery"
                                                    checked={roofParams.isSlippery}
                                                    onChange={(e) => setRoofParams({ ...roofParams, isSlippery: e.target.checked })}
                                                    className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
                                                />
                                                <label htmlFor="slippery" className="ml-2 text-sm text-gray-300">
                                                    Slippery roof surface (metal, plastic, etc.)
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between mt-8">
                                    <button
                                        onClick={() => setStep(1)}
                                        className="px-6 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={() => {
                                            calculateSnowLoads();
                                            setStep(3);
                                        }}
                                        className="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
                                    >
                                        Calculate Snow Loads
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Results */}
                        {step === 3 && showResults && (
                            <div className="engineering-card">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold text-white dark:text-white light:text-gray-900">Calculation Results</h2>
                                    <div className="space-x-2">
                                        <button
                                            onClick={printResults}
                                            className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
                                        >
                                            Print Report
                                        </button>
                                        <button
                                            onClick={resetCalculator}
                                            className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
                                        >
                                            New Calculation
                                        </button>
                                    </div>
                                </div>



                                {/* Summary Cards */}
                                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                    <div className="bg-gray-800 rounded-lg p-6 text-center">
                                        <div className="text-2xl font-bold text-orange-500 mb-2">
                                            {Math.max(...snowLoadCases.filter(lc => lc.designCase === "uls").map(lc => lc.loadValue)).toFixed(2)}
                                        </div>
                                        <div className="text-gray-400">Max ULS Load (kPa)</div>
                                    </div>
                                    <div className="bg-gray-800 rounded-lg p-6 text-center">
                                        <div className="text-2xl font-bold text-blue-400 mb-2">
                                            {Math.max(...snowLoadCases.filter(lc => lc.designCase === "sls").map(lc => lc.loadValue)).toFixed(2)}
                                        </div>
                                        <div className="text-gray-400">Max SLS Load (kPa)</div>
                                    </div>
                                    <div className="bg-gray-800 rounded-lg p-6 text-center">
                                        <div className="text-2xl font-bold text-white mb-2">
                                            {(roofParams.length * roofParams.width).toFixed(1)}
                                        </div>
                                        <div className="text-gray-400">Total Roof Area (m²)</div>
                                    </div>
                                    <div className="bg-gray-800 rounded-lg p-6 text-center">
                                        <div className="text-2xl font-bold text-white mb-2">
                                            {(getMaxSnowLoad() * roofParams.length * roofParams.width).toFixed(1)}
                                        </div>
                                        <div className="text-gray-400">Max Total Load (kN)</div>
                                    </div>
                                </div>

                                {/* Step-by-Step Mathematical Derivation */}
                                {calculationFactors && (
                                    <div className="mb-8">
                                        <h3 className="text-lg font-semibold text-white mb-4">NBC 2020 Step-by-Step Calculation</h3>

                                        {/* Main Formula */}
                                        <div className="bg-gray-800 rounded-lg p-6 mb-6">
                                            <h4 className="text-white font-semibold mb-4">Main NBC 2020 Formula</h4>
                                            <div className="bg-gray-900 p-4 rounded border-l-4 border-orange-500">
                                                <div
                                                    className="text-white"
                                                    dangerouslySetInnerHTML={{
                                                        __html: `$$S = I_s \\times [S_s \\times (C_b \\times C_w \\times C_s \\times C_a) + S_r]$$`
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Step-by-Step Derivation */}
                                        <div className="space-y-6">
                                            {/* Step 1: Basic Parameters */}
                                            <div className="bg-gray-800 rounded-lg p-6">
                                                <h4 className="text-white font-semibold mb-4">Step 1: Basic Parameters</h4>
                                                <div className="space-y-3">
                                                    <div
                                                        className="text-gray-300"
                                                        dangerouslySetInnerHTML={{
                                                            __html: `$$S_s = ${selectedLocation?.ss || parseFloat(customLocation.groundSnowLoad)} \\text{ kPa (Ground snow load)}$$`
                                                        }}
                                                    />
                                                    <div
                                                        className="text-gray-300"
                                                        dangerouslySetInnerHTML={{
                                                            __html: `$$S_r = ${selectedLocation?.sr || parseFloat(customLocation.rainLoad || "0")} \\text{ kPa (Rain load)}$$`
                                                        }}
                                                    />
                                                    <div
                                                        className="text-gray-300"
                                                        dangerouslySetInnerHTML={{
                                                            __html: `$$\\gamma = \\min(4.0, 0.43 \\times ${selectedLocation?.ss || parseFloat(customLocation.groundSnowLoad)} + 2.2) = ${calculationFactors.gamma.toFixed(2)} \\text{ kN/m³}$$`
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Step 2: Importance Factor */}
                                            <div className="bg-gray-800 rounded-lg p-6">
                                                <h4 className="text-white font-semibold mb-4">Step 2: Importance Factor (Is)</h4>
                                                <div className="space-y-3">
                                                    <div className="text-gray-300">
                                                        From NBC 2020 Table 4.1.6.2-A: <strong>{importanceFactors.category.charAt(0).toUpperCase() + importanceFactors.category.slice(1)}</strong> importance category
                                                    </div>
                                                    <div
                                                        className="text-gray-300"
                                                        dangerouslySetInnerHTML={{
                                                            __html: `$$I_s \\text{ (ULS)} = ${calculationFactors.Is_uls.toFixed(2)}$$`
                                                        }}
                                                    />
                                                    <div
                                                        className="text-gray-300"
                                                        dangerouslySetInnerHTML={{
                                                            __html: `$$I_s \\text{ (SLS)} = ${calculationFactors.Is_sls.toFixed(2)}$$`
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Step 3: Characteristic Length */}
                                            <div className="bg-gray-800 rounded-lg p-6">
                                                <h4 className="text-white font-semibold mb-4">Step 3: Characteristic Length (lc)</h4>
                                                <div className="space-y-3">
                                                    <div
                                                        className="text-gray-300"
                                                        dangerouslySetInnerHTML={{
                                                            __html: `$$l_c = 2w - \\frac{w^2}{l}$$`
                                                        }}
                                                    />
                                                    <div className="text-gray-300">
                                                        Where w = {Math.min(roofParams.width, roofParams.length)} m (smaller dimension), l = {Math.max(roofParams.width, roofParams.length)} m (larger dimension)
                                                    </div>
                                                    <div
                                                        className="text-gray-300"
                                                        dangerouslySetInnerHTML={{
                                                            __html: `$$l_c = 2 \\times ${Math.min(roofParams.width, roofParams.length)} - \\frac{${Math.min(roofParams.width, roofParams.length)}^2}{${Math.max(roofParams.width, roofParams.length)}} = ${calculationFactors.lc.toFixed(2)} \\text{ m}$$`
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Step 4: Wind Exposure Factor */}
                                            <div className="bg-gray-800 rounded-lg p-6">
                                                <h4 className="text-white font-semibold mb-4">Step 4: Wind Exposure Factor (Cw)</h4>
                                                <div className="space-y-3">
                                                    <div className="text-gray-300">
                                                        Base: Cw = 1.0, with reductions for specific terrain types in Low/Normal importance categories
                                                    </div>
                                                    <div className="text-gray-300">
                                                        Terrain: <strong>{roofParams.terrainType}</strong>, Importance: <strong>{importanceFactors.category}</strong>
                                                    </div>
                                                    <div
                                                        className="text-gray-300"
                                                        dangerouslySetInnerHTML={{
                                                            __html: `$$C_w = ${calculationFactors.Cw.toFixed(2)}$$`
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Step 5: Basic Roof Factor */}
                                            <div className="bg-gray-800 rounded-lg p-6">
                                                <h4 className="text-white font-semibold mb-4">Step 5: Basic Roof Snow Load Factor (Cb)</h4>
                                                <div className="space-y-3">
                                                    <div className="text-gray-300">
                                                        Building height: {roofParams.height} m, Critical height: {((1 + (selectedLocation?.ss || parseFloat(customLocation.groundSnowLoad))) / calculationFactors.gamma).toFixed(2)} m
                                                    </div>
                                                    {roofParams.height < (1 + (selectedLocation?.ss || parseFloat(customLocation.groundSnowLoad)) / calculationFactors.gamma) ? (
                                                        <div
                                                            className="text-gray-300"
                                                            dangerouslySetInnerHTML={{
                                                                __html: `$$\\text{Since } h < 1 + \\frac{S_s}{\\gamma}, \\text{ therefore } C_b = 1.0$$`
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="space-y-2">
                                                            <div
                                                                className="text-gray-300"
                                                                dangerouslySetInnerHTML={{
                                                                    __html: `$$\\text{Threshold: } \\frac{70}{C_w^2} = \\frac{70}{${calculationFactors.Cw}^2} = ${(70 / (calculationFactors.Cw * calculationFactors.Cw)).toFixed(2)} \\text{ m}$$`
                                                                }}
                                                            />
                                                            {calculationFactors.lc <= (70 / (calculationFactors.Cw * calculationFactors.Cw)) ? (
                                                                <div
                                                                    className="text-gray-300"
                                                                    dangerouslySetInnerHTML={{
                                                                        __html: `$$\\text{Since } l_c \\leq \\frac{70}{C_w^2}, \\text{ therefore } C_b = 0.8$$`
                                                                    }}
                                                                />
                                                            ) : (
                                                                <div
                                                                    className="text-gray-300"
                                                                    dangerouslySetInnerHTML={{
                                                                        __html: `$$C_b = \\frac{1}{C_w} \\times \\left[1 - (1 - 0.8 \\times C_w) \\times e^{-\\frac{l_c \\times C_w^2 - 70}{100}}\\right] = ${calculationFactors.Cb.toFixed(3)}$$`
                                                                    }}
                                                                />
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Step 6: Slope Factor */}
                                            <div className="bg-gray-800 rounded-lg p-6">
                                                <h4 className="text-white font-semibold mb-4">Step 6: Slope Factor (Cs)</h4>
                                                <div className="space-y-3">
                                                    <div className="text-gray-300">
                                                        Roof slope: {roofParams.slope}°, Surface: {roofParams.isSlippery ? 'Slippery' : 'Regular'}
                                                    </div>
                                                    {roofParams.isSlippery ? (
                                                        <div className="space-y-2">
                                                            <div className="text-gray-300">Slippery roof provisions (NBC 2020 Sentence 6):</div>
                                                            {roofParams.slope <= 15 ? (
                                                                <div
                                                                    className="text-gray-300"
                                                                    dangerouslySetInnerHTML={{
                                                                        __html: `$$\\text{Since } \\alpha \\leq 15°, \\text{ therefore } C_s = 1.0$$`
                                                                    }}
                                                                />
                                                            ) : roofParams.slope <= 60 ? (
                                                                <div
                                                                    className="text-gray-300"
                                                                    dangerouslySetInnerHTML={{
                                                                        __html: `$$C_s = \\frac{60° - ${roofParams.slope}°}{45°} = ${calculationFactors.Cs.toFixed(2)}$$`
                                                                    }}
                                                                />
                                                            ) : (
                                                                <div
                                                                    className="text-gray-300"
                                                                    dangerouslySetInnerHTML={{
                                                                        __html: `$$\\text{Since } \\alpha > 60°, \\text{ therefore } C_s = 0$$`
                                                                    }}
                                                                />
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            <div className="text-gray-300">Regular roof provisions (NBC 2020 Sentence 5):</div>
                                                            {roofParams.slope <= 30 ? (
                                                                <div
                                                                    className="text-gray-300"
                                                                    dangerouslySetInnerHTML={{
                                                                        __html: `$$\\text{Since } \\alpha \\leq 30°, \\text{ therefore } C_s = 1.0$$`
                                                                    }}
                                                                />
                                                            ) : roofParams.slope <= 70 ? (
                                                                <div
                                                                    className="text-gray-300"
                                                                    dangerouslySetInnerHTML={{
                                                                        __html: `$$C_s = \\frac{70° - ${roofParams.slope}°}{40°} = ${calculationFactors.Cs.toFixed(2)}$$`
                                                                    }}
                                                                />
                                                            ) : (
                                                                <div
                                                                    className="text-gray-300"
                                                                    dangerouslySetInnerHTML={{
                                                                        __html: `$$\\text{Since } \\alpha > 70°, \\text{ therefore } C_s = 0$$`
                                                                    }}
                                                                />
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Step 7: Accumulation Factor */}
                                            <div className="bg-gray-800 rounded-lg p-6">
                                                <h4 className="text-white font-semibold mb-4">Step 7: Accumulation Factor (Ca)</h4>
                                                <div className="space-y-3">
                                                    <div className="text-gray-300">
                                                        For basic snow load calculator, the accumulation factor is set to 1.0
                                                    </div>
                                                    <div className="text-gray-300">
                                                        This represents the basic roof accumulation factor per NBC 2020
                                                    </div>
                                                    <div
                                                        className="text-gray-300"
                                                        dangerouslySetInnerHTML={{
                                                            __html: `$$C_a = ${calculationFactors.Ca.toFixed(2)}$$`
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Step 8: Final Calculation */}
                                            <div className="bg-gray-800 rounded-lg p-6">
                                                <h4 className="text-white font-semibold mb-4">Step 8: Final Snow Load Calculation</h4>
                                                <div className="space-y-3">
                                                    <div
                                                        className="text-gray-300"
                                                        dangerouslySetInnerHTML={{
                                                            __html: `$$S = I_s \\times [S_s \\times (C_b \\times C_w \\times C_s \\times C_a) + S_r]$$`
                                                        }}
                                                    />

                                                    <div className="text-gray-300 font-semibold">For ULS (Ultimate Limit State):</div>
                                                    <div
                                                        className="text-gray-300"
                                                        dangerouslySetInnerHTML={{
                                                            __html: `$$S_{ULS} = ${calculationFactors.Is_uls.toFixed(2)} \\times [${selectedLocation?.ss || parseFloat(customLocation.groundSnowLoad)} \\times (${calculationFactors.Cb.toFixed(3)} \\times ${calculationFactors.Cw.toFixed(2)} \\times ${calculationFactors.Cs.toFixed(2)} \\times ${calculationFactors.Ca.toFixed(2)}) + ${selectedLocation?.sr || parseFloat(customLocation.rainLoad || "0")}]$$`
                                                        }}
                                                    />
                                                    <div
                                                        className="text-orange-500 font-semibold"
                                                        dangerouslySetInnerHTML={{
                                                            __html: `$$\\boxed{S_{ULS} = ${snowLoadCases.find(sc => sc.designCase === "uls")?.loadValue.toFixed(2)} \\text{ kPa}}$$`
                                                        }}
                                                    />

                                                    <div className="text-gray-300 font-semibold mt-4">For SLS (Serviceability Limit State):</div>
                                                    <div
                                                        className="text-gray-300"
                                                        dangerouslySetInnerHTML={{
                                                            __html: `$$S_{SLS} = ${calculationFactors.Is_sls.toFixed(2)} \\times [${selectedLocation?.ss || parseFloat(customLocation.groundSnowLoad)} \\times (${calculationFactors.Cb.toFixed(3)} \\times ${calculationFactors.Cw.toFixed(2)} \\times ${calculationFactors.Cs.toFixed(2)} \\times ${calculationFactors.Ca.toFixed(2)}) + ${selectedLocation?.sr || parseFloat(customLocation.rainLoad || "0")}]$$`
                                                        }}
                                                    />
                                                    <div
                                                        className="text-blue-400 font-semibold"
                                                        dangerouslySetInnerHTML={{
                                                            __html: `$$\\boxed{S_{SLS} = ${snowLoadCases.find(sc => sc.designCase === "sls")?.loadValue.toFixed(2)} \\text{ kPa}}$$`
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Load Cases */}
                                <div className="space-y-6">
                                    <h3 className="text-lg font-semibold text-white">Snow Load Cases</h3>

                                    {/* ULS Cases */}
                                    <div className="bg-gray-800 rounded-lg p-6">
                                        <h4 className="text-lg font-semibold text-orange-500 mb-4">Ultimate Limit State (ULS)</h4>
                                        <div className="space-y-4">
                                            {snowLoadCases.filter(lc => lc.designCase === "uls").map((loadCase) => (
                                                <div key={loadCase.id} className="bg-gray-700 rounded-lg p-4">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h5 className="font-medium text-white">{loadCase.name}</h5>
                                                            <div
                                                                className="text-gray-400 text-sm"
                                                                dangerouslySetInnerHTML={{
                                                                    __html: `$$${loadCase.description}$$`
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-xl font-bold text-orange-500">
                                                                {loadCase.loadValue.toFixed(2)} kPa
                                                            </div>
                                                            <div className="text-sm text-gray-400 capitalize">
                                                                {loadCase.distribution} distribution
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* SLS Cases */}
                                    <div className="bg-gray-800 rounded-lg p-6">
                                        <h4 className="text-lg font-semibold text-blue-400 mb-4">Serviceability Limit State (SLS)</h4>
                                        <div className="space-y-4">
                                            {snowLoadCases.filter(lc => lc.designCase === "sls").map((loadCase) => (
                                                <div key={loadCase.id} className="bg-gray-700 rounded-lg p-4">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h5 className="font-medium text-white">{loadCase.name}</h5>
                                                            <div
                                                                className="text-gray-400 text-sm"
                                                                dangerouslySetInnerHTML={{
                                                                    __html: `$$${loadCase.description}$$`
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-xl font-bold text-blue-400">
                                                                {loadCase.loadValue.toFixed(2)} kPa
                                                            </div>
                                                            <div className="text-sm text-gray-400 capitalize">
                                                                {loadCase.distribution} distribution
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
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
                    </>
                )}


            </div>
        </div>
    );
} 