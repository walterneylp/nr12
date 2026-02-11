
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../../infrastructure/auth/AuthContext';
import {
    LayoutDashboard,
    Users,
    Settings,
    FileText,
    LogOut,
    Menu,
    Sun,
    Moon,
    Building,
    GraduationCap,
    Briefcase,
    MapPin,
    History
} from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '../components/theme-provider';
import { NotificationBell } from '../components/NotificationBell';

export function DashboardLayout() {
    const { signOut, user } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { setTheme, theme } = useTheme();

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    const navigation = [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
        { name: 'Clientes', href: '/clients', icon: Users },
        { name: 'Locais', href: '/sites', icon: MapPin },
        { name: 'Máquinas', href: '/machines', icon: Settings },
        { name: 'Ordens de Serviço', href: '/jobs', icon: Briefcase },
        { name: 'Laudos', href: '/reports', icon: FileText },
        { name: 'Treinamentos', href: '/training', icon: GraduationCap },
        { name: 'Auditoria', href: '/audit', icon: History },
        { name: 'Minha Empresa', href: '/settings', icon: Building },
    ];

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
            {/* Sidebar for Desktop */}
            <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-center h-16 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-xl font-bold text-gray-800 dark:text-white">NR-12 Safety</span>
                </div>
                <nav className="flex-1 px-2 py-4 space-y-1">
                    {navigation.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.href}
                            className={({ isActive }) =>
                                `flex items-center px-4 py-2 text-sm font-medium rounded-md group ${isActive
                                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                                }`
                            }
                        >
                            <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                            {item.name}
                        </NavLink>
                    ))}
                </nav>
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                    <button
                        onClick={toggleTheme}
                        className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                        {theme === 'dark' ? <Sun className="mr-3 h-5 w-5" /> : <Moon className="mr-3 h-5 w-5" />}
                        {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
                    </button>
                    <div className="flex items-center px-4 py-2">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{user?.email}</div>
                    </div>
                    <button
                        onClick={() => signOut()}
                        className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                        <LogOut className="mr-3 h-5 w-5" />
                        Sair
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Mobile Header */}
                <header className="md:hidden flex items-center justify-between h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4">
                    <span className="text-lg font-bold text-gray-800 dark:text-white">NR-12 Safety</span>
                    <div className="flex items-center gap-2">
                        <NotificationBell />
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none dark:hover:bg-gray-700"
                        >
                            {theme === 'dark' ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
                        </button>
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                        >
                            <Menu className="h-6 w-6" />
                        </button>
                    </div>
                </header>

                {/* Mobile Sidebar (simplified implementation) */}
                {isSidebarOpen && (
                    <div className="md:hidden fixed inset-0 z-40 flex">
                        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setIsSidebarOpen(false)}></div>
                        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-gray-800">
                            <nav className="flex-1 px-2 py-4 space-y-1">
                                {navigation.map((item) => (
                                    <NavLink
                                        key={item.name}
                                        to={item.href}
                                        onClick={() => setIsSidebarOpen(false)}
                                        className={({ isActive }) =>
                                            `flex items-center px-4 py-2 text-base font-medium rounded-md group ${isActive
                                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                                            }`
                                        }
                                    >
                                        <item.icon className="mr-4 h-6 w-6" />
                                        {item.name}
                                    </NavLink>
                                ))}
                            </nav>
                        </div>
                    </div>
                )}

                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
