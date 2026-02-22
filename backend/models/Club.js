const mongoose = require('mongoose');

const clubSchema = new mongoose.Schema({
    category: {
        type: String,
        required: true,
        trim: true
    },
    clubName: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Club', clubSchema);
