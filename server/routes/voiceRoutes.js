const express = require('express');
const router = express.Router();
const { parseVoice } = require('../controllers/voiceController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Voice parse requires authentication
router.post('/parse', authMiddleware, parseVoice);

module.exports = router;
