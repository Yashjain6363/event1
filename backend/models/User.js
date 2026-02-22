const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { encryptPassword } = require('../utils/crypto');

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true
    },
    usn: {
        type: String,
        required: [true, 'USN is required'],
        unique: true,
        uppercase: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    },
    // AES-256 encrypted copy of plain password (for forgot-password recovery)
    plainPassword: {
        type: String,
        select: false
    },
    role: {
        type: String,
        enum: ['student', 'admin'],
        default: 'student'
    },
    // Email verification (students)
    emailVerified: { type: Boolean, default: false },
    otp: { type: String, select: false },
    otpExpiresAt: { type: Date, select: false },
    // Admin-specific fields
    clubCategory: { type: String, default: null },
    clubName: { type: String, default: null },
    idCardPath: { type: String, default: null }
}, { timestamps: true });

// Hash password and encrypt plain copy before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    // Encrypt the plain-text password with AES-256 before hashing
    this.plainPassword = encryptPassword(this.password);
    // Hash with bcrypt
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
