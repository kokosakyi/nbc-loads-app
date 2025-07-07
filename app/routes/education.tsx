import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import {
    AcademicCapIcon,
    ScaleIcon,
    UserGroupIcon,
    CloudIcon,
    CloudArrowUpIcon,
    GlobeAmericasIcon
} from "@heroicons/react/24/outline";

export const meta: MetaFunction = () => {
    return [
        { title: "Education - NBC 2020 Structural Loads" },
        { name: "description", content: "Learn structural load calculations through comprehensive courses covering NBC 2020 requirements." },
    ];
};

const courses = [
    {
        title: "Fundamental Concepts",
        description: "Introduction to structural loads and limit states design philosophy according to NBC 2020",
        href: "/education/fundamentals",
        icon: AcademicCapIcon,
        difficulty: "Beginner",
        duration: "45 min",
        topics: ["Limit states design", "Load combinations", "Safety factors", "NBC overview"],
        status: "free"
    },
    {
        title: "Dead Loads",
        description: "Understanding permanent loads, material weights, and load accumulation through building height",
        href: "/education/dead-loads",
        icon: ScaleIcon,
        difficulty: "Beginner",
        duration: "60 min",
        topics: ["Material weights", "Permanent vs non-permanent", "Load accumulation", "Special considerations"],
        status: "free"
    },
    {
        title: "Live Loads",
        description: "Variable loads, occupancy classifications, and reduction calculations per NBC 4.1.5",
        href: "/education/live-loads",
        icon: UserGroupIcon,
        difficulty: "Intermediate",
        duration: "75 min",
        topics: ["Occupancy classes", "Load reductions", "Special live loads", "Dynamic effects"],
        status: "premium"
    },
    {
        title: "Snow Loads",
        description: "Snow load fundamentals, shape coefficients, and uneven snow distribution analysis",
        href: "/education/snow-loads",
        icon: CloudIcon,
        difficulty: "Advanced",
        duration: "90 min",
        topics: ["Ground snow loads", "Shape coefficients", "Drift loads", "Rain-on-snow"],
        status: "premium"
    },
    {
        title: "Wind Loads",
        description: "Wind climate in Canada, pressure coefficients, and dynamic wind effects",
        href: "/education/wind-loads",
        icon: CloudArrowUpIcon,
        difficulty: "Advanced",
        duration: "120 min",
        topics: ["Basic wind speed", "Pressure coefficients", "Dynamic response", "Cladding loads"],
        status: "premium"
    },
    {
        title: "Seismic Loads",
        description: "Seismic hazard mapping, response spectrum analysis, and ductility considerations",
        href: "/education/seismic-loads",
        icon: GlobeAmericasIcon,
        difficulty: "Expert",
        duration: "150 min",
        topics: ["Seismic hazard", "Response spectrum", "Ductility factors", "Dynamic analysis"],
        status: "premium"
    }
];

const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
        case "Beginner": return "bg-green-100 text-green-800";
        case "Intermediate": return "bg-blue-100 text-blue-800";
        case "Advanced": return "bg-orange-100 text-orange-800";
        case "Expert": return "bg-red-100 text-red-800";
        default: return "bg-gray-100 text-gray-800";
    }
};

export default function Education() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-green-600 to-green-800 rounded-lg p-8 text-white mb-8">
                <h1 className="text-3xl font-bold mb-4">
                    Master NBC 2020 Structural Loads
                </h1>
                <p className="text-green-100 text-lg mb-6">
                    Comprehensive educational content covering all aspects of structural load calculations
                    according to the National Building Code of Canada 2020, Part 4.
                </p>

                {/* Learning Path Preview */}
                <div className="flex flex-wrap items-center gap-4">
                    {courses.slice(0, 4).map((course, index) => {
                        const IconComponent = course.icon;
                        return (
                            <div key={course.title} className="flex items-center">
                                <div className="flex items-center bg-white rounded-lg p-3 shadow-sm">
                                    <IconComponent className="h-6 w-6 text-green-600 mr-2" />
                                    <div>
                                        <div className="font-semibold text-gray-900 text-sm">{course.title}</div>
                                        <div className="text-xs text-gray-600">{course.duration}</div>
                                    </div>
                                </div>
                                {index < 3 && (
                                    <div className="mx-2 text-gray-400">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
                <div className="mt-6">
                    <Link
                        to="/education/fundamentals"
                        className="bg-white text-green-600 px-6 py-3 rounded-lg hover:bg-green-50 transition-colors font-medium"
                    >
                        Start Learning
                    </Link>
                </div>
            </div>

            {/* Course Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => {
                    const IconComponent = course.icon;
                    return (
                        <div key={course.title} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center">
                                        <IconComponent className="h-10 w-10 text-green-600 mr-3" />
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-lg font-semibold text-gray-900">{course.title}</h3>
                                                {course.status === "premium" && (
                                                    <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                                                        ⭐ Premium
                                                    </span>
                                                )}
                                                {course.status === "free" && (
                                                    <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                                        Free
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <span className={`px-2 py-1 rounded-full ${getDifficultyColor(course.difficulty)}`}>
                                                    {course.difficulty}
                                                </span>
                                                <span>•</span>
                                                <span>{course.duration}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                                    {course.description}
                                </p>

                                {/* Topics */}
                                <div className="mb-6">
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">What You&apos;ll Learn</h4>
                                    <div className="space-y-1">
                                        {course.topics.map((topic) => (
                                            <div key={topic} className="flex items-center text-xs text-gray-600">
                                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2"></span>
                                                {topic}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Action Button */}
                                <Link
                                    to={course.href}
                                    className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors block text-center ${course.status === "free"
                                        ? "bg-green-600 text-white hover:bg-green-700"
                                        : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                                        }`}
                                >
                                    {course.status === "free" ? "Start Course" : "Premium Course"}
                                </Link>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Additional Resources */}
            <div className="mt-16 bg-green-50 rounded-lg p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">Why Learn with Us?</h2>
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="text-center">
                        <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                            <AcademicCapIcon className="h-6 w-6 text-green-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Expert-Led Content</h3>
                        <p className="text-sm text-gray-600">Learn from professional structural engineers with decades of experience</p>
                    </div>
                    <div className="text-center">
                        <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                            <span className="text-blue-600 font-bold text-sm">NBC</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Code-Compliant</h3>
                        <p className="text-sm text-gray-600">All content based on NBC 2020 Part 4 requirements and best practices</p>
                    </div>
                    <div className="text-center">
                        <div className="bg-orange-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                            <span className="text-orange-600 font-bold">✓</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Practical Application</h3>
                        <p className="text-sm text-gray-600">Real-world examples and hands-on exercises for immediate application</p>
                    </div>
                </div>
            </div>
        </div>
    );
} 