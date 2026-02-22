const express = require('express');
const router = express.Router();
const {
    createOrder,
    verifyPayment,
    registerFreeEvent,
    getMyRegistrations,
    getEventRegistrations
} = require('../controllers/paymentController');
const { authMiddleware, adminOnly } = require('../middleware/authMiddleware');

// All payment routes require authentication
router.use(authMiddleware);

// Student: create Razorpay order for paid event
router.post('/create-order', createOrder);

// Student: verify Razorpay payment
router.post('/verify', verifyPayment);

// Student: register for free event
router.post('/register-free', registerFreeEvent);

// Student: get my registrations
router.get('/my-registrations', getMyRegistrations);

// Admin: get registrations for a specific event
router.get('/event/:eventId/registrations', adminOnly, getEventRegistrations);

module.exports = router;
