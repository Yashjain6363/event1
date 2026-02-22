import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Calendar,
    MapPin,
    Users,
    IndianRupee,
    Ticket,
    ArrowLeft,
    LogIn,
    UserPlus,
    CheckCircle2,
    Loader2,
    Phone,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getEventById, getMyRegistrations, registerFreeEvent, createPaymentOrder, verifyPayment, API_BASE } from '../api/api';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';

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

const formatDate = (d) => {
    const date = new Date(d);
    return {
        day: date.getDate(),
        month: date.toLocaleString('en-IN', { month: 'short' }),
        year: date.getFullYear(),
        time: date.toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        full: date.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    };
};

export default function EventDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [registeredEventIds, setRegisteredEventIds] = useState(new Set());
    const [registeringId, setRegisteringId] = useState(null);

    useEffect(() => {
        getEventById(id)
            .then((res) => setEvent(res.data.event))
            .catch(() => setEvent(null))
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        if (user) {
            getMyRegistrations()
                .then((res) => {
                    const ids = new Set((res.data.registrations || []).map((r) => r.event?._id || r.event));
                    setRegisteredEventIds(ids);
                })
                .catch(() => {});
        }
    }, [user]);

    const handleRegister = async () => {
        if (!event || registeredEventIds.has(event._id)) return;
        if (event.maxRegistrations > 0 && event.registrationCount >= event.maxRegistrations) {
            return toast.error('Registration is full for this event');
        }
        const isFree = !event.registrationFee || event.registrationFee === 0;
        if (isFree) {
            setRegisteringId(event._id);
            try {
                await registerFreeEvent({ eventId: event._id });
                setRegisteredEventIds((prev) => new Set([...prev, event._id]));
                setEvent((e) => (e ? { ...e, registrationCount: (e.registrationCount || 0) + 1 } : null));
                toast.success('Successfully registered! 🎉');
            } catch (err) {
                toast.error(err.response?.data?.message || 'Registration failed');
            } finally {
                setRegisteringId(null);
            }
        } else {
            setRegisteringId(event._id);
            try {
                const orderRes = await createPaymentOrder({ eventId: event._id });
                const { order, key } = orderRes.data;
                const options = {
                    key,
                    amount: order.amount,
                    currency: order.currency,
                    name: 'BMSCE Events Portal',
                    description: `Registration: ${event.eventName}`,
                    order_id: order.id,
                    prefill: { name: user?.fullName || '', email: user?.email || '' },
                    theme: { color: '#8B5CF6' },
                    handler: async (response) => {
                        try {
                            await verifyPayment({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                eventId: event._id,
                            });
                            setRegisteredEventIds((prev) => new Set([...prev, event._id]));
                            setEvent((e) => (e ? { ...e, registrationCount: (e.registrationCount || 0) + 1 } : null));
                            toast.success('Payment successful! You are registered 🎉');
                        } catch (err) {
                            toast.error('Payment verification failed.');
                        }
                        setRegisteringId(null);
                    },
                    modal: { ondismiss: () => { setRegisteringId(null); toast('Payment cancelled', { icon: 'ℹ️' }); } },
                };
                if (!window.Razorpay) {
                    toast.error('Payment system is loading. Please try again.');
                    setRegisteringId(null);
                    return;
                }
                const rzp = new window.Razorpay(options);
                rzp.on('payment.failed', () => {
                    toast.error('Payment failed.');
                    setRegisteringId(null);
                });
                rzp.open();
            } catch (err) {
                toast.error(err.response?.data?.message || 'Failed to start payment');
                setRegisteringId(null);
            }
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen">
                <Navbar />
                <div className="pt-24 flex justify-center">
                    <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-screen">
                <Navbar />
                <div className="pt-24 px-4 text-center">
                    <p className="text-gray-400 mb-4">Event not found.</p>
                    <Link to="/events" className="text-indigo-400 hover:text-indigo-300">← Back to events</Link>
                </div>
            </div>
        );
    }

    const d = formatDate(event.eventDate);
    const cc = getCatColor(event.category);
    const isFree = !event.registrationFee || event.registrationFee === 0;
    const isPast = new Date(event.eventDate) < new Date();
    const isRegistered = registeredEventIds.has(event._id);
    const isFull = event.maxRegistrations > 0 && event.registrationCount >= event.maxRegistrations;
    const imageUrl = event.imageURL
        ? `${API_BASE}${event.imageURL.startsWith('/') ? '' : '/'}${event.imageURL}`
        : null;

    return (
        <div className="min-h-screen">
            <Navbar />
            <div className="pt-24 pb-16 px-4 max-w-4xl mx-auto">
                <Link
                    to="/events"
                    className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
                >
                    <ArrowLeft size={18} /> Back to events
                </Link>

                <motion.article
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-3xl overflow-hidden border border-white/5"
                >
                    {imageUrl ? (
                        <div className="relative h-56 sm:h-72 overflow-hidden">
                            <img
                                src={imageUrl}
                                alt={event.eventName}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                            <div className="absolute top-4 right-4">
                                <span className={`text-sm px-3 py-1.5 rounded-xl ${cc.bg} ${cc.text} border ${cc.border}`}>
                                    {event.category}
                                </span>
                            </div>
                            <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
                                <span className="text-sm px-3 py-1.5 rounded-xl bg-black/50 text-white">
                                    {d.full} · {d.time}
                                </span>
                                {isFree ? (
                                    <span className="text-sm px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300">
                                        Free
                                    </span>
                                ) : (
                                    <span className="text-sm px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300">
                                        ₹{event.registrationFee}
                                    </span>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="h-40 bg-gradient-to-br from-indigo-600/40 to-violet-600/40 flex items-center justify-center relative">
                            <Ticket size={64} className="text-white/40" />
                            <span className={`absolute top-4 right-4 text-sm px-3 py-1.5 rounded-xl ${cc.bg} ${cc.text} border ${cc.border}`}>
                                {event.category}
                            </span>
                        </div>
                    )}

                    <div className="p-6 sm:p-8">
                        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{event.eventName}</h1>
                        <p className="text-gray-400 mb-6">{event.clubName}</p>

                        <div className="prose prose-invert max-w-none text-gray-300 mb-8 whitespace-pre-wrap">
                            {event.description}
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-8">
                            <span className="flex items-center gap-2">
                                <Calendar size={18} className="text-indigo-400" />
                                {d.full}, {d.time}
                            </span>
                            {event.venue && (
                                <span className="flex items-center gap-2">
                                    <MapPin size={18} className="text-indigo-400" />
                                    {event.venue}
                                </span>
                            )}
                            {event.phoneNumber && (
                                <span className="flex items-center gap-2">
                                    <Phone size={18} className="text-indigo-400" />
                                    {event.phoneNumber}
                                </span>
                            )}
                            {event.maxRegistrations > 0 && (
                                <span className="flex items-center gap-2">
                                    <Users size={18} className="text-indigo-400" />
                                    {event.registrationCount || 0} / {event.maxRegistrations} spots
                                </span>
                            )}
                        </div>

                        {/* Register / Sign in CTA */}
                        <div className="pt-6 border-t border-white/10">
                            {!user ? (
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <p className="text-gray-400 text-sm sm:mb-0 mb-2">
                                        Sign in or sign up to register for this event.
                                    </p>
                                    <div className="flex flex-wrap gap-3">
                                        <Link
                                            to={`/signin?redirect=${encodeURIComponent(`/events/${event._id}`)}`}
                                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors"
                                        >
                                            <LogIn size={18} /> Sign in to register
                                        </Link>
                                        <Link
                                            to={`/signup?redirect=${encodeURIComponent(`/events/${event._id}`)}`}
                                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white glass border border-white/10 hover:border-indigo-500/40 hover:bg-white/5 transition-all"
                                        >
                                            <UserPlus size={18} /> Sign up
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {isPast ? (
                                        <p className="text-gray-500">This event has ended.</p>
                                    ) : isRegistered ? (
                                        <div className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                            <CheckCircle2 size={18} /> You are registered
                                        </div>
                                    ) : isFull ? (
                                        <p className="text-gray-500">Registration is full.</p>
                                    ) : (
                                        <motion.button
                                            onClick={handleRegister}
                                            disabled={registeringId !== null}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white disabled:opacity-70"
                                            style={
                                                isFree
                                                    ? {
                                                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                                            boxShadow: '0 4px 20px rgba(99, 102, 241, 0.35)',
                                                        }
                                                    : {
                                                            background: 'linear-gradient(135deg, #f59e0b, #ec4899)',
                                                            boxShadow: '0 4px 20px rgba(245, 158, 11, 0.35)',
                                                        }
                                            }
                                        >
                                            {registeringId === event._id ? (
                                                <Loader2 size={18} className="animate-spin" />
                                            ) : isFree ? (
                                                'Register for this event'
                                            ) : (
                                                <>
                                                    <IndianRupee size={18} /> Pay ₹{event.registrationFee} & Register
                                                </>
                                            )}
                                        </motion.button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </motion.article>
            </div>
        </div>
    );
}
