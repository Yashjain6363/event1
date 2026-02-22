const express = require('express');
const router = express.Router();
const { getAllEvents, getEventById, createEvent, updateEvent, deleteEvent } = require('../controllers/eventController');
const { authMiddleware, adminOnly } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public: get all events (sorted by date)
router.get('/', getAllEvents);
router.get('/:id', getEventById);

// Admin only: create/update/delete
router.post('/', authMiddleware, adminOnly, upload.single('eventImage'), createEvent);
router.put('/:id', authMiddleware, adminOnly, upload.single('eventImage'), updateEvent);
router.delete('/:id', authMiddleware, adminOnly, deleteEvent);

module.exports = router;
