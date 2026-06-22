"use strict";

const asyncHandler = require('../middleware/asyncHandler');
const { processVoiceInput } = require('../services/voiceService');

const MAX_TEXT_LENGTH = 500;

// POST /api/voice/parse
const parseVoice = asyncHandler(async (req, res) => {
  const { text } = req.body;

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'text is required.' });
  }

  if (text.length > MAX_TEXT_LENGTH) {
    return res.status(400).json({
      success: false,
      message: `text cannot exceed ${MAX_TEXT_LENGTH} characters.`,
    });
  }

  const result = await processVoiceInput(text.trim());

  res.status(200).json({ success: true, data: result });
});

module.exports = { parseVoice };
