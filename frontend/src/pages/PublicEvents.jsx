import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Users, IndianRupee, Ticket, ArrowRight } from 'lucide-react';
import { getAllEvents, API_BASE } from '../api/api';
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

export default function PublicEvents() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAllEvents()
            .then((res) => setEvents(res.data.events || []))
            .catch(() => setEvents([]))
            .finally(() => setLoading(false));
    }, []);

    const now = new Date();
    const sorted = [...events].sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));
    const upcoming = sorted.filter((e) => new Date(e.eventDate) >= now);
    const past = sorted.filter((e) => new Date(e.eventDate) < now);

    return (
        <div className="min-h-screen">
            <Navbar />
            <div className="pt-24 pb-16 px-4 max-w-6xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-2">
                        Browse Events
                    </h1>
                    <p className="text-gray-400">
                        View event details. Sign in to register for an event.
                    </p>
                </motion.div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="space-y-10">
                        {upcoming.length > 0 && (
                            <section>
                                <h2 className="text-lg font-semibold text-gray-300 mb-4">Upcoming</h2>
                                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                    {upcoming.map((event, i) => (
                                        <EventCard key={event._id} event={event} i={i} />
                                    ))}
                                </div>
                            </section>
                        )}
                        {past.length > 0 && (
                            <section>
                                <h2 className="text-lg font-semibold text-gray-500 mb-4">Past events</h2>
                                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                    {past.map((event, i) => (
                                        <EventCard key={event._id} event={event} i={i} isPast />
                                    ))}
                                </div>
                            </section>
                        )}
                        {!loading && events.length === 0 && (
                            <p className="text-center text-gray-500 py-12">No events yet.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function EventCard({ event, i, isPast = false }) {
    const d = formatDate(event.eventDate);
    const cc = getCatColor(event.category);
    const isFree = !event.registrationFee || event.registrationFee === 0;
    const imageUrl = event.imageURL
        ? `${API_BASE}${event.imageURL.startsWith('/') ? '' : '/'}${event.imageURL}`
        : null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`glass-hover rounded-2xl overflow-hidden group ${isPast ? 'opacity-60' : ''}`}
        >
            <Link to={`/events/${event._id}`} className="block">
                {imageUrl ? (
                    <div className="relative h-36 overflow-hidden">
                        <img
                            src={imageUrl}
                            alt={event.eventName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute top-3 right-3">
                            <span className={`text-xs px-2.5 py-1 rounded-full ${cc.bg} ${cc.text} border ${cc.border}`}>
                                {event.category}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="h-28 bg-gradient-to-br from-indigo-600/40 to-violet-600/40 flex items-center justify-center">
                        <Ticket size={40} className="text-white/50" />
                        <span className={`absolute top-3 right-3 text-xs px-2.5 py-1 rounded-full ${cc.bg} ${cc.text} border ${cc.border}`}>
                            {event.category}
                        </span>
                    </div>
                )}
                <div className="p-4">
                    <h3 className="font-semibold text-white mb-1 line-clamp-2 group-hover:text-indigo-200 transition-colors">
                        {event.eventName}
                    </h3>
                    <p className="text-sm text-gray-400 mb-3">{event.clubName}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {d.day} {d.month} · {d.time}
                        </span>
                        {event.venue && (
                            <span className="flex items-center gap-1">
                                <MapPin size={12} /> {event.venue}
                            </span>
                        )}
                        {event.maxRegistrations > 0 && (
                            <span className="flex items-center gap-1">
                                <Users size={12} />
                                {event.registrationCount || 0}/{event.maxRegistrations}
                            </span>
                        )}
                        <span className={isFree ? 'text-emerald-400' : 'text-amber-400'}>
                            {isFree ? 'Free' : `₹${event.registrationFee}`}
                        </span>
                    </div>
                    <p className="mt-3 text-indigo-400 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                        View details <ArrowRight size={14} />
                    </p>
                </div>
            </Link>
        </motion.div>
    );
}
