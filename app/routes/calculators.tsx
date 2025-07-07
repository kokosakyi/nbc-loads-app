import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import {
    ScaleIcon,
    UserGroupIcon,
    CloudIcon,
    CloudArrowUpIcon,
    GlobeAmericasIcon
} from "@heroicons/react/24/outline";

export const meta: MetaFunction = () => {
    return [
        { title: "Load Calculators - NBC 2020 Structural Loads" },
        { name: "description", content: "Professional structural load calculators for gravity and lateral loads based on NBC 2020." },
    ];
};

const calculators = [
    {
        category: "Gravity Loads",
        color: "green",
        items: [
            {
                title: "Dead Load Calculator",
                description: "Calculate dead loads using comprehensive material database with automatic load accumulation through building height",
                href: "/dead-load-calculator",
                icon: ScaleIcon,
                features: ["Material database", "Tributary areas", "Load accumulation", "Special dead loads"],
                difficulty: "Beginner"
            },
            {
                title: "Live Load Calculator",
                description: "Determine live loads based on occupancy with automatic reduction calculations per NBC 4.1.5",
                href: "/live-load-calculator",
                icon: UserGroupIcon,
                features: ["Occupancy categories", "Load reductions", "Special live loads", "Assembly areas"],
                difficulty: "Intermediate"
            },
            {
                title: "Snow Load Calculator",
                description: "Calculate snow loads with location-based ground snow loads, exposure factors, and slope considerations",
                href: "/snow-load-calculator",
                icon: CloudIcon,
                features: ["Ground snow loads", "Exposure factors", "Slope factors", "Rain-on-snow"],
                difficulty: "Advanced"
            }
        ]
    },
    {
        category: "Lateral Loads",
        color: "orange",
        items: [
            {
                title: "Wind Load Calculator",
                description: "Determine wind pressures with location-based wind speeds, exposure categories, and pressure coefficients",
                href: "/wind-load-calculator",
                icon: CloudArrowUpIcon,
                features: ["Basic wind speed", "Exposure categories", "Gust factors", "Pressure coefficients"],
                difficulty: "Advanced"
            },
            {
                title: "Seismic Load Calculator",
                description: "Calculate seismic forces using site classification, spectral values, and equivalent static force procedure",
                href: "/seismic-load-calculator",
                icon: GlobeAmericasIcon,
                features: ["Site classification", "Spectral values", "Force modification", "Static procedure"],
                difficulty: "Expert"
            }
        ]
    }
];

const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
        case "Beginner": return "bg-green-900 text-green-200 border border-green-600";
        case "Intermediate": return "bg-blue-900 text-blue-200 border border-blue-600";
        case "Advanced": return "bg-orange-900 text-orange-200 border border-orange-600";
        case "Expert": return "bg-red-900 text-red-200 border border-red-600";
        default: return "bg-gray-900 text-gray-200 border border-gray-600";
    }
};

export default function Calculators() {
    return (
        <div className="min-h-screen pt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white dark:text-white light:text-gray-900 mb-4">Load Calculators</h1>
                    <p className="text-lg text-gray-300 dark:text-gray-300 light:text-gray-600">
                        Professional structural load calculations according to NBC 2020 Part 4
                    </p>
                </div>

                <div className="space-y-12">
                    {calculators.map((category) => (
                        <div key={category.category}>
                            <div className="flex items-center mb-6">
                                <span className={`w-4 h-4 ${category.color === 'green' ? 'bg-green-500' : 'bg-orange-500'} rounded-full mr-3`}></span>
                                <h2 className="text-2xl font-bold text-white dark:text-white light:text-gray-900">{category.category}</h2>
                            </div>

                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {category.items.map((calculator) => {
                                    const IconComponent = calculator.icon;
                                    return (
                                        <div key={calculator.title} className="engineering-card overflow-hidden hover:border-orange-400 transition-all duration-300">
                                            <div className="p-6">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="flex items-center">
                                                        <IconComponent className="h-10 w-10 text-orange-400 mr-3" />
                                                        <div>
                                                            <h3 className="text-lg font-semibold text-white dark:text-white light:text-gray-900">{calculator.title}</h3>
                                                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${getDifficultyColor(calculator.difficulty)}`}>
                                                                {calculator.difficulty}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <p className="text-gray-300 dark:text-gray-300 light:text-gray-600 text-sm mb-4 leading-relaxed">
                                                    {calculator.description}
                                                </p>

                                                <div className="mb-6">
                                                    <h4 className="text-sm font-medium text-white dark:text-white light:text-gray-900 mb-2">Key Features</h4>
                                                    <div className="flex flex-wrap gap-1">
                                                        {calculator.features.map((feature) => (
                                                            <span key={feature} className="inline-block bg-gray-900 text-gray-300 text-xs px-2 py-1 rounded border border-orange-600">
                                                                {feature}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>

                                                <Link
                                                    to={calculator.href}
                                                    className="w-full bg-orange-600 text-white py-2 px-4 rounded text-sm font-medium hover:bg-orange-700 transition-colors block text-center"
                                                >
                                                    Open Calculator
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-16 engineering-card p-8">
                    <h2 className="text-xl font-bold text-white dark:text-white light:text-gray-900 mb-4 text-center">Need Help Getting Started?</h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="bg-orange-900 border border-orange-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                                <span className="text-orange-200 font-bold">1</span>
                            </div>
                            <h3 className="font-semibold text-white dark:text-white light:text-gray-900 mb-2">Learn the Basics</h3>
                            <p className="text-sm text-gray-300 dark:text-gray-300 light:text-gray-600 mb-3">Start with our educational modules to understand load fundamentals</p>
                            <Link to="/education" className="text-orange-400 hover:text-orange-300 text-sm font-medium">
                                Browse Courses →
                            </Link>
                        </div>
                        <div className="text-center">
                            <div className="bg-orange-900 border border-orange-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                                <span className="text-orange-200 font-bold">2</span>
                            </div>
                            <h3 className="font-semibold text-white dark:text-white light:text-gray-900 mb-2">Start Simple</h3>
                            <p className="text-sm text-gray-300 dark:text-gray-300 light:text-gray-600 mb-3">Begin with dead loads and work your way up to more complex calculations</p>
                            <Link to="/dead-load-calculator" className="text-orange-400 hover:text-orange-300 text-sm font-medium">
                                Try Dead Loads →
                            </Link>
                        </div>
                        <div className="text-center">
                            <div className="bg-orange-900 border border-orange-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                                <span className="text-orange-200 font-bold">3</span>
                            </div>
                            <h3 className="font-semibold text-white dark:text-white light:text-gray-900 mb-2">Watch & Learn</h3>
                            <p className="text-sm text-gray-300 dark:text-gray-300 light:text-gray-600 mb-3">Visual learner? Check out our video tutorials and examples</p>
                            <Link to="/videos" className="text-orange-400 hover:text-orange-300 text-sm font-medium">
                                Watch Videos →
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 