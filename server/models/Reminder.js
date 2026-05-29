const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema(
  {
    customerId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Customer',
      required: [true, 'customerId is required'],
      index:    true,
    },
    entryId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Entry',
      required: false,
      index:    true,
    },
    message: {
      type:     String,
      required: [true, 'message is required'],
      trim:     true,
    },
    // Status lifecycle: pending → sent → delivered → read | failed
    status: {
      type:    String,
      enum:    ['pending', 'sent', 'delivered', 'read', 'failed'],
      default: 'sent',
    },
    tone: {
      type:    String,
      enum:    ['friendly', 'firm', 'urgent'],
      default: 'friendly',
    },
    sentAt: {
      type:    Date,
      default: () => new Date(),
    },
    // WhatsApp deep-link snapshot at send time
    whatsappLink: {
      type:    String,
      default: null,
    },
    // Snapshot fields — protect history against customer/entry edits
    snapshot: {
      customerName:  { type: String, default: null },
      customerPhone: { type: String, default: null },
      amount:        { type: Number, default: null }, // rupees
      entryType:     { type: String, default: null },
      entryStatus:   { type: String, default: null },
    },
  },
  { timestamps: true }
);

// Fast lookup: all reminders for a customer, newest first
reminderSchema.index({ customerId: 1, createdAt: -1 });

module.exports = mongoose.model('Reminder', reminderSchema);
