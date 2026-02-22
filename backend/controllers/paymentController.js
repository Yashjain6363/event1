const crypto = require('crypto');
const Razorpay = require('razorpay');
const Event = require('../models/Event');
const Registration = require('../models/Registration');

// Initialize Razorpay instance (lazy — only when keys exist)
let razorpayInstance = null;
function getRazorpay() {
    if (!razorpayInstance) {
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        if (!keyId || !keySecret || keyId === 'your_razorpay_key_id') {
            return null;
        }
        razorpayInstance = new Razorpay({ key_id: keyId, key_secret: keySecret });
    }
    return razorpayInstance;
}

// =============================================
// POST /api/payments/create-order
// Creates a Razorpay order for a paid event
// =============================================
exports.createOrder = async (req, res) => {
    console.log(`[Payment] CreateOrder request for event: ${req.body.eventId} by user: ${req.user?._id}`);
    try {
        const { eventId } = req.body;

        if (!eventId) {
            return res.status(400).json({ success: false, message: 'Event ID is required' });
        }

        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        if (event.registrationFee <= 0) {
            return res.status(400).json({ success: false, message: 'This is a free event. Use free registration instead.' });
        }

        // Check if already registered
        const existing = await Registration.findOne({ user: req.user._id, event: eventId });
        if (existing && existing.paymentStatus === 'paid') {
            return res.status(400).json({ success: false, message: 'You are already registered for this event' });
        }

        // Check max registrations
        if (event.maxRegistrations > 0 && event.registrationCount >= event.maxRegistrations) {
            return res.status(400).json({ success: false, message: 'Registration is full for this event' });
        }

        const razorpay = getRazorpay();
        if (!razorpay) {
            return res.status(503).json({
                success: false,
                message: 'Payment system is not configured yet. Please contact the administrator.'
            });
        }

        // Amount in paise (1 INR = 100 paise)
        const amountInPaise = Math.round(event.registrationFee * 100);

        const order = await razorpay.orders.create({
            amount: amountInPaise,
            currency: 'INR',
            receipt: `evt_${event._id}_usr_${req.user._id}`,
            notes: {
                eventId: event._id.toString(),
                eventName: event.eventName,
                userId: req.user._id.toString(),
                userName: req.user.fullName
            }
        });

        // Create or update a pending registration
        await Registration.findOneAndUpdate(
            { user: req.user._id, event: eventId },
            {
                user: req.user._id,
                event: eventId,
                razorpayOrderId: order.id,
                paymentStatus: 'pending',
                amountPaid: event.registrationFee
            },
            { upsert: true, new: true }
        );

        res.json({
            success: true,
            order: {
                id: order.id,
                amount: order.amount,
                currency: order.currency
            },
            event: {
                name: event.eventName,
                clubName: event.clubName
            },
            key: process.env.RAZORPAY_KEY_ID
        });
    } catch (error) {
        console.error('Create Order Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to create payment order' });
    }
};

// =============================================
// POST /api/payments/verify
// Verifies Razorpay payment signature and completes registration
// =============================================
exports.verifyPayment = async (req, res) => {
    console.log(`[Payment] VerifyPayment request for event: ${req.body.eventId} by user: ${req.user?._id}`);
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, eventId } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !eventId) {
            return res.status(400).json({ success: false, message: 'Missing payment verification data' });
        }

        // Verify signature
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        const expectedSignature = crypto
            .createHmac('sha256', keySecret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            // Mark registration as failed
            await Registration.findOneAndUpdate(
                { user: req.user._id, event: eventId, razorpayOrderId: razorpay_order_id },
                { paymentStatus: 'failed' }
            );
            return res.status(400).json({ success: false, message: 'Payment verification failed' });
        }

        // Update registration to paid
        const registration = await Registration.findOneAndUpdate(
            { user: req.user._id, event: eventId, razorpayOrderId: razorpay_order_id },
            {
                paymentStatus: 'paid',
                razorpayPaymentId: razorpay_payment_id,
                razorpaySignature: razorpay_signature
            },
            { new: true }
        );

        if (!registration) {
            return res.status(404).json({ success: false, message: 'Registration not found' });
        }

        // Increment registration count
        await Event.findByIdAndUpdate(eventId, { $inc: { registrationCount: 1 } });

        res.json({
            success: true,
            message: 'Payment verified! You are registered for the event.',
            registration
        });
    } catch (error) {
        console.error('Verify Payment Error:', error.message);
        res.status(500).json({ success: false, message: 'Payment verification failed' });
    }
};

// =============================================
// POST /api/payments/register-free
// Register for a free event
// =============================================
exports.registerFreeEvent = async (req, res) => {
    console.log(`[Payment] RegisterFreeEvent request for event: ${req.body.eventId} by user: ${req.user?._id}`);
    try {
        const { eventId } = req.body;

        if (!eventId) {
            return res.status(400).json({ success: false, message: 'Event ID is required' });
        }

        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        if (event.registrationFee > 0) {
            return res.status(400).json({ success: false, message: 'This is a paid event. Please use payment registration.' });
        }

        // Check if already registered
        const existing = await Registration.findOne({ user: req.user._id, event: eventId });
        if (existing) {
            return res.status(400).json({ success: false, message: 'You are already registered for this event' });
        }

        // Check max registrations
        if (event.maxRegistrations > 0 && event.registrationCount >= event.maxRegistrations) {
            return res.status(400).json({ success: false, message: 'Registration is full for this event' });
        }

        // Create registration
        const registration = await Registration.create({
            user: req.user._id,
            event: eventId,
            paymentStatus: 'free',
            amountPaid: 0
        });

        // Increment registration count
        await Event.findByIdAndUpdate(eventId, { $inc: { registrationCount: 1 } });

        res.status(201).json({
            success: true,
            message: 'Successfully registered for the event!',
            registration
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'You are already registered for this event' });
        }
        console.error('Free Registration Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to register for event' });
    }
};

// =============================================
// GET /api/payments/my-registrations
// Get all events the current user has registered for
// =============================================
exports.getMyRegistrations = async (req, res) => {
    try {
        const registrations = await Registration.find({
            user: req.user._id,
            paymentStatus: { $in: ['paid', 'free'] }
        }).populate('event', 'eventName clubName category eventDate venue imageURL registrationFee');

        res.json({ success: true, registrations });
    } catch (error) {
        console.error('Get My Registrations Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch registrations' });
    }
};

// =============================================
// GET /api/payments/event/:eventId/registrations
// Admin: get all registrations for an event
// =============================================
exports.getEventRegistrations = async (req, res) => {
    try {
        const { eventId } = req.params;

        // Verify this admin owns the event
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }
        if (event.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'You can only view registrations for your own events' });
        }

        const registrations = await Registration.find({
            event: eventId,
            paymentStatus: { $in: ['paid', 'free'] }
        }).populate('user', 'fullName email usn');

        res.json({
            success: true,
            eventName: event.eventName,
            totalRegistrations: registrations.length,
            registrations
        });
    } catch (error) {
        console.error('Get Event Registrations Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch registrations' });
    }
};
