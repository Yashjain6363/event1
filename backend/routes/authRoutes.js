const express = require('express');
const router = express.Router();
const { studentSignUp, studentSignIn, adminLogin, adminReLogin, getMe, forgotPassword, adminResetPassword, verifyOtp, resendOtp } = require('../controllers/authController');
const { authMiddleware, adminOnly } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Student routes
router.post('/student/signup', studentSignUp);
router.post('/student/verify-otp', verifyOtp);
router.post('/student/resend-otp', resendOtp);
router.post('/student/signin', studentSignIn);
router.post('/forgot-password', forgotPassword);

// Admin login with ID card upload (first-time registration)
router.post('/admin/login', upload.single('idCard'), adminLogin);

// Admin re-login (returning admin with password)
router.post('/admin/relogin', adminReLogin);

// Admin reset password (authenticated)
router.post('/admin/reset-password', authMiddleware, adminOnly, adminResetPassword);

// Get current user
router.get('/me', authMiddleware, getMe);

module.exports = router;
