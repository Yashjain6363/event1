import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserPlus, Mail, Lock, Eye, EyeOff, User, Hash, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { studentSignUp, verifyOtp, resendOtp } from '../api/api';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';

export default function StudentSignUp() {
    const [form, setForm] = useState({ fullName: '', email: '', usn: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState('form'); // 'form' | 'otp'
    const [pendingEmail, setPendingEmail] = useState('');
    const [otpValue, setOtpValue] = useState('');
    const [verifyLoading, setVerifyLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [searchParams] = useSearchParams();
    const redirectTo = searchParams.get('redirect') || '/dashboard';
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const isValidEmail = (str) => {
        if (!str || typeof str !== 'string') return false;
        const t = str.trim().toLowerCase();
        return t.length <= 254 && /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/.test(t);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const fullName = form.fullName.trim();
        const email = form.email.trim().toLowerCase();
        const usn = form.usn.trim().toUpperCase();
        const password = form.password;

        if (!fullName || !usn) {
            return toast.error('Full name and USN are required');
        }
        if (!email) {
            return toast.error('Email is required');
        }
        if (!isValidEmail(form.email)) {
            return toast.error('Please enter a valid email address');
        }
        if (!password || password.length < 6) {
            return toast.error('Password must be at least 6 characters');
        }

        setLoading(true);
        try {
            const res = await studentSignUp({ fullName, email, usn, password });
            if (res.data.needsVerification) {
                setPendingEmail(res.data.email);
                setStep('otp');
                toast.success(res.data.message || 'Check your email for the verification code');
            } else {
                login(res.data.token, res.data.user);
                toast.success('Account created! Welcome to BMSCE Events! 🎉');
                navigate(redirectTo.startsWith('/') ? redirectTo : `/${redirectTo}`);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Sign up failed');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        if (!otpValue.trim() || otpValue.length !== 6) {
            return toast.error('Enter the 6-digit code from your email');
        }
        setVerifyLoading(true);
        try {
            const res = await verifyOtp({ email: pendingEmail, otp: otpValue.trim() });
            login(res.data.token, res.data.user);
            toast.success('Email verified! Welcome to BMSCE Events! 🎉');
            navigate(redirectTo.startsWith('/') ? redirectTo : `/${redirectTo}`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Verification failed');
        } finally {
            setVerifyLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setResendLoading(true);
        try {
            await resendOtp({ email: pendingEmail });
            toast.success('New code sent to your email');
            setOtpValue('');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to resend code');
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <div className="min-h-screen">
            <Navbar />
            <div className="min-h-screen flex items-center justify-center pt-20 pb-10 px-4">
                <div className="fixed inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-1/3 left-1/5 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-float" />
                    <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md relative z-10"
                >
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 p-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 mb-6 shadow-lg shadow-indigo-500/25">
                            <UserPlus size={28} className="text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Student Sign Up</h1>
                        <p className="text-gray-400 mt-2">Create your BMSCE Events account</p>
                    </div>

                    <div className="glass rounded-3xl p-8 border border-white/5">
                        {step === 'otp' ? (
                            <>
                                <div className="text-center mb-6">
                                    <div className="inline-flex items-center gap-2 p-4 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 mb-4 shadow-lg shadow-emerald-500/25">
                                        <ShieldCheck size={28} className="text-white" />
                                    </div>
                                    <h2 className="text-xl font-bold text-white">Verify your email</h2>
                                    <p className="text-gray-400 text-sm mt-1">
                                        We sent a 6-digit code to <span className="text-indigo-300 font-medium">{pendingEmail}</span>
                                    </p>
                                </div>
                                <form onSubmit={handleVerifyOtp} className="space-y-5">
                                    <div>
                                        <label className="text-sm text-gray-300 font-medium mb-2 block">Verification code</label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={6}
                                            placeholder="000000"
                                            value={otpValue}
                                            onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                                            className="input-field text-center text-2xl tracking-[0.5em] font-mono"
                                            autoFocus
                                        />
                                    </div>
                                    <motion.button
                                        type="submit"
                                        disabled={verifyLoading || otpValue.length !== 6}
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 disabled:opacity-50"
                                    >
                                        {verifyLoading ? (
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <><ShieldCheck size={18} /> Verify & Continue</>
                                        )}
                                    </motion.button>
                                </form>
                                <p className="mt-4 text-center text-sm text-gray-400">
                                    Didn&apos;t receive the code?{' '}
                                    <button
                                        type="button"
                                        onClick={handleResendOtp}
                                        disabled={resendLoading}
                                        className="text-indigo-400 hover:text-indigo-300 font-medium disabled:opacity-50"
                                    >
                                        {resendLoading ? 'Sending…' : 'Resend code'}
                                    </button>
                                </p>
                            </>
                        ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Full Name */}
                            <div>
                                <label className="text-sm text-gray-300 font-medium mb-2 block">Full Name</label>
                                <div className="relative">
                                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        name="fullName" type="text" placeholder="John Doe"
                                        value={form.fullName} onChange={handleChange}
                                        className="input-field pl-10" required
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="text-sm text-gray-300 font-medium mb-2 block">Email Address</label>
                                <div className="relative">
                                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        name="email" type="email" placeholder="your.email@example.com"
                                        value={form.email} onChange={handleChange}
                                        className="input-field pl-10" required
                                    />
                                </div>
                            </div>

                            {/* USN Number */}
                            <div>
                                <label className="text-sm text-gray-300 font-medium mb-2 block">USN Number</label>
                                <div className="relative">
                                    <Hash size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        name="usn" type="text" placeholder="1BM22CS001"
                                        value={form.usn} onChange={handleChange}
                                        className="input-field pl-10 uppercase" required
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="text-sm text-gray-300 font-medium mb-2 block">Password</label>
                                <div className="relative">
                                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        name="password" type={showPassword ? 'text' : 'password'}
                                        placeholder="Minimum 6 characters"
                                        value={form.password} onChange={handleChange}
                                        className="input-field pl-10 pr-12" required minLength={6}
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
                                className="btn-primary w-full flex items-center justify-center gap-2 py-3.5"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <><UserPlus size={18} /> Create Account</>
                                )}
                            </motion.button>
                        </form>
                        )}

                        <div className="mt-6 text-center text-sm text-gray-400">
                            Already have an account?{' '}
                            <Link to="/signin" className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
                                Sign In
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
