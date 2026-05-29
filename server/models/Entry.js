const mongoose = require('mongoose');

const entrySchema = new mongoose.Schema(
  {
    customerId: {
      type:  mongoose.Schema.Types.ObjectId,
      ref:   'Customer',
      index: true,
      default: null, // null for cashbook entries
    },
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'userId is required'],
      index:    true,
    },
    // Amount stored in RUPEES (e.g. ₹500 → 500)
    amount: {
      type:     Number,
      required: [true, 'Amount is required'],
      min:      [0.01, 'Amount must be greater than 0'],
    },
    type: {
      type:     String,
      enum:     ['credit', 'payment', 'cashbook_in', 'cashbook_out'],
      required: [true, 'Entry type is required'],
    },
    status: {
      type:    String,
      enum:    ['pending', 'paid', 'overdue', 'disputed', 'partial'],
      default: 'pending',
    },
    dueDate: {
      type:    Date,
      default: null,
    },
    note: {
      type:      String,
      trim:      true,
      maxlength: [500, 'Note cannot exceed 500 characters'],
      default:   null,
    },
    // Raw voice transcript that generated this entry (audit / dispute)
    voiceTranscript: {
      type:    String,
      trim:    true,
      default: null,
    },
    // Proof URL (uploaded image/receipt)
    proofUrl: {
      type:    String,
      default: null,
    },
    // Remaining unpaid amount for credit entries (in rupees)
    remainingAmount: {
      type: Number,
      min:  0,
    },
    // Links a payment entry back to its originating credit entry
    linkedEntryId: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'Entry',
      default: null,
    },
    paymentMethod: {
      type:    String,
      enum:    ['cash', 'upi', 'bank', 'other'],
      default: 'cash',
    },
  },
  { timestamps: true }
);

// Auto-set remainingAmount on new credit entries
entrySchema.pre('save', function (next) {
  if (this.isNew && this.type === 'credit' && this.remainingAmount === undefined) {
    this.remainingAmount = this.amount;
  }
  next();
});

// Compound index: fetch all entries for a customer sorted newest first
entrySchema.index({ customerId: 1, createdAt: -1 });
// User-scoped query index
entrySchema.index({ userId: 1, createdAt: -1 });
// Due date queries for overdue detection
entrySchema.index({ dueDate: 1, status: 1 });

module.exports = mongoose.model('Entry', entrySchema);
