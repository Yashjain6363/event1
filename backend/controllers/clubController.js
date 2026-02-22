const Club = require('../models/Club');

// GET /api/clubs — get all active clubs grouped by category
exports.getActiveClubs = async (req, res) => {
    try {
        const clubs = await Club.find({ isActive: true }).sort({ category: 1, clubName: 1 });

        // Group by category for dropdown
        const grouped = {};
        clubs.forEach(club => {
            if (!grouped[club.category]) grouped[club.category] = [];
            grouped[club.category].push({
                _id: club._id,
                clubName: club.clubName
            });
        });

        res.json({ success: true, clubs: grouped });
    } catch (error) {
        console.error('Get Clubs Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch clubs' });
    }
};

// GET /api/clubs/all — get all clubs (for admin reference)
exports.getAllClubs = async (req, res) => {
    try {
        const clubs = await Club.find().sort({ category: 1, clubName: 1 });
        res.json({ success: true, clubs });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch clubs' });
    }
};
