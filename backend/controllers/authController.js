const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const Club = require('../models/Club');
const { decryptPassword } = require('../utils/crypto');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
};

// Email transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

// =============================================
// POST /api/auth/student/signup
// =============================================
exports.studentSignUp = async (req, res) => {
    try {
        const { fullName, email, usn, password } = req.body;

        if (!fullName || !email || !usn || !password) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
        }

        // Check if email already exists
        const existingEmail = await User.findOne({ email: email.toLowerCase() });
        if (existingEmail) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        // Check if USN already exists
        const existingUSN = await User.findOne({ usn: usn.toUpperCase() });
        if (existingUSN) {
            return res.status(400).json({ success: false, message: 'USN already registered' });
        }

        const user = await User.create({
            fullName,
            email: email.toLowerCase(),
            usn: usn.toUpperCase(),
            password,
            role: 'student'
        });

        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            message: 'Account created successfully!',
            token,
            user: {
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                usn: user.usn,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Signup Error:', error.message);
        res.status(500).json({ success: false, message: 'Server error during signup' });
    }
};

// =============================================
// POST /api/auth/student/signin
// =============================================
exports.studentSignIn = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        // Find user by email (ANY role — student or admin)
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const token = generateToken(user._id);

        res.json({
            success: true,
            message: 'Login successful!',
            token,
            user: {
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                usn: user.usn,
                role: user.role,
                clubCategory: user.clubCategory || null,
                clubName: user.clubName || null
            }
        });
    } catch (error) {
        console.error('Signin Error:', error.message);
        res.status(500).json({ success: false, message: 'Server error during login' });
    }
};

// =============================================
// POST /api/auth/admin/login  (FIRST-TIME registration)
// =============================================
exports.adminLogin = async (req, res) => {
    try {
        const { clubCategory, clubName, email, password } = req.body;
        const idCardFile = req.file;

        if (!clubCategory || !clubName || !email || !idCardFile) {
            return res.status(400).json({
                success: false,
                message: 'Club category, club name, email, and ID card (JPG) are all required'
            });
        }

        if (!password || password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password is required and must be at least 6 characters'
            });
        }

        // Verify club exists and is active (not already claimed)
        const club = await Club.findOne({ clubName, category: clubCategory, isActive: true });
        if (!club) {
            return res.status(400).json({
                success: false,
                message: 'This club is either invalid or has already been claimed by another admin'
            });
        }

        // Check if this email is already used by another admin
        const existingAdmin = await User.findOne({ email: email.toLowerCase(), role: 'admin' });
        if (existingAdmin) {
            return res.status(400).json({
                success: false,
                message: 'This email is already registered as an admin. Please use the "Returning Admin" login instead.'
            });
        }

        // Check if email already exists as a student — upgrade their role to admin
        let adminUser = await User.findOne({ email: email.toLowerCase(), role: 'student' }).select('+password');
        if (adminUser) {
            adminUser.role = 'admin';
            adminUser.clubCategory = clubCategory;
            adminUser.clubName = clubName;
            adminUser.password = password; // Will be hashed + encrypted by pre-save hook
            adminUser.markModified('password'); // Required: password has select:false, ensures pre-save hook runs
            adminUser.idCardPath = `/uploads/${idCardFile.filename}`;
            await adminUser.save();
        } else {
            // Create new admin user
            adminUser = await User.create({
                fullName: `${clubName} Admin`,
                email: email.toLowerCase(),
                usn: `ADMIN-${Date.now()}`,
                password,
                role: 'admin',
                clubCategory,
                clubName,
                idCardPath: `/uploads/${idCardFile.filename}`
            });
        }

        // Mark club as inactive so it's removed from the dropdown for next users
        club.isActive = false;
        await club.save();

        const token = generateToken(adminUser._id);

        res.status(201).json({
            success: true,
            message: `Admin access granted for ${clubName}!`,
            token,
            user: {
                _id: adminUser._id,
                fullName: adminUser.fullName,
                email: adminUser.email,
                role: adminUser.role,
                clubCategory: adminUser.clubCategory,
                clubName: adminUser.clubName
            }
        });
    } catch (error) {
        console.error('Admin Login Error:', error.message);
        res.status(500).json({ success: false, message: 'Server error during admin login' });
    }
};

// =============================================
// POST /api/auth/admin/relogin  (RETURNING admin login)
// =============================================
exports.adminReLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        const user = await User.findOne({ email: email.toLowerCase(), role: 'admin' }).select('+password');
        if (!user) {
            return res.status(401).json({ success: false, message: 'No admin account found with this email' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const token = generateToken(user._id);

        res.json({
            success: true,
            message: `Welcome back, ${user.clubName} Admin!`,
            token,
            user: {
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                clubCategory: user.clubCategory,
                clubName: user.clubName
            }
        });
    } catch (error) {
        console.error('Admin Re-Login Error:', error.message);
        res.status(500).json({ success: false, message: 'Server error during admin login' });
    }
};

// =============================================
// POST /api/auth/forgot-password
// =============================================
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        const user = await User.findOne({ email: email.toLowerCase() }).select('+password +plainPassword');
        if (!user) {
            return res.status(404).json({ success: false, message: 'No account found with this email' });
        }

        let passwordToSend;
        let isOriginal = true;

        // Try to decrypt the stored original password
        if (user.plainPassword) {
            try {
                passwordToSend = decryptPassword(user.plainPassword);
            } catch (e) {
                console.error('Decryption failed, generating temp password');
                passwordToSend = null;
            }
        }

        // Fallback: generate a temp password if no encrypted original exists
        if (!passwordToSend) {
            isOriginal = false;
            passwordToSend = `BMSCE@${Math.random().toString(36).slice(2, 8).toUpperCase()}${Math.floor(Math.random() * 100)}`;
            user.password = passwordToSend; // This will trigger pre-save: bcrypt hash + AES encrypt
            await user.save();
        }

        // Send email
        const transporter = createTransporter();

        const subjectLine = isOriginal
            ? 'BMSCE Events - Your Password'
            : 'BMSCE Events - Your New Password';

        const bodyMessage = isOriginal
            ? 'Here is your password for your BMSCE Events account:'
            : 'Your password has been reset. Here is your new temporary password:';

        const footerMessage = isOriginal
            ? ''
            : '<p style="color: #D1D5DB; font-size: 14px;">⚠️ Please log in and change this password as soon as possible.</p>';

        const mailOptions = {
            from: `"BMSCE Events Portal" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: subjectLine,
            html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; background: #1a1a2e; color: #f0f0f0; border-radius: 16px;">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <h1 style="color: #8B5CF6; font-size: 24px; margin: 0;">BMSCE Events Portal</h1>
                        <p style="color: #9CA3AF; font-size: 14px; margin-top: 4px;">Password Recovery</p>
                    </div>
                    <p style="color: #D1D5DB;">Hi <strong style="color: white;">${user.fullName}</strong>,</p>
                    <p style="color: #D1D5DB;">${bodyMessage}</p>
                    <div style="background: #2d2d4e; padding: 16px; border-radius: 12px; text-align: center; margin: 20px 0; border: 1px solid #8B5CF6;">
                        <code style="font-size: 22px; color: #8B5CF6; letter-spacing: 2px; font-weight: bold;">${passwordToSend}</code>
                    </div>
                    ${footerMessage}
                    <hr style="border: 1px solid #333; margin: 20px 0;">
                    <p style="color: #6B7280; font-size: 12px; text-align: center;">BMSCE Events Portal &bull; Bull Temple Road, Bengaluru</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);

        res.json({
            success: true,
            message: isOriginal
                ? 'Your password has been sent to your email address'
                : 'A new password has been sent to your email address'
        });
    } catch (error) {
        console.error('Forgot Password Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to send email. Please try again later.' });
    }
};

// =============================================
// POST /api/auth/admin/reset-password (Authenticated)
// =============================================
exports.adminResetPassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Current password and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
        }

        // req.user is set by authMiddleware (password not selected by default)
        const user = await User.findById(req.user._id).select('+password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect' });
        }

        // Set new password (pre-save hook will bcrypt hash + AES encrypt)
        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Password updated successfully!'
        });
    } catch (error) {
        console.error('Reset Password Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to reset password' });
    }
};

// =============================================
// GET /api/auth/me
// =============================================
exports.getMe = async (req, res) => {
    try {
        const user = req.user;
        res.json({
            success: true,
            user: {
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                usn: user.usn,
                role: user.role,
                clubCategory: user.clubCategory || null,
                clubName: user.clubName || null
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
