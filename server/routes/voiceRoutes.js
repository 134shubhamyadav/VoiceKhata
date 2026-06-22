const express = require('express');
const router = express.Router();
const { parseVoice, chatVoice } = require('../controllers/voiceController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Voice parse requires authentication
router.post('/parse', authMiddleware, parseVoice);
router.post('/chat', authMiddleware, chatVoice);

module.exports = router;
