const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    eventName: {
        type: String,
        required: [true, 'Event name is required'],
        trim: true
    },
    clubName: {
        type: String,
        required: [true, 'Club name is required'],
        trim: true
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Description is required']
    },
    eventDate: {
        type: Date,
        required: [true, 'Event date is required']
    },
    imageURL: {
        type: String,
        default: ''
    },
    venue: {
        type: String,
        default: 'BMSCE Campus'
    },
    phoneNumber: {
        type: String,
        default: ''
    },
    // Registration fields
    registrationFee: {
        type: Number,
        default: 0,
        min: [0, 'Registration fee cannot be negative']
    },
    maxRegistrations: {
        type: Number,
        default: 0  // 0 means unlimited
    },
    registrationCount: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
