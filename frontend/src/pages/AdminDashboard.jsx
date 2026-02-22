import { useState, useEffect, useRef } from 'react';
    import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Calendar, Trash2, Edit2, Save, X, Upload, MapPin, KeyRound, Lock, Eye, EyeOff,
    IndianRupee, Users, ChevronDown, ChevronUp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAllEvents, createEvent, updateEvent, deleteEvent, adminResetPassword, getEventRegistrations, API_BASE } from '../api/api';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';

export default function AdminDashboard() {
    const { user } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [preview, setPreview] = useState(null);
    const fileRef = useRef(null);

    // Password reset state
    const [showResetPassword, setShowResetPassword] = useState(false);
    const [resetForm, setResetForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [resetLoading, setResetLoading] = useState(false);
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);

    // Registration viewer state
    const [viewingRegistrations, setViewingRegistrations] = useState(null); // eventId
    const [registrations, setRegistrations] = useState([]);
    const [registrationsLoading, setRegistrationsLoading] = useState(false);

    const emptyForm = { eventName: '', description: '', eventDate: '', venue: 'BMSCE Campus', phoneNumber: '', registrationFee: '0', maxRegistrations: '' };
    const [form, setForm] = useState(emptyForm);
    const [imageFile, setImageFile] = useState(null);

    const fetchEvents = () => {
        setLoading(true);
        getAllEvents()
            .then(res => {
                const myEvents = res.data.events.filter(
                    e => e.createdBy?._id === user._id || e.createdBy === user._id
                );
                setEvents(myEvents);
            })
            .catch(() => toast.error('Failed to load events'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchEvents(); }, []);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImageFile(file);
        setPreview(URL.createObjectURL(file));
    };

    const resetEventForm = () => {
        setForm(emptyForm);
        setImageFile(null);
        setPreview(null);
        setEditingId(null);
        setShowForm(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.eventName || !form.description || !form.eventDate) {
            return toast.error('Please fill all required fields');
        }

        setSubmitting(true);
        try {
            const fd = new FormData();
            fd.append('eventName', form.eventName);
            fd.append('description', form.description);
            fd.append('eventDate', form.eventDate);
            fd.append('venue', form.venue);
            fd.append('phoneNumber', form.phoneNumber);
            fd.append('registrationFee', form.registrationFee || '0');
            if (form.maxRegistrations) fd.append('maxRegistrations', form.maxRegistrations);
            if (imageFile) fd.append('eventImage', imageFile);

            if (editingId) {
                await updateEvent(editingId, fd);
                toast.success('Event updated!');
            } else {
                await createEvent(fd);
                toast.success('Event created! 🎉');
            }
            resetEventForm();
            fetchEvents();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save event');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (event) => {
        const localDate = event.eventDate
            ? new Date(new Date(event.eventDate).getTime() - new Date(event.eventDate).getTimezoneOffset() * 60000)
                .toISOString().slice(0, 16)
            : '';
        setForm({
            eventName: event.eventName,
            description: event.description,
            eventDate: localDate,
            venue: event.venue || 'BMSCE Campus',
            phoneNumber: event.phoneNumber || '',
            registrationFee: String(event.registrationFee || 0),
            maxRegistrations: event.maxRegistrations > 0 ? String(event.maxRegistrations) : ''
        });
        setEditingId(event._id);
        if (event.imageURL) setPreview(`${API_BASE}${event.imageURL.startsWith('/') ? '' : '/'}${event.imageURL}`);
        setShowForm(true);
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
        try {
            await deleteEvent(id);
            toast.success('Event deleted');
            fetchEvents();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete');
        }
    };

    // View registrations for an event
    const toggleRegistrations = async (eventId) => {
        if (viewingRegistrations === eventId) {
            setViewingRegistrations(null);
            setRegistrations([]);
            return;
        }
        setViewingRegistrations(eventId);
        setRegistrationsLoading(true);
        try {
            const res = await getEventRegistrations(eventId);
            setRegistrations(res.data.registrations);
        } catch (err) {
            toast.error('Failed to load registrations');
        } finally {
            setRegistrationsLoading(false);
        }
    };

    // Password reset handler
    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!resetForm.currentPassword || !resetForm.newPassword || !resetForm.confirmPassword) {
            return toast.error('All fields are required');
        }
        if (resetForm.newPassword.length < 6) {
            return toast.error('New password must be at least 6 characters');
        }
        if (resetForm.newPassword !== resetForm.confirmPassword) {
            return toast.error('New passwords do not match');
        }

        setResetLoading(true);
        try {
            await adminResetPassword({
                currentPassword: resetForm.currentPassword,
                newPassword: resetForm.newPassword
            });
            toast.success('Password updated successfully! 🔒');
            setResetForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setShowResetPassword(false);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to reset password');
        } finally {
            setResetLoading(false);
        }
    };

    return (
        <div className="min-h-screen">
            <Navbar />
            <div className="pt-20 pb-10 px-4">
                <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between mb-8 flex-wrap gap-3"
                    >
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-1">
                                <span className="gradient-text">{user?.clubName}</span>
                            </h1>
                            <p className="text-gray-400 text-sm">
                                {user?.clubCategory} • Admin Dashboard
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => { setShowResetPassword(!showResetPassword); if (showForm) resetEventForm(); }}
                                className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl glass text-orange-400 hover:text-orange-300 transition-colors font-medium"
                            >
                                <KeyRound size={16} /> {showResetPassword ? 'Cancel' : 'Reset Password'}
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => { resetEventForm(); setShowForm(!showForm); if (showResetPassword) setShowResetPassword(false); }}
                                className="btn-primary flex items-center gap-2 text-sm"
                            >
                                {showForm ? <><X size={16} /> Cancel</> : <><Plus size={16} /> Add Event</>}
                            </motion.button>
                        </div>
                    </motion.div>

                    {/* Password Reset Form */}
                    <AnimatePresence>
                        {showResetPassword && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden mb-8"
                            >
                                <div className="glass rounded-3xl p-8">
                                    <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                                        <KeyRound size={20} className="text-orange-400" /> Reset Password
                                    </h2>
                                    <form onSubmit={handleResetPassword} className="space-y-4 max-w-md">
                                        <div>
                                            <label className="text-sm text-gray-300 font-medium mb-2 block">Current Password</label>
                                            <div className="relative">
                                                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <input
                                                    type={showCurrentPw ? 'text' : 'password'} placeholder="••••••••"
                                                    value={resetForm.currentPassword}
                                                    onChange={(e) => setResetForm({ ...resetForm, currentPassword: e.target.value })}
                                                    className="input-field pl-10 pr-12" required
                                                />
                                                <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors">
                                                    {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm text-gray-300 font-medium mb-2 block">New Password</label>
                                            <div className="relative">
                                                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <input
                                                    type={showNewPw ? 'text' : 'password'} placeholder="Minimum 6 characters"
                                                    value={resetForm.newPassword}
                                                    onChange={(e) => setResetForm({ ...resetForm, newPassword: e.target.value })}
                                                    className="input-field pl-10 pr-12" required minLength={6}
                                                />
                                                <button type="button" onClick={() => setShowNewPw(!showNewPw)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors">
                                                    {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm text-gray-300 font-medium mb-2 block">Confirm New Password</label>
                                            <div className="relative">
                                                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <input
                                                    type="password" placeholder="••••••••"
                                                    value={resetForm.confirmPassword}
                                                    onChange={(e) => setResetForm({ ...resetForm, confirmPassword: e.target.value })}
                                                    className="input-field pl-10" required minLength={6}
                                                />
                                            </div>
                                        </div>
                                        <motion.button
                                            type="submit" disabled={resetLoading}
                                            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white transition-all"
                                            style={{
                                                background: 'linear-gradient(135deg, #F97316, #EC4899)',
                                                boxShadow: '0 4px 20px rgba(249, 115, 22, 0.3)',
                                            }}
                                        >
                                            {resetLoading ? (
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <><KeyRound size={18} /> Update Password</>
                                            )}
                                        </motion.button>
                                    </form>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Create / Edit Form */}
                    <AnimatePresence>
                        {showForm && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden mb-8"
                            >
                                <div className="glass rounded-3xl p-8">
                                    <h2 className="text-lg font-bold text-white mb-5">
                                        {editingId ? 'Edit Event' : 'Create New Event'}
                                    </h2>
                                    <form onSubmit={handleSubmit} className="space-y-5">
                                        {/* Image Upload */}
                                        <div
                                            onClick={() => fileRef.current?.click()}
                                            className={`relative border-2 border-dashed rounded-2xl overflow-hidden cursor-pointer transition-all hover:border-purple-500 ${preview ? 'border-purple-500/50 h-44' : 'border-white/20 h-32 flex flex-col items-center justify-center'}`}
                                        >
                                            {preview ? (
                                                <>
                                                    <img src={preview} alt="Event" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                        <p className="text-white text-sm font-semibold">Click to change</p>
                                                    </div>
                                                    <button type="button" onClick={(e) => { e.stopPropagation(); setImageFile(null); setPreview(null); }}
                                                        className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white">
                                                        <X size={12} />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <Upload size={28} className="text-gray-500 mb-2" />
                                                    <p className="text-gray-400 text-sm">Upload event image (optional)</p>
                                                </>
                                            )}
                                        </div>
                                        <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

                                        <div>
                                            <label className="text-sm text-gray-300 font-medium mb-2 block">Event Name *</label>
                                            <input name="eventName" value={form.eventName} onChange={handleChange}
                                                placeholder="e.g. Annual Hackathon 2025" className="input-field" required />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm text-gray-300 font-medium mb-2 block">Event Date *</label>
                                                <input type="datetime-local" name="eventDate" value={form.eventDate}
                                                    onChange={handleChange} className="input-field" required />
                                            </div>
                                            <div>
                                                <label className="text-sm text-gray-300 font-medium mb-2 block">Venue</label>
                                                <input name="venue" value={form.venue} onChange={handleChange}
                                                    placeholder="Seminar Hall" className="input-field" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm text-gray-300 font-medium mb-2 block">Phone Number</label>
                                                <input name="phoneNumber" value={form.phoneNumber} onChange={handleChange}
                                                    placeholder="Contact number" className="input-field" />
                                            </div>
                                        </div>

                                        {/* Registration Fee & Max */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm text-gray-300 font-medium mb-2 block">
                                                    Registration Fee (₹)
                                                </label>
                                                <div className="relative">
                                                    <IndianRupee size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                                    <input
                                                        type="number" name="registrationFee" min="0" step="1"
                                                        value={form.registrationFee} onChange={handleChange}
                                                        placeholder="0 = Free" className="input-field pl-10"
                                                    />
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {Number(form.registrationFee) > 0
                                                        ? `₹${form.registrationFee} — Razorpay payment required`
                                                        : 'Free — no payment needed'}
                                                </p>
                                            </div>
                                            <div>
                                                <label className="text-sm text-gray-300 font-medium mb-2 block">
                                                    Max Registrations
                                                </label>
                                                <div className="relative">
                                                    <Users size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                                    <input
                                                        type="number" name="maxRegistrations" min="0" step="1"
                                                        value={form.maxRegistrations} onChange={handleChange}
                                                        placeholder="Unlimited" className="input-field pl-10"
                                                    />
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">Leave empty for unlimited</p>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-sm text-gray-300 font-medium mb-2 block">Description *</label>
                                            <textarea name="description" value={form.description} onChange={handleChange}
                                                placeholder="Describe the event..." rows={4} className="input-field resize-none" required />
                                        </div>

                                        <div className="p-4 glass rounded-xl text-sm">
                                            <p className="text-gray-400">
                                                Club: <span className="text-white font-medium">{user?.clubName}</span>
                                                <br />
                                                Category: <span className="text-white font-medium">{user?.clubCategory}</span>
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">These are auto-filled from your admin profile</p>
                                        </div>

                                        <motion.button
                                            type="submit" disabled={submitting}
                                            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                                            className="btn-primary w-full flex items-center justify-center gap-2 py-3.5"
                                        >
                                            {submitting ? (
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <><Save size={18} /> {editingId ? 'Save Changes' : 'Create Event'}</>
                                            )}
                                        </motion.button>
                                    </form>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* My Events List */}
                    <h2 className="text-lg font-bold text-white mb-4">Your Events</h2>

                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : events.length === 0 ? (
                        <div className="text-center py-16 glass rounded-2xl">
                            <div className="text-4xl mb-3">📅</div>
                            <p className="text-gray-400">No events yet. Create your first event!</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {events.map((event, i) => (
                                <motion.div
                                    key={event._id}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    <div className="glass rounded-2xl p-5 flex flex-col sm:flex-row gap-4">
                                        {/* Image */}
                                        {event.imageURL && (
                                            <div className="w-full sm:w-28 h-24 rounded-xl overflow-hidden shrink-0">
                                                <img src={`${API_BASE}${event.imageURL.startsWith('/') ? '' : '/'}${event.imageURL}`} alt={event.eventName}
                                                    className="w-full h-full object-cover" />
                                            </div>
                                        )}

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-white">{event.eventName}</h3>
                                            <p className="text-sm text-gray-400 line-clamp-1 mt-0.5">{event.description}</p>
                                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 flex-wrap">
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={11} /> {new Date(event.eventDate).toLocaleDateString('en-IN')}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <MapPin size={11} /> {event.venue}
                                                </span>
                                                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${event.registrationFee > 0
                                                        ? 'bg-green-500/15 text-green-400'
                                                        : 'bg-blue-500/15 text-blue-400'
                                                    }`}>
                                                    <IndianRupee size={10} />
                                                    {event.registrationFee > 0 ? `₹${event.registrationFee}` : 'Free'}
                                                </span>
                                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400">
                                                    <Users size={10} />
                                                    {event.registrationCount || 0}
                                                    {event.maxRegistrations > 0 ? ` / ${event.maxRegistrations}` : ''} registered
                                                </span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex sm:flex-col gap-2 justify-end shrink-0">
                                            <button onClick={() => toggleRegistrations(event._id)}
                                                className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg glass text-purple-400 hover:text-purple-300 transition-colors">
                                                <Users size={12} /> {viewingRegistrations === event._id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                            </button>
                                            <button onClick={() => handleEdit(event)}
                                                className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg glass text-yellow-400 hover:text-yellow-300 transition-colors">
                                                <Edit2 size={12} /> Edit
                                            </button>
                                            <button onClick={() => handleDelete(event._id, event.eventName)}
                                                className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg glass text-red-400 hover:text-red-300 transition-colors">
                                                <Trash2 size={12} /> Delete
                                            </button>
                                        </div>
                                    </div>

                                    {/* Registration list (expandable) */}
                                    <AnimatePresence>
                                        {viewingRegistrations === event._id && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="glass rounded-b-2xl -mt-2 pt-6 pb-4 px-5 border-t border-white/5">
                                                    <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                                                        <Users size={14} /> Registered Students
                                                    </h4>
                                                    {registrationsLoading ? (
                                                        <div className="flex justify-center py-4">
                                                            <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                                                        </div>
                                                    ) : registrations.length === 0 ? (
                                                        <p className="text-gray-500 text-sm py-2">No registrations yet</p>
                                                    ) : (
                                                        <div className="space-y-2 max-h-60 overflow-y-auto">
                                                            {registrations.map((reg, idx) => (
                                                                <div key={reg._id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/5 text-sm">
                                                                    <div>
                                                                        <span className="text-gray-400 mr-2">{idx + 1}.</span>
                                                                        <span className="text-white font-medium">{reg.user?.fullName}</span>
                                                                        <span className="text-gray-500 ml-2">{reg.user?.email}</span>
                                                                    </div>
                                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${reg.paymentStatus === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                                                                        }`}>
                                                                        {reg.paymentStatus === 'paid' ? `₹${reg.amountPaid} Paid` : 'Free'}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
