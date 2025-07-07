import { Link, useLocation } from "@remix-run/react";
import { useState, useEffect, createContext, useContext } from "react";
import { Bars3Icon, XMarkIcon, SunIcon, MoonIcon } from "@heroicons/react/24/outline";

// Theme Context
const ThemeContext = createContext<{
    isDark: boolean;
    toggleTheme: () => void;
}>({
    isDark: true,
    toggleTheme: () => { },
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [isDark, setIsDark] = useState(true);

    useEffect(() => {
        // Load theme from localStorage on mount
        const savedTheme = localStorage.getItem('nbc-theme');
        if (savedTheme) {
            setIsDark(savedTheme === 'dark');
        }
    }, []);

    useEffect(() => {
        // Apply theme to document
        if (isDark) {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
        } else {
            document.documentElement.classList.add('light');
            document.documentElement.classList.remove('dark');
        }
        // Save to localStorage
        localStorage.setItem('nbc-theme', isDark ? 'dark' : 'light');
    }, [isDark]);

    const toggleTheme = () => {
        setIsDark(!isDark);
    };

    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export default function Navigation() {
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { isDark, toggleTheme } = useTheme();

    const navigation = [
        { name: 'Home', href: '/' },
        { name: 'Calculators', href: '/calculators' },
        { name: 'Education', href: '/education' },
        { name: 'Projects', href: '/projects' },
        { name: 'Videos', href: '/videos' },
    ];

    return (
        <nav className="engineering-nav fixed top-0 left-0 right-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center space-x-3">
                            <div className="engineering-logo text-2xl font-bold">
                                NBC
                            </div>
                            <div className="engineering-logo-text text-sm hidden sm:block">
                                2020 STRUCTURAL<br />LOADS
                            </div>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-4">
                            {navigation.map((item) => (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={`engineering-nav-item px-3 py-2 text-sm font-medium ${location.pathname === item.href
                                        ? 'active'
                                        : 'hover:text-orange-200 dark:hover:text-orange-200 light:hover:text-orange-700'
                                        }`}
                                >
                                    {item.name}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Theme Toggle & Mobile menu button */}
                    <div className="flex items-center space-x-2">
                        {/* Theme Toggle Button */}
                        <button
                            onClick={toggleTheme}
                            className="engineering-nav-item inline-flex items-center justify-center p-2 rounded-md hover:bg-orange-600 dark:hover:bg-orange-600 light:hover:bg-orange-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-500 transition-colors"
                            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                        >
                            <span className="sr-only">Toggle theme</span>
                            {isDark ? (
                                <SunIcon className="block h-5 w-5" aria-hidden="true" />
                            ) : (
                                <MoonIcon className="block h-5 w-5" aria-hidden="true" />
                            )}
                        </button>

                        {/* Mobile menu button */}
                        <div className="md:hidden">
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="engineering-nav-item inline-flex items-center justify-center p-2 rounded-md hover:bg-orange-600 dark:hover:bg-orange-600 light:hover:bg-orange-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-500"
                            >
                                <span className="sr-only">Open main menu</span>
                                {mobileMenuOpen ? (
                                    <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                                ) : (
                                    <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {mobileMenuOpen && (
                <div className="md:hidden">
                    <div className="concrete-texture px-2 pt-2 pb-3 space-y-1">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={`engineering-nav-item block px-3 py-2 text-base font-medium ${location.pathname === item.href
                                    ? 'active'
                                    : 'hover:text-orange-200 dark:hover:text-orange-200 light:hover:text-orange-700'
                                    }`}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {item.name}
                            </Link>
                        ))}

                        {/* Mobile Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="engineering-nav-item w-full text-left block px-3 py-2 text-base font-medium hover:text-orange-200 dark:hover:text-orange-200 light:hover:text-orange-700 transition-colors"
                        >
                            <div className="flex items-center space-x-2">
                                {isDark ? (
                                    <>
                                        <SunIcon className="h-5 w-5" />
                                        <span>Light Mode</span>
                                    </>
                                ) : (
                                    <>
                                        <MoonIcon className="h-5 w-5" />
                                        <span>Dark Mode</span>
                                    </>
                                )}
                            </div>
                        </button>
                    </div>
                </div>
            )}
        </nav>
    );
} 