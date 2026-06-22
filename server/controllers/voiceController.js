"use strict";

const asyncHandler = require('../middleware/asyncHandler');
const { processVoiceInput } = require('../services/voiceService');
const { handleChat } = require('../services/assistantService');

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

// POST /api/voice/chat
const chatVoice = asyncHandler(async (req, res) => {
  const { history, message } = req.body;
  
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'message is required.' });
  }

  const result = await handleChat(history || [], message.trim());
  res.status(200).json({ success: true, data: result });
});

module.exports = { parseVoice, chatVoice };
