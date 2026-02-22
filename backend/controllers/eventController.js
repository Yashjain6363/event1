const Event = require('../models/Event');

// GET /api/events — get all events sorted by date (upcoming first)
exports.getAllEvents = async (req, res) => {
    try {
        const events = await Event.find()
            .sort({ eventDate: 1 })
            .populate('createdBy', 'fullName clubName');

        res.json({ success: true, events });
    } catch (error) {
        console.error('Get Events Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch events' });
    }
};

// GET /api/events/:id
exports.getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate('createdBy', 'fullName clubName');
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }
        res.json({ success: true, event });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch event' });
    }
};

// POST /api/events — admin creates event
exports.createEvent = async (req, res) => {
    try {
        const { eventName, description, eventDate, venue, phoneNumber, registrationFee, maxRegistrations } = req.body;

        if (!eventName || !description || !eventDate) {
            return res.status(400).json({ success: false, message: 'Event name, description, and date are required' });
        }

        const event = await Event.create({
            eventName,
            clubName: req.user.clubName,
            category: req.user.clubCategory,
            description,
            eventDate,
            venue: venue || 'BMSCE Campus',
            phoneNumber: phoneNumber || '',
            registrationFee: Number(registrationFee) || 0,
            maxRegistrations: Number(maxRegistrations) || 0,
            imageURL: req.file ? `/uploads/${req.file.filename}` : '',
            createdBy: req.user._id
        });

        res.status(201).json({ success: true, message: 'Event created!', event });
    } catch (error) {
        console.error('Create Event Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to create event' });
    }
};

// PUT /api/events/:id
exports.updateEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        // Only the creator admin can edit
        if (event.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'You can only edit your own events' });
        }

        const updates = { ...req.body };
        if (req.file) updates.imageURL = `/uploads/${req.file.filename}`;

        const updated = await Event.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
        res.json({ success: true, message: 'Event updated!', event: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update event' });
    }
};

// DELETE /api/events/:id
exports.deleteEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }
        if (event.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'You can only delete your own events' });
        }
        await event.deleteOne();
        res.json({ success: true, message: 'Event deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete event' });
    }
};
