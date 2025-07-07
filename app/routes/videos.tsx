import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
    return [
        { title: "Video Learning - NBC 2020 Structural Loads" },
        { name: "description", content: "Professional video courses for structural load calculations" },
    ];
};

const freeVideos = [
    {
        title: "Introduction to NBC 2020 Part 4",
        description: "Overview of structural load requirements in the National Building Code",
        duration: "15:30",
        thumbnail: "🎯",
        difficulty: "Beginner"
    },
    {
        title: "Basic Load Combination Examples",
        description: "Step-by-step examples of combining different load types",
        duration: "22:45",
        thumbnail: "🔢",
        difficulty: "Beginner"
    },
    {
        title: "Dead Load Calculation Walkthrough",
        description: "Complete dead load calculation for a simple structure",
        duration: "18:20",
        thumbnail: "⚖️",
        difficulty: "Beginner"
    }
];

const premiumCourses = [
    {
        title: "Dead Load Mastery",
        description: "Advanced material databases and complex building scenarios",
        price: "$29",
        lessons: 12,
        duration: "3.5 hours",
        thumbnail: "⚖️",
        difficulty: "Intermediate",
        features: ["Advanced material database", "Multi-story load accumulation", "Special dead loads", "Case studies"]
    },
    {
        title: "Live Load Deep Dive",
        description: "Special occupancy cases and dynamic load considerations",
        price: "$39",
        lessons: 15,
        duration: "4.2 hours",
        thumbnail: "👥",
        difficulty: "Intermediate",
        features: ["Occupancy classifications", "Load reduction methods", "Dynamic effects", "Assembly loads"]
    },
    {
        title: "Snow Load Workshop",
        description: "Complex roof geometries and adjacent building effects",
        price: "$49",
        lessons: 18,
        duration: "5.1 hours",
        thumbnail: "❄️",
        difficulty: "Advanced",
        features: ["Ground snow mapping", "Drift analysis", "Shape coefficients", "Unbalanced loads"]
    },
    {
        title: "Wind Load Professional",
        description: "Dynamic response and cladding pressures",
        price: "$69",
        lessons: 25,
        duration: "7.5 hours",
        thumbnail: "💨",
        difficulty: "Advanced",
        features: ["Dynamic wind effects", "Pressure coefficients", "Cladding design", "Wind tunnel correlation"]
    },
    {
        title: "Seismic Design Series",
        description: "Site classification and dynamic analysis methods",
        price: "$79",
        lessons: 30,
        duration: "9.2 hours",
        thumbnail: "🌍",
        difficulty: "Expert",
        features: ["Site classification", "Response spectrum", "Dynamic analysis", "Irregular structures"]
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

export default function Videos() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Video Learning</h1>
                <p className="text-lg text-gray-600 max-w-3xl">
                    Learn structural load calculations through professional video courses. Start with free previews
                    and unlock advanced content with premium courses.
                </p>
            </div>

            {/* Free Preview Section */}
            <div className="mb-12">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Free Preview Content</h2>
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        Free Access
                    </span>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {freeVideos.map((video, index) => (
                        <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                            <div className="aspect-video bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                                <div className="text-6xl">{video.thumbnail}</div>
                            </div>
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(video.difficulty)}`}>
                                        {video.difficulty}
                                    </span>
                                    <span className="text-sm text-gray-500">{video.duration}</span>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">{video.title}</h3>
                                <p className="text-gray-600 text-sm mb-4">{video.description}</p>
                                <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium">
                                    ▶ Watch Free
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Premium Courses Section */}
            <div className="mb-12">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Premium Video Courses</h2>
                    <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                        ⭐ Premium
                    </span>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {premiumCourses.map((course, index) => (
                        <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                            <div className="aspect-video bg-gradient-to-br from-yellow-50 to-yellow-100 flex items-center justify-center relative">
                                <div className="text-6xl">{course.thumbnail}</div>
                                <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded text-sm font-bold">
                                    {course.price}
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(course.difficulty)}`}>
                                        {course.difficulty}
                                    </span>
                                    <div className="text-sm text-gray-500">
                                        {course.lessons} lessons • {course.duration}
                                    </div>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">{course.title}</h3>
                                <p className="text-gray-600 text-sm mb-4">{course.description}</p>

                                <div className="mb-4">
                                    <h4 className="text-sm font-medium text-gray-900 mb-2">What you&apos;ll learn:</h4>
                                    <ul className="text-sm text-gray-600 space-y-1">
                                        {course.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-center">
                                                <span className="text-green-500 mr-2">✓</span>
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <button className="w-full bg-yellow-500 text-white py-2 px-4 rounded-lg hover:bg-yellow-600 transition-colors font-medium">
                                    Unlock Course {course.price}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Subscription Option */}
            <div className="mb-12 bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg p-8 text-white">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">All-Access Premium Subscription</h2>
                    <p className="text-purple-100 mb-6 max-w-2xl mx-auto">
                        Get unlimited access to all premium video courses, new releases, and exclusive content.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4 mb-6">
                        <div className="bg-white bg-opacity-20 rounded-lg p-4">
                            <div className="text-2xl font-bold">$19</div>
                            <div className="text-sm text-purple-100">per month</div>
                        </div>
                        <div className="bg-white bg-opacity-20 rounded-lg p-4">
                            <div className="text-2xl font-bold">$199</div>
                            <div className="text-sm text-purple-100">per year</div>
                            <div className="text-xs text-purple-200">Save 12%</div>
                        </div>
                    </div>
                    <div className="flex flex-wrap justify-center gap-4">
                        <button className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors">
                            Start Monthly Subscription
                        </button>
                        <button className="border border-purple-300 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors">
                            Choose Annual Plan
                        </button>
                    </div>
                </div>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                    <div className="text-4xl mb-4">🎥</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">HD Video Quality</h3>
                    <p className="text-gray-600 text-sm">
                        Crystal clear 1080p video with professional audio and screen recordings.
                    </p>
                </div>
                <div className="text-center">
                    <div className="text-4xl mb-4">📱</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Watch Anywhere</h3>
                    <p className="text-gray-600 text-sm">
                        Access your courses on desktop, tablet, or mobile device with sync across all platforms.
                    </p>
                </div>
                <div className="text-center">
                    <div className="text-4xl mb-4">🎓</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Completion Certificates</h3>
                    <p className="text-gray-600 text-sm">
                        Earn professional certificates upon completing courses to showcase your expertise.
                    </p>
                </div>
            </div>
        </div>
    );
} 