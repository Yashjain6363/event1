import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { GraduationCap, LogOut, Home, LayoutDashboard, Shield, CalendarDays } from 'lucide-react';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <motion.nav
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-3 group">
                    <div className="p-2 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 group-hover:scale-105 transition-transform shadow-lg shadow-indigo-500/20">
                        <GraduationCap size={20} className="text-white" />
                    </div>
                    <span className="font-bold text-lg gradient-text hidden sm:block tracking-tight">BMSCE Events</span>
                </Link>

                <div className="flex items-center gap-2 sm:gap-4">
                    {user ? (
                        <>
                            <span className="text-sm text-gray-400 hidden md:block truncate max-w-[140px]">
                                {user.fullName}
                                {user.role === 'admin' && (
                                    <span className="ml-2 text-xs px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 font-medium">Admin</span>
                                )}
                            </span>
                            <Link
                                to="/dashboard"
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all"
                            >
                                <LayoutDashboard size={16} /> Dashboard
                            </Link>
                            {user.role === 'admin' && (
                                <Link
                                    to="/admin/dashboard"
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-all"
                                >
                                    <Shield size={16} /> Admin
                                </Link>
                            )}
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-red-400/90 hover:text-red-400 hover:bg-red-500/10 transition-all"
                            >
                                <LogOut size={16} /> Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                to="/events"
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all"
                            >
                                <CalendarDays size={16} /> Browse events
                            </Link>
                            {location.pathname !== '/' && (
                                <Link
                                    to="/"
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                                >
                                    Home
                                </Link>
                            )}
                        </>
                    )}
                </div>
            </div>
        </motion.nav>
    );
}
