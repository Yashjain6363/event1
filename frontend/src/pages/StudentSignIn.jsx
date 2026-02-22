import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, Mail, Lock, Eye, EyeOff, KeyRound, ArrowLeft, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { studentSignIn, forgotPassword } from '../api/api';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';

export default function StudentSignIn() {
    const [searchParams] = useSearchParams();
    const redirectTo = searchParams.get('redirect') || '/dashboard';
    const [form, setForm] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showForgot, setShowForgot] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.email || !form.password) return toast.error('All fields are required');

        setLoading(true);
        try {
            const res = await studentSignIn(form);
            login(res.data.token, res.data.user);
            toast.success('Welcome back! 👋');
            navigate(redirectTo.startsWith('/') ? redirectTo : `/${redirectTo}`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Sign in failed');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        if (!forgotEmail) return toast.error('Please enter your email');

        setForgotLoading(true);
        try {
            const res = await forgotPassword({ email: forgotEmail });
            toast.success(res.data.message || 'New password sent to your email!');
            setShowForgot(false);
            setForgotEmail('');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send password reset email');
        } finally {
            setForgotLoading(false);
        }
    };

    return (
        <div className="min-h-screen">
            <Navbar />
            <div className="min-h-screen flex items-center justify-center pt-20 pb-10 px-4">
                <div className="fixed inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-float" />
                    <div className="absolute bottom-1/3 left-1/4 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md relative z-10"
                >
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 p-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 mb-6 shadow-lg shadow-indigo-500/25">
                            <LogIn size={28} className="text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Sign In</h1>
                        <p className="text-gray-400 mt-2">Access your BMSCE Events account</p>
                    </div>

                    <div className="glass rounded-3xl p-8 border border-white/5">
                        <AnimatePresence mode="wait">
                            {!showForgot ? (
                                <motion.div
                                    key="login"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                >
                                    <form onSubmit={handleSubmit} className="space-y-5">
                                        <div>
                                            <label className="text-sm text-gray-300 font-medium mb-2 block">Email</label>
                                            <div className="relative">
                                                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <input
                                                    type="email" placeholder="your.email@example.com"
                                                    value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                                                    className="input-field pl-10" required
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-sm text-gray-300 font-medium mb-2 block">Password</label>
                                            <div className="relative">
                                                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <input
                                                    type={showPassword ? 'text' : 'password'} placeholder="••••••••"
                                                    value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                                                    className="input-field pl-10 pr-12" required
                                                />
                                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors">
                                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Forgot Password Link */}
                                        <div className="text-right">
                                            <button
                                                type="button"
                                                onClick={() => { setShowForgot(true); setForgotEmail(form.email); }}
                                                className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                                            >
                                                Forgot Password?
                                            </button>
                                        </div>

                                        <motion.button
                                            type="submit" disabled={loading}
                                            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                                            className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl"
                                        >
                                            {loading ? (
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <><LogIn size={18} /> Sign In</>
                                            )}
                                        </motion.button>
                                    </form>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="forgot"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                >
                                    <button
                                        onClick={() => setShowForgot(false)}
                                        className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors mb-5"
                                    >
                                        <ArrowLeft size={14} /> Back to Sign In
                                    </button>

                                    <div className="text-center mb-6">
                                        <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 mb-3">
                                            <KeyRound size={24} className="text-white" />
                                        </div>
                                        <h2 className="text-lg font-bold text-white">Forgot Password</h2>
                                        <p className="text-gray-400 text-sm mt-1">
                                            Enter your email and we'll send you a new password
                                        </p>
                                    </div>

                                    <form onSubmit={handleForgotPassword} className="space-y-5">
                                        <div>
                                            <label className="text-sm text-gray-300 font-medium mb-2 block">Your Email</label>
                                            <div className="relative">
                                                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <input
                                                    type="email" placeholder="your.email@example.com"
                                                    value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                                                    className="input-field pl-10" required
                                                />
                                            </div>
                                        </div>

                                        <motion.button
                                            type="submit" disabled={forgotLoading}
                                            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                                            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white transition-all"
                                            style={{
                                                background: 'linear-gradient(135deg, #F97316, #EC4899)',
                                                boxShadow: '0 4px 20px rgba(249, 115, 22, 0.3)',
                                            }}
                                        >
                                            {forgotLoading ? (
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <><Send size={18} /> Send New Password</>
                                            )}
                                        </motion.button>
                                    </form>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="mt-6 text-center text-sm text-gray-400">
                            Don't have an account?{' '}
                            <Link to="/signup" className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
                                Sign Up
                            </Link>
                        </div>
                        <div className="mt-4 text-center">
                            <Link to="/admin-login" className="text-sm text-gray-500 hover:text-indigo-400 transition-colors">
                                Are you a club admin? Login here →
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
