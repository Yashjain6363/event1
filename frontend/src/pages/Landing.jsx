import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, UserPlus, LogIn, ChevronDown, Star, Calendar, Users } from 'lucide-react';

export default function Landing() {
    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
                {/* Background */}
                <div className="absolute inset-0">
                    <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url('/bmsce-building.jpg')` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/75 to-slate-950" />
                </div>

                {/* Animated blobs */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl animate-float" />
                    <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s', animationDirection: 'reverse' }} />
                    <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
                </div>

                {/* Hero Content */}
                <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                    >
                        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl glass mb-8 text-sm font-medium text-indigo-300">
                            <Star size={16} className="text-amber-400" />
                            <span>BMS College of Engineering</span>
                        </div>

                        <h1 className="text-5xl sm:text-7xl font-extrabold mb-6 leading-tight tracking-tight">
                            <span className="gradient-text">BMSCE</span>
                            <br />
                            <span className="text-white">Events Portal</span>
                        </h1>

                        <p className="text-xl sm:text-2xl text-gray-300 max-w-xl mx-auto mb-3 font-medium">
                            Discover. Register. Participate.
                        </p>
                        <p className="text-base text-gray-400 max-w-lg mx-auto mb-12">
                            Your one-stop hub for college events, workshops, competitions, and cultural fests.
                        </p>
                    </motion.div>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                    >
                        <Link to="/signup" id="student-signup-btn">
                            <motion.div
                                whileHover={{ scale: 1.03, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold text-white text-base cursor-pointer"
                                style={{
                                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                    boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)',
                                }}
                            >
                                <UserPlus size={20} /> Student Sign Up
                            </motion.div>
                        </Link>

                        <Link to="/signin" id="student-signin-btn">
                            <motion.div
                                whileHover={{ scale: 1.03, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold text-white text-base glass border border-white/10 cursor-pointer hover:border-indigo-500/40 hover:bg-white/5 transition-all duration-300"
                            >
                                <LogIn size={20} /> Student Sign In
                            </motion.div>
                        </Link>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        className="mt-8"
                    >
                        <Link to="/admin-login" className="text-sm text-gray-500 hover:text-indigo-400 transition-colors">
                            Club Admin? Login here →
                        </Link>
                    </motion.div>

                    {/* Scroll indicator */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.5 }}
                        className="absolute bottom-10 left-1/2 -translate-x-1/2"
                    >
                        <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                            <ChevronDown size={24} className="text-gray-500" />
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-24 px-4">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">Why BMSCE Events?</h2>
                        <p className="text-gray-400 max-w-xl mx-auto text-lg">
                            Explore activities across 35+ clubs and participate in events that shape your college experience.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { icon: Calendar, label: 'Events Year-Round', desc: 'Technical, cultural, sports, and professional events every month', color: 'from-indigo-600 to-violet-600' },
                            { icon: Users, label: '35+ Active Clubs', desc: 'From coding to music, robotics to business — find your tribe', color: 'from-pink-600 to-rose-600' },
                            { icon: Star, label: 'Easy Registration', desc: 'Sign up, browse events, and register in just a few clicks', color: 'from-amber-500 to-orange-500' },
                        ].map(({ icon: Icon, label, desc, color }, i) => (
                            <motion.div
                                key={label}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
                                className="card-modern glass-hover p-8 text-center"
                            >
                                <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${color} mb-6 shadow-lg`}>
                                    <Icon size={24} className="text-white" />
                                </div>
                                <h3 className="text-white font-semibold text-xl mb-3">{label}</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section className="py-20 px-4 border-t border-white/5">
                <div className="max-w-3xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-3xl font-bold text-white mb-6 tracking-tight">About BMSCE</h2>
                        <p className="text-gray-400 leading-relaxed text-lg">
                            BMS College of Engineering is one of the premier engineering institutions in India,
                            established in 1946. Known for academic excellence and vibrant campus life,
                            BMSCE hosts dozens of events throughout the year organized by its diverse clubs and student bodies.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/5 py-10 px-4">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <GraduationCap size={20} className="text-indigo-400" />
                        <span className="text-sm text-gray-400">BMSCE Events Portal © {new Date().getFullYear()}</span>
                    </div>
                    <p className="text-sm text-gray-500">
                        Bull Temple Road, Basavanagudi, Bengaluru, Karnataka 560019
                    </p>
                </div>
            </footer>
        </div>
    );
}
