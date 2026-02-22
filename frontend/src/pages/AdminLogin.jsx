import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Upload, X, Mail, ChevronDown, Camera, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { adminLogin, adminReLogin, getActiveClubs } from '../api/api';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';

export default function AdminLogin() {
    // Toggle between first-time registration and returning admin login
    const [isReturning, setIsReturning] = useState(false);

    // First-time registration state
    const [clubs, setClubs] = useState({});
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedClub, setSelectedClub] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [idCard, setIdCard] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fetchingClubs, setFetchingClubs] = useState(true);
    const fileRef = useRef(null);
    const { login } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        getActiveClubs()
            .then(res => {
                const data = res.data.clubs;
                setClubs(data);
                setCategories(Object.keys(data).sort());
            })
            .catch(() => toast.error('Failed to load clubs'))
            .finally(() => setFetchingClubs(false));
    }, []);

    const handleCategoryChange = (cat) => {
        setSelectedCategory(cat);
        setSelectedClub('');
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const ext = file.name.split('.').pop().toLowerCase();
        if (ext !== 'jpg' && ext !== 'jpeg') {
            toast.error('Only JPG/JPEG images are allowed');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File must be under 5MB');
            return;
        }
        setIdCard(file);
        setPreview(URL.createObjectURL(file));
    };

    // First-time admin registration
    const handleFirstTimeSubmit = async (e) => {
        e.preventDefault();

        if (!selectedCategory || !selectedClub || !email || !password || !idCard) {
            return toast.error('All fields are required');
        }

        if (password.length < 6) {
            return toast.error('Password must be at least 6 characters');
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('clubCategory', selectedCategory);
            formData.append('clubName', selectedClub);
            formData.append('email', email);
            formData.append('password', password);
            formData.append('idCard', idCard);

            const res = await adminLogin(formData);
            login(res.data.token, res.data.user);
            toast.success(`Welcome, ${res.data.user.clubName} Admin! 🎉`);
            navigate('/admin/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Admin login failed');
        } finally {
            setLoading(false);
        }
    };

    // Returning admin login
    const handleReturningSubmit = async (e) => {
        e.preventDefault();

        if (!email || !password) {
            return toast.error('Email and password are required');
        }

        setLoading(true);
        try {
            const res = await adminReLogin({ email, password });
            login(res.data.token, res.data.user);
            toast.success(`Welcome back, ${res.data.user.clubName} Admin! 🎉`);
            navigate('/admin/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Admin login failed');
        } finally {
            setLoading(false);
        }
    };

    const switchMode = () => {
        setIsReturning(!isReturning);
        setEmail('');
        setPassword('');
        setSelectedCategory('');
        setSelectedClub('');
        setIdCard(null);
        setPreview(null);
    };

    return (
        <div className="min-h-screen">
            <Navbar />
            <div className="min-h-screen flex items-center justify-center pt-20 pb-10 px-4">
                <div className="fixed inset-0 pointer-events-none">
                    <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-pink-600/10 rounded-full blur-3xl animate-float" />
                    <div className="absolute bottom-1/3 right-1/4 w-56 h-56 bg-purple-600/10 rounded-full blur-3xl" />
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-lg relative z-10"
                >
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center gap-2 p-3 rounded-2xl bg-gradient-to-br from-pink-600 to-purple-600 mb-4">
                            <Shield size={24} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-white">Admin Login</h1>
                        <p className="text-gray-400 text-sm mt-1">
                            {isReturning ? 'Welcome back, admin' : 'Club representative access'}
                        </p>
                    </div>

                    {/* Toggle between first-time and returning */}
                    <div className="flex mb-5 glass rounded-xl p-1">
                        <button
                            onClick={() => !isReturning || switchMode()}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${!isReturning
                                    ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg'
                                    : 'text-gray-400 hover:text-gray-200'
                                }`}
                        >
                            First Time
                        </button>
                        <button
                            onClick={() => isReturning || switchMode()}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${isReturning
                                    ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg'
                                    : 'text-gray-400 hover:text-gray-200'
                                }`}
                        >
                            Returning Admin
                        </button>
                    </div>

                    <div className="glass rounded-3xl p-8">
                        <AnimatePresence mode="wait">
                            {isReturning ? (
                                /* ===== RETURNING ADMIN LOGIN ===== */
                                <motion.div
                                    key="returning"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                >
                                    <form onSubmit={handleReturningSubmit} className="space-y-5">
                                        {/* Email */}
                                        <div>
                                            <label className="text-sm text-gray-300 font-medium mb-2 block">Admin Email</label>
                                            <div className="relative">
                                                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <input
                                                    type="email" placeholder="clubadmin@bmsce.ac.in"
                                                    value={email} onChange={(e) => setEmail(e.target.value)}
                                                    className="input-field pl-10" required
                                                />
                                            </div>
                                        </div>

                                        {/* Password */}
                                        <div>
                                            <label className="text-sm text-gray-300 font-medium mb-2 block">Password</label>
                                            <div className="relative">
                                                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <input
                                                    type={showPassword ? 'text' : 'password'} placeholder="••••••••"
                                                    value={password} onChange={(e) => setPassword(e.target.value)}
                                                    className="input-field pl-10 pr-12" required
                                                />
                                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors">
                                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                        </div>

                                        <motion.button
                                            type="submit" disabled={loading}
                                            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                                            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white transition-all duration-300"
                                            style={{
                                                background: 'linear-gradient(135deg, #EC4899, #8B5CF6)',
                                                boxShadow: '0 4px 20px rgba(236, 72, 153, 0.4)',
                                            }}
                                        >
                                            {loading ? (
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <><LogIn size={18} /> Login as Admin</>
                                            )}
                                        </motion.button>
                                    </form>
                                </motion.div>
                            ) : (
                                /* ===== FIRST-TIME ADMIN REGISTRATION ===== */
                                <motion.div
                                    key="firsttime"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                >
                                    {fetchingClubs ? (
                                        <div className="flex items-center justify-center py-12">
                                            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    ) : categories.length === 0 ? (
                                        <div className="text-center py-10">
                                            <div className="text-4xl mb-3">🏫</div>
                                            <p className="text-gray-400">All club admin slots have been filled.</p>
                                            <p className="text-gray-500 text-sm mt-1">Contact the portal administrator for assistance.</p>
                                        </div>
                                    ) : (
                                        <form onSubmit={handleFirstTimeSubmit} className="space-y-5">
                                            {/* Club Category */}
                                            <div>
                                                <label className="text-sm text-gray-300 font-medium mb-2 block">Club Category</label>
                                                <div className="relative">
                                                    <select
                                                        value={selectedCategory}
                                                        onChange={(e) => handleCategoryChange(e.target.value)}
                                                        className="input-field appearance-none pr-10 cursor-pointer"
                                                        required
                                                    >
                                                        <option value="" className="bg-gray-900">Select a category...</option>
                                                        {categories.map(cat => (
                                                            <option key={cat} value={cat} className="bg-gray-900">{cat}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                                </div>
                                            </div>

                                            {/* Club Name */}
                                            <div>
                                                <label className="text-sm text-gray-300 font-medium mb-2 block">Club Name</label>
                                                <div className="relative">
                                                    <select
                                                        value={selectedClub}
                                                        onChange={(e) => setSelectedClub(e.target.value)}
                                                        className="input-field appearance-none pr-10 cursor-pointer"
                                                        required
                                                        disabled={!selectedCategory}
                                                    >
                                                        <option value="" className="bg-gray-900">
                                                            {selectedCategory ? 'Select a club...' : 'Select category first'}
                                                        </option>
                                                        {selectedCategory && clubs[selectedCategory]?.map(club => (
                                                            <option key={club._id} value={club.clubName} className="bg-gray-900">
                                                                {club.clubName}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                                </div>
                                                {selectedCategory && (!clubs[selectedCategory] || clubs[selectedCategory].length === 0) && (
                                                    <p className="text-xs text-yellow-400 mt-1">All clubs in this category are already claimed</p>
                                                )}
                                            </div>

                                            {/* Email */}
                                            <div>
                                                <label className="text-sm text-gray-300 font-medium mb-2 block">Admin Email</label>
                                                <div className="relative">
                                                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                                    <input
                                                        type="email" placeholder="clubadmin@bmsce.ac.in"
                                                        value={email} onChange={(e) => setEmail(e.target.value)}
                                                        className="input-field pl-10" required
                                                    />
                                                </div>
                                            </div>

                                            {/* Password */}
                                            <div>
                                                <label className="text-sm text-gray-300 font-medium mb-2 block">Set Admin Password</label>
                                                <div className="relative">
                                                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                                    <input
                                                        type={showPassword ? 'text' : 'password'} placeholder="Minimum 6 characters"
                                                        value={password} onChange={(e) => setPassword(e.target.value)}
                                                        className="input-field pl-10 pr-12" required minLength={6}
                                                    />
                                                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors">
                                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* ID Card Upload */}
                                            <div>
                                                <label className="text-sm text-gray-300 font-medium mb-2 block">
                                                    ID Card Proof <span className="text-gray-500">(JPG only)</span>
                                                </label>
                                                <div
                                                    onClick={() => fileRef.current?.click()}
                                                    className={`relative border-2 border-dashed rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:border-purple-500 ${preview ? 'border-purple-500/50 h-44' : 'border-white/20 h-32 flex flex-col items-center justify-center'
                                                        }`}
                                                >
                                                    {preview ? (
                                                        <>
                                                            <img src={preview} alt="ID Card" className="w-full h-full object-cover" />
                                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                                <p className="text-white text-sm font-semibold">Click to change</p>
                                                            </div>
                                                            <button type="button" onClick={(e) => { e.stopPropagation(); setIdCard(null); setPreview(null); }}
                                                                className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white">
                                                                <X size={12} />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Camera size={28} className="text-gray-500 mb-2" />
                                                            <p className="text-gray-400 text-sm">Upload your ID card</p>
                                                            <p className="text-gray-600 text-xs mt-0.5">JPG/JPEG only, max 5MB</p>
                                                        </>
                                                    )}
                                                </div>
                                                <input ref={fileRef} type="file" accept=".jpg,.jpeg" onChange={handleFileChange} className="hidden" />
                                            </div>

                                            <motion.button
                                                type="submit" disabled={loading}
                                                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                                                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white transition-all duration-300"
                                                style={{
                                                    background: 'linear-gradient(135deg, #EC4899, #8B5CF6)',
                                                    boxShadow: '0 4px 20px rgba(236, 72, 153, 0.4)',
                                                }}
                                            >
                                                {loading ? (
                                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <><Shield size={18} /> Register as Admin</>
                                                )}
                                            </motion.button>
                                        </form>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="mt-6 text-center text-sm text-gray-500">
                            Student?{' '}
                            <Link to="/signin" className="text-purple-400 hover:text-purple-300 transition-colors">
                                Sign in here
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
