const express = require('express');
const router = express.Router();
const { getActiveClubs, getAllClubs } = require('../controllers/clubController');

// Public: get active clubs (for admin login dropdown)
router.get('/', getActiveClubs);
router.get('/all', getAllClubs);

module.exports = router;
