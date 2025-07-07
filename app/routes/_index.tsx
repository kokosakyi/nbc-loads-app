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
    { title: "NBC 2020 Structural Loads - Canadian Building Code Load Calculators" },
    { name: "description", content: "Professional structural load calculators based on NBC 2020 for dead loads, live loads, snow loads, wind loads, and seismic loads." },
  ];
};

const quickAccessItems = [
  {
    title: "Dead Load Calculator",
    description: "Calculate dead loads with material database",
    href: "/dead-load-calculator",
    icon: ScaleIcon,
    category: "gravity"
  },
  {
    title: "Live Load Calculator",
    description: "Live loads with occupancy-based reductions",
    href: "/live-load-calculator",
    icon: UserGroupIcon,
    category: "gravity"
  },
  {
    title: "Snow Load Calculator",
    description: "Snow loads with exposure and slope factors",
    href: "/snow-load-calculator",
    icon: CloudIcon,
    category: "gravity"
  },
  {
    title: "Wind Load Calculator",
    description: "Wind pressures and dynamic effects",
    href: "/wind-load-calculator",
    icon: CloudArrowUpIcon,
    category: "lateral"
  },
  {
    title: "Seismic Load Calculator",
    description: "Seismic forces and response spectrum",
    href: "/seismic-load-calculator",
    icon: GlobeAmericasIcon,
    category: "lateral"
  },
];

const educationItems = [
  {
    title: "Fundamental Concepts",
    description: "Learn the basics of structural loads",
    href: "/education/fundamentals",
    progress: 0
  },
  {
    title: "Dead Loads",
    description: "Understanding permanent loads",
    href: "/education/dead-loads",
    progress: 0
  },
  {
    title: "Live Loads",
    description: "Variable loads and reductions",
    href: "/education/live-loads",
    progress: 0
  }
];

export default function Index() {
  return (
    <div className="min-h-screen pt-16">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-orange-600 to-orange-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold sm:text-5xl md:text-6xl">
              NBC 2020 Structural Loads
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Professional load calculators, educational resources, and code references based on the National Building Code of Canada 2020
              <br />
              HENRY MENSAH ACKUN APPROVES THIS MESSAGE
            </p>
            <div className="mt-8">
              <Link
                to="/calculators"
                className="bg-white text-orange-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg"
              >
                Start Calculating
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Quick Access Calculators */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-white mb-6">Load Calculators</h2>

            {/* Gravity Loads */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-300 mb-4 flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Gravity Loads
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {quickAccessItems.filter(item => item.category === 'gravity').map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <Link
                      key={item.title}
                      to={item.href}
                      className="engineering-card p-6 hover:border-orange-400 transition-all group"
                    >
                      <div className="flex items-start">
                        <IconComponent className="h-8 w-8 text-orange-400 mr-4 group-hover:scale-110 transition-transform" />
                        <div>
                          <h4 className="font-semibold text-white group-hover:text-orange-400">
                            {item.title}
                          </h4>
                          <p className="text-sm text-gray-300 mt-1">{item.description}</p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Lateral Loads */}
            <div>
              <h3 className="text-lg font-semibold text-gray-300 mb-4 flex items-center">
                <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                Lateral Loads
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {quickAccessItems.filter(item => item.category === 'lateral').map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <Link
                      key={item.title}
                      to={item.href}
                      className="engineering-card p-6 hover:border-orange-400 transition-all group"
                    >
                      <div className="flex items-start">
                        <IconComponent className="h-8 w-8 text-orange-400 mr-4 group-hover:scale-110 transition-transform" />
                        <div>
                          <h4 className="font-semibold text-white group-hover:text-orange-400">
                            {item.title}
                          </h4>
                          <p className="text-sm text-gray-300 mt-1">{item.description}</p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Updates */}
            <div className="engineering-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Updates</h3>
              <div className="space-y-3">
                <div className="border-l-4 border-orange-400 pl-4">
                  <p className="text-sm font-medium text-white">NBC 2020 Snow Loads</p>
                  <p className="text-xs text-gray-300">Updated ground snow load data for all provinces</p>
                </div>
                <div className="border-l-4 border-green-400 pl-4">
                  <p className="text-sm font-medium text-white">Wind Load Calculator</p>
                  <p className="text-xs text-gray-300">Enhanced pressure coefficient database</p>
                </div>
                <div className="border-l-4 border-orange-400 pl-4">
                  <p className="text-sm font-medium text-white">Seismic Updates</p>
                  <p className="text-xs text-gray-300">New seismic hazard maps integrated</p>
                </div>
              </div>
            </div>

            {/* Learning Path */}
            <div className="engineering-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Learning Path</h3>
              <p className="text-sm text-gray-300 mb-4">
                Master structural loads step by step with our comprehensive courses
              </p>
              <div className="space-y-3">
                {educationItems.map((item) => (
                  <div key={item.title} className="flex items-center justify-between p-3 bg-gray-900 border border-orange-600 rounded">
                    <div>
                      <p className="text-sm font-medium text-white">{item.title}</p>
                      <p className="text-xs text-gray-300">{item.description}</p>
                    </div>
                    <div className="w-16 bg-gray-700 rounded-full h-1.5">
                      <div
                        className="bg-orange-600 h-1.5 rounded-full"
                        style={{ width: `${item.progress}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                to="/education"
                className="mt-4 w-full bg-orange-600 text-white py-2 px-4 rounded text-sm hover:bg-orange-700 transition-colors block text-center"
              >
                Start Learning
              </Link>
            </div>

            {/* Quick Stats */}
            <div className="engineering-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Platform Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-300">Active Calculators</span>
                  <span className="text-sm font-semibold text-orange-400">5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-300">Educational Modules</span>
                  <span className="text-sm font-semibold text-orange-400">12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-300">Code References</span>
                  <span className="text-sm font-semibold text-orange-400">50+</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-300">Material Database</span>
                  <span className="text-sm font-semibold text-orange-400">200+</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
