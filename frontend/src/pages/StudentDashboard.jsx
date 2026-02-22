import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Users, Search, Filter, IndianRupee, CheckCircle2, Loader2, Ticket, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAllEvents, getMyRegistrations, createPaymentOrder, verifyPayment, registerFreeEvent } from '../api/api';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';

export default function StudentDashboard() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('events');
    const [events, setEvents] = useState([]);
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [regLoading, setRegLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [registeredEventIds, setRegisteredEventIds] = useState(new Set());
    const [registeringId, setRegisteringId] = useState(null);

    const fetchRegistrations = () => {
        setRegLoading(true);
        getMyRegistrations()
            .then(res => {
                setRegistrations(res.data.registrations || []);
                setRegisteredEventIds(new Set((res.data.registrations || []).map(r => r.event?._id || r.event)));
            })
            .catch(() => toast.error('Failed to load registrations'))
            .finally(() => setRegLoading(false));
    };

    useEffect(() => {
        getAllEvents()
            .then(res => setEvents(res.data.events))
            .catch(() => toast.error('Failed to load events'))
            .finally(() => setLoading(false));

        getMyRegistrations()
            .then(res => {
                setRegistrations(res.data.registrations || []);
                setRegisteredEventIds(new Set((res.data.registrations || []).map(r => r.event?._id || r.event)));
            })
            .catch(() => { });
    }, []);

    const categories = ['all', ...new Set(events.map(e => e.category))];

    const filteredEvents = events.filter(e => {
        const matchSearch = e.eventName.toLowerCase().includes(search.toLowerCase()) ||
            e.clubName.toLowerCase().includes(search.toLowerCase()) ||
            e.description.toLowerCase().includes(search.toLowerCase());
        const matchCategory = filterCategory === 'all' || e.category === filterCategory;
        return matchSearch && matchCategory;
    });

    const sortedEvents = [...filteredEvents].sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));
    const now = new Date();
    const upcomingEvents = sortedEvents.filter(e => new Date(e.eventDate) >= now);
    const pastEvents = sortedEvents.filter(e => new Date(e.eventDate) < now);

    const formatDate = (d) => {
        const date = new Date(d);
        return {
            day: date.getDate(),
            month: date.toLocaleString('en-IN', { month: 'short' }),
            year: date.getFullYear(),
            time: date.toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            full: date.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        };
    };

    const categoryColors = {
        'Social Clubs': { bg: 'bg-green-500/15', text: 'text-green-400', border: 'border-green-500/30' },
        'Cultural Clubs': { bg: 'bg-pink-500/15', text: 'text-pink-400', border: 'border-pink-500/30' },
        'Quiz Club': { bg: 'bg-yellow-500/15', text: 'text-yellow-400', border: 'border-yellow-500/30' },
        'Gaming Club': { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30' },
        'Professional Bodies': { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' },
        'Coding Clubs': { bg: 'bg-cyan-500/15', text: 'text-cyan-400', border: 'border-cyan-500/30' },
        'Technical Clubs': { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30' },
        'Business Related Clubs': { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
    };

    const getCatColor = (cat) => categoryColors[cat] || { bg: 'bg-gray-500/15', text: 'text-gray-400', border: 'border-gray-500/30' };

    // ======== Registration Handlers ========

    const handleRegister = async (event) => {
        if (registeredEventIds.has(event._id)) return;

        // Check if spots available
        if (event.maxRegistrations > 0 && event.registrationCount >= event.maxRegistrations) {
            return toast.error('Registration is full for this event');
        }

        if (event.registrationFee > 0) {
            // Paid event — Razorpay flow
            await handlePaidRegistration(event);
        } else {
            // Free event — direct registration
            await handleFreeRegistration(event);
        }
    };

    const handleFreeRegistration = async (event) => {
        setRegisteringId(event._id);
        try {
            await registerFreeEvent({ eventId: event._id });
            setRegisteredEventIds(prev => new Set([...prev, event._id]));
            setEvents(prev => prev.map(e =>
                e._id === event._id ? { ...e, registrationCount: (e.registrationCount || 0) + 1 } : e
            ));
            fetchRegistrations();
            toast.success('Successfully registered! 🎉');
        } catch (err) {
            console.error('Free Registration Frontend Error:', err);
            const msg = err.response?.data?.message || err.message || 'Registration failed';
            toast.error(msg);
        } finally {
            setRegisteringId(null);
        }
    };

    const handlePaidRegistration = async (event) => {
        setRegisteringId(event._id);
        try {
            // Step 1: Create Razorpay order
            const orderRes = await createPaymentOrder({ eventId: event._id });
            const { order, key } = orderRes.data;

            // Step 2: Open Razorpay checkout
            const options = {
                key: key,
                amount: order.amount,
                currency: order.currency,
                name: 'BMSCE Events Portal',
                description: `Registration: ${event.eventName}`,
                order_id: order.id,
                prefill: {
                    name: user?.fullName || '',
                    email: user?.email || '',
                },
                theme: {
                    color: '#8B5CF6'
                },
                handler: async (response) => {
                    // Step 3: Verify payment
                    try {
                        await verifyPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            eventId: event._id
                        });
                        setRegisteredEventIds(prev => new Set([...prev, event._id]));
                        setEvents(prev => prev.map(e =>
                            e._id === event._id ? { ...e, registrationCount: (e.registrationCount || 0) + 1 } : e
                        ));
                        fetchRegistrations();
                        toast.success('Payment successful! You are registered 🎉');
                    } catch (err) {
                        toast.error('Payment verification failed. Contact support.');
                    }
                    setRegisteringId(null);
                },
                modal: {
                    ondismiss: () => {
                        setRegisteringId(null);
                        toast('Payment cancelled', { icon: 'ℹ️' });
                    }
                }
            };

            // Check if Razorpay is loaded
            if (!window.Razorpay) {
                toast.error('Payment system is loading. Please try again.');
                setRegisteringId(null);
                return;
            }

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', (response) => {
                toast.error(`Payment failed: ${response.error?.description || 'Unknown error'}`);
                setRegisteringId(null);
            });
            rzp.open();
        } catch (err) {
            console.error('Paid Registration Frontend Error:', err);
            const msg = err.response?.data?.message || err.message || 'Failed to initiate payment';
            toast.error(msg);
            setRegisteringId(null);
        }
    };

    // ======== Render ========

    const renderEventCard = (event, i, isPast = false) => {
        const d = formatDate(event.eventDate);
        const cc = getCatColor(event.category);
        const isRegistered = registeredEventIds.has(event._id);
        const isRegistering = registeringId === event._id;
        const isFull = event.maxRegistrations > 0 && event.registrationCount >= event.maxRegistrations;
        const isFree = !event.registrationFee || event.registrationFee === 0;

        return (
            <motion.div
                key={event._id}
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`card-modern glass-hover overflow-hidden group ${isPast ? 'opacity-60' : ''}`}
            >
                {/* Event Image / Color Banner */}
                {event.imageURL ? (
                    <div className="relative h-36 overflow-hidden">
                        <img src={`http://localhost:5000${event.imageURL.startsWith('/') ? '' : '/'}${event.imageURL}`} alt={event.eventName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute top-3 right-3">
                            <span className={`text-xs px-2.5 py-1 rounded-full ${cc.bg} ${cc.text} border ${cc.border}`}>
                                {event.category}
                            </span>
                        </div>
                        {/* Fee badge on image */}
                        <div className="absolute bottom-3 left-3">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${isFree
                                ? 'bg-green-500/90 text-white'
                                : 'bg-amber-500/90 text-white'
                                }`}>
                                {isFree ? 'FREE' : `₹${event.registrationFee}`}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="h-20 bg-gradient-to-r from-purple-900/50 to-pink-900/50 flex items-center justify-between px-5">
                        <span className={`text-xs px-2.5 py-1 rounded-full ${cc.bg} ${cc.text} border ${cc.border}`}>
                            {event.category}
                        </span>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${isFree ? 'bg-green-500/90 text-white' : 'bg-amber-500/90 text-white'
                            }`}>
                            {isFree ? 'FREE' : `₹${event.registrationFee}`}
                        </span>
                    </div>
                )}

                <div className="p-5">
                    {/* Date Badge */}
                    <div className="flex items-start gap-3 mb-3">
                        <div className="shrink-0 w-12 h-14 rounded-xl bg-purple-600/20 border border-purple-500/30 flex flex-col items-center justify-center text-center">
                            <span className="text-lg font-bold text-purple-300 leading-tight">{d.day}</span>
                            <span className="text-[10px] text-purple-400 uppercase">{d.month}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-white leading-snug line-clamp-2">{event.eventName}</h3>
                            <p className="text-xs text-gray-400 mt-0.5">{event.clubName}</p>
                        </div>
                    </div>

                    <p className="text-sm text-gray-400 line-clamp-2 mb-4">{event.description}</p>

                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-4 flex-wrap">
                        <span className="flex items-center gap-1">
                            <Calendar size={11} /> {d.time}
                        </span>
                        {event.venue && (
                            <span className="flex items-center gap-1">
                                <MapPin size={11} /> {event.venue}
                            </span>
                        )}
                        {event.maxRegistrations > 0 && (
                            <span className="flex items-center gap-1">
                                <Users size={11} />
                                {event.registrationCount || 0}/{event.maxRegistrations} spots
                            </span>
                        )}
                    </div>

                    {/* Register Button */}
                    {!isPast ? (
                        isRegistered ? (
                            <div className="w-full py-2.5 rounded-xl font-semibold text-sm text-center flex items-center justify-center gap-2"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.2))',
                                    border: '1px solid rgba(34, 197, 94, 0.3)'
                                }}>
                                <CheckCircle2 size={16} className="text-green-400" />
                                <span className="text-green-400">Registered ✓</span>
                            </div>
                        ) : isFull ? (
                            <div className="w-full py-2.5 rounded-xl font-semibold text-sm text-center text-gray-500 glass">
                                Registration Full
                            </div>
                        ) : (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleRegister(event)}
                                disabled={isRegistering}
                                className="w-full py-3 rounded-2xl font-semibold text-sm text-white transition-all flex items-center justify-center gap-2"
                                style={{
                                    background: isFree
                                        ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                                        : 'linear-gradient(135deg, #f59e0b, #ec4899)',
                                    boxShadow: isFree
                                        ? '0 4px 20px rgba(99, 102, 241, 0.35)'
                                        : '0 4px 20px rgba(245, 158, 11, 0.35)'
                                }}
                            >
                                {isRegistering ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : isFree ? (
                                    'Register Now'
                                ) : (
                                    <>
                                        <IndianRupee size={14} /> Pay ₹{event.registrationFee} & Register
                                    </>
                                )}
                            </motion.button>
                        )
                    ) : null}
                </div>
            </motion.div>
        );
    };

    // My Registrations view — sorted by date (upcoming first)
    const sortedRegistrations = [...registrations]
        .filter(r => r.event)
        .sort((a, b) => new Date(a.event.eventDate) - new Date(b.event.eventDate));
    const upcomingRegs = sortedRegistrations.filter(r => new Date(r.event.eventDate) >= now);
    const pastRegs = sortedRegistrations.filter(r => new Date(r.event.eventDate) < now);

    const renderRegistrationCard = (reg, i, isPast = false) => {
        const event = reg.event;
        const d = formatDate(event.eventDate);
        const cc = getCatColor(event.category);
        const isFree = !event.registrationFee || event.registrationFee === 0;

        return (
            <motion.div
                key={reg._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`card-modern glass-hover group ${isPast ? 'opacity-70' : ''}`}
            >
                <div className="flex flex-col sm:flex-row">
                    {event.imageURL ? (
                        <div className="relative sm:w-48 h-32 sm:h-auto shrink-0 overflow-hidden">
                            <img src={`http://localhost:5000${event.imageURL.startsWith('/') ? '' : '/'}${event.imageURL}`} alt={event.eventName}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent sm:bg-gradient-to-r" />
                        </div>
                    ) : (
                        <div className="sm:w-32 shrink-0 bg-gradient-to-br from-indigo-600/30 to-pink-600/30 flex items-center justify-center">
                            <Ticket size={32} className="text-white/60" />
                        </div>
                    )}
                    <div className="flex-1 p-5 flex flex-col justify-between">
                        <div>
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className={`text-xs px-2.5 py-1 rounded-xl ${cc.bg} ${cc.text} border ${cc.border}`}>
                                    {event.category}
                                </span>
                                <span className={`text-xs px-2.5 py-1 rounded-xl font-medium ${isFree ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                    {isFree ? 'FREE' : `₹${event.registrationFee} paid`}
                                </span>
                                <span className="flex items-center gap-1 text-xs text-emerald-400">
                                    <CheckCircle2 size={12} /> Registered
                                </span>
                            </div>
                            <h3 className="font-semibold text-white text-lg mb-1">{event.eventName}</h3>
                            <p className="text-sm text-gray-400 mb-3">{event.clubName}</p>
                            <p className="text-sm text-gray-500 line-clamp-2">{event.description}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-white/5 text-xs text-gray-500">
                            <span className="flex items-center gap-1.5">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex flex-col items-center justify-center">
                                    <span className="text-sm font-bold text-indigo-300 leading-tight">{d.day}</span>
                                    <span className="text-[10px] text-indigo-400">{d.month}</span>
                                </div>
                                <span className="text-gray-400">{d.time}</span>
                            </span>
                            {event.venue && (
                                <span className="flex items-center gap-1">
                                    <MapPin size={12} /> {event.venue}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    };

    return (
        <div className="min-h-screen">
            <Navbar />
            <div className="pt-24 pb-16 px-4 sm:px-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 tracking-tight">
                            Welcome back, <span className="gradient-text">{user?.fullName?.split(' ')[0]}</span>
                        </h1>
                        <p className="text-gray-400 text-lg">Discover events and manage your registrations</p>
                    </motion.div>

                    {/* Tabs */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="flex gap-1 p-1.5 rounded-2xl glass mb-8 w-fit"
                    >
                        <button
                            onClick={() => setActiveTab('events')}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${activeTab === 'events'
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <Sparkles size={18} /> Browse Events
                            <span className="text-xs opacity-80">({events.length})</span>
                        </button>
                        <button
                            onClick={() => { setActiveTab('registrations'); fetchRegistrations(); }}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${activeTab === 'registrations'
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <Ticket size={18} /> My Registrations
                            <span className="text-xs opacity-80">({registrations.length})</span>
                        </button>
                    </motion.div>

                    <AnimatePresence mode="wait">
                        {activeTab === 'events' ? (
                            <motion.div
                                key="events"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                transition={{ duration: 0.2 }}
                            >
                                {/* Search & Filter */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="glass rounded-2xl p-4 mb-8"
                                >
                                    <div className="flex flex-col md:flex-row gap-4">
                                        <div className="relative flex-1">
                                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                                            <input
                                                type="text"
                                                placeholder="Search events, clubs..."
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                                className="input-field pl-11"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Filter size={16} className="text-gray-500" />
                                            {categories.map(cat => (
                                                <button key={cat} onClick={() => setFilterCategory(cat)}
                                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${filterCategory === cat
                                                        ? 'bg-indigo-600 text-white'
                                                        : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5'
                                                        }`}
                                                >
                                                    {cat === 'all' ? 'All' : cat}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>

                                {loading ? (
                                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                                        <div className="w-12 h-12 border-2 border-indigo-500/50 border-t-indigo-400 rounded-full animate-spin" />
                                        <p className="text-gray-500">Loading events...</p>
                                    </div>
                                ) : sortedEvents.length === 0 ? (
                                    <div className="text-center py-32">
                                        <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-6">
                                            <Calendar size={40} className="text-indigo-400" />
                                        </div>
                                        <p className="text-gray-400 text-lg mb-2">
                                            {search || filterCategory !== 'all' ? 'No events match your search' : 'No events scheduled yet'}
                                        </p>
                                        <p className="text-gray-500 text-sm">Check back soon for new events!</p>
                                    </div>
                                ) : (
                                    <>
                                        {upcomingEvents.length > 0 && (
                                            <div className="mb-12">
                                                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                                                    <span className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                                        <Calendar size={20} className="text-emerald-400" />
                                                    </span>
                                                    Upcoming Events
                                                    <span className="text-sm font-medium px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400">{upcomingEvents.length}</span>
                                                </h2>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                    {upcomingEvents.map((event, i) => renderEventCard(event, i))}
                                                </div>
                                            </div>
                                        )}
                                        {pastEvents.length > 0 && (
                                            <div>
                                                <h2 className="text-xl font-bold text-gray-400 mb-6 flex items-center gap-3">
                                                    <span className="w-10 h-10 rounded-xl bg-gray-500/20 flex items-center justify-center">
                                                        <Calendar size={20} className="text-gray-500" />
                                                    </span>
                                                    Past Events
                                                    <span className="text-sm font-medium px-3 py-1 rounded-full bg-gray-500/20 text-gray-500">{pastEvents.length}</span>
                                                </h2>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                    {pastEvents.map((event, i) => renderEventCard(event, i, true))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="registrations"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                {regLoading ? (
                                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                                        <div className="w-12 h-12 border-2 border-indigo-500/50 border-t-indigo-400 rounded-full animate-spin" />
                                        <p className="text-gray-500">Loading your registrations...</p>
                                    </div>
                                ) : registrations.length === 0 ? (
                                    <div className="text-center py-32">
                                        <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-6">
                                            <Ticket size={40} className="text-indigo-400" />
                                        </div>
                                        <p className="text-gray-400 text-lg mb-2">No registrations yet</p>
                                        <p className="text-gray-500 text-sm mb-6">Browse events and register to see them here</p>
                                        <button
                                            onClick={() => setActiveTab('events')}
                                            className="px-6 py-3 rounded-2xl font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
                                        >
                                            Browse Events
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-8">
                                        {upcomingRegs.length > 0 && (
                                            <div>
                                                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                                                    <span className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                                        <CheckCircle2 size={20} className="text-emerald-400" />
                                                    </span>
                                                    Upcoming
                                                    <span className="text-sm font-medium px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400">{upcomingRegs.length}</span>
                                                </h2>
                                                <div className="space-y-4">
                                                    {upcomingRegs.map((reg, i) => renderRegistrationCard(reg, i))}
                                                </div>
                                            </div>
                                        )}
                                        {pastRegs.length > 0 && (
                                            <div>
                                                <h2 className="text-xl font-bold text-gray-400 mb-6 flex items-center gap-3">
                                                    <span className="w-10 h-10 rounded-xl bg-gray-500/20 flex items-center justify-center">
                                                        <Calendar size={20} className="text-gray-500" />
                                                    </span>
                                                    Past
                                                    <span className="text-sm font-medium px-3 py-1 rounded-full bg-gray-500/20 text-gray-500">{pastRegs.length}</span>
                                                </h2>
                                                <div className="space-y-4">
                                                    {pastRegs.map((reg, i) => renderRegistrationCard(reg, i, true))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
